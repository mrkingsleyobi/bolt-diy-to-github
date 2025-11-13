"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const FilterEngine_1 = require("../FilterEngine");
describe('FilterEngine Integration', () => {
    let engine;
    beforeEach(() => {
        engine = new FilterEngine_1.FilterEngine();
    });
    test('should filter files with complex configuration', async () => {
        const config = {
            include: ['**/*.{ts,tsx}', '**/*.js'],
            exclude: ['**/node_modules/**', '**/*.test.*', '**/dist/**'],
            maxSize: 1024 * 1024, // 1MB
            minSize: 10,
            contentTypes: ['text/plain', 'application/javascript', 'text/typescript']
        };
        const files = [
            { path: 'src/index.ts', size: 5000, contentType: 'text/typescript' },
            { path: 'src/index.test.ts', size: 3000, contentType: 'text/typescript' },
            { path: 'src/utils/helper.js', size: 2000, contentType: 'application/javascript' },
            { path: 'node_modules/package/index.js', size: 1000, contentType: 'application/javascript' },
            { path: 'dist/bundle.js', size: 50000, contentType: 'application/javascript' },
            { path: 'README.md', size: 1000, contentType: 'text/markdown' },
            { path: 'large.ts', size: 2048 * 1024, contentType: 'text/typescript' }, // 2MB
            { path: 'empty.ts', size: 0, contentType: 'text/typescript' }
        ];
        const result = await engine.filter(config, files);
        // Should be included
        expect(result.included).toContain('src/index.ts');
        expect(result.included).toContain('src/utils/helper.js');
        expect(result.included).toHaveLength(2);
        // Should be excluded for various reasons
        expect(result.excluded).toContain('src/index.test.ts'); // matches exclude pattern
        expect(result.excluded).toContain('node_modules/package/index.js'); // matches exclude pattern
        expect(result.excluded).toContain('dist/bundle.js'); // matches exclude pattern
        expect(result.excluded).toContain('README.md'); // not in include patterns and not allowed content type
        expect(result.excluded).toContain('large.ts'); // exceeds max size
        expect(result.excluded).toContain('empty.ts'); // below min size
        expect(result.excluded).toHaveLength(6);
        // Check reasons
        expect(result.reasons['src/index.test.ts']).toContain('exclude pattern');
        expect(result.reasons['large.ts']).toContain('above maximum');
        expect(result.reasons['empty.ts']).toContain('below minimum');
        expect(result.reasons['README.md']).toContain('not match any include pattern');
    });
    test('should handle empty file list', async () => {
        const config = {
            include: ['**/*.ts'],
            exclude: ['**/*.test.ts'],
            maxSize: 1000
        };
        const files = [];
        const result = await engine.filter(config, files);
        expect(result.included).toHaveLength(0);
        expect(result.excluded).toHaveLength(0);
        expect(Object.keys(result.reasons)).toHaveLength(0);
    });
    test('should handle no configuration', async () => {
        const config = {};
        const files = [
            { path: 'file1.ts', size: 100, contentType: 'text/typescript' },
            { path: 'file2.js', size: 200, contentType: 'application/javascript' }
        ];
        const result = await engine.filter(config, files);
        // With no filters, all files should be included
        expect(result.included).toContain('file1.ts');
        expect(result.included).toContain('file2.js');
        expect(result.included).toHaveLength(2);
        expect(result.excluded).toHaveLength(0);
    });
    test('should handle only include patterns', async () => {
        const config = {
            include: ['**/*.ts']
        };
        const files = [
            { path: 'src/index.ts', size: 100, contentType: 'text/typescript' },
            { path: 'src/index.js', size: 200, contentType: 'application/javascript' },
            { path: 'test/index.test.ts', size: 150, contentType: 'text/typescript' }
        ];
        const result = await engine.filter(config, files);
        expect(result.included).toContain('src/index.ts');
        expect(result.included).toContain('test/index.test.ts'); // Include patterns don't exclude, only exclude patterns exclude
        expect(result.excluded).toHaveLength(0);
    });
    test('should handle only exclude patterns', async () => {
        const config = {
            exclude: ['**/*.test.ts']
        };
        const files = [
            { path: 'src/index.ts', size: 100, contentType: 'text/typescript' },
            { path: 'test/index.test.ts', size: 150, contentType: 'text/typescript' },
            { path: 'src/utils/helper.js', size: 200, contentType: 'application/javascript' }
        ];
        const result = await engine.filter(config, files);
        expect(result.included).toContain('src/index.ts');
        expect(result.included).toContain('src/utils/helper.js');
        expect(result.excluded).toContain('test/index.test.ts');
        expect(result.excluded).toHaveLength(1);
    });
    test('should handle only size filters', async () => {
        const config = {
            maxSize: 1000,
            minSize: 100
        };
        const files = [
            { path: 'small.txt', size: 50, contentType: 'text/plain' },
            { path: 'medium.txt', size: 500, contentType: 'text/plain' },
            { path: 'large.txt', size: 1500, contentType: 'text/plain' }
        ];
        const result = await engine.filter(config, files);
        expect(result.included).toContain('medium.txt');
        expect(result.excluded).toContain('small.txt');
        expect(result.excluded).toContain('large.txt');
        expect(result.excluded).toHaveLength(2);
    });
    test('should handle only content type filters', async () => {
        const config = {
            contentTypes: ['text/plain', 'application/json']
        };
        const files = [
            { path: 'readme.txt', size: 1000, contentType: 'text/plain' },
            { path: 'data.json', size: 2000, contentType: 'application/json' },
            { path: 'script.js', size: 1500, contentType: 'application/javascript' },
            { path: 'image.png', size: 3000, contentType: 'image/png' }
        ];
        const result = await engine.filter(config, files);
        expect(result.included).toContain('readme.txt');
        expect(result.included).toContain('data.json');
        expect(result.excluded).toContain('script.js');
        expect(result.excluded).toContain('image.png');
        expect(result.excluded).toHaveLength(2);
    });
    test('should handle complex include pattern logic', async () => {
        const config = {
            include: ['src/**/*.{ts,tsx}', 'test/**/*.test.{ts,tsx}']
        };
        const files = [
            { path: 'src/index.ts', size: 100, contentType: 'text/typescript' },
            { path: 'src/components/App.tsx', size: 200, contentType: 'text/typescript' },
            { path: 'src/utils/helper.js', size: 150, contentType: 'application/javascript' },
            { path: 'test/index.test.ts', size: 300, contentType: 'text/typescript' },
            { path: 'test/utils/helper.test.js', size: 250, contentType: 'application/javascript' },
            { path: 'README.md', size: 500, contentType: 'text/markdown' }
        ];
        const result = await engine.filter(config, files);
        expect(result.included).toContain('src/index.ts');
        expect(result.included).toContain('src/components/App.tsx');
        expect(result.included).toContain('test/index.test.ts');
        expect(result.excluded).toHaveLength(3); // helper.js, helper.test.js, README.md
    });
    test('should provide detailed reasons for all exclusions', async () => {
        const config = {
            include: ['**/*.ts'],
            exclude: ['**/*.test.ts'],
            maxSize: 1000,
            contentTypes: ['text/typescript']
        };
        const files = [
            { path: 'included.ts', size: 500, contentType: 'text/typescript' },
            { path: 'wrong-extension.js', size: 300, contentType: 'application/javascript' },
            { path: 'excluded.test.ts', size: 400, contentType: 'text/typescript' },
            { path: 'too-large.ts', size: 1500, contentType: 'text/typescript' },
            { path: 'wrong-type.ts', size: 600, contentType: 'application/javascript' }
        ];
        const result = await engine.filter(config, files);
        expect(result.included).toContain('included.ts');
        expect(result.included).toHaveLength(1);
        expect(result.excluded).toHaveLength(4);
        expect(result.reasons['wrong-extension.js']).toContain('not match any include pattern');
        expect(result.reasons['excluded.test.ts']).toContain('exclude pattern');
        expect(result.reasons['too-large.ts']).toContain('above maximum');
        expect(result.reasons['wrong-type.ts']).toContain('not in allowed list');
    });
});
//# sourceMappingURL=FilterEngine.integration.test.js.map