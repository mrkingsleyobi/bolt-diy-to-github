"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const RateLimitingService_1 = require("../RateLimitingService");
describe('Debug Token Structure Test', () => {
    let rateLimitingService;
    beforeEach(() => {
        rateLimitingService = new RateLimitingService_1.RateLimitingService(10, 1, 'integration-test-secret');
    });
    it('should show token structure', async () => {
        const requestData = {
            payload: {
                action: 'export-project',
                projectId: '12345',
                timestamp: Date.now()
            }
        };
        const token = rateLimitingService.createRateLimitToken(requestData.payload, 5);
        console.log('Token string:', token);
        const signedMessage = JSON.parse(token);
        console.log('Signed message:', JSON.stringify(signedMessage, null, 2));
        const payloadObj = JSON.parse(signedMessage.payload);
        console.log('Payload object:', JSON.stringify(payloadObj, null, 2));
        const tokenData = JSON.parse(payloadObj.message);
        console.log('Token data:', JSON.stringify(tokenData, null, 2));
        // Test validation
        const isTokenValid = rateLimitingService.validateRateLimitToken(token);
        console.log('Token is valid:', isTokenValid);
    });
});
//# sourceMappingURL=debug-token-structure.test.js.map