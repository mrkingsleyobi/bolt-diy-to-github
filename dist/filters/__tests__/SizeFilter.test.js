"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SizeFilter_1 = require("../SizeFilter");
describe('SizeFilter', () => {
    test('should allow files within size bounds', () => {
        const filter = new SizeFilter_1.SizeFilter({ minSize: 100, maxSize: 1000 });
        const result = filter.apply({ path: 'file.txt', size: 500, contentType: 'text/plain' });
        expect(result).toBe(true);
    });
    test('should exclude files below minimum size', () => {
        const filter = new SizeFilter_1.SizeFilter({ minSize: 100 });
        const result = filter.apply({ path: 'file.txt', size: 50, contentType: 'text/plain' });
        expect(result).toBe(false);
        expect(filter.getReason()).toBe('File size 50 bytes is below minimum 100 bytes');
    });
    test('should exclude files above maximum size', () => {
        const filter = new SizeFilter_1.SizeFilter({ maxSize: 1000 });
        const result = filter.apply({ path: 'file.txt', size: 1500, contentType: 'text/plain' });
        expect(result).toBe(false);
        expect(filter.getReason()).toBe('File size 1500 bytes is above maximum 1000 bytes');
    });
    test('should allow all files when no size limits specified', () => {
        const filter = new SizeFilter_1.SizeFilter({});
        const result = filter.apply({ path: 'file.txt', size: 500, contentType: 'text/plain' });
        expect(result).toBe(true);
    });
    test('should handle zero size files', () => {
        const filter = new SizeFilter_1.SizeFilter({ minSize: 1 });
        const result = filter.apply({ path: 'empty.txt', size: 0, contentType: 'text/plain' });
        expect(result).toBe(false);
        expect(filter.getReason()).toBe('File size 0 bytes is below minimum 1 bytes');
    });
    test('should handle exact boundary conditions', () => {
        const minFilter = new SizeFilter_1.SizeFilter({ minSize: 100 });
        expect(minFilter.apply({ path: 'file.txt', size: 100, contentType: 'text/plain' })).toBe(true);
        const maxFilter = new SizeFilter_1.SizeFilter({ maxSize: 100 });
        expect(maxFilter.apply({ path: 'file.txt', size: 100, contentType: 'text/plain' })).toBe(true);
    });
    test('should handle very large files', () => {
        const filter = new SizeFilter_1.SizeFilter({ maxSize: 1024 * 1024 }); // 1MB limit
        const result = filter.apply({
            path: 'large.zip',
            size: 1024 * 1024 * 10, // 10MB file
            contentType: 'application/zip'
        });
        expect(result).toBe(false);
        expect(filter.getReason()).toBe('File size 10485760 bytes is above maximum 1048576 bytes');
    });
    test('should handle both min and max size limits', () => {
        const filter = new SizeFilter_1.SizeFilter({ minSize: 100, maxSize: 1000 });
        // Too small
        expect(filter.apply({ path: 'small.txt', size: 50, contentType: 'text/plain' })).toBe(false);
        // Just right
        expect(filter.apply({ path: 'medium.txt', size: 500, contentType: 'text/plain' })).toBe(true);
        // Too large
        expect(filter.apply({ path: 'large.txt', size: 1500, contentType: 'text/plain' })).toBe(false);
    });
    test('should provide correct reasons for exclusion', () => {
        const minFilter = new SizeFilter_1.SizeFilter({ minSize: 100 });
        minFilter.apply({ path: 'small.txt', size: 50, contentType: 'text/plain' });
        expect(minFilter.getReason()).toBe('File size 50 bytes is below minimum 100 bytes');
        const maxFilter = new SizeFilter_1.SizeFilter({ maxSize: 100 });
        maxFilter.apply({ path: 'large.txt', size: 150, contentType: 'text/plain' });
        expect(maxFilter.getReason()).toBe('File size 150 bytes is above maximum 100 bytes');
    });
    test('should reset reason on each application', () => {
        const filter = new SizeFilter_1.SizeFilter({ minSize: 100 });
        // First application - should be excluded
        filter.apply({ path: 'small.txt', size: 50, contentType: 'text/plain' });
        expect(filter.getReason()).not.toBe('');
        // Second application - should be included (no reason)
        filter.apply({ path: 'large.txt', size: 150, contentType: 'text/plain' });
        expect(filter.getReason()).toBe('');
    });
});
//# sourceMappingURL=SizeFilter.test.js.map