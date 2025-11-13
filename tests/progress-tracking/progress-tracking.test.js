/**
 * Test script for real-time progress tracking functionality
 * This script tests the progress tracking implementation for large file exports
 */

// Import required modules
const fs = require('fs');
const path = require('path');
const { OptimizedZipProcessor } = require('../../dist/utils/zip/OptimizedZipProcessor.js');

/**
 * Test progress tracking with large files
 */
async function testProgressTrackingWithLargeFiles() {
  console.log('[Progress Tracking Test] Starting progress tracking test with large files');

  try {
    // Create test files with varying sizes
    const testFiles = [
      { name: 'small-file.txt', content: 'Small file content' },
      { name: 'medium-file.txt', content: 'M'.repeat(10000) }, // 10KB
      { name: 'large-file.txt', content: 'L'.repeat(1000000) } // 1MB
    ];

    // Initialize ZIP processor
    const zipProcessor = new OptimizedZipProcessor(100 * 1024 * 1024); // 100MB limit

    console.log('[Progress Tracking Test] Created test files with sizes:');
    testFiles.forEach(file => {
      const size = typeof file.content === 'string' ? Buffer.byteLength(file.content) : file.content.length;
      console.log(`  ${file.name}: ${size} bytes`);
    });

    // Test ZIP creation with progress tracking
    console.log('[Progress Tracking Test] Testing ZIP creation with progress tracking');
    let creationProgressUpdates = 0;

    const zipBuffer = await zipProcessor.create(testFiles, (progress) => {
      creationProgressUpdates++;
      console.log(`[Progress Tracking Test] ZIP Creation Progress: ${progress}%`);

      // Validate progress values
      if (progress < 0 || progress > 100) {
        throw new Error(`Invalid progress value: ${progress}`);
      }

      // Check for expected progress milestones
      if (progress === 0) {
        console.log('[Progress Tracking Test] ✅ Progress started at 0%');
      } else if (progress === 100) {
        console.log('[Progress Tracking Test] ✅ Progress completed at 100%');
      }
    });

    console.log(`[Progress Tracking Test] ZIP creation completed with ${creationProgressUpdates} progress updates`);
    console.log(`[Progress Tracking Test] ZIP buffer size: ${zipBuffer.length} bytes`);

    // Validate progress tracking
    if (creationProgressUpdates < 2) {
      throw new Error('Insufficient progress updates during ZIP creation');
    }

    console.log('[Progress Tracking Test] ✅ ZIP creation progress tracking validation passed');

    // Test ZIP extraction with progress tracking
    console.log('[Progress Tracking Test] Testing ZIP extraction with progress tracking');
    const extractionDir = path.join(__dirname, 'test-extraction');

    // Ensure extraction directory exists
    if (!fs.existsSync(extractionDir)) {
      fs.mkdirSync(extractionDir, { recursive: true });
    }

    let extractionProgressUpdates = 0;

    const extractionResult = await zipProcessor.extractBuffer(zipBuffer, extractionDir, (progress) => {
      extractionProgressUpdates++;
      console.log(`[Progress Tracking Test] ZIP Extraction Progress: ${progress}%`);

      // Validate progress values
      if (progress < 0 || progress > 100) {
        throw new Error(`Invalid progress value: ${progress}`);
      }

      // Check for expected progress milestones
      if (progress === 0) {
        console.log('[Progress Tracking Test] ✅ Extraction progress started at 0%');
      } else if (progress === 100) {
        console.log('[Progress Tracking Test] ✅ Extraction progress completed at 100%');
      }
    });

    console.log(`[Progress Tracking Test] ZIP extraction completed with ${extractionProgressUpdates} progress updates`);
    console.log(`[Progress Tracking Test] Extracted ${extractionResult.extractedCount} files`);

    // Validate progress tracking
    if (extractionProgressUpdates < 2) {
      throw new Error('Insufficient progress updates during ZIP extraction');
    }

    console.log('[Progress Tracking Test] ✅ ZIP extraction progress tracking validation passed');

    // Verify extracted files
    console.log('[Progress Tracking Test] Verifying extracted files');
    const extractedFiles = fs.readdirSync(extractionDir);
    console.log(`[Progress Tracking Test] Found ${extractedFiles.length} extracted files:`, extractedFiles);

    // Check that all expected files were extracted
    const expectedFiles = testFiles.map(file => file.name);
    const missingFiles = expectedFiles.filter(file => !extractedFiles.includes(file));

    if (missingFiles.length > 0) {
      throw new Error(`Missing extracted files: ${missingFiles.join(', ')}`);
    }

    console.log('[Progress Tracking Test] ✅ All files extracted successfully');

    // Clean up test files
    console.log('[Progress Tracking Test] Cleaning up test files');
    extractedFiles.forEach(file => {
      const filePath = path.join(extractionDir, file);
      fs.unlinkSync(filePath);
    });
    fs.rmdirSync(extractionDir);

    console.log('[Progress Tracking Test] ✅ Test cleanup completed');
    console.log('[Progress Tracking Test] 🎉 All progress tracking tests passed successfully');

    return true;
  } catch (error) {
    console.error('[Progress Tracking Test] ❌ Test failed:', error.message);
    console.error('[Progress Tracking Test] Stack trace:', error.stack);
    return false;
  }
}

/**
 * Test progress tracking with very large files
 */
