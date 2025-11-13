/**
 * Test helpers for ZIP extraction functionality
 */
import { ZipEntry } from '../../src/types/zip.js';
/**
 * Creates a test ZIP file with the specified content
 */
export declare function createTestZip(filePath: string, files: Array<{
    name: string;
    content: string;
}>): Promise<void>;
/**
 * Creates a test directory structure
 */
export declare function createTestDirectory(dirPath: string, files: Array<{
    name: string;
    content: string;
}>): Promise<void>;
/**
 * Gets the file tree structure of a directory
 */
export declare function getFileTree(dirPath: string): Promise<ZipEntry[]>;
/**
 * Creates a corrupted file for testing error handling
 */
export declare function createCorruptedFile(filePath: string): Promise<void>;
/**
 * Creates a large file for testing size limits
 */
export declare function createLargeTestZip(filePath: string, sizeInBytes: number): Promise<void>;
