import { Readable } from 'stream';
import yauzl, { Entry, ZipFile } from 'yauzl';
import { StreamEntry, StreamOptions, StreamProgress } from '../../types/streaming';
import { ZipEntry, ZipExtractionOptions, ZipExtractionResult, ZipExtractionError } from '../../types/zip';
import { promisify } from 'util';
import { createWriteStream } from 'fs';
import { FilterHooksService } from '../../filters/hooks/FilterHooksService';
import { AgenticJujutsuService } from '../../github/files/AgenticJujutsuService';
import { ZipVerificationService, ZipVerificationReport } from './ZipVerificationService';
import { EntryFilter, EntryFilterConfig } from './EntryFilter';
import { MemoryMonitor, MemoryUsage } from './MemoryMonitor';
import { ProgressTracker, ProgressMetrics } from './ProgressTracker';
import path from 'path';
import fs from 'fs/promises';

const openZip = promisify(yauzl.fromBuffer);

/**
 * Optimized ZIP processor for large file handling with streaming support
 * Implements London School TDD with comprehensive test coverage
 * Utilizes hooks for coordination (pre-task, post-edit, post-task)
 * Applies agentic-jujutsu for version control
 * Verification-quality for truth scoring
 */
export class OptimizedZipProcessor {
  private memoryMonitor: MemoryMonitor;
  private hooksService: FilterHooksService;
  private jujutsuService: AgenticJujutsuService;
  private verificationService: ZipVerificationService;
  private entryFilter: EntryFilter;
  private progressTracker: ProgressTracker | null = null;
  private static readonly EMPTY_STREAM = new Readable({ read() { this.push(null); } });
  private maxEntriesInMemory: number;
  private bufferPool: Buffer[] = [];
  private readonly MAX_POOL_SIZE: number = 100;
  private currentChunk: Buffer | null = null;
  private currentOffset: number = 0;
  private processingMetrics: {
    chunksPerSecond: number[];
    avgProcessingTime: number;
    lastProcessed: number;
  } = {
    chunksPerSecond: [],
    avgProcessingTime: 0,
    lastProcessed: 0
  };
  private memoryHistory: number[] = [];
  private readonly HISTORY_SIZE: number = 10;

  // Enhanced buffer pooling with size categorization
  private smallBufferPool: Buffer[] = [];
  private mediumBufferPool: Buffer[] = [];
  private largeBufferPool: Buffer[] = [];
  private readonly SMALL_BUFFER_SIZE: number = 4 * 1024;      // 4KB
  private readonly MEDIUM_BUFFER_SIZE: number = 64 * 1024;   // 64KB
  private readonly LARGE_BUFFER_SIZE: number = 1024 * 1024;  // 1MB
  private readonly MAX_CATEGORY_POOL_SIZE: number = 30;

  /**
   * Create an optimized ZIP processor
   * @param memoryLimit Maximum memory usage in bytes (default: 100MB)
   * @param maxEntriesInMemory Maximum number of entries to keep in memory (default: 1000)
   */
  constructor(memoryLimit?: number, maxEntriesInMemory: number = 1000) {
    this.memoryMonitor = new MemoryMonitor(
      memoryLimit !== undefined ? memoryLimit : 100 * 1024 * 1024
    );
    this.maxEntriesInMemory = maxEntriesInMemory;
    this.hooksService = FilterHooksService.getInstance();
    this.jujutsuService = AgenticJujutsuService.getInstance();
    this.verificationService = ZipVerificationService.getInstance();
    this.entryFilter = new EntryFilter();
  }

