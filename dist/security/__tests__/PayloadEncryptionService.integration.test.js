"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const PayloadEncryptionService_1 = require("../PayloadEncryptionService");
describe('PayloadEncryptionService Integration', () => {
    let service;
    const testSecret = 'integration-test-secret-key-for-aes';
    const testPayloads = [
        'Simple message',
        'Message with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?`~"\'\\/',
        'Unicode message: 你好世界 🌍 Привет мир 👋',
        '{"userId":123,"action":"transfer","amount":99.99,"currency":"USD"}',
        '', // Empty string
        'A'.repeat(1000) // Large payload
    ];
    beforeEach(() => {
        service = new PayloadEncryptionService_1.PayloadEncryptionService();
    });
    // Test end-to-end encryption and decryption for various payload types
    test.each(testPayloads)('should encrypt and decrypt payload: %s', async (payload) => {
        const encryptedMessage = await service.encryptPayload(payload, testSecret);
        const decryptedPayload = await service.decryptPayload(encryptedMessage, testSecret);
        expect(decryptedPayload).toBe(payload);
    });
    // Test that different secrets produce different encrypted results
    it('should produce different encrypted results with different secrets', async () => {
        const payload = 'Test message';
        const secret1 = 'secret-key-one';
        const secret2 = 'secret-key-two';
        const encrypted1 = await service.encryptPayload(payload, secret1);
        const encrypted2 = await service.encryptPayload(payload, secret2);
        expect(encrypted1.encryptedPayload).not.toBe(encrypted2.encryptedPayload);
    });
    // Test that same payload with same secret produces decryptable results across instances
    it('should produce decryptable results across different service instances', async () => {
        const payload = 'Cross-instance test message';
        const service1 = new PayloadEncryptionService_1.PayloadEncryptionService();
        const service2 = new PayloadEncryptionService_1.PayloadEncryptionService();
        const encryptedMessage = await service1.encryptPayload(payload, testSecret);
        const decryptedPayload = await service2.decryptPayload(encryptedMessage, testSecret);
        expect(decryptedPayload).toBe(payload);
    });
    // Test cross-origin communication scenario
    it('should handle cross-origin communication scenario', async () => {
        // Simulate sending message from content script to background script
        const message = {
            type: 'SECURE_DATA_TRANSFER',
            payload: JSON.stringify({
                userId: 'user123',
                token: 'sensitive-access-token',
                action: 'github-sync'
            })
        };
        // Encrypt in content script
        const encryptedMessage = await service.encryptPayload(message.payload, testSecret);
        // Simulate transmission (serialize/deserialize)
        const transmittedMessage = JSON.parse(JSON.stringify(encryptedMessage));
        // Decrypt in background script
        const decryptedPayload = await service.decryptPayload(transmittedMessage, testSecret);
        const decryptedData = JSON.parse(decryptedPayload);
        expect(decryptedData.userId).toBe('user123');
        expect(decryptedData.token).toBe('sensitive-access-token');
        expect(decryptedData.action).toBe('github-sync');
    });
    // Test performance with multiple operations
    it('should handle multiple encryption/decryption operations efficiently', async () => {
        const payloads = Array.from({ length: 50 }, (_, i) => `Message ${i}`);
        const results = [];
        const startTime = Date.now();
        // Perform multiple encryption/decryption operations
        for (const payload of payloads) {
            const encrypted = await service.encryptPayload(payload, testSecret);
            const decrypted = await service.decryptPayload(encrypted, testSecret);
            results.push(decrypted);
        }
        const endTime = Date.now();
        const duration = endTime - startTime;
        // Verify all operations were successful
        expect(results).toHaveLength(50);
        results.forEach((result, index) => {
            expect(result).toBe(`Message ${index}`);
        });
        // Performance check - should complete within reasonable time (5 seconds for 50 operations in CI)
        expect(duration).toBeLessThan(5000);
    });
    // Test with different expiration settings
    it('should handle different expiration settings correctly', async () => {
        const payload = 'Test message with expiration';
        // Test with 1 minute expiration
        service.setExpirationTime(60000); // 1 minute
        const encrypted1 = await service.encryptPayload(payload, testSecret);
        const decrypted1 = await service.decryptPayload(encrypted1, testSecret);
        expect(decrypted1).toBe(payload);
        // Test with 1 hour expiration
        service.setExpirationTime(3600000); // 1 hour
        const encrypted2 = await service.encryptPayload(payload, testSecret);
        const decrypted2 = await service.decryptPayload(encrypted2, testSecret);
        expect(decrypted2).toBe(payload);
        // Test with no expiration
        service.setExpirationTime(0); // No expiration
        const encrypted3 = await service.encryptPayload(payload, testSecret);
        const decrypted3 = await service.decryptPayload(encrypted3, testSecret);
        expect(decrypted3).toBe(payload);
    });
});
//# sourceMappingURL=PayloadEncryptionService.integration.test.js.map