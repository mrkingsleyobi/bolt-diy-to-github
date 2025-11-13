"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const MessageAuthenticationService_1 = require("../MessageAuthenticationService");
/**
 * Integration test demonstrating cross-origin communication flow
 * between Chrome extension and bolt.diy platform
 */
describe('MessageAuthenticationService - Integration Test', () => {
    // Simulate the shared secret key that both parties have
    const SHARED_SECRET_KEY = 'shared-secret-key-for-cross-origin-communication';
    // Simulate Chrome extension side
    let extensionAuthService;
    // Simulate bolt.diy platform side
    let platformAuthService;
    beforeEach(() => {
        jest.useFakeTimers();
        // Initialize extension-side service
        extensionAuthService = new MessageAuthenticationService_1.MessageAuthenticationService();
        extensionAuthService.setSecretKey(SHARED_SECRET_KEY);
        // Initialize platform-side service
        platformAuthService = new MessageAuthenticationService_1.MessageAuthenticationService();
        platformAuthService.setSecretKey(SHARED_SECRET_KEY);
        // Set appropriate expiration time for cross-origin communication
        extensionAuthService.setExpirationTime(5 * 60 * 1000); // 5 minutes
        platformAuthService.setExpirationTime(5 * 60 * 1000); // 5 minutes
    });
    afterEach(() => {
        jest.useRealTimers();
    });
    it('should demonstrate complete cross-origin communication flow', () => {
        // Step 1: Chrome extension signs a message before sending
        const messageData = {
            action: 'SYNC_PROJECT',
            projectId: 'project-123',
            branch: 'main',
            timestamp: Date.now()
        };
        const message = JSON.stringify(messageData);
        const signedMessage = extensionAuthService.signMessage(message);
        // Verify the structure of the signed message
        expect(signedMessage).toHaveProperty('payload');
        expect(signedMessage).toHaveProperty('signature');
        expect(signedMessage).toHaveProperty('timestamp');
        expect(typeof signedMessage.signature).toBe('string');
        expect(signedMessage.signature).toMatch(/^[0-9a-f]{64}$/); // HMAC-SHA256 hex format
        // Step 2: Message is transmitted over cross-origin boundary
        // (In real implementation, this would be sent via postMessage or HTTP request)
        const transmittedMessage = {
            payload: signedMessage.payload,
            signature: signedMessage.signature,
            timestamp: signedMessage.timestamp
        };
        // Step 3: bolt.diy platform receives and verifies the message
        const isAuthentic = platformAuthService.verifyMessage(transmittedMessage);
        expect(isAuthentic).toBe(true);
        // Step 4: Platform processes the verified message
        const payloadObj = JSON.parse(transmittedMessage.payload);
        const originalMessage = payloadObj.message;
        const originalMessageData = JSON.parse(originalMessage);
        expect(originalMessageData.action).toBe('SYNC_PROJECT');
        expect(originalMessageData.projectId).toBe('project-123');
        expect(originalMessageData.branch).toBe('main');
        // Step 5: Platform creates response message
        const responseMessageData = {
            success: true,
            result: 'Project sync initiated',
            requestId: originalMessageData.timestamp
        };
        const responseMessage = JSON.stringify(responseMessageData);
        const signedResponse = platformAuthService.signMessage(responseMessage);
        // Step 6: Response is transmitted back to extension
        const transmittedResponse = {
            payload: signedResponse.payload,
            signature: signedResponse.signature,
            timestamp: signedResponse.timestamp
        };
        // Step 7: Extension verifies the response
        const isResponseAuthentic = extensionAuthService.verifyMessage(transmittedResponse);
        expect(isResponseAuthentic).toBe(true);
        // Step 8: Extension processes the verified response
        const responsePayloadObj = JSON.parse(transmittedResponse.payload);
        const originalResponseMessage = responsePayloadObj.message;
        const originalResponseData = JSON.parse(originalResponseMessage);
        expect(originalResponseData.success).toBe(true);
        expect(originalResponseData.result).toBe('Project sync initiated');
    });
    it('should reject messages from attacker with different key', () => {
        // Attacker tries to create a message with their own key
        const attackerAuthService = new MessageAuthenticationService_1.MessageAuthenticationService();
        attackerAuthService.setSecretKey('attacker-secret-key');
        // Attacker creates a malicious message
        const maliciousMessageData = {
            action: 'DELETE_PROJECT',
            projectId: 'project-123',
            malicious: true
        };
        const maliciousMessage = JSON.stringify(maliciousMessageData);
        const attackerSignedMessage = attackerAuthService.signMessage(maliciousMessage);
        // Platform tries to verify the attacker's message
        const isAuthentic = platformAuthService.verifyMessage(attackerSignedMessage);
        expect(isAuthentic).toBe(false); // Should be rejected
        // Even if attacker tries to use platform's key format, they don't have the key
        const fakeSignedMessage = {
            payload: attackerSignedMessage.payload,
            signature: 'fake-signature-hopefully-looks-valid',
            timestamp: attackerSignedMessage.timestamp
        };
        const isFakeAuthentic = platformAuthService.verifyMessage(fakeSignedMessage);
        expect(isFakeAuthentic).toBe(false); // Should still be rejected
    });
    it('should reject expired messages to prevent replay attacks', () => {
        // Set short expiration time for testing
        extensionAuthService.setExpirationTime(1000); // 1 second
        platformAuthService.setExpirationTime(1000); // 1 second
        // Extension signs a message
        const messageData = {
            action: 'GET_STATUS',
            projectId: 'project-123'
        };
        const message = JSON.stringify(messageData);
        const signedMessage = extensionAuthService.signMessage(message);
        // Simulate network delay or message interception
        jest.advanceTimersByTime(2000); // Advance time by 2 seconds
        // Platform tries to verify the expired message
        const isAuthentic = platformAuthService.verifyMessage(signedMessage);
        expect(isAuthentic).toBe(false); // Should be rejected due to expiration
        // Verify that the message structure is still intact but just expired
        const payloadObj = JSON.parse(signedMessage.payload);
        const originalMessageData = JSON.parse(payloadObj.message);
        expect(originalMessageData.action).toBe('GET_STATUS');
    });
    it('should maintain security with rapid message exchanges', () => {
        const messages = [
            { action: 'PING', data: 'ping-1' },
            { action: 'PING', data: 'ping-2' },
            { action: 'PING', data: 'ping-3' },
            { action: 'DATA', data: { key: 'value1' } },
            { action: 'DATA', data: { key: 'value2' } },
            { action: 'DATA', data: { key: 'value3' } }
        ];
        // Process each message in sequence
        for (let i = 0; i < messages.length; i++) {
            const message = JSON.stringify(messages[i]);
            // Extension signs message
            const signedMessage = extensionAuthService.signMessage(message);
            // Verify message structure
            expect(signedMessage.signature).toMatch(/^[0-9a-f]{64}$/);
            // Platform verifies message
            const isAuthentic = platformAuthService.verifyMessage(signedMessage);
            expect(isAuthentic).toBe(true);
            // Platform processes message
            const payloadObj = JSON.parse(signedMessage.payload);
            const originalMessageData = JSON.parse(payloadObj.message);
            expect(originalMessageData.action).toBe(messages[i].action);
            expect(originalMessageData.data).toEqual(messages[i].data);
            // Platform sends response
            const response = JSON.stringify({
                action: 'RESPONSE',
                originalAction: messages[i].action,
                success: true,
                timestamp: Date.now()
            });
            const signedResponse = platformAuthService.signMessage(response);
            const isResponseAuthentic = extensionAuthService.verifyMessage(signedResponse);
            expect(isResponseAuthentic).toBe(true);
        }
    });
});
//# sourceMappingURL=MessageAuthenticationService.integration.test.js.map