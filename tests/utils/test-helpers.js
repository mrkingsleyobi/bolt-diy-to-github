/**
 * Test helpers for ZIP extraction functionality
 */
import fs from 'fs/promises';
import path from 'path';
import archiver from 'archiver';
import { createWriteStream } from 'fs';
/**
 * Creates a test ZIP file with the specified content
 */
export async function createTestZip(filePath, files) {
    const output = createWriteStream(filePath);
    const archive = archiver('zip', {
        zlib: { level: 9 } // Sets the compression level
    });
    // Pipe archive data to the file
    archive.pipe(output);
    // Append files
    for (const file of files) {
        // Special handling for path traversal test
        if (file.name === '../malicious.txt') {
            // We'll create a file with the literal name "../malicious.txt"
            // This might get normalized by archiver, but we want to test our validation
            archive.append(file.content, { name: file.name });
        }
        else {
            archive.append(file.content, { name: file.name });
        }
    }
    // Finalize the archive
    await archive.finalize();
}
/**
 * Creates a test directory structure
 */
export async function createTestDirectory(dirPath, files) {
    await fs.mkdir(dirPath, { recursive: true });
    for (const file of files) {
        const fullPath = path.join(dirPath, file.name);
        const parentDir = path.dirname(fullPath);
        // Ensure parent directory exists
        await fs.mkdir(parentDir, { recursive: true });
        // Write file content
        await fs.writeFile(fullPath, file.content);
    }
}
/**
 * Gets the file tree structure of a directory
 */
export async function getFileTree(dirPath) {
    const entries = [];
    async function walk(currentPath, relativeTo) {
        const items = await fs.readdir(currentPath);
        for (const item of items) {
            const fullPath = path.join(currentPath, item);
            const relativePath = path.relative(relativeTo, fullPath);
            const stat = await fs.stat(fullPath);
            if (stat.isDirectory()) {
                entries.push({
                    name: relativePath + '/',
                    size: 0,
                    compressedSize: 0,
                    lastModified: stat.mtime,
                    isDirectory: true,
                    isFile: false
                });
                await walk(fullPath, relativeTo);
            }
            else {
                entries.push({
                    name: relativePath,
                    size: stat.size,
                    compressedSize: stat.size, // For testing purposes
                    lastModified: stat.mtime,
                    isDirectory: false,
                    isFile: true
                });
            }
        }
    }
    await walk(dirPath, dirPath);
    return entries.sort((a, b) => a.name.localeCompare(b.name));
}
/**
 * Creates a corrupted file for testing error handling
 */
export async function createCorruptedFile(filePath) {
    // Create a file with invalid ZIP signature
    const buffer = Buffer.from([0x50, 0x4B, 0x01, 0x02, 0xFF, 0xFF]); // Invalid ZIP signature
    await fs.writeFile(filePath, buffer);
}
/**
 * Creates a large file for testing size limits
 */
export async function createLargeTestZip(filePath, sizeInBytes) {
    const output = createWriteStream(filePath);
    const archive = archiver('zip', {
        zlib: { level: 9 }
    });
    archive.pipe(output);
    // Create a large content buffer
    const largeContent = 'A'.repeat(sizeInBytes);
    archive.append(largeContent, { name: 'large-file.txt' });
    await archive.finalize();
}
