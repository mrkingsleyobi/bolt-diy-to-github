"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const MessageAuthenticationService_1 = require("../MessageAuthenticationService");
describe('MessageAuthenticationService - Comprehensive Tests', () => {
    let service;
    const testSecret = 'comprehensive-test-secret-key-for-hmac-sha256';
    beforeEach(() => {
        jest.useFakeTimers();
        service = new MessageAuthenticationService_1.MessageAuthenticationService();
        service.setSecretKey(testSecret);
    });
    afterEach(() => {
        jest.useRealTimers();
    });
    // Signing functionality tests
    describe('signMessage', () => {
        it('should create a valid signed message structure', () => {
            const message = 'test message';
            const signedMessage = service.signMessage(message);
            expect(signedMessage).toHaveProperty('payload');
            expect(signedMessage).toHaveProperty('signature');
            expect(signedMessage).toHaveProperty('timestamp');
            expect(typeof signedMessage.payload).toBe('string');
            expect(typeof signedMessage.signature).toBe('string');
            expect(typeof signedMessage.timestamp).toBe('number');
        });
        it('should include the original message in the payload', () => {
            const message = 'Hello, World!';
            const signedMessage = service.signMessage(message);
            const payloadObj = JSON.parse(signedMessage.payload);
            expect(payloadObj.message).toBe(message);
        });
        it('should include a valid timestamp in the payload', () => {
            const now = Date.now();
            jest.setSystemTime(now);
            const message = 'test message';
            const signedMessage = service.signMessage(message);
            const payloadObj = JSON.parse(signedMessage.payload);
            expect(payloadObj.timestamp).toBe(now);
            expect(signedMessage.timestamp).toBe(now);
        });
        it('should generate a valid HMAC-SHA256 signature', () => {
            const message = 'test message';
            const signedMessage = service.signMessage(message);
            // Should be a hex string of correct length (32 bytes = 64 hex chars)
            expect(signedMessage.signature).toMatch(/^[0-9a-f]{64}$/);
        });
        it('should produce different signatures for the same message at different times', () => {
            const message = 'test message';
            const signedMessage1 = service.signMessage(message);
            jest.advanceTimersByTime(10);
            const signedMessage2 = service.signMessage(message);
            expect(signedMessage1.signature).not.toBe(signedMessage2.signature);
            expect(signedMessage1.payload).not.toBe(signedMessage2.payload);
        });
        it('should produce different signatures for different messages', () => {
            const message1 = 'first message';
            const message2 = 'second message';
            const signedMessage1 = service.signMessage(message1);
            const signedMessage2 = service.signMessage(message2);
            expect(signedMessage1.signature).not.toBe(signedMessage2.signature);
        });
        it('should handle empty string messages', () => {
            const message = '';
            const signedMessage = service.signMessage(message);
            const isValid = service.verifyMessage(signedMessage);
            expect(isValid).toBe(true);
            const payloadObj = JSON.parse(signedMessage.payload);
            expect(payloadObj.message).toBe(message);
        });
        it('should handle special characters in messages', () => {
            const message = 'Message with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?';
            const signedMessage = service.signMessage(message);
            const isValid = service.verifyMessage(signedMessage);
            expect(isValid).toBe(true);
            const payloadObj = JSON.parse(signedMessage.payload);
            expect(payloadObj.message).toBe(message);
        });
        it('should handle unicode characters in messages', () => {
            const message = 'Message with unicode: 你好世界 🌍';
            const signedMessage = service.signMessage(message);
            const isValid = service.verifyMessage(signedMessage);
            expect(isValid).toBe(true);
            const payloadObj = JSON.parse(signedMessage.payload);
            expect(payloadObj.message).toBe(message);
        });
        it('should handle JSON string messages', () => {
            const message = JSON.stringify({ key: 'value', number: 42 });
            const signedMessage = service.signMessage(message);
            const isValid = service.verifyMessage(signedMessage);
            expect(isValid).toBe(true);
            const payloadObj = JSON.parse(signedMessage.payload);
            expect(payloadObj.message).toBe(message);
        });
    });
    // Verification functionality tests
    describe('verifyMessage', () => {
        it('should verify a valid signed message', () => {
            const message = 'valid message';
            const signedMessage = service.signMessage(message);
            const isValid = service.verifyMessage(signedMessage);
            expect(isValid).toBe(true);
        });
        it('should reject a message with tampered payload', () => {
            const message = 'original message';
            const signedMessage = service.signMessage(message);
            // Tamper with the payload
            const payloadObj = JSON.parse(signedMessage.payload);
            payloadObj.message = 'tampered message';
            signedMessage.payload = JSON.stringify(payloadObj);
            const isValid = service.verifyMessage(signedMessage);
            expect(isValid).toBe(false);
        });
        it('should reject a message with tampered timestamp', () => {
            const message = 'test message';
            const signedMessage = service.signMessage(message);
            // Tamper with the timestamp
            const payloadObj = JSON.parse(signedMessage.payload);
            payloadObj.timestamp = payloadObj.timestamp + 1000;
            signedMessage.payload = JSON.stringify(payloadObj);
            const isValid = service.verifyMessage(signedMessage);
            expect(isValid).toBe(false);
        });
        it('should reject a message with completely invalid signature', () => {
            const message = 'test message';
            const signedMessage = service.signMessage(message);
            signedMessage.signature = 'completely-invalid-signature';
            const isValid = service.verifyMessage(signedMessage);
            expect(isValid).toBe(false);
        });
        it('should reject a message with wrong signature length', () => {
            const message = 'test message';
            const signedMessage = service.signMessage(message);
            signedMessage.signature = 'abcd1234'; // Much shorter
            const isValid = service.verifyMessage(signedMessage);
            expect(isValid).toBe(false);
        });
        it('should reject a message with future timestamp', () => {
            const message = 'test message';
            const signedMessage = service.signMessage(message);
            // Tamper with payload to set future timestamp
            const payloadObj = JSON.parse(signedMessage.payload);
            payloadObj.timestamp = Date.now() + 5 * 60 * 1000; // 5 minutes in the future
            signedMessage.payload = JSON.stringify(payloadObj);
            const isValid = service.verifyMessage(signedMessage);
            expect(isValid).toBe(false);
        });
        it('should reject a message with malformed JSON payload', () => {
            const signedMessage = {
                payload: 'invalid-json-{',
                signature: 'some-signature',
                timestamp: Date.now()
            };
            const isValid = service.verifyMessage(signedMessage);
            expect(isValid).toBe(false);
        });
        it('should reject a message with non-numeric timestamp', () => {
            const message = 'test message';
            const signedMessage = service.signMessage(message);
            const payloadObj = JSON.parse(signedMessage.payload);
            payloadObj.timestamp = 'not-a-number';
            signedMessage.payload = JSON.stringify(payloadObj);
            const isValid = service.verifyMessage(signedMessage);
            expect(isValid).toBe(false);
        });
    });
    // Key management tests
    describe('setSecretKey', () => {
        it('should set and store a valid secret key', () => {
            const secretKey = 'new-secret-key';
            service.setSecretKey(secretKey);
            // Test by signing and verifying
            const message = 'test message';
            const signedMessage = service.signMessage(message);
            const isValid = service.verifyMessage(signedMessage);
            expect(isValid).toBe(true);
        });
        it('should reject empty string key', () => {
            expect(() => {
                service.setSecretKey('');
            }).toThrow('Secret key cannot be empty');
        });
        it('should reject non-string key', () => {
            expect(() => {
                service.setSecretKey(123);
            }).toThrow('Secret key must be a string');
        });
        it('should allow updating key multiple times', () => {
            const key1 = 'first-key';
            const key2 = 'second-key';
            service.setSecretKey(key1);
            const message = 'test message';
            const signedWithKey1 = service.signMessage(message);
            expect(service.verifyMessage(signedWithKey1)).toBe(true);
            service.setSecretKey(key2);
            const signedWithKey2 = service.signMessage(message);
            expect(service.verifyMessage(signedWithKey2)).toBe(true);
            // Messages signed with old key should fail with new key
            expect(service.verifyMessage(signedWithKey1)).toBe(false);
        });
    });
    // Expiration tests
    describe('setExpirationTime and expiration', () => {
        it('should allow setting custom expiration time', () => {
            service.setExpirationTime(10 * 60 * 1000); // 10 minutes
            expect(service.getExpirationTime()).toBe(10 * 60 * 1000);
        });
        it('should reject zero expiration time', () => {
            expect(() => {
                service.setExpirationTime(0);
            }).toThrow('Expiration time must be positive');
        });
        it('should reject negative expiration time', () => {
            expect(() => {
                service.setExpirationTime(-1);
            }).toThrow('Expiration time must be positive');
        });
        it('should accept message at exact expiration boundary', () => {
            service.setExpirationTime(60000); // 1 minute
            const now = Date.now();
            jest.setSystemTime(now);
            const message = 'test message';
            const signedMessage = service.signMessage(message);
            // Set time to exactly expiration time
            jest.setSystemTime(now + 60000);
            const isValid = service.verifyMessage(signedMessage);
            expect(isValid).toBe(true);
        });
        it('should reject message just past expiration boundary', () => {
            service.setExpirationTime(60000); // 1 minute
            const now = Date.now();
            jest.setSystemTime(now);
            const message = 'test message';
            const signedMessage = service.signMessage(message);
            // Set time to just past expiration (1ms over)
            jest.setSystemTime(now + 60001);
            const isValid = service.verifyMessage(signedMessage);
            expect(isValid).toBe(false);
        });
        it('should work with very short expiration time', () => {
            service.setExpirationTime(1000); // 1 second
            const now = Date.now();
            jest.setSystemTime(now);
            const message = 'test message';
            const signedMessage = service.signMessage(message);
            // Test at 0.5 seconds (should pass)
            jest.setSystemTime(now + 500);
            expect(service.verifyMessage(signedMessage)).toBe(true);
            // Test at 1.5 seconds (should fail)
            jest.setSystemTime(now + 1500);
            expect(service.verifyMessage(signedMessage)).toBe(false);
        });
    });
    // Security tests
    describe('Security', () => {
        it('should use constant-time comparison to prevent timing attacks', () => {
            const message = 'test message';
            const signedMessage = service.signMessage(message);
            // Test that verification time is constant regardless of how wrong the signature is
            const validSignature = signedMessage.signature;
            const completelyWrongSignature = '0'.repeat(64);
            const slightlyWrongSignature = validSignature.slice(0, -1) + '0';
            // Time verification of valid signature
            const startValid = performance.now();
            service.verifyMessage(signedMessage);
            const endValid = performance.now();
            // Time verification of completely wrong signature
            const wrongSignedMessage1 = { ...signedMessage, signature: completelyWrongSignature };
            const startWrong1 = performance.now();
            service.verifyMessage(wrongSignedMessage1);
            const endWrong1 = performance.now();
            // Time verification of slightly wrong signature
            const wrongSignedMessage2 = { ...signedMessage, signature: slightlyWrongSignature };
            const startWrong2 = performance.now();
            service.verifyMessage(wrongSignedMessage2);
            const endWrong2 = performance.now();
            const validTime = endValid - startValid;
            const wrongTime1 = endWrong1 - startWrong1;
            const wrongTime2 = endWrong2 - startWrong2;
            // All times should be very close (within 2ms) - constant time comparison
            expect(Math.abs(validTime - wrongTime1)).toBeLessThan(2);
            expect(Math.abs(validTime - wrongTime2)).toBeLessThan(2);
            expect(Math.abs(wrongTime1 - wrongTime2)).toBeLessThan(2);
        });
        it('should prevent message forgery with different key', () => {
            const message = 'legitimate message';
            // Sign with first service
            const signedMessage = service.signMessage(message);
            // Try to verify with different service (different key)
            const differentService = new MessageAuthenticationService_1.MessageAuthenticationService();
            differentService.setSecretKey('different-secret-key');
            const isValid = differentService.verifyMessage(signedMessage);
            expect(isValid).toBe(false);
        });
        it('should maintain message integrity through sign-verify cycle', () => {
            const originalMessage = 'Important message that must not be tampered with';
            // Sign the message
            const signedMessage = service.signMessage(originalMessage);
            // Verify the signed message
            const isValid = service.verifyMessage(signedMessage);
            // Extract message from payload and verify it matches original
            const payloadObj = JSON.parse(signedMessage.payload);
            const extractedMessage = payloadObj.message;
            expect(isValid).toBe(true);
            expect(extractedMessage).toBe(originalMessage);
        });
    });
    // Edge case tests
    describe('Edge Cases', () => {
        it('should handle very large messages', () => {
            const largeMessage = 'A'.repeat(100000); // 100KB message
            const signedMessage = service.signMessage(largeMessage);
            const isValid = service.verifyMessage(signedMessage);
            expect(isValid).toBe(true);
            const payloadObj = JSON.parse(signedMessage.payload);
            expect(payloadObj.message).toBe(largeMessage);
        });
        it('should handle messages with null bytes', () => {
            const message = 'message with \0 null byte';
            const signedMessage = service.signMessage(message);
            const isValid = service.verifyMessage(signedMessage);
            expect(isValid).toBe(true);
            const payloadObj = JSON.parse(signedMessage.payload);
            expect(payloadObj.message).toBe(message);
        });
        it('should handle messages with newlines and tabs', () => {
            const message = 'message\nwith\nnewlines\tand\ttabs';
            const signedMessage = service.signMessage(message);
            const isValid = service.verifyMessage(signedMessage);
            expect(isValid).toBe(true);
            const payloadObj = JSON.parse(signedMessage.payload);
            expect(payloadObj.message).toBe(message);
        });
        it('should work with single character secret key', () => {
            const serviceWithShortKey = new MessageAuthenticationService_1.MessageAuthenticationService();
            serviceWithShortKey.setSecretKey('a');
            const message = 'test message';
            const signedMessage = serviceWithShortKey.signMessage(message);
            const isValid = serviceWithShortKey.verifyMessage(signedMessage);
            expect(isValid).toBe(true);
        });
        it('should work with very long secret key', () => {
            const longKey = 'a'.repeat(10000); // 10KB key
            const serviceWithLongKey = new MessageAuthenticationService_1.MessageAuthenticationService();
            serviceWithLongKey.setSecretKey(longKey);
            const message = 'test message';
            const signedMessage = serviceWithLongKey.signMessage(message);
            const isValid = serviceWithLongKey.verifyMessage(signedMessage);
            expect(isValid).toBe(true);
        });
    });
});
//# sourceMappingURL=MessageAuthenticationService.comprehensive.test.js.map