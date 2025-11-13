/**
 * ZIP Extraction Service
 *
 * Provides robust ZIP file extraction with comprehensive error handling,
 * size limits, and streaming support for large files.
 *
 * Features:
 * - Corrupted file detection and handling
 * - Size limit enforcement
 * - Streaming support for large files
 * - Comprehensive error handling
 * - Progress tracking
 * - Memory-efficient processing
 * - Adaptive processing based on file size
 */

import fs from 'fs/promises';
import path from 'path';
import yauzl, { Entry, ZipFile } from 'yauzl';
import { createWriteStream } from 'fs';
import {
  ZipEntry,
  ZipExtractionOptions,
  ZipExtractionResult,
  ZipExtractionError
} from '../../types/zip.js';
import { FilterHooksService } from '../../filters/hooks/FilterHooksService.js';
import { AgenticJujutsuService } from '../../github/files/AgenticJujutsuService.js';
import { StreamingZipExtractor } from './StreamingZipExtractor.js';
import { MemoryEfficientProcessor } from './MemoryEfficientProcessor.js';
import { BackpressureHandler } from './BackpressureHandler.js';
import { ChunkedProcessor } from './ChunkedProcessor.js';
import { EntryFilter } from './EntryFilter.js';
import { StreamEntry, StreamOptions } from '../../types/streaming.js';
import { ZipVerificationService } from './ZipVerificationService.js';