  /**
   * Extract ZIP file with optimized streaming and memory management
   * @param zipFilePath Path to the ZIP file
   * @param destinationPath Path where files should be extracted
   * @param options Extraction options
   * @returns Extraction result with statistics
   */
  public async extract(
    zipFilePath: string,
    destinationPath: string,
    options: ZipExtractionOptions = {}
  ): Promise<ZipExtractionResult> {
    const sessionId = `optimized-zip-extraction-${Date.now()}`;

    // Initialize agentic jujutsu session
    await this.jujutsuService.initializeSession(sessionId, ['optimized-zip-processor']);

    try {
      // Call pre-task hook
      await this.hooksService.preTask(`Extracting ZIP file ${zipFilePath} to ${destinationPath} with options: ${JSON.stringify(options)}`);

      // Validate inputs
      if (!zipFilePath || typeof zipFilePath !== 'string') {
        throw new ZipExtractionError(
          'Invalid ZIP file path provided',
          'INVALID_ZIP_FILE'
        );
      }

      if (!destinationPath || typeof destinationPath !== 'string') {
        throw new ZipExtractionError(
          'Invalid destination path provided',
          'INVALID_ZIP_FILE'
        );
      }

      // For large files or when streaming is enabled, use streaming extraction
      if (options.useStreaming || (options.maxSize && options.maxSize > 50 * 1024 * 1024)) {
        return await this.extractStreaming(zipFilePath, destinationPath, options);
      }

      // Ensure destination directory exists
      await this.ensureDirectoryExists(destinationPath);

      // Initialize result object
      const result: ZipExtractionResult = {
        extractedCount: 0,
        totalSize: 0,
        entries: [],
        warnings: []
      };

      const finalResult = await new Promise<ZipExtractionResult>((resolve, reject) => {
        yauzl.open(zipFilePath, { lazyEntries: true }, (err, zipFile) => {
          if (err) {
            reject(new ZipExtractionError(
              `Failed to open ZIP file: ${err.message}`,
              'INVALID_ZIP_FILE',
              err
            ));
            return;
          }

          if (!zipFile) {
            reject(new ZipExtractionError(
              'Failed to open ZIP file: zipFile is null',
              'INVALID_ZIP_FILE'
            ));
            return;
          }

          this.processEntries(zipFile, destinationPath, options, result)
            .then(async entries => {
              result.entries = entries;

              // Record operation in agentic jujutsu
              await this.jujutsuService.recordOperation(
                {
                  operation: 'update',
                  path: zipFilePath,
                  message: `Extracted ${result.extractedCount} files from ZIP`,
                  content: JSON.stringify(result),
                  branch: 'main'
                },
                {
                  success: true,
                  path: zipFilePath
                },
                'optimized-zip-processor'
              );

              resolve(result);
            })
            .catch(error => {
              zipFile.close();
              reject(error);
            });
        });
      });

      // Calculate truth score using ZipVerificationService
      const mockStreamEntries = finalResult.entries.map(entry => ({
        name: entry.name,
        size: entry.size,
        isDirectory: entry.isDirectory,
        stream: null as any
      }));

      const truthScore = this.verificationService.calculateTruthScore(
        mockStreamEntries,
        finalResult,
        0
      );

      // Call post-task hook with calculated truth score
      await this.hooksService.postTask({
        totalFiles: finalResult.entries.length,
        includedFiles: finalResult.extractedCount,
        excludedFiles: finalResult.entries.length - finalResult.extractedCount,
        reasons: {},
        processingTimeMs: 0
      }, truthScore);

      return finalResult;
    } finally {
      try {
        // Cleanup agentic jujutsu session
        await this.jujutsuService.cleanupSession(sessionId);
      } catch (error) {
        console.warn('Failed to cleanup session:', error);
      }
    }
  }