async function testProgressTrackingWithVeryLargeFiles() {
  console.log('[Progress Tracking Test] Starting progress tracking test with very large files');

  try {
    // Create a very large file (10MB)
    console.log('[Progress Tracking Test] Creating very large test file (10MB)');
    const veryLargeContent = 'V'.repeat(10 * 1024 * 1024); // 10MB

    const testFiles = [
      { name: 'very-large-file.txt', content: veryLargeContent },
      { name: 'small-file.txt', content: 'Small file content' }
    ];

    // Initialize ZIP processor
    const zipProcessor = new OptimizedZipProcessor(200 * 1024 * 1024); // 200MB limit

    console.log('[Progress Tracking Test] Created very large test files');

    // Test ZIP creation with progress tracking for very large files
    console.log('[Progress Tracking Test] Testing ZIP creation with very large files');
    let largeFileProgressUpdates = 0;
    let lastProgress = -1;

    const startTime = Date.now();
    const zipBuffer = await zipProcessor.create(testFiles, (progress) => {
      largeFileProgressUpdates++;

      // Ensure progress is monotonically increasing
      if (progress < lastProgress) {
        throw new Error(`Progress decreased from ${lastProgress}% to ${progress}%`);
      }
      lastProgress = progress;

      // Log progress at key milestones
      if (progress % 20 === 0 || progress === 0 || progress === 100) {
        console.log(`[Progress Tracking Test] Large File ZIP Creation Progress: ${progress}%`);
      }

      // Validate progress values
      if (progress < 0 || progress > 100) {
        throw new Error(`Invalid progress value: ${progress}`);
      }
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`[Progress Tracking Test] Large file ZIP creation completed in ${duration}ms`);
    console.log(`[Progress Tracking Test] ZIP creation completed with ${largeFileProgressUpdates} progress updates`);
    console.log(`[Progress Tracking Test] ZIP buffer size: ${zipBuffer.length} bytes`);

    // Validate that we got sufficient progress updates
    if (largeFileProgressUpdates < 5) {
      throw new Error('Insufficient progress updates during large file ZIP creation');
    }

    console.log('[Progress Tracking Test] ✅ Large file ZIP creation progress tracking validation passed');

    // Test ZIP extraction with progress tracking for very large files
    console.log('[Progress Tracking Test] Testing ZIP extraction with very large files');
    const extractionDir = path.join(__dirname, 'test-extraction-large');

    // Ensure extraction directory exists
    if (!fs.existsSync(extractionDir)) {
      fs.mkdirSync(extractionDir, { recursive: true });
    }

    let largeFileExtractionProgressUpdates = 0;
    lastProgress = -1;

    const extractionResult = await zipProcessor.extractBuffer(zipBuffer, extractionDir, (progress) => {
      largeFileExtractionProgressUpdates++;

      // Ensure progress is monotonically increasing
      if (progress < lastProgress) {
        throw new Error(`Progress decreased from ${lastProgress}% to ${progress}%`);
      }
      lastProgress = progress;

      // Log progress at key milestones
      if (progress % 20 === 0 || progress === 0 || progress === 100) {
        console.log(`[Progress Tracking Test] Large File ZIP Extraction Progress: ${progress}%`);
      }

      // Validate progress values
      if (progress < 0 || progress > 100) {
        throw new Error(`Invalid progress value: ${progress}`);
      }
    });

    console.log(`[Progress Tracking Test] Large file ZIP extraction completed with ${largeFileExtractionProgressUpdates} progress updates`);
    console.log(`[Progress Tracking Test] Extracted ${extractionResult.extractedCount} files`);

    // Validate that we got sufficient progress updates
    if (largeFileExtractionProgressUpdates < 5) {
      throw new Error('Insufficient progress updates during large file ZIP extraction');
    }

    console.log('[Progress Tracking Test] ✅ Large file ZIP extraction progress tracking validation passed');

    // Clean up test files
    console.log('[Progress Tracking Test] Cleaning up large file test files');
    const extractedFiles = fs.readdirSync(extractionDir);
    extractedFiles.forEach(file => {
      const filePath = path.join(extractionDir, file);
      fs.unlinkSync(filePath);
    });
    fs.rmdirSync(extractionDir);

    console.log('[Progress Tracking Test] ✅ Large file test cleanup completed');
    console.log('[Progress Tracking Test] 🎉 All large file progress tracking tests passed successfully');

    return true;
  } catch (error) {
    console.error('[Progress Tracking Test] ❌ Large file test failed:', error.message);
    console.error('[Progress Tracking Test] Stack trace:', error.stack);
    return false;
  }
}

// Run the tests
async function runProgressTrackingTests() {
  console.log('[Progress Tracking Test] Starting progress tracking tests');

  try {
    // Test with regular files
    const regularFilesResult = await testProgressTrackingWithLargeFiles();
    if (!regularFilesResult) {
      throw new Error('Regular files test failed');
    }

    // Test with very large files
    const veryLargeFilesResult = await testProgressTrackingWithVeryLargeFiles();
    if (!veryLargeFilesResult) {
      throw new Error('Very large files test failed');
    }

    console.log('[Progress Tracking Test] 🎉 All progress tracking tests completed successfully');
    return true;
  } catch (error) {
    console.error('[Progress Tracking Test] ❌ Progress tracking tests failed:', error.message);
    return false;
  }
}

// Export for testing
module.exports = {
  testProgressTrackingWithLargeFiles,
  testProgressTrackingWithVeryLargeFiles,
  runProgressTrackingTests
};

// Run tests if this file is executed directly
if (require.main === module) {
  runProgressTrackingTests()
    .then(success => {
      if (success) {
        console.log('[Progress Tracking Test] All tests passed');
        process.exit(0);
      } else {
        console.error('[Progress Tracking Test] Some tests failed');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('[Progress Tracking Test] Test execution failed:', error);
      process.exit(1);
    });
}