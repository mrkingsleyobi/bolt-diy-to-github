"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const FilterEngine_1 = require("../FilterEngine");
describe('FilterHooksService Integration', () => {
    let filterEngine;
    let consoleLogSpy;
    beforeEach(() => {
        filterEngine = new FilterEngine_1.FilterEngine();
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    });
    afterEach(() => {
        consoleLogSpy.mockRestore();
    });
    it('should call hooks during filter operations', async () => {
        const config = {
            include: ['**/*.ts'],
            exclude: ['**/*.test.ts'],
            maxSize: 1000
        };
        const files = [
            { path: 'src/index.ts', size: 500, contentType: 'text/plain' },
            { path: 'src/index.test.ts', size: 300, contentType: 'text/plain' },
            { path: 'src/utils.ts', size: 800, contentType: 'text/plain' }
        ];
        const result = await filterEngine.filter(config, files);
        // Verify hooks were called
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('[PRE-TASK HOOK]'));
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('[POST-EDIT HOOK]'));
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('[POST-TASK HOOK]'));
        // Verify filtering still works correctly
        expect(result.included).toContain('src/index.ts');
        expect(result.included).toContain('src/utils.ts');
        expect(result.excluded).toContain('src/index.test.ts');
        expect(result.reasons['src/index.test.ts']).toContain('exclude pattern');
    });
    it('should handle empty file arrays', async () => {
        const config = {
            include: ['**/*.ts']
        };
        const files = [];
        const result = await filterEngine.filter(config, files);
        // Verify hooks were called even with empty files
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('[PRE-TASK HOOK]'));
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('[POST-EDIT HOOK]'));
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('[POST-TASK HOOK]'));
        // Verify empty results
        expect(result.included).toHaveLength(0);
        expect(result.excluded).toHaveLength(0);
        expect(Object.keys(result.reasons)).toHaveLength(0);
    });
});
//# sourceMappingURL=FilterHooksService.integration.test.js.map