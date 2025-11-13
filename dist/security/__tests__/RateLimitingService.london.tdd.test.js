"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const RateLimitingService_1 = require("../RateLimitingService");
/**
 * London School TDD Tests for RateLimitingService
 *
 * These tests follow the London School TDD approach:
 * 1. Test behavior and interactions rather than implementation details
 * 2. Focus on the public API and expected outcomes
 * 3. Verify the system under test collaborates correctly with dependencies
 */
describe('RateLimitingService - London School TDD', () => {
    let rateLimitingService;
    beforeEach(() => {
        rateLimitingService = new RateLimitingService_1.RateLimitingService(10, 1, 'test-secret-key');
    });
    // Test 1: Verify the service can be instantiated
    it('should be able to create a RateLimitingService instance', () => {
        expect(rateLimitingService).toBeInstanceOf(RateLimitingService_1.RateLimitingService);
    });
    // Test 2: Verify basic rate limiting functionality
    it('should allow consumption of tokens when available', () => {
        const result = rateLimitingService.consume(1);
        expect(result).toBe(true);
    });
    // Test 3: Verify token consumption fails when no tokens available
    it('should reject consumption when insufficient tokens available', () => {
        // Consume all tokens
        for (let i = 0; i < 10; i++) {
            rateLimitingService.consume(1);
        }
        // Try to consume one more
        const result = rateLimitingService.consume(1);
        expect(result).toBe(false);
    });
    // Test 4: Verify token refill over time
    it('should refill tokens over time', async () => {
        // Consume all tokens
        for (let i = 0; i < 10; i++) {
            rateLimitingService.consume(1);
        }
        // Check no tokens available
        expect(rateLimitingService.getAvailableTokens()).toBe(0);
        // Wait for token refill
        await new Promise(resolve => setTimeout(resolve, 2000));
        // Should have refilled some tokens
        const availableTokens = rateLimitingService.getAvailableTokens();
        expect(availableTokens).toBeGreaterThan(0);
    });
    // Test 5: Verify configuration update
    it('should allow updating configuration', () => {
        rateLimitingService.updateConfiguration(20, 2);
        expect(rateLimitingService.getBucketSize()).toBe(20);
        expect(rateLimitingService.getRefillRate()).toBe(2);
    });
    // Test 6: Verify secret key management
    it('should allow setting and getting secret key', () => {
        rateLimitingService.setSecretKey('new-secret-key');
        expect(rateLimitingService.getSecretKey()).toBe('new-secret-key');
    });
    // Test 7: Verify rate limit token creation
    it('should create rate limit tokens', () => {
        const token = rateLimitingService.createRateLimitToken({ test: 'data' }, 5);
        expect(typeof token).toBe('string');
        expect(token.length).toBeGreaterThan(0);
    });
    // Test 8: Verify rate limit token validation
    it('should validate rate limit tokens', () => {
        const token = rateLimitingService.createRateLimitToken({ test: 'data' }, 5);
        const isValid = rateLimitingService.validateRateLimitToken(token);
        expect(isValid).toBe(true);
    });
    // Test 9: Verify encryption with rate limit metadata
    it('should encrypt data with rate limit metadata', async () => {
        const encrypted = await rateLimitingService.encryptWithRateLimit('test data', 'encryption-secret');
        expect(typeof encrypted).toBe('string');
        expect(encrypted.length).toBeGreaterThan(0);
    });
    // Test 10: Verify decryption with rate limit validation
    it('should decrypt data and validate rate limit', async () => {
        const encrypted = await rateLimitingService.encryptWithRateLimit('test data', 'encryption-secret');
        const decrypted = await rateLimitingService.decryptWithRateLimit(encrypted, 'encryption-secret');
        expect(decrypted).toBe('test data');
    });
    // Test 11: Verify error handling for invalid secret key
    it('should throw error when creating tokens without secret key', () => {
        rateLimitingService.setSecretKey('');
        expect(() => {
            rateLimitingService.createRateLimitToken({ test: 'data' });
        }).toThrow('Secret key not set');
    });
    // Test 12: Verify error handling for invalid configuration values
    it('should throw error for invalid configuration values', () => {
        expect(() => {
            rateLimitingService.updateConfiguration(-1, 1);
        }).toThrow('Bucket size and refill rate must be positive');
        expect(() => {
            rateLimitingService.updateConfiguration(10, -1);
        }).toThrow('Bucket size and refill rate must be positive');
    });
});
//# sourceMappingURL=RateLimitingService.london.tdd.test.js.map