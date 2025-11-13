"use strict";
/**
 * Example usage of the ZIP Extraction Service
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("../utils/zip/index.js");
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const os_1 = __importDefault(require("os"));
const zip_example_helpers_js_1 = require("./zip-example-helpers.js");
async function runExample() {
    console.log('ZIP Extraction Service Example');
    console.log('==============================');
    // Create a temporary directory for our example
    const tempDir = await promises_1.default.mkdtemp(path_1.default.join(os_1.default.tmpdir(), 'zip-example-'));
    const zipFilePath = path_1.default.join(tempDir, 'example.zip');
    const extractDir = path_1.default.join(tempDir, 'extracted');
    try {
        // Create a sample ZIP file
        console.log('\n1. Creating a sample ZIP file...');
        const testFiles = [
            { name: 'readme.txt', content: 'This is a sample README file.' },
            { name: 'data/config.json', content: '{"setting1": "value1", "setting2": "value2"}' },
            { name: 'src/index.js', content: 'console.log("Hello, World!");' },
            { name: 'docs/intro.md', content: '# Introduction\n\nThis is a sample document.' }
        ];
        await (0, zip_example_helpers_js_1.createTestZip)(zipFilePath, testFiles);
        console.log('   ✓ Created ZIP file with 4 entries');
        // Example 1: Basic extraction
        console.log('\n2. Extracting ZIP file...');
        const result1 = await index_js_1.ZipExtractionService.extract(zipFilePath, extractDir);
        console.log(`   ✓ Extracted ${result1.extractedCount} files`);
        console.log(`   ✓ Total size: ${result1.totalSize} bytes`);
        console.log(`   ✓ Warnings: ${result1.warnings.length}`);
        // List extracted files
        console.log('\n3. Listing extracted files...');
        for (const entry of result1.entries) {
            console.log(`   - ${entry.name} (${entry.size} bytes)`);
        }
        // Example 2: Extraction with size limits
        console.log('\n4. Extracting with size limits...');
        const result2 = await index_js_1.ZipExtractionService.extract(zipFilePath, extractDir + '_limited', {
            maxSize: 50, // Only extract files smaller than 50 bytes
            overwrite: true
        });
        console.log(`   ✓ Extracted ${result2.extractedCount} files (with size limit)`);
        if (result2.warnings.length > 0) {
            console.log(`   ✓ Warnings: ${result2.warnings[0]}`);
        }
        // Example 3: Extraction with progress tracking
        console.log('\n5. Extracting with progress tracking...');
        const result3 = await index_js_1.ZipExtractionService.extract(zipFilePath, extractDir + '_progress', {
            overwrite: true,
            onProgress: (progress) => {
                console.log(`   Progress: ${progress}%`);
            },
            onEntryExtracted: (entry) => {
                console.log(`   ✓ Extracted: ${entry.name}`);
            }
        });
        console.log(`   ✓ Extracted ${result3.extractedCount} files with progress tracking`);
        // Example 4: Listing entries without extraction
        console.log('\n6. Listing ZIP entries without extraction...');
        const entries = await index_js_1.ZipExtractionService.listEntries(zipFilePath);
        console.log(`   ✓ Found ${entries.length} entries:`);
        for (const entry of entries) {
            const type = entry.isDirectory ? '[DIR]' : '[FILE]';
            console.log(`     ${type} ${entry.name} (${entry.size} bytes)`);
        }
        console.log('\n✅ All examples completed successfully!');
    }
    catch (error) {
        console.error('❌ Error running example:', error);
    }
    finally {
        // Clean up
        try {
            await promises_1.default.rm(tempDir, { recursive: true, force: true });
            console.log('\n🧹 Cleaned up temporary files');
        }
        catch (error) {
            console.error('❌ Error cleaning up:', error);
        }
    }
}
// Run the example
runExample().catch(console.error);
//# sourceMappingURL=zip-extraction-example.js.map