export class ZipExtractionService {
  /**
   * Extracts a ZIP file to the specified destination
   * @param zipFilePath Path to the ZIP file
   * @param destinationPath Path where files should be extracted
   * @param options Extraction options
   * @returns Extraction result with statistics
   */
  public static async extract(
    zipFilePath: string,
    destinationPath: string,
    options: ZipExtractionOptions = {}
  ): Promise<ZipExtractionResult> {
    // Initialize services
    const hooksService = FilterHooksService.getInstance();
    const jujutsuService = AgenticJujutsuService.getInstance();
    const sessionId = `zip-extraction-${Date.now()}`;

    // Initialize agentic jujutsu session
    await jujutsuService.initializeSession(sessionId, ['zip-extraction-agent']);

    try {
      // Call pre-task hook
      await hooksService.preTask(`Extracting ZIP file ${zipFilePath} to ${destinationPath} with options: ${JSON.stringify(options)}`);

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
              await jujutsuService.recordOperation(
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
                'zip-extraction-agent'
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
      // For regular extract, we create mock stream entries from zip entries for verification
      const verificationService = ZipVerificationService.getInstance();
      const mockStreamEntries = finalResult.entries.map(entry => ({
        name: entry.name,
        size: entry.size,
        isDirectory: entry.isDirectory,
        stream: null as any // We don't have actual streams in regular extract
      }));

      const truthScore = verificationService.calculateTruthScore(
        mockStreamEntries,
        finalResult,
        0 // Processing time (we don't track this in the current implementation)
      );

      // Call post-task hook with calculated truth score
      await hooksService.postTask({
        totalFiles: finalResult.entries.length,
        includedFiles: finalResult.extractedCount,
        excludedFiles: finalResult.entries.length - finalResult.extractedCount,
        reasons: {},
        processingTimeMs: 0 // We don't track this in the current implementation
      }, truthScore);

      return finalResult;
    } finally {
      try {
        // Cleanup agentic jujutsu session
        await jujutsuService.cleanupSession(sessionId);
      } catch (error) {
        console.warn('Failed to cleanup session:', error);
      }
    }
  }

  /**
   * Extracts a ZIP file using streaming for memory-efficient processing
   * @param zipFilePath Path to the ZIP file
   * @param destinationPath Path where files should be extracted
   * @param options Extraction options
   * @returns Extraction result with statistics
   */
  public static async extractStreaming(
    zipFilePath: string,
    destinationPath: string,
    options: ZipExtractionOptions = {}
  ): Promise<ZipExtractionResult> {
    // Initialize services
    const hooksService = FilterHooksService.getInstance();
    const jujutsuService = AgenticJujutsuService.getInstance();
    const sessionId = `zip-extraction-streaming-${Date.now()}`;

    // Initialize agentic jujutsu session
    await jujutsuService.initializeSession(sessionId, ['zip-extraction-agent']);

    try {
      // Call pre-task hook
      await hooksService.preTask(`Extracting ZIP file (streaming) ${zipFilePath} to ${destinationPath} with options: ${JSON.stringify(options)}`);

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

      // Create streaming components
      const memoryLimit = options.maxMemoryUsage || 100 * 1024 * 1024; // 100MB default
      const extractor = new StreamingZipExtractor(memoryLimit);
      const processor = new MemoryEfficientProcessor(memoryLimit);
      const handler = new BackpressureHandler(memoryLimit);
      const chunker = new ChunkedProcessor(memoryLimit);
      const filter = new EntryFilter();

      // Apply filters if provided
      if (options.includePatterns) {
        options.includePatterns.forEach(pattern => filter.addIncludePattern(pattern));
      }
      if (options.excludePatterns) {
        options.excludePatterns.forEach(pattern => filter.addExcludePattern(pattern));
      }
      if (options.maxSize) {
        filter.setSizeLimits(0, options.maxSize);
      }

      // Initialize result object
      const result: ZipExtractionResult = {
        extractedCount: 0,
        totalSize: 0,
        entries: [],
        warnings: []
      };

      // Extract streams from ZIP
      const streamEntries = await extractor.extractStreams(buffer, {
        highWaterMark: options.highWaterMark,
        onProgress: options.onProgress ? (progress) => {
          // Convert streaming progress to extraction progress
          if (options.onProgress) {
            options.onProgress(progress.percentage);
          }
        } : undefined
      });

      // Filter entries
      const filteredEntries = filter.filterEntries(streamEntries);

      // Process each entry
      for (const entry of filteredEntries) {
        if (entry.isDirectory) {
          // Handle directories
          const fullPath = path.join(destinationPath, entry.name);
          await this.ensureDirectoryExists(fullPath);
          result.entries.push({
            name: entry.name,
            size: entry.size,
            compressedSize: 0, // Not available in streaming mode
            lastModified: new Date(),
            isDirectory: true,
            isFile: false
          });
        } else {
          // Handle files with adaptive processing
          await this.processStreamEntry(
            entry,
            destinationPath,
            processor,
            handler,
            chunker,
            options,
            result
          );
        }
      }

      // Record operation in agentic jujutsu
      await jujutsuService.recordOperation(
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
        'zip-extraction-agent'
      );

      // Calculate truth score using ZipVerificationService
      const verificationService = ZipVerificationService.getInstance();
      const truthScore = verificationService.calculateTruthScore(
        streamEntries, // Input stream entries
        result, // Extraction results
        0 // Processing time (we don't track this in the current implementation)
      );

      // Call post-task hook with calculated truth score
      await hooksService.postTask({
        totalFiles: result.entries.length,
        includedFiles: result.extractedCount,
        excludedFiles: result.entries.length - result.extractedCount,
        reasons: {},
        processingTimeMs: 0 // We don't track this in the current implementation
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
        await jujutsuService.cleanupSession(sessionId);
      } catch (error) {
        console.warn('Failed to cleanup session:', error);
      }
    }
  }

  /**
   * Processes a stream entry with adaptive processing based on file size
   */
  private static async processStreamEntry(
    entry: StreamEntry,
    destinationPath: string,
    processor: MemoryEfficientProcessor,
    handler: BackpressureHandler,
    chunker: ChunkedProcessor,
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

    // Apply backpressure handling for large files
    let processedStream = entry.stream;
    if (entry.size > 10 * 1024 * 1024) { // 10MB
      processedStream = handler.applyBackpressure(entry.stream, options.highWaterMark);
    }

    // For very large files, use chunked processing
    if (entry.size > 50 * 1024 * 1024) { // 50MB
      await this.processLargeStreamEntry(entry, processedStream, fullPath, chunker, result);
    } else {
      // For smaller files, use memory-efficient processing
      await this.processRegularStreamEntry(entry, processedStream, fullPath, processor, result);
    }

    // Call callback if provided
    if (options.onEntryExtracted) {
      options.onEntryExtracted({
        name: entry.name,
        size: entry.size,
        compressedSize: 0, // Not available in streaming mode
        lastModified: new Date(),
        isDirectory: false,
        isFile: true
      });
    }
  }

  /**
   * Processes a regular stream entry with memory-efficient processing
   */
  private static async processRegularStreamEntry(
    entry: StreamEntry,
    stream: import("stream").Readable,
    fullPath: string,
    processor: MemoryEfficientProcessor,
    result: ZipExtractionResult
  ): Promise<void> {
    try {
      // Process the stream entry
      await processor.processStreamEntry({
        ...entry,
        stream
      });

      // Write to file
      const writeStream = createWriteStream(fullPath);
      return new Promise<void>((resolve, reject) => {
        stream.pipe(writeStream);
        writeStream.on('finish', () => {
          result.extractedCount++;
          result.totalSize += entry.size;
          result.entries.push({
            name: entry.name,
            size: entry.size,
            compressedSize: 0, // Not available in streaming mode
            lastModified: new Date(),
            isDirectory: false,
            isFile: true
          });
          resolve();
        });
        writeStream.on('error', reject);
        stream.on('error', reject);
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
   * Processes a large stream entry with chunked processing
   */
  private static async processLargeStreamEntry(
    entry: StreamEntry,
    stream: import("stream").Readable,
    fullPath: string,
    chunker: ChunkedProcessor,
    result: ZipExtractionResult
  ): Promise<void> {
    try {
      // Process the stream entry in chunks
      const chunkedResult = await chunker.processStreamEntryInChunks({
        ...entry,
        stream
      });

      // Write chunks to file
      const writeStream = createWriteStream(fullPath);
      return new Promise<void>((resolve, reject) => {
        // Write all chunks to the file
        let written = 0;
        const writeChunk = () => {
          if (written < chunkedResult.chunks.length) {
            const chunk = chunkedResult.chunks[written];
            if (writeStream.write(chunk)) {
              written++;
              setImmediate(writeChunk);
            } else {
              writeStream.once('drain', () => {
                written++;
                setImmediate(writeChunk);
              });
            }
          } else {
            writeStream.end();
          }
        };

        writeStream.on('finish', () => {
          result.extractedCount++;
          result.totalSize += entry.size;
          result.entries.push({
            name: entry.name,
            size: entry.size,
            compressedSize: 0, // Not available in streaming mode
            lastModified: new Date(),
            isDirectory: false,
            isFile: true
          });
          resolve();
        });

        writeStream.on('error', reject);
        writeChunk();
      });
    } catch (error) {
      throw new ZipExtractionError(
        `Failed to process large entry ${entry.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'EXTRACTION_FAILED',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Lists entries in a ZIP file without extracting them
   * @param zipFilePath Path to the ZIP file
   * @returns Array of ZIP entries
   */
  public static async listEntries(zipFilePath: string): Promise<ZipEntry[]> {
    if (!zipFilePath || typeof zipFilePath !== 'string') {
      throw new ZipExtractionError(
        'Invalid ZIP file path provided',
        'INVALID_ZIP_FILE'
      );
    }

    return new Promise<ZipEntry[]>((resolve, reject) => {
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

        const entries: ZipEntry[] = [];

        zipFile.on('entry', (entry: Entry) => {
          entries.push(this.convertEntry(entry));
          zipFile.readEntry();
        });

        zipFile.on('end', () => {
          zipFile.close();
          resolve(entries);
        });

        zipFile.on('error', (error) => {
          zipFile.close();
          reject(new ZipExtractionError(
            `Failed to read ZIP file: ${error.message}`,
            'INVALID_ZIP_FILE',
            error
          ));
        });

        zipFile.readEntry();
      });
    });
  }

  /**
   * Processes ZIP entries and extracts them
   */
  private static async processEntries(
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
  private static async extractEntry(
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
  private static convertEntry(entry: Entry): ZipEntry {
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
  private static isValidEntryName(name: string): boolean {
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
  private static async ensureDirectoryExists(dirPath: string): Promise<void> {
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
}