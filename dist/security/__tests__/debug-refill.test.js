"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const RateLimitingService_1 = require("../RateLimitingService");
describe('Debug Refill Test', () => {
    let rateLimitingService;
    beforeEach(() => {
        rateLimitingService = new RateLimitingService_1.RateLimitingService(10, 1, 'test-secret-key');
    });
    it('should debug token refill', async () => {
        console.log('Initial tokens:', rateLimitingService.getAvailableTokens());
        // Consume all tokens
        for (let i = 0; i < 10; i++) {
            const result = rateLimitingService.consume(1);
            console.log(`Consumed token ${i + 1}, result: ${result}`);
        }
        console.log('Tokens after consuming all:', rateLimitingService.getAvailableTokens());
        // Wait for refill (2 seconds should refill 2 tokens)
        console.log('Waiting 2000ms for refill...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log('Tokens after 2 seconds:', rateLimitingService.getAvailableTokens());
        // Try to consume a token
        const result = rateLimitingService.consume(1);
        console.log('Consumption result:', result);
        console.log('Tokens after consumption:', rateLimitingService.getAvailableTokens());
        expect(result).toBe(true);
        expect(rateLimitingService.getAvailableTokens()).toBeGreaterThan(0);
    }, 10000);
});
//# sourceMappingURL=debug-refill.test.js.map