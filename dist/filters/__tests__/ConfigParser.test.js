"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ConfigParser_1 = require("../ConfigParser");
const SizeFilter_1 = require("../SizeFilter");
const ContentTypeFilter_1 = require("../ContentTypeFilter");
describe('ConfigParser', () => {
    let parser;
    beforeEach(() => {
        parser = new ConfigParser_1.ConfigParser();
    });
    test('should create filters from configuration', () => {
        const config = {
            include: ['**/*.ts'],
            exclude: ['**/node_modules/**'],
            maxSize: 1024 * 1024,
            minSize: 100,
            contentTypes: ['text/plain', 'application/json']
        };
        const filters = parser.parse(config);
        expect(filters).toHaveLength(4); // include group, exclude filter, size filter, content type filter
        expect(filters[0]).toBeDefined(); // include glob filter group
        expect(filters[1]).toBeDefined(); // exclude glob filter
        expect(filters[2]).toBeDefined(); // size filter (combines min and max)
        expect(filters[3]).toBeDefined(); // content type filter
    });
    test('should handle empty configuration', () => {
        const config = {};
        const filters = parser.parse(config);
        expect(filters).toHaveLength(0);
    });
    test('should handle partial configuration', () => {
        const config = {
            include: ['*.ts'],
            maxSize: 1000
        };
        const filters = parser.parse(config);
        expect(filters).toHaveLength(2);
    });
    test('should create correct number of include filters', () => {
        const config = {
            include: ['*.ts', '*.tsx', '*.js']
        };
        const filters = parser.parse(config);
        // Should create one IncludeFilterGroup with 3 glob filters inside
        expect(filters).toHaveLength(1);
    });
    test('should create correct number of exclude filters', () => {
        const config = {
            exclude: ['**/node_modules/**', '**/*.test.ts', '**/dist/**']
        };
        const filters = parser.parse(config);
        // Should create 3 separate exclude filters
        expect(filters).toHaveLength(3);
    });
    test('should create size filter when only maxSize specified', () => {
        const config = {
            maxSize: 1024 * 1024 // 1MB
        };
        const filters = parser.parse(config);
        expect(filters).toHaveLength(1);
        expect(filters[0]).toBeInstanceOf(SizeFilter_1.SizeFilter);
    });
    test('should create size filter when only minSize specified', () => {
        const config = {
            minSize: 100 // 100 bytes
        };
        const filters = parser.parse(config);
        expect(filters).toHaveLength(1);
        expect(filters[0]).toBeInstanceOf(SizeFilter_1.SizeFilter);
    });
    test('should create content type filter', () => {
        const config = {
            contentTypes: ['text/plain', 'application/json', 'image/png']
        };
        const filters = parser.parse(config);
        expect(filters).toHaveLength(1);
        expect(filters[0]).toBeInstanceOf(ContentTypeFilter_1.ContentTypeFilter);
    });
    test('should create all filter types together', () => {
        const config = {
            include: ['**/*.ts', '**/*.tsx'],
            exclude: ['**/node_modules/**', '**/*.test.ts'],
            maxSize: 1024 * 1024, // 1MB
            minSize: 100, // 100 bytes
            contentTypes: ['text/plain', 'application/json']
        };
        const filters = parser.parse(config);
        // 1 include group + 2 exclude filters + 1 size filter + 1 content type filter
        expect(filters).toHaveLength(5);
    });
    test('should handle complex glob patterns', () => {
        const config = {
            include: ['src/**/*.{ts,tsx}', 'test/**/*.test.{ts,tsx}'],
            exclude: ['**/node_modules/**', '**/*.d.ts']
        };
        const filters = parser.parse(config);
        // 1 include group with 2 patterns + 2 exclude filters
        expect(filters).toHaveLength(3);
    });
    test('should handle edge case configurations', () => {
        // Empty arrays
        const emptyConfig = {
            include: [],
            exclude: [],
            contentTypes: []
        };
        const emptyFilters = parser.parse(emptyConfig);
        // Empty include/exclude arrays should not create filters
        // Empty contentTypes should create a content type filter (that excludes everything)
        expect(emptyFilters).toHaveLength(1); // Just the content type filter
        // Single item arrays
        const singleConfig = {
            include: ['*.ts'],
            exclude: ['*.test.ts'],
            contentTypes: ['text/plain']
        };
        const singleFilters = parser.parse(singleConfig);
        expect(singleFilters).toHaveLength(3); // 1 include group + 1 exclude + 1 content type
    });
    test('should create functional filters that work correctly', () => {
        const config = {
            include: ['**/*.ts'],
            exclude: ['**/*.test.ts'],
            maxSize: 1000,
            contentTypes: ['text/plain']
        };
        const filters = parser.parse(config);
        // Test include filter
        const includeFilterGroup = filters[0];
        expect(includeFilterGroup.apply({ path: 'src/index.ts', size: 100, contentType: 'text/plain' })).toBe(true);
        expect(includeFilterGroup.apply({ path: 'src/index.js', size: 100, contentType: 'text/plain' })).toBe(false);
        // Test exclude filter
        const excludeFilter = filters[1];
        expect(excludeFilter.apply({ path: 'src/index.test.ts', size: 100, contentType: 'text/plain' })).toBe(false);
        expect(excludeFilter.apply({ path: 'src/index.ts', size: 100, contentType: 'text/plain' })).toBe(true);
        // Test size filter
        const sizeFilter = filters[2];
        expect(sizeFilter.apply({ path: 'file.ts', size: 500, contentType: 'text/plain' })).toBe(true);
        expect(sizeFilter.apply({ path: 'file.ts', size: 1500, contentType: 'text/plain' })).toBe(false);
        // Test content type filter
        const contentTypeFilter = filters[3];
        expect(contentTypeFilter.apply({ path: 'file.ts', size: 500, contentType: 'text/plain' })).toBe(true);
        expect(contentTypeFilter.apply({ path: 'file.ts', size: 500, contentType: 'image/png' })).toBe(false);
    });
});
//# sourceMappingURL=ConfigParser.test.js.map