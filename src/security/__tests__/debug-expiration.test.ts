import { RateLimitingService } from '../RateLimitingService';

describe('Debug Expiration Test', () => {
  let rateLimitingService: RateLimitingService;

  beforeEach(() => {
    rateLimitingService = new RateLimitingService(10, 1, 'test-secret-key');
  });

  it('should debug token expiration', async () => {
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

    // Wait 2000ms more (total 2500ms)
    console.log('Waiting 2000ms more...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('Current time:', Date.now());
    console.log('Time since expiration:', Date.now() - tokenData.expiration);

    const isValid3 = rateLimitingService.validateRateLimitToken(token);
    console.log('Valid after 2500ms total:', isValid3);

    expect(isValid3).toBe(false);
  }, 10000);
});