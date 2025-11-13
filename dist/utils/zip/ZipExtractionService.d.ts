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
import { ZipEntry, ZipExtractionOptions, ZipExtractionResult } from '../../types/zip.js';
export declare class ZipExtractionService {
    /**
     * Extracts a ZIP file to the specified destination
     * @param zipFilePath Path to the ZIP file
     * @param destinationPath Path where files should be extracted
     * @param options Extraction options
     * @returns Extraction result with statistics
     */
    static extract(zipFilePath: string, destinationPath: string, options?: ZipExtractionOptions): Promise<ZipExtractionResult>;
    /**
     * Extracts a ZIP file using streaming for memory-efficient processing
     * @param zipFilePath Path to the ZIP file
     * @param destinationPath Path where files should be extracted
     * @param options Extraction options
     * @returns Extraction result with statistics
     */
    static extractStreaming(zipFilePath: string, destinationPath: string, options?: ZipExtractionOptions): Promise<ZipExtractionResult>;
    /**
     * Processes a stream entry with adaptive processing based on file size
     */
    private static processStreamEntry;
    /**
     * Processes a regular stream entry with memory-efficient processing
     */
    private static processRegularStreamEntry;
    /**
     * Processes a large stream entry with chunked processing
     */
    private static processLargeStreamEntry;
    /**
     * Lists entries in a ZIP file without extracting them
     * @param zipFilePath Path to the ZIP file
     * @returns Array of ZIP entries
     */
    static listEntries(zipFilePath: string): Promise<ZipEntry[]>;
    /**
     * Processes ZIP entries and extracts them
     */
    private static processEntries;
    /**
     * Extracts a single entry from the ZIP file
     */
    private static extractEntry;
    /**
     * Converts a yauzl Entry to our ZipEntry format
     */
    private static convertEntry;
    /**
     * Validates entry name to prevent path traversal attacks
     */
    private static isValidEntryName;
    /**
     * Ensures a directory exists, creating it if necessary
     */
    private static ensureDirectoryExists;
}
//# sourceMappingURL=ZipExtractionService.d.ts.map