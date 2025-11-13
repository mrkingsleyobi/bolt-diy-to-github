"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const FilterEngine_1 = require("../FilterEngine");
describe('FilterVerificationService Integration', () => {
    let filterEngine;
    let consoleLogSpy;
    beforeEach(() => {
        filterEngine = new FilterEngine_1.FilterEngine();
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    });
    afterEach(() => {
        consoleLogSpy.mockRestore();
    });
    it('should calculate truth score and include verification report', async () => {
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
        // Verify verification report is included
        expect(result).toHaveProperty('verification');
        expect(result.verification).toBeDefined();
        expect(result.verification).toHaveProperty('truthScore');
        expect(result.verification).toHaveProperty('meetsThreshold');
        expect(result.verification).toHaveProperty('metrics');
        expect(result.verification).toHaveProperty('summary');
        // Verify truth score is calculated
        expect(typeof result.verification.truthScore).toBe('number');
        expect(result.verification.truthScore).toBeGreaterThanOrEqual(0);
        expect(result.verification.truthScore).toBeLessThanOrEqual(1);
        // Verify metrics are calculated
        expect(result.verification.metrics).toHaveProperty('configCompleteness');
        expect(result.verification.metrics).toHaveProperty('patternAccuracy');
        expect(result.verification.metrics).toHaveProperty('consistency');
        expect(result.verification.metrics).toHaveProperty('performance');
        expect(result.verification.metrics).toHaveProperty('coverage');
        // Verify all metrics are between 0 and 1
        Object.values(result.verification.metrics).forEach(metric => {
            expect(metric).toBeGreaterThanOrEqual(0);
            expect(metric).toBeLessThanOrEqual(1);
        });
        // Verify summary information
        expect(result.verification.summary.totalFiles).toBe(3);
        expect(result.verification.summary.includedFiles).toBe(2);
        expect(result.verification.summary.excludedFiles).toBe(1);
        expect(result.verification.summary.configuration.includePatterns).toBe(1);
        expect(result.verification.summary.configuration.excludePatterns).toBe(1);
        expect(result.verification.summary.configuration.hasSizeFilters).toBe(true);
        expect(result.verification.summary.configuration.hasContentTypeFilters).toBe(false);
    });
    it('should handle edge cases in verification', async () => {
        const config = {};
        const files = [];
        const result = await filterEngine.filter(config, files);
        // Verify verification report is included even with empty files
        expect(result).toHaveProperty('verification');
        expect(result.verification).toBeDefined();
        expect(typeof result.verification.truthScore).toBe('number');
        expect(result.verification.truthScore).toBeGreaterThanOrEqual(0);
        expect(result.verification.truthScore).toBeLessThanOrEqual(1);
    });
    it('should meet truth threshold for good configurations', async () => {
        const config = {
            include: ['**/*.ts', '**/*.tsx'],
            exclude: ['**/*.test.ts', '**/*.test.tsx', '**/node_modules/**'],
            maxSize: 5000,
            contentTypes: ['text/plain', 'application/json']
        };
        const files = [
            { path: 'src/index.ts', size: 1000, contentType: 'text/plain' },
            { path: 'src/component.tsx', size: 2000, contentType: 'text/plain' },
            { path: 'src/index.test.ts', size: 500, contentType: 'text/plain' },
            { path: 'package.json', size: 300, contentType: 'application/json' },
            { path: 'node_modules/library/index.js', size: 100, contentType: 'text/plain' }
        ];
        const result = await filterEngine.filter(config, files);
        // Verify verification report
        expect(result.verification).toBeDefined();
        expect(result.verification.meetsThreshold).toBe(true); // Should meet 0.95 threshold
        expect(result.verification.truthScore).toBeGreaterThanOrEqual(0.95);
    });
});
//# sourceMappingURL=FilterVerificationService.integration.test.js.map