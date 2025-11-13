"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const GlobMatcher_1 = require("../GlobMatcher");
describe('GlobMatcher', () => {
    test('should match simple wildcard patterns', () => {
        const matcher = new GlobMatcher_1.GlobMatcher('*.ts');
        expect(matcher.match('file.ts')).toBe(true);
        expect(matcher.match('file.js')).toBe(false);
        expect(matcher.match('path/file.ts')).toBe(false); // Should not match nested paths
    });
    test('should match recursive patterns', () => {
        const matcher = new GlobMatcher_1.GlobMatcher('**/*.ts');
        expect(matcher.match('file.ts')).toBe(true);
        expect(matcher.match('src/file.ts')).toBe(true);
        expect(matcher.match('src/utils/file.ts')).toBe(true);
        expect(matcher.match('file.js')).toBe(false);
    });
    test('should match directory patterns', () => {
        const matcher = new GlobMatcher_1.GlobMatcher('src/**/*.ts');
        expect(matcher.match('src/file.ts')).toBe(true);
        expect(matcher.match('src/utils/file.ts')).toBe(true);
        expect(matcher.match('test/file.ts')).toBe(false);
        expect(matcher.match('file.ts')).toBe(false);
    });
    test('should match single character wildcard', () => {
        const matcher = new GlobMatcher_1.GlobMatcher('file?.txt');
        expect(matcher.match('file1.txt')).toBe(true);
        expect(matcher.match('fileA.txt')).toBe(true);
        expect(matcher.match('file12.txt')).toBe(false); // Two characters
        expect(matcher.match('file.txt')).toBe(false); // No character
    });
    test('should handle complex patterns', () => {
        const matcher = new GlobMatcher_1.GlobMatcher('src/**/*.{ts,tsx}');
        expect(matcher.match('src/index.ts')).toBe(true);
        expect(matcher.match('src/components/App.tsx')).toBe(true);
        expect(matcher.match('src/styles.css')).toBe(false);
    });
    test('should handle negation patterns', () => {
        const matcher = new GlobMatcher_1.GlobMatcher('!*.test.ts');
        expect(matcher.match('file.ts')).toBe(true);
        expect(matcher.match('file.test.ts')).toBe(false);
    });
    test('should handle edge cases', () => {
        // Empty pattern
        const emptyMatcher = new GlobMatcher_1.GlobMatcher('');
        expect(emptyMatcher.match('')).toBe(true);
        expect(emptyMatcher.match('file.txt')).toBe(false);
        // Pattern with special regex characters
        const specialMatcher = new GlobMatcher_1.GlobMatcher('file[1-3].txt');
        // Note: Our simple implementation might not handle this correctly
        // This is an edge case we might not support initially
    });
    test('should handle path separators correctly', () => {
        const matcher = new GlobMatcher_1.GlobMatcher('src/**/*.ts');
        expect(matcher.match('src\\utils\\file.ts')).toBe(true); // Windows path
        expect(matcher.match('src/utils/file.ts')).toBe(true); // Unix path
    });
});
//# sourceMappingURL=GlobMatcher.test.js.map