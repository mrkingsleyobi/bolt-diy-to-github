"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const FilterEngine_1 = require("../FilterEngine");
describe('FilterEngine Performance', () => {
    let filterEngine;
    beforeEach(() => {
        filterEngine = new FilterEngine_1.FilterEngine();
    });
    it('should process large file sets efficiently', async () => {
        const config = {
            include: ['**/*.ts', '**/*.tsx'],
            exclude: ['**/*.test.ts', '**/*.test.tsx', '**/node_modules/**'],
            maxSize: 5000
        };
        // Create a large set of files for performance testing
        const files = [];
        for (let i = 0; i < 5000; i++) {
            files.push({
                path: `src/module${Math.floor(i / 100)}/file${i}.ts`,
                size: 100 + (i % 1000),
                contentType: 'text/plain'
            });
        }
        // Add some test files that should be excluded
        for (let i = 0; i < 500; i++) {
            files.push({
                path: `src/module${Math.floor(i / 100)}/file${i}.test.ts`,
                size: 50 + (i % 500),
                contentType: 'text/plain'
            });
        }
        // Add some files that exceed max size
        for (let i = 0; i < 100; i++) {
            files.push({
                path: `src/large/file${i}.ts`,
                size: 6000 + (i * 100),
                contentType: 'text/plain'
            });
        }
        const startTime = Date.now();
        const result = await filterEngine.filter(config, files);
        const processingTime = Date.now() - startTime;
        // Verify results are correct
        expect(result.included.length).toBeGreaterThan(0);
        expect(result.excluded.length).toBeGreaterThan(0);
        expect(result.included.length + result.excluded.length).toBe(files.length);
        // Verify performance - should process 5000+ files in reasonable time
        expect(processingTime).toBeLessThan(5000); // Should be less than 5 seconds
        // Log performance metrics
        console.log(`Processed ${files.length} files in ${processingTime}ms`);
        console.log(`Files per second: ${Math.round((files.length / processingTime) * 1000)}`);
    }, 10000); // 10 second timeout for this test
    it('should cache regex patterns for repeated use', async () => {
        const config = {
            include: ['**/*.ts'],
            exclude: ['**/*.test.ts']
        };
        // Create files with repetitive patterns
        const files = [];
        for (let i = 0; i < 1000; i++) {
            files.push({
                path: `src/file${i}.ts`,
                size: 100,
                contentType: 'text/plain'
            });
            files.push({
                path: `src/file${i}.test.ts`,
                size: 100,
                contentType: 'text/plain'
            });
        }
        const startTime = Date.now();
        const result = await filterEngine.filter(config, files);
        const processingTime = Date.now() - startTime;
        // Verify results
        expect(result.included.length).toBe(1000);
        expect(result.excluded.length).toBe(1000);
        // Processing should be fast due to caching
        expect(processingTime).toBeLessThan(2000); // Should be less than 2 seconds
        console.log(`Processed ${files.length} files with repeated patterns in ${processingTime}ms`);
    }, 5000);
    it('should handle batch processing for very large file sets', async () => {
        const config = {
            include: ['**/*.js', '**/*.ts'],
            exclude: ['**/node_modules/**', '**/dist/**']
        };
        // Create a very large set of files to trigger batch processing
        const files = [];
        for (let i = 0; i < 10000; i++) {
            files.push({
                path: `project${Math.floor(i / 1000)}/src/module${Math.floor(i / 100)}/file${i}.${i % 2 === 0 ? 'ts' : 'js'}`,
                size: 100 + (i % 1000),
                contentType: 'text/plain'
            });
        }
        // Add some node_modules files that should be excluded
        for (let i = 0; i < 1000; i++) {
            files.push({
                path: `project${Math.floor(i / 100)}/node_modules/library${i}/file${i}.js`,
                size: 50 + (i % 500),
                contentType: 'text/plain'
            });
        }
        const startTime = Date.now();
        const result = await filterEngine.filter(config, files);
        const processingTime = Date.now() - startTime;
        // Verify results
        expect(result.included.length).toBeGreaterThan(0);
        expect(result.excluded.length).toBeGreaterThan(0);
        // Should still process quickly with batch optimization
        expect(processingTime).toBeLessThan(8000); // Should be less than 8 seconds
        console.log(`Batch processed ${files.length} files in ${processingTime}ms`);
        console.log(`Batch processing rate: ${Math.round((files.length / processingTime) * 1000)} files/second`);
    }, 15000); // 15 second timeout for this test
});
//# sourceMappingURL=FilterEngine.performance.test.js.map