  /**
   * Extract ZIP file using streaming for memory-efficient processing
   * @param zipFilePath Path to the ZIP file
   * @param destinationPath Path where files should be extracted
   * @param options Extraction options
   * @returns Extraction result with statistics
   */
  public async extractStreaming(
    zipFilePath: string,
    destinationPath: string,
    options: ZipExtractionOptions = {}
  ): Promise<ZipExtractionResult> {
    const sessionId = `optimized-zip-extraction-streaming-${Date.now()}`;

    // Initialize agentic jujutsu session
    await this.jujutsuService.initializeSession(sessionId, ['optimized-zip-processor']);

    try {
      // Call pre-task hook
      await this.hooksService.preTask(`Extracting ZIP file (streaming) ${zipFilePath} to ${destinationPath} with options: ${JSON.stringify(options)}`);

      // Validate inputs
      if (!zipFilePath || typeof zipFilePath !== 'string') {
        throw new ZipExtractionError(
          'Invalid ZIP file path provided',
          'INVALID_ZIP_FILE'
        );
      }

      if (!destinationPath || typeof destinationPath !== 'string') {
        throw new ZipExtractionError(
          'Invalid destination path provided',
          'INVALID_ZIP_FILE'
        );
      }

      // Ensure destination directory exists
      await this.ensureDirectoryExists(destinationPath);

      // Read the ZIP file into a buffer
      const buffer = await fs.readFile(zipFilePath);

      // Apply filters if provided
      if (options.includePatterns) {
        options.includePatterns.forEach(pattern => this.entryFilter.addIncludePattern(pattern));
      }
      if (options.excludePatterns) {
        options.excludePatterns.forEach(pattern => this.entryFilter.addExcludePattern(pattern));
      }
      if (options.maxSize) {
        this.entryFilter.setSizeLimits(0, options.maxSize);
      }

      // Initialize result object
      const result: ZipExtractionResult = {
        extractedCount: 0,
        totalSize: 0,
        entries: [],
        warnings: []
      };

      // Extract streams from ZIP with optimized processing
      const streamEntries = await this.extractStreamsOptimized(buffer, {
        highWaterMark: options.highWaterMark,
        onProgress: options.onProgress ? (progress) => {
          if (options.onProgress) {
            options.onProgress(progress.percentage);
          }
        } : undefined
      });

      // Filter entries
      const filteredEntries = this.entryFilter.filterEntries(streamEntries);

      // Process each entry with adaptive processing
      for (const entry of filteredEntries) {
        if (entry.isDirectory) {
          // Handle directories
          const fullPath = path.join(destinationPath, entry.name);
          await this.ensureDirectoryExists(fullPath);
          result.entries.push({
            name: entry.name,
            size: entry.size,
            compressedSize: 0,
            lastModified: new Date(),
            isDirectory: true,
            isFile: false
          });
        } else {
          // Handle files with adaptive processing
          await this.processStreamEntryOptimized(
            entry,
            destinationPath,
            options,
            result
          );
        }
      }

      // Record operation in agentic jujutsu
      await this.jujutsuService.recordOperation(
        {
          operation: 'update',
          path: zipFilePath,
          message: `Extracted ${result.extractedCount} files from ZIP (streaming)`,
          content: JSON.stringify(result),
          branch: 'main'
        },
        {
          success: true,
          path: zipFilePath
        },
        'optimized-zip-processor'
      );

      // Calculate truth score using ZipVerificationService
      const truthScore = this.verificationService.calculateTruthScore(
        streamEntries,
        result,
        0
      );

      // Call post-task hook with calculated truth score
      await this.hooksService.postTask({
        totalFiles: result.entries.length,
        includedFiles: result.extractedCount,
        excludedFiles: result.entries.length - result.extractedCount,
        reasons: {},
        processingTimeMs: 0
      }, truthScore);

      return result;
    } catch (error) {
      throw new ZipExtractionError(
        `Streaming extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'EXTRACTION_FAILED',
        error instanceof Error ? error : undefined
      );
    } finally {
      try {
        // Cleanup agentic jujutsu session
        await this.jujutsuService.cleanupSession(sessionId);
      } catch (error) {
        console.warn('Failed to cleanup session:', error);
      }
    }
  }

  /**
   * Optimized stream extraction with buffer pooling and memory efficiency
   * @param buffer ZIP file buffer
   * @param options Streaming options
   * @returns Promise resolving to array of stream entries
   */
  private async extractStreamsOptimized(buffer: Buffer, options: StreamOptions = {}): Promise<StreamEntry[]> {
    // Pre-task hook
    await this.hooksService.preTask(`Extracting streams from ZIP buffer (${buffer.length} bytes) with optimization`);

    // Check memory before processing
    if (this.memoryMonitor.isLimitExceeded()) {
      const error = new Error('Memory limit exceeded before processing');
      await this.recordOperation('extractStreamsOptimized', buffer.length, false, error.message);
      throw error;
    }

    return new Promise((resolve, reject) => {
      yauzl.fromBuffer(buffer, { lazyEntries: true }, async (err, zipFile) => {
        if (err) {
          const error = new Error(`Failed to open ZIP file: ${err.message}`);
          await this.recordOperation('extractStreamsOptimized', buffer.length, false, error.message);
          return reject(error);
        }
        if (!zipFile) {
          const error = new Error('Failed to open ZIP file: zipFile is null');
          await this.recordOperation('extractStreamsOptimized', buffer.length, false, error.message);
          return reject(error);
        }

        const entries: StreamEntry[] = [];
        let processedEntries = 0;
        const totalEntries = zipFile.entryCount;

        // Initialize progress tracker if callback provided
        if (options.onProgress) {
          this.progressTracker = new ProgressTracker(totalEntries);
        }

        // Set up memory monitoring
        this.memoryMonitor.setAlertCallback((usage) => {
          console.warn(`Memory usage warning: ${Math.round(usage.heapUsed / 1024 / 1024)}MB`);
        });

        zipFile.on('entry', async (entry: Entry) => {
          // Check memory limit
          if (this.memoryMonitor.isLimitExceeded()) {
            zipFile.close();
            const error = new Error('Memory limit exceeded during processing');
            await this.recordOperation('extractStreamsOptimized', buffer.length, false, error.message);
            return reject(error);
          }

          // Handle directory entries with optimized stream creation
          if (entry.fileName.endsWith('/')) {
            entries.push({
              name: entry.fileName,
              size: entry.uncompressedSize,
              isDirectory: true,
              stream: OptimizedZipProcessor.EMPTY_STREAM
            });

            // Evict old entries if we exceed memory limit
            this.evictOldEntriesIfNeeded(entries);

            this.continueProcessing(zipFile, ++processedEntries, totalEntries, options);
            return;
          }

          // Open read stream for file entries
          zipFile.openReadStream(entry, async (err, readStream) => {
            if (err) {
              zipFile.close();
              const error = new Error(`Failed to open read stream for entry ${entry.fileName}: ${err.message}`);
              await this.recordOperation('extractStreamsOptimized', buffer.length, false, error.message);
              return reject(error);
            }

            if (!readStream) {
              zipFile.close();
              const error = new Error(`Failed to open read stream for entry ${entry.fileName}: stream is null`);
              await this.recordOperation('extractStreamsOptimized', buffer.length, false, error.message);
              return reject(error);
            }

            // Apply enhanced backpressure handling if highWaterMark specified
            if (options.highWaterMark) {
              readStream.on('data', (chunk: Buffer) => {
                if (readStream.readableLength > options.highWaterMark!) {
                  readStream.pause();
                  const delay = this.calculateBackpressureDelay(readStream.readableLength, options.highWaterMark!);
                  setTimeout(() => readStream.resume(), delay);
                }
              });
            }

            // Create stream entry
            const streamEntry: StreamEntry = {
              name: entry.fileName,
              size: entry.uncompressedSize,
              isDirectory: false,
              stream: readStream
            };

            entries.push(streamEntry);

            // Evict old entries if we exceed memory limit
            this.evictOldEntriesIfNeeded(entries);

            // Call entry callback if provided
            if (options.onEntry) {
              try {
                await options.onEntry(streamEntry);
                this.continueProcessing(zipFile, ++processedEntries, totalEntries, options);
              } catch (error) {
                zipFile.close();
                await this.recordOperation('extractStreamsOptimized', buffer.length, false, error instanceof Error ? error.message : 'Unknown error');
                reject(error);
              }
            } else {
              this.continueProcessing(zipFile, ++processedEntries, totalEntries, options);
            }
          });
        });

        zipFile.on('end', async () => {
          zipFile.close();
          const processingTime = Date.now() - (this.progressTracker ? this.progressTracker['startTime'] || Date.now() : Date.now());

          // Calculate truth score
          const truthScore = this.verificationService.calculateTruthScore(entries, {
            extractedCount: entries.filter(e => !e.isDirectory).length,
            totalSize: entries.reduce((sum, entry) => sum + entry.size, 0),
            entries: entries.map(entry => ({
              name: entry.name,
              size: entry.size,
              compressedSize: 0,
              lastModified: new Date(),
              isDirectory: entry.isDirectory,
              isFile: !entry.isDirectory
            })),
            warnings: []
          }, processingTime);

          await this.recordOperation('extractStreamsOptimized', buffer.length, true, `Processed ${totalEntries} entries`);
          await this.hooksService.postTask({
            totalFiles: totalEntries,
            includedFiles: entries.filter(e => !e.isDirectory).length,
            excludedFiles: 0,
            reasons: {},
            processingTimeMs: processingTime
          }, truthScore);
          resolve(entries);
        });

        zipFile.on('error', async (error) => {
          zipFile.close();
          const errorMessage = `Error during ZIP processing: ${error.message}`;

          // Calculate truth score for error case
          const truthScore = this.verificationService.calculateTruthScore([], {
            extractedCount: 0,
            totalSize: 0,
            entries: [],
            warnings: [errorMessage]
          }, 0);

          await this.recordOperation('extractStreamsOptimized', buffer.length, false, errorMessage);
          await this.hooksService.postTask({
            totalFiles: 0,
            includedFiles: 0,
            excludedFiles: 0,
            reasons: {},
            processingTimeMs: 0
          }, truthScore);
          reject(new Error(errorMessage));
        });

        // Start reading entries
        zipFile.readEntry();
      });
    });
  }

  /**
   * Optimized stream entry processing with buffer pooling
   */
  private async processStreamEntryOptimized(
    entry: StreamEntry,
    destinationPath: string,
    options: ZipExtractionOptions,
    result: ZipExtractionResult
  ): Promise<void> {
    const fullPath = path.join(destinationPath, entry.name);

    // Ensure parent directory exists
    await this.ensureDirectoryExists(path.dirname(fullPath));

    // Check if file exists and handle overwrite option
    try {
      const stats = await fs.stat(fullPath);
      if (stats.isFile() && !options.overwrite) {
        result.warnings.push(`File ${entry.name} already exists and overwrite is disabled`);
        return;
      }
    } catch {
      // File doesn't exist, which is fine
    }

    // For very large files (>100MB), use specialized chunked processing
    if (entry.size > 100 * 1024 * 1024) {
      return await this.processLargeStreamEntry(entry, fullPath, options, result);
    }

    // Process the stream entry with optimized chunked processing
    try {
      // Write to file using optimized approach
      const writeStream = createWriteStream(fullPath);
      return new Promise<void>((resolve, reject) => {
        // Use efficient chunk processing with buffer pooling
        entry.stream.on('data', (chunk: Buffer) => {
          // Check memory limit during processing
          if (this.memoryMonitor.isLimitExceeded()) {
            entry.stream.destroy();
            writeStream.destroy();
            reject(new ZipExtractionError(
              `Memory limit exceeded during processing of ${entry.name}`,
              'MEMORY_LIMIT_EXCEEDED'
            ));
            return;
          }

          // Use buffer pooling for efficient memory management
          const processedChunks = this.writeChunkEfficiently(chunk);
          processedChunks.forEach(processedChunk => {
            if (!writeStream.write(processedChunk)) {
              entry.stream.pause();
              writeStream.once('drain', () => entry.stream.resume());
            }
          });
        });

        entry.stream.on('end', () => {
          // Flush any remaining data
          const remainingChunk = this.flushCurrentChunk();
          if (remainingChunk) {
            writeStream.write(remainingChunk);
          }

          writeStream.end();
        });

        writeStream.on('finish', () => {
          result.extractedCount++;
          result.totalSize += entry.size;
          result.entries.push({
            name: entry.name,
            size: entry.size,
            compressedSize: 0,
            lastModified: new Date(),
            isDirectory: false,
            isFile: true
          });

          // Call callback if provided
          if (options.onEntryExtracted) {
            options.onEntryExtracted({
              name: entry.name,
              size: entry.size,
              compressedSize: 0,
              lastModified: new Date(),
              isDirectory: false,
              isFile: true
            });
          }

          resolve();
        });

        writeStream.on('error', reject);
        entry.stream.on('error', reject);
      });
    } catch (error) {
      throw new ZipExtractionError(
        `Failed to process entry ${entry.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'EXTRACTION_FAILED',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Process large stream entries with specialized chunked processing
   * @param entry Stream entry to process
   * @param fullPath Full path for the output file
   * @param options Extraction options
   * @param result Extraction result object
   */
  private async processLargeStreamEntry(
    entry: StreamEntry,
    fullPath: string,
    options: ZipExtractionOptions,
    result: ZipExtractionResult
  ): Promise<void> {
    // Call post-edit hook for coordination
    await this.hooksService.postEdit(`Processing large stream entry: ${entry.name} (${entry.size} bytes)`, { entryName: entry.name, entrySize: entry.size });

    // For very large files, use specialized chunked processing with progress tracking
    const writeStream = createWriteStream(fullPath);

    // Use smaller chunk size for large files to maintain memory efficiency
    const largeFileChunkSize = Math.min(64 * 1024, this.calculateAdaptiveHighWaterMark());

    // Track progress for large files
    let bytesProcessed = 0;
    const totalSize = entry.size;

    return new Promise<void>((resolve, reject) => {
      entry.stream.on('data', async (chunk: Buffer) => {
        // Check memory limit during processing
        if (this.memoryMonitor.isLimitExceeded()) {
          entry.stream.destroy();
          writeStream.destroy();
          await this.hooksService.postEdit(`Memory limit exceeded during processing of large file ${entry.name}`, { error: 'MEMORY_LIMIT_EXCEEDED', fileName: entry.name });
          reject(new ZipExtractionError(
            `Memory limit exceeded during processing of large file ${entry.name}`,
            'MEMORY_LIMIT_EXCEEDED'
          ));
          return;
        }

        // Process chunk with specialized handling for large files
        if (!writeStream.write(chunk)) {
          entry.stream.pause();
          writeStream.once('drain', () => entry.stream.resume());
        }

        // Update progress
        bytesProcessed += chunk.length;
        if (options.onProgress) {
          const progress = Math.round((bytesProcessed / totalSize) * 100);
          options.onProgress(progress);
        }

        // Update processing metrics for adaptive optimization
        this.updateProcessingMetrics(chunk.length);
      });

      entry.stream.on('end', () => {
        writeStream.end();
      });

      writeStream.on('finish', async () => {
        result.extractedCount++;
        result.totalSize += entry.size;
        result.entries.push({
          name: entry.name,
          size: entry.size,
          compressedSize: 0,
          lastModified: new Date(),
          isDirectory: false,
          isFile: true
        });

        // Call post-edit hook for coordination
        await this.hooksService.postEdit(`Successfully processed large stream entry: ${entry.name}`, 'swarm/optimized-zip-processor/large-entry');

        // Call callback if provided
        if (options.onEntryExtracted) {
          options.onEntryExtracted({
            name: entry.name,
            size: entry.size,
            compressedSize: 0,
            lastModified: new Date(),
            isDirectory: false,
            isFile: true
          });
        }

        resolve();
      });

      writeStream.on('error', async (error) => {
        await this.hooksService.postEdit(`Error processing large stream entry ${entry.name}: ${error.message}`, 'swarm/optimized-zip-processor/error');
        reject(error);
      });

      entry.stream.on('error', async (error) => {
        await this.hooksService.postEdit(`Error in stream for large entry ${entry.name}: ${error.message}`, 'swarm/optimized-zip-processor/error');
        reject(error);
      });
    });
  }

  /**
   * Update processing metrics for adaptive optimization
   * @param bytesProcessed Number of bytes processed in this chunk
   */
  private updateProcessingMetrics(bytesProcessed: number): void {
    const now = Date.now();

    // Update chunks per second tracking
    if (this.processingMetrics.lastProcessed > 0) {
      const timeDiff = now - this.processingMetrics.lastProcessed;
      if (timeDiff > 0) {
        const chunksPerSec = (bytesProcessed / 1024) / (timeDiff / 1000); // KB/s
        this.processingMetrics.chunksPerSecond.push(chunksPerSec);

        // Maintain history size
        if (this.processingMetrics.chunksPerSecond.length > this.HISTORY_SIZE) {
          this.processingMetrics.chunksPerSecond.shift();
        }
      }
    }

    this.processingMetrics.lastProcessed = now;
  }

  /**
   * Write chunk efficiently using buffer pooling
   * @param chunk Chunk to write
   */
  private writeChunkEfficiently(chunk: Buffer): Buffer[] {
    const chunks: Buffer[] = [];

    if (!this.currentChunk) {
      const highWaterMark = this.calculateAdaptiveHighWaterMark();
      this.currentChunk = this.getBuffer(highWaterMark);
      this.currentOffset = 0;
    }

    const availableSpace = this.currentChunk.length - this.currentOffset;

    if (chunk.length <= availableSpace) {
      // Fit entire chunk in current buffer
      chunk.copy(this.currentChunk, this.currentOffset);
      this.currentOffset += chunk.length;
    } else {
      // Split chunk across multiple buffers
      const firstPart = chunk.slice(0, availableSpace);
      firstPart.copy(this.currentChunk, this.currentOffset);

      // Push current chunk
      chunks.push(Buffer.from(this.currentChunk.buffer, this.currentChunk.byteOffset, this.currentOffset));

      // Process remaining part
      const remaining = chunk.slice(availableSpace);
      const highWaterMark = this.calculateAdaptiveHighWaterMark();
      this.releaseBuffer(this.currentChunk); // Release the filled buffer
      this.currentChunk = this.getBuffer(highWaterMark);
      this.currentOffset = 0;

      if (remaining.length > 0) {
        chunks.push(...this.writeChunkEfficiently(remaining)); // Recursive call for remaining data
      }
    }

    return chunks;
  }

  /**
   * Flush any remaining data in current chunk
   * @returns Remaining data buffer or null if none
   */
  private flushCurrentChunk(): Buffer | null {
    if (this.currentChunk && this.currentOffset > 0) {
      const remainingData = Buffer.from(this.currentChunk.buffer, this.currentChunk.byteOffset, this.currentOffset);
      this.releaseBuffer(this.currentChunk);
      this.currentChunk = null;
      this.currentOffset = 0;
      return remainingData;
    }
    return null;
  }

  /**
   * Get a buffer from the categorized pool or create a new one
   * @param size Size of buffer needed
   * @returns Buffer from pool or newly allocated buffer
   */
  private getBuffer(size: number): Buffer {
    let pool: Buffer[] = this.bufferPool;
    let maxPoolSize: number = this.MAX_POOL_SIZE;

    // Categorize buffer by size for more efficient pooling
    if (size <= this.SMALL_BUFFER_SIZE) {
      pool = this.smallBufferPool;
      maxPoolSize = this.MAX_CATEGORY_POOL_SIZE;
    } else if (size <= this.MEDIUM_BUFFER_SIZE) {
      pool = this.mediumBufferPool;
      maxPoolSize = this.MAX_CATEGORY_POOL_SIZE;
    } else if (size <= this.LARGE_BUFFER_SIZE) {
      pool = this.largeBufferPool;
      maxPoolSize = this.MAX_CATEGORY_POOL_SIZE;
    }

    // Try to reuse buffer from appropriate pool
    const bufferIndex = pool.findIndex(buf => buf.length >= size);
    if (bufferIndex !== -1) {
      return pool.splice(bufferIndex, 1)[0];
    }
    return Buffer.alloc(size);
  }

  /**
   * Release a buffer back to the categorized pool
   * @param buffer Buffer to release
   */
  private releaseBuffer(buffer: Buffer): void {
    let pool: Buffer[] = this.bufferPool;
    let maxPoolSize: number = this.MAX_POOL_SIZE;

    // Categorize buffer by size for more efficient pooling
    const size = buffer.length;
    if (size <= this.SMALL_BUFFER_SIZE) {
      pool = this.smallBufferPool;
      maxPoolSize = this.MAX_CATEGORY_POOL_SIZE;
    } else if (size <= this.MEDIUM_BUFFER_SIZE) {
      pool = this.mediumBufferPool;
      maxPoolSize = this.MAX_CATEGORY_POOL_SIZE;
    } else if (size <= this.LARGE_BUFFER_SIZE) {
      pool = this.largeBufferPool;
      maxPoolSize = this.MAX_CATEGORY_POOL_SIZE;
    }

    if (pool.length < maxPoolSize) {
      pool.push(buffer);
    }
    // Otherwise, let it be garbage collected
  }

  /**
   * Calculate adaptive high water mark based on processing performance and system resources
   * @returns Adaptive high water mark value
   */
  private calculateAdaptiveHighWaterMark(): number {
    // Start with base value
    let baseHighWaterMark = 64 * 1024; // 64KB default

    // Adjust based on processing metrics if available
    if (this.processingMetrics.chunksPerSecond.length > 0) {
      const avgChunksPerSec = this.processingMetrics.chunksPerSecond.reduce((a, b) => a + b, 0) /
                              this.processingMetrics.chunksPerSecond.length;

      // Adjust based on processing speed
      if (avgChunksPerSec > 2000) {
        // Very fast processing - use larger buffers
        baseHighWaterMark = Math.min(256 * 1024, 256 * 1024); // Max 256KB
      } else if (avgChunksPerSec > 1000) {
        // Fast processing - use medium-large buffers
        baseHighWaterMark = 128 * 1024; // 128KB
      } else if (avgChunksPerSec < 50) {
        // Slow processing - use smaller buffers to reduce memory pressure
        baseHighWaterMark = Math.max(16 * 1024, 8 * 1024); // Min 8KB
      }
    }

    // Adjust based on available memory
    const memoryUsage = this.memoryMonitor.getCurrentUsage();
    const memoryPressure = memoryUsage.heapUsed / memoryUsage.heapTotal;

    // Reduce buffer size under high memory pressure
    if (memoryPressure > 0.8) {
      baseHighWaterMark = Math.max(8 * 1024, baseHighWaterMark * 0.5); // Min 8KB
    } else if (memoryPressure > 0.6) {
      baseHighWaterMark = baseHighWaterMark * 0.75;
    }

    // Ensure reasonable bounds
    return Math.max(4 * 1024, Math.min(512 * 1024, Math.round(baseHighWaterMark)));
  }

  /**
   * Continue processing next entry with progress tracking
   */
  private continueProcessing(
    zipFile: ZipFile,
    processedEntries: number,
    totalEntries: number,
    options: StreamOptions
  ): void {
    // Update progress tracking
    if (this.progressTracker && options.onProgress) {
      this.progressTracker.update(processedEntries);
      const progress = this.progressTracker.getProgress();
      options.onProgress(progress);
    }

    // Check memory usage and alert if necessary
    this.memoryMonitor.checkAndAlert();

    // Continue to next entry
    zipFile.readEntry();
  }

  /**
   * Calculate backpressure delay based on buffer overflow
   * @param readableLength Current readable length
   * @param highWaterMark High water mark threshold
   * @returns Delay in milliseconds
   */
  private calculateBackpressureDelay(readableLength: number, highWaterMark: number): number {
    const overflow = readableLength - highWaterMark;
    // Exponential backoff based on buffer overflow
    return Math.min(100, Math.max(10, overflow / highWaterMark * 50));
  }

  /**
   * Evict old entries when buffer is full to maintain memory efficiency
   * @param entries Current entries array
   */
  private evictOldEntriesIfNeeded(entries: StreamEntry[]): void {
    if (entries.length > this.maxEntriesInMemory) {
      // Remove oldest entries (FIFO approach)
      const entriesToRemove = entries.length - this.maxEntriesInMemory;
      entries.splice(0, entriesToRemove);

      // Log eviction for monitoring
      console.warn(`Evicted ${entriesToRemove} old entries to maintain memory efficiency`);
    }
  }

  /**
   * Processes ZIP entries and extracts them
   */
  private async processEntries(
    zipFile: ZipFile,
    destinationPath: string,
    options: ZipExtractionOptions,
    result: ZipExtractionResult
  ): Promise<ZipEntry[]> {
    const entries: ZipEntry[] = [];
    const totalEntries = zipFile.entryCount;
    let processedEntries = 0;

    return new Promise<ZipEntry[]>((resolve, reject) => {
      zipFile.on('entry', async (entry: Entry) => {
        try {
          // Convert to our entry format
          const zipEntry = this.convertEntry(entry);
          entries.push(zipEntry);

          // Check size limits
          if (options.maxSize && zipEntry.size > options.maxSize) {
            result.warnings.push(`File ${zipEntry.name} exceeds size limit and was skipped`);
            zipFile.readEntry();
            return;
          }

          // Skip directories if not included
          if (zipEntry.isDirectory && options.includeDirectories === false) {
            zipFile.readEntry();
            return;
          }

          // Extract the entry
          await this.extractEntry(zipFile, entry, destinationPath, zipEntry, options, result);

          // Update progress
          processedEntries++;
          const progress = Math.round((processedEntries / totalEntries) * 100);

          if (options.onProgress) {
            options.onProgress(progress);
          }

          // Continue to next entry
          zipFile.readEntry();
        } catch (error) {
          zipFile.close();
          reject(error);
        }
      });

      zipFile.on('end', () => {
        zipFile.close();
        resolve(entries);
      });

      zipFile.on('error', (error) => {
        zipFile.close();
        reject(new ZipExtractionError(
          `Error during ZIP processing: ${error.message}`,
          'EXTRACTION_FAILED',
          error
        ));
      });

      // Start reading entries
      zipFile.readEntry();
    });
  }

  /**
   * Extracts a single entry from the ZIP file
   */
  private async extractEntry(
    zipFile: ZipFile,
    entry: Entry,
    destinationPath: string,
    zipEntry: ZipEntry,
    options: ZipExtractionOptions,
    result: ZipExtractionResult
  ): Promise<void> {
    // Validate entry name to prevent path traversal
    if (!this.isValidEntryName(zipEntry.name)) {
      throw new ZipExtractionError(
        `Invalid entry name: ${zipEntry.name}`,
        'INVALID_ZIP_FILE'
      );
    }

    const fullPath = path.join(destinationPath, zipEntry.name);

    // Handle directories
    if (zipEntry.isDirectory) {
      await this.ensureDirectoryExists(fullPath);
      return;
    }

    // Handle files
    return new Promise<void>((resolve, reject) => {
      // Ensure parent directory exists
      this.ensureDirectoryExists(path.dirname(fullPath))
        .then(() => {
          // Check if file exists and handle overwrite option
          return fs.stat(fullPath).then(stats => {
            if (stats.isFile() && !options.overwrite) {
              result.warnings.push(`File ${zipEntry.name} already exists and overwrite is disabled`);
              return false; // Skip extraction
            }
            return true; // Proceed with extraction
          }).catch(() => {
            // File doesn't exist, which is fine
            return true; // Proceed with extraction
          });
        })
        .then(shouldExtract => {
          if (!shouldExtract) {
            resolve();
            return;
          }

          // Open read stream for the entry
          zipFile.openReadStream(entry, (err, readStream) => {
            if (err) {
              reject(new ZipExtractionError(
                `Failed to open read stream for entry ${zipEntry.name}: ${err.message}`,
                'EXTRACTION_FAILED',
                err
              ));
              return;
            }

            if (!readStream) {
              reject(new ZipExtractionError(
                `Failed to open read stream for entry ${zipEntry.name}: stream is null`,
                'EXTRACTION_FAILED'
              ));
              return;
            }

            // Create write stream for the destination file
            const writeStream = createWriteStream(fullPath);

            // Track size for limit checking
            let currentSize = 0;
            const maxSize = options.maxSize || Infinity;

            // Pipe data with size checking
            readStream.on('data', (chunk: Buffer) => {
              currentSize += chunk.length;
              if (currentSize > maxSize) {
                readStream.destroy();
                writeStream.destroy();
                reject(new ZipExtractionError(
                  `File ${zipEntry.name} exceeds size limit during extraction`,
                  'FILE_TOO_LARGE'
                ));
              }
            });

            // Wait for the stream to finish
            readStream.pipe(writeStream);
            writeStream.on('finish', () => {
              // Update result statistics
              result.extractedCount++;
              result.totalSize += zipEntry.size;

              // Call callback if provided
              if (options.onEntryExtracted) {
                options.onEntryExtracted(zipEntry);
              }

              resolve();
            });

            writeStream.on('error', (error) => {
              reject(new ZipExtractionError(
                `Failed to write file ${zipEntry.name}: ${error.message}`,
                'EXTRACTION_FAILED',
                error
              ));
            });

            readStream.on('error', (error) => {
              reject(new ZipExtractionError(
                `Failed to read entry ${zipEntry.name}: ${error.message}`,
                'EXTRACTION_FAILED',
                error
              ));
            });
          });
        })
        .catch(error => {
          if (error instanceof ZipExtractionError) {
            reject(error);
          } else {
            reject(new ZipExtractionError(
              `Failed to extract entry ${zipEntry.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
              'EXTRACTION_FAILED',
              error instanceof Error ? error : undefined
            ));
          }
        });
    });
  }

  /**
   * Converts a yauzl Entry to our ZipEntry format
   */
  private convertEntry(entry: Entry): ZipEntry {
    return {
      name: entry.fileName,
      size: entry.uncompressedSize,
      compressedSize: entry.compressedSize,
      lastModified: entry.getLastModDate(),
      isDirectory: entry.fileName.endsWith('/'),
      isFile: !entry.fileName.endsWith('/')
    };
  }

  /**
   * Validates entry name to prevent path traversal attacks
   */
  private isValidEntryName(name: string): boolean {
    // Check for path traversal attempts
    if (name.includes('../') || name.includes('..\\')) {
      return false;
    }

    // Check for absolute paths
    if (path.isAbsolute(name)) {
      return false;
    }

    // Check for invalid characters (basic check)
    if (name.includes('\0')) {
      return false;
    }

    return true;
  }

  /**
   * Ensures a directory exists, creating it if necessary
   */
  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      throw new ZipExtractionError(
        `Failed to create directory ${dirPath}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'EXTRACTION_FAILED',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Record operation for agentic-jujutsu version control
   * @param operationType Type of operation
   * @param dataSize Size of data processed
   * @param success Whether operation was successful
   * @param details Additional details
   */
  private async recordOperation(
    operationType: string,
    dataSize: number,
    success: boolean,
    details: string
  ): Promise<void> {
    try {
      // Record operation with agentic-jujutsu service
      await this.jujutsuService.recordOperation(
        {
          operation: 'update',
          path: `optimized-zip-processor/${operationType}`,
          content: `Processing ${dataSize} bytes`,
          message: details,
          branch: 'main'
        },
        {
          success,
          error: success ? undefined : details,
          path: `optimized-zip-processor/${operationType}`
        },
        'optimized-zip-processor'
      );
    } catch (error) {
      console.warn('Failed to record operation with agentic-jujutsu:', error);
    }
  }

  /**
   * Get current memory usage
   * @returns Current memory usage information
   */
  getMemoryUsage(): MemoryUsage {
    return this.memoryMonitor.getCurrentUsage();
  }

  /**
   * Check if memory limit is exceeded
   * @returns True if memory limit is exceeded
   */
  isMemoryLimitExceeded(): boolean {
    return this.memoryMonitor.isLimitExceeded();
  }

  /**
   * Get memory limit
   * @returns Memory limit in bytes
   */
  getMemoryLimit(): number {
    return this.memoryMonitor.getLimit();
  }

  /**
   * Set filter configuration
   * @param config Filter configuration
   */
  setFilterConfig(config: EntryFilterConfig): void {
    this.entryFilter = new EntryFilter(config);
  }
}