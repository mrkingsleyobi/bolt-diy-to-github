const { RateLimitingService } = require('../../dist/security/RateLimitingService');

async function debugToken() {
  const rateLimiter = new RateLimitingService(10, 1, 'debug-secret');

  console.log('Creating token with 0.001 minute expiration (60ms)...');
  const token = rateLimiter.createRateLimitToken({ userId: 123, action: 'export' }, 0.001);

  console.log('Token created:', token);

  const signedMessage = JSON.parse(token);
  console.log('Signed message:', signedMessage);

  const tokenData = JSON.parse(signedMessage.payload);
  console.log('Token data:', tokenData);
  console.log('Current time:', Date.now());
  console.log('Expiration time:', tokenData.expiration);
  console.log('Time until expiration:', tokenData.expiration - Date.now());

  // Test validation immediately
  const isValidBefore = rateLimiter.validateRateLimitToken(token);
  console.log('Token is valid before expiration:', isValidBefore);

  // Wait for expiration
  console.log('Waiting 200ms for token to expire...');
  await new Promise(resolve => setTimeout(resolve, 200));

  console.log('Current time:', Date.now());
  console.log('Expiration time:', tokenData.expiration);
  console.log('Time since expiration:', Date.now() - tokenData.expiration);

  const isValidAfter = rateLimiter.validateRateLimitToken(token);
  console.log('Token is valid after expiration:', isValidAfter);

  if (isValidAfter === false) {
    console.log('✅ Token expiration is working correctly!');
  } else {
    console.log('❌ Token expiration is NOT working correctly!');
  }
}

debugToken().catch(console.error);