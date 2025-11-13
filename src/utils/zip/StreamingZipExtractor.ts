import { Readable } from 'stream';
import yauzl, { Entry, ZipFile } from 'yauzl';
import { StreamEntry, StreamOptions } from '../../types/streaming';
import { promisify } from 'util';
import { MemoryMonitor } from './MemoryMonitor';
import { ProgressTracker } from './ProgressTracker';
import { FilterHooksService } from '../../filters/hooks/FilterHooksService';
import { AgenticJujutsuService } from '../../github/files/AgenticJujutsuService';
import { ZipVerificationService, ZipVerificationReport } from './ZipVerificationService';

const openZip = promisify(yauzl.fromBuffer);

/**
 * Streaming ZIP extractor for memory-efficient processing
 */
export class StreamingZipExtractor {
  private memoryMonitor: MemoryMonitor;
  private progressTracker: ProgressTracker | null = null;
  private static readonly EMPTY_STREAM = new Readable({ read() { this.push(null); } });
  private maxEntriesInMemory: number;
  private hooksService: FilterHooksService;
  private jujutsuService: AgenticJujutsuService;
  private verificationService: ZipVerificationService;

  /**
   * Create a streaming ZIP extractor
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
  }

  /**
   * Extract ZIP file entries as streams with streaming processing
   * @param buffer ZIP file buffer
   * @param options Streaming options
   * @returns Promise resolving to array of stream entries
   */
  async extractStreams(buffer: Buffer, options: StreamOptions = {}): Promise<StreamEntry[]> {
    // Pre-task hook
    await this.hooksService.preTask(`Extracting streams from ZIP buffer (${buffer.length} bytes)`);

    // Check memory before processing
    if (this.memoryMonitor.isLimitExceeded()) {
      const error = new Error('Memory limit exceeded before processing');
      await this.recordOperation('extractStreams', buffer.length, false, error.message);
      throw error;
    }

    return new Promise((resolve, reject) => {
      yauzl.fromBuffer(buffer, { lazyEntries: true }, async (err, zipFile) => {
        if (err) {
          const error = new Error(`Failed to open ZIP file: ${err.message}`);
          await this.recordOperation('extractStreams', buffer.length, false, error.message);
          return reject(error);
        }
        if (!zipFile) {
          const error = new Error('Failed to open ZIP file: zipFile is null');
          await this.recordOperation('extractStreams', buffer.length, false, error.message);
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
            await this.recordOperation('extractStreams', buffer.length, false, error.message);
            return reject(error);
          }

          // Handle directory entries with optimized stream creation
          if (entry.fileName.endsWith('/')) {
            entries.push({
              name: entry.fileName,
              size: entry.uncompressedSize,
              isDirectory: true,
              stream: StreamingZipExtractor.EMPTY_STREAM // Reuse singleton empty stream
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
              await this.recordOperation('extractStreams', buffer.length, false, error.message);
              return reject(error);
            }

            if (!readStream) {
              zipFile.close();
              const error = new Error(`Failed to open read stream for entry ${entry.fileName}: stream is null`);
              await this.recordOperation('extractStreams', buffer.length, false, error.message);
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
                await this.recordOperation('extractStreams', buffer.length, false, error instanceof Error ? error.message : 'Unknown error');
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

          await this.recordOperation('extractStreams', buffer.length, true, `Processed ${totalEntries} entries`);
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

          await this.recordOperation('extractStreams', buffer.length, false, errorMessage);
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
   * Process ZIP entries with streaming callback for memory-efficient processing
   * @param buffer ZIP file buffer
   * @param entryCallback Callback function for each entry
   * @param options Streaming options
   */
  async processEntriesStream(
    buffer: Buffer,
    entryCallback: (entry: StreamEntry) => Promise<void>,
    options?: StreamOptions
  ): Promise<void> {
    // Pre-task hook
    await this.hooksService.preTask(`Processing entries stream from ZIP buffer (${buffer.length} bytes)`);

    // Check memory before processing
    if (this.memoryMonitor.isLimitExceeded()) {
      const error = new Error('Memory limit exceeded before processing');
      await this.recordOperation('processEntriesStream', buffer.length, false, error.message);
      throw error;
    }

    return new Promise((resolve, reject) => {
      yauzl.fromBuffer(buffer, { lazyEntries: true }, async (err, zipFile) => {
        if (err) {
          const error = new Error(`Failed to open ZIP file: ${err.message}`);
          await this.recordOperation('processEntriesStream', buffer.length, false, error.message);
          return reject(error);
        }
        if (!zipFile) {
          const error = new Error('Failed to open ZIP file: zipFile is null');
          await this.recordOperation('processEntriesStream', buffer.length, false, error.message);
          return reject(error);
        }

        let processedEntries = 0;
        const totalEntries = zipFile.entryCount;

        // Initialize progress tracker if callback provided
        if (options?.onProgress) {
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
            await this.recordOperation('processEntriesStream', buffer.length, false, error.message);
            return reject(error);
          }

          // Handle directory entries with optimized stream creation
          if (entry.fileName.endsWith('/')) {
            const streamEntry: StreamEntry = {
              name: entry.fileName,
              size: entry.uncompressedSize,
              isDirectory: true,
              stream: StreamingZipExtractor.EMPTY_STREAM // Reuse singleton empty stream
            };

            try {
              await entryCallback(streamEntry);
              this.continueProcessing(zipFile, ++processedEntries, totalEntries, options || {});
            } catch (error) {
              zipFile.close();
              await this.recordOperation('processEntriesStream', buffer.length, false, error instanceof Error ? error.message : 'Unknown error');
              reject(error);
            }
            return;
          }

          // Open read stream for file entries
          zipFile.openReadStream(entry, async (err, readStream) => {
            if (err) {
              zipFile.close();
              const error = new Error(`Failed to open read stream for entry ${entry.fileName}: ${err.message}`);
              await this.recordOperation('processEntriesStream', buffer.length, false, error.message);
              return reject(error);
            }

            if (!readStream) {
              zipFile.close();
              const error = new Error(`Failed to open read stream for entry ${entry.fileName}: stream is null`);
              await this.recordOperation('processEntriesStream', buffer.length, false, error.message);
              return reject(error);
            }

            // Apply enhanced backpressure handling if highWaterMark specified
            if (options?.highWaterMark) {
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

            try {
              await entryCallback(streamEntry);
              this.continueProcessing(zipFile, ++processedEntries, totalEntries, options || {});
            } catch (error) {
              zipFile.close();
              await this.recordOperation('processEntriesStream', buffer.length, false, error instanceof Error ? error.message : 'Unknown error');
              reject(error);
            }
          });
        });

        zipFile.on('end', async () => {
          zipFile.close();
          const processingTime = Date.now() - (this.progressTracker ? this.progressTracker['startTime'] || Date.now() : Date.now());

          // For processEntriesStream, we don't have detailed entry information, so we create a minimal result
          const truthScore = this.verificationService.calculateTruthScore([], {
            extractedCount: totalEntries,
            totalSize: 0, // We don't have size information in this method
            entries: [],
            warnings: []
          }, processingTime);

          await this.recordOperation('processEntriesStream', buffer.length, true, `Processed ${totalEntries} entries`);
          await this.hooksService.postTask({
            totalFiles: totalEntries,
            includedFiles: totalEntries,
            excludedFiles: 0,
            reasons: {},
            processingTimeMs: processingTime
          }, truthScore);
          resolve();
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

          await this.recordOperation('processEntriesStream', buffer.length, false, errorMessage);
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
          path: `zip-extractor/${operationType}`,
          content: `Processing ${dataSize} bytes`,
          message: details,
          branch: 'main'
        },
        {
          success,
          error: success ? undefined : details,
          path: `zip-extractor/${operationType}`
        },
        'zip-extractor-agent'
      );
    } catch (error) {
      console.warn('Failed to record operation with agentic-jujutsu:', error);
    }
  }

  /**
   * Get current memory usage
   * @returns Current memory usage information
   */
  getMemoryUsage() {
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
}