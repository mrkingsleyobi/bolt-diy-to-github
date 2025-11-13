"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const RateLimitingService_1 = require("./RateLimitingService");
async function debugTest() {
    const rateLimitingService = new RateLimitingService_1.RateLimitingService(10, 1, 'test-secret-key');
    console.log('Creating token with 0.01 minute expiration (600ms)...');
    const token = rateLimitingService.createRateLimitToken({ userId: 123, action: 'export' }, 0.01);
    const signedMessage = JSON.parse(token);
    const tokenData = JSON.parse(signedMessage.payload);
    console.log('Token created at:', tokenData.timestamp);
    console.log('Token expires at:', tokenData.expiration);
    console.log('Current time:', Date.now());
    console.log('Time until expiration:', tokenData.expiration - Date.now());
    // Test immediately
    const isValid1 = rateLimitingService.validateRateLimitToken(token);
    console.log('Valid immediately:', isValid1);
    // Wait 500ms
    console.log('Waiting 500ms...');
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('Current time:', Date.now());
    console.log('Time until/since expiration:', Date.now() - tokenData.expiration);
    const isValid2 = rateLimitingService.validateRateLimitToken(token);
    console.log('Valid after 500ms:', isValid2);
    // Wait 1000ms more (total 1500ms)
    console.log('Waiting 1000ms more...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Current time:', Date.now());
    console.log('Time since expiration:', Date.now() - tokenData.expiration);
    const isValid3 = rateLimitingService.validateRateLimitToken(token);
    console.log('Valid after 1500ms total:', isValid3);
    if (isValid3 === false) {
        console.log('✅ Token correctly expired!');
    }
    else {
        console.log('❌ Token did not expire as expected!');
    }
}
debugTest().catch(console.error);
//# sourceMappingURL=debug-expiration-test.js.map