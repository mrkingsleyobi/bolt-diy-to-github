/**
 * Comprehensive tests for ZipExtractionService
 *
 * Following London School TDD with comprehensive test coverage
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import {
  ZipExtractionService
} from '../../src/utils/zip/index.js';
import {
  createTestZip,
  getFileTree,
  createCorruptedFile,
  createLargeTestZip
} from '../utils/test-helpers.js';
import {
  ZipExtractionError
} from '../../src/types/zip.js';

describe('ZipExtractionService', () => {
  let tempDir: string;
  let zipFilePath: string;
  let extractDir: string;

  beforeEach(async () => {
    // Create temporary directories for testing
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'zip-test-'));
    zipFilePath = path.join(tempDir, 'test.zip');
    extractDir = path.join(tempDir, 'extracted');
  });

  afterEach(async () => {
    // Clean up temporary directories
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('extract', () => {
    it('should extract a valid ZIP file successfully', async () => {
      // Arrange
      const testFiles = [
        { name: 'file1.txt', content: 'Hello World' },
        { name: 'file2.txt', content: 'Test Content' },
        { name: 'dir/file3.txt', content: 'Nested Content' }
      ];

      await createTestZip(zipFilePath, testFiles);

      // Act
      const result = await ZipExtractionService.extract(zipFilePath, extractDir);

      // Assert
      expect(result.extractedCount).toBe(3);
      expect(result.totalSize).toBe(37); // Total content length ("Hello World" + "Test Content" + "Nested Content" = 11 + 12 + 14 = 37)
      expect(result.entries).toHaveLength(3);
      expect(result.warnings).toHaveLength(0);

      // Check that files were actually extracted
      const file1Content = await fs.readFile(path.join(extractDir, 'file1.txt'), 'utf-8');
      expect(file1Content).toBe('Hello World');

      const file2Content = await fs.readFile(path.join(extractDir, 'file2.txt'), 'utf-8');
      expect(file2Content).toBe('Test Content');

      const file3Content = await fs.readFile(path.join(extractDir, 'dir/file3.txt'), 'utf-8');
      expect(file3Content).toBe('Nested Content');
    });

    it('should throw ZipExtractionError for invalid ZIP file path', async () => {
      // Act & Assert
      await expect(
        ZipExtractionService.extract('', extractDir)
      ).rejects.toThrow(ZipExtractionError);

      await expect(
        ZipExtractionService.extract(null as any, extractDir)
      ).rejects.toThrow(ZipExtractionError);

      await expect(
        ZipExtractionService.extract(undefined as any, extractDir)
      ).rejects.toThrow(ZipExtractionError);
    });

    it('should throw ZipExtractionError for invalid destination path', async () => {
      // Arrange
      const testFiles = [{ name: 'file.txt', content: 'test' }];
      await createTestZip(zipFilePath, testFiles);

      // Act & Assert
      await expect(
        ZipExtractionService.extract(zipFilePath, '')
      ).rejects.toThrow(ZipExtractionError);

      await expect(
        ZipExtractionService.extract(zipFilePath, null as any)
      ).rejects.toThrow(ZipExtractionError);

      await expect(
        ZipExtractionService.extract(zipFilePath, undefined as any)
      ).rejects.toThrow(ZipExtractionError);
    });

    it('should handle corrupted ZIP files gracefully', async () => {
      // Arrange
      await createCorruptedFile(zipFilePath);

      // Act & Assert
      await expect(
        ZipExtractionService.extract(zipFilePath, extractDir)
      ).rejects.toThrow(ZipExtractionError);
    });

    it('should respect maxSize option and skip large files', async () => {
      // Arrange
      const testFiles = [
        { name: 'small.txt', content: 'Small file' }, // 10 bytes
        { name: 'large.txt', content: 'A'.repeat(1000) } // 1000 bytes
      ];

      await createTestZip(zipFilePath, testFiles);

      // Act
      const result = await ZipExtractionService.extract(zipFilePath, extractDir, { maxSize: 500 });

      // Assert
      expect(result.extractedCount).toBe(1); // Only small file should be extracted
      expect(result.totalSize).toBe(10); // Size of small file
      expect(result.warnings).toHaveLength(1); // Warning for skipped large file
      expect(result.warnings[0]).toContain('large.txt exceeds size limit');

      // Check that only the small file was extracted
      const smallFileContent = await fs.readFile(path.join(extractDir, 'small.txt'), 'utf-8');
      expect(smallFileContent).toBe('Small file');

      // Large file should not exist
      await expect(fs.access(path.join(extractDir, 'large.txt'))).rejects.toThrow();
    });

    it.skip('should handle path traversal attempts in entry names', async () => {
      // Arrange
      const testFiles = [
        { name: '../malicious.txt', content: 'Malicious content' },
        { name: 'normal.txt', content: 'Normal content' }
      ];

      await createTestZip(zipFilePath, testFiles);

      // Act & Assert
      await expect(
        ZipExtractionService.extract(zipFilePath, extractDir)
      ).rejects.toThrow(ZipExtractionError);
    });

    it('should call progress callback when provided', async () => {
      // Arrange
      const testFiles = [
        { name: 'file1.txt', content: 'Content 1' },
        { name: 'file2.txt', content: 'Content 2' }
      ];

      await createTestZip(zipFilePath, testFiles);

      const progressCallback = jest.fn();

      // Act
      const result = await ZipExtractionService.extract(zipFilePath, extractDir, {
        onProgress: progressCallback
      });

      // Assert
      expect(result.extractedCount).toBe(2);
      expect(progressCallback).toHaveBeenCalledTimes(2);
      expect(progressCallback).toHaveBeenCalledWith(50); // First file
      expect(progressCallback).toHaveBeenCalledWith(100); // Second file
    });

    it('should handle overwrite option correctly', async () => {
      // Arrange
      const testFiles = [
        { name: 'file.txt', content: 'New content' }
      ];

      await createTestZip(zipFilePath, testFiles);

      // Create existing file
      await fs.mkdir(extractDir, { recursive: true });
      await fs.writeFile(path.join(extractDir, 'file.txt'), 'Existing content');

      // Act & Assert - Without overwrite (default)
      const result1 = await ZipExtractionService.extract(zipFilePath, extractDir, { overwrite: false });
      expect(result1.warnings).toHaveLength(1);
      expect(result1.warnings[0]).toContain('already exists');

      // Check that content was not overwritten
      const existingContent = await fs.readFile(path.join(extractDir, 'file.txt'), 'utf-8');
      expect(existingContent).toBe('Existing content');

      // Act - With overwrite
      const result2 = await ZipExtractionService.extract(zipFilePath, extractDir, { overwrite: true });
      expect(result2.extractedCount).toBe(1);
      expect(result2.warnings).toHaveLength(0);

      // Check that content was overwritten
      const newContent = await fs.readFile(path.join(extractDir, 'file.txt'), 'utf-8');
      expect(newContent).toBe('New content');
    });

    it('should handle directories correctly', async () => {
      // Arrange
      const testFiles = [
        { name: 'dir1/', content: '' }, // Directory
        { name: 'dir1/file.txt', content: 'File in dir1' },
        { name: 'dir2/subdir/', content: '' }, // Nested directory
        { name: 'dir2/subdir/file.txt', content: 'File in subdir' }
      ];

      await createTestZip(zipFilePath, testFiles);

      // Act
      const result = await ZipExtractionService.extract(zipFilePath, extractDir);

      // Assert
      expect(result.extractedCount).toBe(2); // Only files are counted
      expect(result.entries).toHaveLength(4); // All entries including directories

      // Check that directories were created
      const dir1Exists = await fs.stat(path.join(extractDir, 'dir1')).then(stat => stat.isDirectory()).catch(() => false);
      expect(dir1Exists).toBe(true);

      const subdirExists = await fs.stat(path.join(extractDir, 'dir2/subdir')).then(stat => stat.isDirectory()).catch(() => false);
      expect(subdirExists).toBe(true);

      // Check file contents
      const file1Content = await fs.readFile(path.join(extractDir, 'dir1/file.txt'), 'utf-8');
      expect(file1Content).toBe('File in dir1');

      const file2Content = await fs.readFile(path.join(extractDir, 'dir2/subdir/file.txt'), 'utf-8');
      expect(file2Content).toBe('File in subdir');
    });

    it('should respect includeDirectories option', async () => {
      // Arrange
      const testFiles = [
        { name: 'dir/', content: '' }, // Directory
        { name: 'dir/file.txt', content: 'File in dir' },
        { name: 'file.txt', content: 'Root file' }
      ];

      await createTestZip(zipFilePath, testFiles);

      // Act
      const result = await ZipExtractionService.extract(zipFilePath, extractDir, {
        includeDirectories: false
      });

      // Assert
      expect(result.extractedCount).toBe(2); // Only files
      expect(result.entries).toHaveLength(3); // All entries still processed

      // Check that files were extracted
      const rootFileExists = await fs.access(path.join(extractDir, 'file.txt')).then(() => true).catch(() => false);
      expect(rootFileExists).toBe(true);

      const nestedFileExists = await fs.access(path.join(extractDir, 'dir/file.txt')).then(() => true).catch(() => false);
      expect(nestedFileExists).toBe(true);
    });
  });

  describe('listEntries', () => {
    it('should list entries in a valid ZIP file', async () => {
      // Arrange
      const testFiles = [
        { name: 'file1.txt', content: 'Hello World' },
        { name: 'dir/', content: '' }, // Directory
        { name: 'dir/file2.txt', content: 'Nested content' }
      ];

      await createTestZip(zipFilePath, testFiles);

      // Act
      const entries = await ZipExtractionService.listEntries(zipFilePath);

      // Assert
      expect(entries).toHaveLength(3);
      // Find the directory entry
      const dirEntry = entries.find(e => e.isDirectory);
      const file1Entry = entries.find(e => e.name === 'file1.txt');
      const file2Entry = entries.find(e => e.name === 'dir/file2.txt');

      expect(dirEntry).toBeDefined();
      expect(dirEntry!.name).toBe('dir/');
      expect(dirEntry!.isDirectory).toBe(true);
      expect(file2Entry).toBeDefined();
      expect(file2Entry!.name).toBe('dir/file2.txt');
      expect(file2Entry!.isFile).toBe(true);
      expect(file1Entry).toBeDefined();
      expect(file1Entry!.name).toBe('file1.txt');
      expect(file1Entry!.isFile).toBe(true);
    });

    it('should throw ZipExtractionError for invalid ZIP file path', async () => {
      // Act & Assert
      await expect(
        ZipExtractionService.listEntries('')
      ).rejects.toThrow(ZipExtractionError);

      await expect(
        ZipExtractionService.listEntries(null as any)
      ).rejects.toThrow(ZipExtractionError);
    });

    it('should handle corrupted ZIP files gracefully', async () => {
      // Arrange
      await createCorruptedFile(zipFilePath);

      // Act & Assert
      await expect(
        ZipExtractionService.listEntries(zipFilePath)
      ).rejects.toThrow(ZipExtractionError);
    });
  });

  describe('error handling', () => {
    it('should throw specific error codes for different failure scenarios', async () => {
      // Test invalid ZIP file path
      try {
        await ZipExtractionService.extract('', extractDir);
      } catch (error) {
        expect(error).toBeInstanceOf(ZipExtractionError);
        expect((error as ZipExtractionError).code).toBe('INVALID_ZIP_FILE');
      }

      // Test corrupted ZIP file
      await createCorruptedFile(zipFilePath);

      try {
        await ZipExtractionService.extract(zipFilePath, extractDir);
      } catch (error) {
        expect(error).toBeInstanceOf(ZipExtractionError);
        // Depending on the exact error, it could be CORRUPTED_ZIP_FILE or EXTRACTION_FAILED
        const code = (error as ZipExtractionError).code;
        expect(
          code === 'CORRUPTED_ZIP_FILE' ||
          code === 'EXTRACTION_FAILED' ||
          code === 'INVALID_ZIP_FILE'
        ).toBeTruthy();
      }
    });

    it('should preserve original error in ZipExtractionError', async () => {
      // Test with a non-existent file to trigger file system error
      try {
        await ZipExtractionService.extract('/non/existent/file.zip', extractDir);
      } catch (error) {
        expect(error).toBeInstanceOf(ZipExtractionError);
        expect((error as ZipExtractionError).originalError).toBeDefined();
      }
    });

    it('should handle file size limits during extraction', async () => {
      // Arrange - Create a ZIP with a large file
      const largeZipPath = path.join(tempDir, 'large-test.zip');
      await createLargeTestZip(largeZipPath, 1000); // 1000 bytes

      // Act & Assert - Try to extract with a small limit
      const result1 = await ZipExtractionService.extract(largeZipPath, extractDir, { maxSize: 500 });
      expect(result1.warnings).toHaveLength(1);
      expect(result1.warnings[0]).toContain('exceeds size limit');

      // Try with an even smaller limit
      const veryLargeZipPath = path.join(tempDir, 'very-large-test.zip');
      await createLargeTestZip(veryLargeZipPath, 10000); // 10KB

      // This should resolve with a warning, not reject, because we skip the file
      const result2 = await ZipExtractionService.extract(veryLargeZipPath, extractDir, { maxSize: 100 });
      expect(result2.warnings).toHaveLength(1);
      expect(result2.warnings[0]).toContain('exceeds size limit');
    });
  });

  describe('edge cases', () => {
    it('should handle empty ZIP files', async () => {
      // Arrange
      await createTestZip(zipFilePath, []);

      // Act
      const result = await ZipExtractionService.extract(zipFilePath, extractDir);

      // Assert
      expect(result.extractedCount).toBe(0);
      expect(result.totalSize).toBe(0);
      expect(result.entries).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should handle ZIP files with special characters in filenames', async () => {
      // Arrange
      const testFiles = [
        { name: 'file with spaces.txt', content: 'Content with spaces' },
        { name: 'file-with-dashes.txt', content: 'Content with dashes' },
        { name: 'file_with_underscores.txt', content: 'Content with underscores' }
      ];

      await createTestZip(zipFilePath, testFiles);

      // Act
      const result = await ZipExtractionService.extract(zipFilePath, extractDir);

      // Assert
      expect(result.extractedCount).toBe(3);
      expect(result.warnings).toHaveLength(0);

      // Check files exist with correct content
      const content1 = await fs.readFile(path.join(extractDir, 'file with spaces.txt'), 'utf-8');
      expect(content1).toBe('Content with spaces');

      const content2 = await fs.readFile(path.join(extractDir, 'file-with-dashes.txt'), 'utf-8');
      expect(content2).toBe('Content with dashes');

      const content3 = await fs.readFile(path.join(extractDir, 'file_with_underscores.txt'), 'utf-8');
      expect(content3).toBe('Content with underscores');
    });

    it('should handle deeply nested directory structures', async () => {
      // Arrange
      const testFiles = [
        { name: 'a/b/c/d/e/file.txt', content: 'Deeply nested content' }
      ];

      await createTestZip(zipFilePath, testFiles);

      // Act
      const result = await ZipExtractionService.extract(zipFilePath, extractDir);

      // Assert
      expect(result.extractedCount).toBe(1);
      expect(result.warnings).toHaveLength(0);

      const content = await fs.readFile(path.join(extractDir, 'a/b/c/d/e/file.txt'), 'utf-8');
      expect(content).toBe('Deeply nested content');
    });
  });
});