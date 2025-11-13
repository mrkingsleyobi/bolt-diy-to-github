"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const EnhancedGlobMatcher_1 = require("../EnhancedGlobMatcher");
describe('EnhancedGlobMatcher', () => {
    test('should match simple wildcard patterns', () => {
        const matcher = new EnhancedGlobMatcher_1.EnhancedGlobMatcher('*.ts');
        expect(matcher.match('file.ts')).toBe(true);
        expect(matcher.match('file.js')).toBe(false);
        expect(matcher.match('path/file.ts')).toBe(false); // Should not match nested paths
    });
    test('should match recursive patterns', () => {
        const matcher = new EnhancedGlobMatcher_1.EnhancedGlobMatcher('**/*.ts');
        expect(matcher.match('file.ts')).toBe(true);
        expect(matcher.match('src/file.ts')).toBe(true);
        expect(matcher.match('src/utils/file.ts')).toBe(true);
        expect(matcher.match('file.js')).toBe(false);
    });
    test('should match directory patterns', () => {
        const matcher = new EnhancedGlobMatcher_1.EnhancedGlobMatcher('src/**/*.ts');
        expect(matcher.match('src/file.ts')).toBe(true);
        expect(matcher.match('src/utils/file.ts')).toBe(true);
        expect(matcher.match('test/file.ts')).toBe(false);
        expect(matcher.match('file.ts')).toBe(false);
    });
    test('should match single character wildcard', () => {
        const matcher = new EnhancedGlobMatcher_1.EnhancedGlobMatcher('file?.txt');
        expect(matcher.match('file1.txt')).toBe(true);
        expect(matcher.match('fileA.txt')).toBe(true);
        expect(matcher.match('file12.txt')).toBe(false); // Two characters
        expect(matcher.match('file.txt')).toBe(false); // No character
    });
    test('should handle complex patterns with brace expansion', () => {
        const matcher = new EnhancedGlobMatcher_1.EnhancedGlobMatcher('src/**/*.{ts,tsx}');
        expect(matcher.match('src/index.ts')).toBe(true);
        expect(matcher.match('src/components/App.tsx')).toBe(true);
        expect(matcher.match('src/styles.css')).toBe(false);
    });
    test('should handle negation patterns', () => {
        const matcher = new EnhancedGlobMatcher_1.EnhancedGlobMatcher('!*.test.ts');
        expect(matcher.match('file.ts')).toBe(true);
        expect(matcher.match('file.test.ts')).toBe(false);
        // Test double negation
        const doubleNegationMatcher = new EnhancedGlobMatcher_1.EnhancedGlobMatcher('!*.test.ts');
        expect(doubleNegationMatcher.match('file.test.ts')).toBe(false);
        expect(doubleNegationMatcher.match('file.ts')).toBe(true);
    });
    test('should handle edge cases', () => {
        // Empty pattern
        const emptyMatcher = new EnhancedGlobMatcher_1.EnhancedGlobMatcher('');
        expect(emptyMatcher.match('')).toBe(true);
        expect(emptyMatcher.match('file.txt')).toBe(false);
        // Pattern with special regex characters
        const specialMatcher = new EnhancedGlobMatcher_1.EnhancedGlobMatcher('file[1-3].txt');
        expect(specialMatcher.match('file[1-3].txt')).toBe(true); // Escaped, so literal match
        expect(specialMatcher.match('file1.txt')).toBe(false);
    });
    test('should handle path separators correctly', () => {
        const matcher = new EnhancedGlobMatcher_1.EnhancedGlobMatcher('src/**/*.ts');
        expect(matcher.match('src\\utils\\file.ts')).toBe(true); // Windows path
        expect(matcher.match('src/utils/file.ts')).toBe(true); // Unix path
    });
    test('should handle complex nested patterns', () => {
        const matcher = new EnhancedGlobMatcher_1.EnhancedGlobMatcher('**/src/**/*.{js,ts,jsx,tsx}');
        expect(matcher.match('project/src/index.ts')).toBe(true);
        expect(matcher.match('project/src/components/App.jsx')).toBe(true);
        expect(matcher.match('project/src/utils/helper.tsx')).toBe(true);
        expect(matcher.match('project/src/styles.css')).toBe(false);
    });
    test('should handle patterns with dots', () => {
        const matcher = new EnhancedGlobMatcher_1.EnhancedGlobMatcher('**/*.test.js');
        expect(matcher.match('test/unit.test.js')).toBe(true);
        expect(matcher.match('src/components/Button.test.js')).toBe(true);
        expect(matcher.match('test/unit.spec.js')).toBe(false);
    });
    test('should get original pattern', () => {
        const matcher = new EnhancedGlobMatcher_1.EnhancedGlobMatcher('!*.test.ts');
        expect(matcher.getPattern()).toBe('!*.test.ts');
    });
    test('should handle multiple brace expansions', () => {
        const matcher = new EnhancedGlobMatcher_1.EnhancedGlobMatcher('src/**/*.{test,spec}.{ts,js}');
        expect(matcher.match('src/utils/helper.test.ts')).toBe(true);
        expect(matcher.match('src/utils/helper.spec.js')).toBe(true);
        expect(matcher.match('src/utils/helper.ts')).toBe(false);
    });
    test('should handle complex negation patterns', () => {
        const matcher = new EnhancedGlobMatcher_1.EnhancedGlobMatcher('!**/*.d.ts');
        expect(matcher.match('types/index.d.ts')).toBe(false);
        expect(matcher.match('src/index.ts')).toBe(true);
    });
});
//# sourceMappingURL=EnhancedGlobMatcher.test.js.map