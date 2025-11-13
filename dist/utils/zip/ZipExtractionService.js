"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZipExtractionService = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const yauzl_1 = __importDefault(require("yauzl"));
const fs_1 = require("fs");
const zip_js_1 = require("../../types/zip.js");
const FilterHooksService_js_1 = require("../../filters/hooks/FilterHooksService.js");
const AgenticJujutsuService_js_1 = require("../../github/files/AgenticJujutsuService.js");
const StreamingZipExtractor_js_1 = require("./StreamingZipExtractor.js");
const MemoryEfficientProcessor_js_1 = require("./MemoryEfficientProcessor.js");
const BackpressureHandler_js_1 = require("./BackpressureHandler.js");
const ChunkedProcessor_js_1 = require("./ChunkedProcessor.js");
const EntryFilter_js_1 = require("./EntryFilter.js");
const ZipVerificationService_js_1 = require("./ZipVerificationService.js");
class ZipExtractionService {
    /**
     * Extracts a ZIP file to the specified destination
     * @param zipFilePath Path to the ZIP file
     * @param destinationPath Path where files should be extracted
     * @param options Extraction options
     * @returns Extraction result with statistics
     */
    static async extract(zipFilePath, destinationPath, options = {}) {
        // Initialize services
        const hooksService = FilterHooksService_js_1.FilterHooksService.getInstance();
        const jujutsuService = AgenticJujutsuService_js_1.AgenticJujutsuService.getInstance();
        const sessionId = `zip-extraction-${Date.now()}`;
        // Initialize agentic jujutsu session
        await jujutsuService.initializeSession(sessionId, ['zip-extraction-agent']);
        try {
            // Call pre-task hook
            await hooksService.preTask(`Extracting ZIP file ${zipFilePath} to ${destinationPath} with options: ${JSON.stringify(options)}`);
            // Validate inputs
            if (!zipFilePath || typeof zipFilePath !== 'string') {
                throw new zip_js_1.ZipExtractionError('Invalid ZIP file path provided', 'INVALID_ZIP_FILE');
            }
            if (!destinationPath || typeof destinationPath !== 'string') {
                throw new zip_js_1.ZipExtractionError('Invalid destination path provided', 'INVALID_ZIP_FILE');
            }
            // For large files or when streaming is enabled, use streaming extraction
            if (options.useStreaming || (options.maxSize && options.maxSize > 50 * 1024 * 1024)) {
                return await this.extractStreaming(zipFilePath, destinationPath, options);
            }
            // Ensure destination directory exists
            await this.ensureDirectoryExists(destinationPath);
            // Initialize result object
            const result = {
                extractedCount: 0,
                totalSize: 0,
                entries: [],
                warnings: []
            };
            const finalResult = await new Promise((resolve, reject) => {
                yauzl_1.default.open(zipFilePath, { lazyEntries: true }, (err, zipFile) => {
                    if (err) {
                        reject(new zip_js_1.ZipExtractionError(`Failed to open ZIP file: ${err.message}`, 'INVALID_ZIP_FILE', err));
                        return;
                    }
                    if (!zipFile) {
                        reject(new zip_js_1.ZipExtractionError('Failed to open ZIP file: zipFile is null', 'INVALID_ZIP_FILE'));
                        return;
                    }
                    this.processEntries(zipFile, destinationPath, options, result)
                        .then(async (entries) => {
                        result.entries = entries;
                        // Record operation in agentic jujutsu
                        await jujutsuService.recordOperation({
                            operation: 'update',
                            path: zipFilePath,
                            message: `Extracted ${result.extractedCount} files from ZIP`,
                            content: JSON.stringify(result),
                            branch: 'main'
                        }, {
                            success: true,
                            path: zipFilePath
                        }, 'zip-extraction-agent');
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
            const verificationService = ZipVerificationService_js_1.ZipVerificationService.getInstance();
            const mockStreamEntries = finalResult.entries.map(entry => ({
                name: entry.name,
                size: entry.size,
                isDirectory: entry.isDirectory,
                stream: null // We don't have actual streams in regular extract
            }));
            const truthScore = verificationService.calculateTruthScore(mockStreamEntries, finalResult, 0 // Processing time (we don't track this in the current implementation)
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
        }
        finally {
            try {
                // Cleanup agentic jujutsu session
                await jujutsuService.cleanupSession(sessionId);
            }
            catch (error) {
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
    static async extractStreaming(zipFilePath, destinationPath, options = {}) {
        // Initialize services
        const hooksService = FilterHooksService_js_1.FilterHooksService.getInstance();
        const jujutsuService = AgenticJujutsuService_js_1.AgenticJujutsuService.getInstance();
        const sessionId = `zip-extraction-streaming-${Date.now()}`;
        // Initialize agentic jujutsu session
        await jujutsuService.initializeSession(sessionId, ['zip-extraction-agent']);
        try {
            // Call pre-task hook
            await hooksService.preTask(`Extracting ZIP file (streaming) ${zipFilePath} to ${destinationPath} with options: ${JSON.stringify(options)}`);
            // Validate inputs
            if (!zipFilePath || typeof zipFilePath !== 'string') {
                throw new zip_js_1.ZipExtractionError('Invalid ZIP file path provided', 'INVALID_ZIP_FILE');
            }
            if (!destinationPath || typeof destinationPath !== 'string') {
                throw new zip_js_1.ZipExtractionError('Invalid destination path provided', 'INVALID_ZIP_FILE');
            }
            // Ensure destination directory exists
            await this.ensureDirectoryExists(destinationPath);
            // Read the ZIP file into a buffer
            const buffer = await promises_1.default.readFile(zipFilePath);
            // Create streaming components
            const memoryLimit = options.maxMemoryUsage || 100 * 1024 * 1024; // 100MB default
            const extractor = new StreamingZipExtractor_js_1.StreamingZipExtractor(memoryLimit);
            const processor = new MemoryEfficientProcessor_js_1.MemoryEfficientProcessor(memoryLimit);
            const handler = new BackpressureHandler_js_1.BackpressureHandler(memoryLimit);
            const chunker = new ChunkedProcessor_js_1.ChunkedProcessor(memoryLimit);
            const filter = new EntryFilter_js_1.EntryFilter();
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
            const result = {
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
                    const fullPath = path_1.default.join(destinationPath, entry.name);
                    await this.ensureDirectoryExists(fullPath);
                    result.entries.push({
                        name: entry.name,
                        size: entry.size,
                        compressedSize: 0, // Not available in streaming mode
                        lastModified: new Date(),
                        isDirectory: true,
                        isFile: false
                    });
                }
                else {
                    // Handle files with adaptive processing
                    await this.processStreamEntry(entry, destinationPath, processor, handler, chunker, options, result);
                }
            }
            // Record operation in agentic jujutsu
            await jujutsuService.recordOperation({
                operation: 'update',
                path: zipFilePath,
                message: `Extracted ${result.extractedCount} files from ZIP (streaming)`,
                content: JSON.stringify(result),
                branch: 'main'
            }, {
                success: true,
                path: zipFilePath
            }, 'zip-extraction-agent');
            // Calculate truth score using ZipVerificationService
            const verificationService = ZipVerificationService_js_1.ZipVerificationService.getInstance();
            const truthScore = verificationService.calculateTruthScore(streamEntries, // Input stream entries
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
        }
        catch (error) {
            throw new zip_js_1.ZipExtractionError(`Streaming extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'EXTRACTION_FAILED', error instanceof Error ? error : undefined);
        }
        finally {
            try {
                // Cleanup agentic jujutsu session
                await jujutsuService.cleanupSession(sessionId);
            }
            catch (error) {
                console.warn('Failed to cleanup session:', error);
            }
        }
    }
    /**
     * Processes a stream entry with adaptive processing based on file size
     */
    static async processStreamEntry(entry, destinationPath, processor, handler, chunker, options, result) {
        const fullPath = path_1.default.join(destinationPath, entry.name);
        // Ensure parent directory exists
        await this.ensureDirectoryExists(path_1.default.dirname(fullPath));
        // Check if file exists and handle overwrite option
        try {
            const stats = await promises_1.default.stat(fullPath);
            if (stats.isFile() && !options.overwrite) {
                result.warnings.push(`File ${entry.name} already exists and overwrite is disabled`);
                return;
            }
        }
        catch {
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
        }
        else {
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
    static async processRegularStreamEntry(entry, stream, fullPath, processor, result) {
        try {
            // Process the stream entry
            await processor.processStreamEntry({
                ...entry,
                stream
            });
            // Write to file
            const writeStream = (0, fs_1.createWriteStream)(fullPath);
            return new Promise((resolve, reject) => {
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
        }
        catch (error) {
            throw new zip_js_1.ZipExtractionError(`Failed to process entry ${entry.name}: ${error instanceof Error ? error.message : 'Unknown error'}`, 'EXTRACTION_FAILED', error instanceof Error ? error : undefined);
        }
    }
    /**
     * Processes a large stream entry with chunked processing
     */
    static async processLargeStreamEntry(entry, stream, fullPath, chunker, result) {
        try {
            // Process the stream entry in chunks
            const chunkedResult = await chunker.processStreamEntryInChunks({
                ...entry,
                stream
            });
            // Write chunks to file
            const writeStream = (0, fs_1.createWriteStream)(fullPath);
            return new Promise((resolve, reject) => {
                // Write all chunks to the file
                let written = 0;
                const writeChunk = () => {
                    if (written < chunkedResult.chunks.length) {
                        const chunk = chunkedResult.chunks[written];
                        if (writeStream.write(chunk)) {
                            written++;
                            setImmediate(writeChunk);
                        }
                        else {
                            writeStream.once('drain', () => {
                                written++;
                                setImmediate(writeChunk);
                            });
                        }
                    }
                    else {
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
        }
        catch (error) {
            throw new zip_js_1.ZipExtractionError(`Failed to process large entry ${entry.name}: ${error instanceof Error ? error.message : 'Unknown error'}`, 'EXTRACTION_FAILED', error instanceof Error ? error : undefined);
        }
    }
    /**
     * Lists entries in a ZIP file without extracting them
     * @param zipFilePath Path to the ZIP file
     * @returns Array of ZIP entries
     */
    static async listEntries(zipFilePath) {
        if (!zipFilePath || typeof zipFilePath !== 'string') {
            throw new zip_js_1.ZipExtractionError('Invalid ZIP file path provided', 'INVALID_ZIP_FILE');
        }
        return new Promise((resolve, reject) => {
            yauzl_1.default.open(zipFilePath, { lazyEntries: true }, (err, zipFile) => {
                if (err) {
                    reject(new zip_js_1.ZipExtractionError(`Failed to open ZIP file: ${err.message}`, 'INVALID_ZIP_FILE', err));
                    return;
                }
                if (!zipFile) {
                    reject(new zip_js_1.ZipExtractionError('Failed to open ZIP file: zipFile is null', 'INVALID_ZIP_FILE'));
                    return;
                }
                const entries = [];
                zipFile.on('entry', (entry) => {
                    entries.push(this.convertEntry(entry));
                    zipFile.readEntry();
                });
                zipFile.on('end', () => {
                    zipFile.close();
                    resolve(entries);
                });
                zipFile.on('error', (error) => {
                    zipFile.close();
                    reject(new zip_js_1.ZipExtractionError(`Failed to read ZIP file: ${error.message}`, 'INVALID_ZIP_FILE', error));
                });
                zipFile.readEntry();
            });
        });
    }
    /**
     * Processes ZIP entries and extracts them
     */
    static async processEntries(zipFile, destinationPath, options, result) {
        const entries = [];
        const totalEntries = zipFile.entryCount;
        let processedEntries = 0;
        return new Promise((resolve, reject) => {
            zipFile.on('entry', async (entry) => {
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
                }
                catch (error) {
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
                reject(new zip_js_1.ZipExtractionError(`Error during ZIP processing: ${error.message}`, 'EXTRACTION_FAILED', error));
            });
            // Start reading entries
            zipFile.readEntry();
        });
    }
    /**
     * Extracts a single entry from the ZIP file
     */
    static async extractEntry(zipFile, entry, destinationPath, zipEntry, options, result) {
        // Validate entry name to prevent path traversal
        if (!this.isValidEntryName(zipEntry.name)) {
            throw new zip_js_1.ZipExtractionError(`Invalid entry name: ${zipEntry.name}`, 'INVALID_ZIP_FILE');
        }
        const fullPath = path_1.default.join(destinationPath, zipEntry.name);
        // Handle directories
        if (zipEntry.isDirectory) {
            await this.ensureDirectoryExists(fullPath);
            return;
        }
        // Handle files
        return new Promise((resolve, reject) => {
            // Ensure parent directory exists
            this.ensureDirectoryExists(path_1.default.dirname(fullPath))
                .then(() => {
                // Check if file exists and handle overwrite option
                return promises_1.default.stat(fullPath).then(stats => {
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
                        reject(new zip_js_1.ZipExtractionError(`Failed to open read stream for entry ${zipEntry.name}: ${err.message}`, 'EXTRACTION_FAILED', err));
                        return;
                    }
                    if (!readStream) {
                        reject(new zip_js_1.ZipExtractionError(`Failed to open read stream for entry ${zipEntry.name}: stream is null`, 'EXTRACTION_FAILED'));
                        return;
                    }
                    // Create write stream for the destination file
                    const writeStream = (0, fs_1.createWriteStream)(fullPath);
                    // Track size for limit checking
                    let currentSize = 0;
                    const maxSize = options.maxSize || Infinity;
                    // Pipe data with size checking
                    readStream.on('data', (chunk) => {
                        currentSize += chunk.length;
                        if (currentSize > maxSize) {
                            readStream.destroy();
                            writeStream.destroy();
                            reject(new zip_js_1.ZipExtractionError(`File ${zipEntry.name} exceeds size limit during extraction`, 'FILE_TOO_LARGE'));
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
                        reject(new zip_js_1.ZipExtractionError(`Failed to write file ${zipEntry.name}: ${error.message}`, 'EXTRACTION_FAILED', error));
                    });
                    readStream.on('error', (error) => {
                        reject(new zip_js_1.ZipExtractionError(`Failed to read entry ${zipEntry.name}: ${error.message}`, 'EXTRACTION_FAILED', error));
                    });
                });
            })
                .catch(error => {
                if (error instanceof zip_js_1.ZipExtractionError) {
                    reject(error);
                }
                else {
                    reject(new zip_js_1.ZipExtractionError(`Failed to extract entry ${zipEntry.name}: ${error instanceof Error ? error.message : 'Unknown error'}`, 'EXTRACTION_FAILED', error instanceof Error ? error : undefined));
                }
            });
        });
    }
    /**
     * Converts a yauzl Entry to our ZipEntry format
     */
    static convertEntry(entry) {
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
    static isValidEntryName(name) {
        // Check for path traversal attempts
        if (name.includes('../') || name.includes('..\\')) {
            return false;
        }
        // Check for absolute paths
        if (path_1.default.isAbsolute(name)) {
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
    static async ensureDirectoryExists(dirPath) {
        try {
            await promises_1.default.mkdir(dirPath, { recursive: true });
        }
        catch (error) {
            throw new zip_js_1.ZipExtractionError(`Failed to create directory ${dirPath}: ${error instanceof Error ? error.message : 'Unknown error'}`, 'EXTRACTION_FAILED', error instanceof Error ? error : undefined);
        }
    }
}
exports.ZipExtractionService = ZipExtractionService;
//# sourceMappingURL=ZipExtractionService.js.map