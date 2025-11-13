# Task 10d: Test Expired Messages

**Estimated Time: 10 minutes**

## Context
I'm creating comprehensive tests specifically for message expiration handling to ensure the system properly rejects expired messages and accepts valid ones.

## Current System State
- MessageAuthenticationService class with verifyMessage implemented including timestamp validation
- Jest testing framework configured

## Your Task
Create specific tests for various expiration scenarios including edge cases and boundary conditions.

## Test First (RED Phase)
Creating tests for specific expiration scenarios.

## Minimal Implementation (GREEN Phase)
Implementing tests that verify expiration handling works correctly.

## Refactored Solution (REFACTOR Phase)
```typescript
// File: /src/security/__tests__/MessageAuthenticationService.expiration.test.ts
import { MessageAuthenticationService } from '../MessageAuthenticationService';

describe('MessageAuthenticationService - Expiration Tests', () => {
  let service: MessageAuthenticationService;
  const testSecret = 'test-secret-key-for-hmac';
  const testMessage = 'Hello, secure world!';

  beforeEach(() => {
    service = new MessageAuthenticationService();
    service.setSecretKey(testSecret);
  });

  it('should accept message at exact expiration boundary', () => {
    service.setExpirationTime(60000); // 1 minute

    const now = Date.now();
    jest.spyOn(global.Date, 'now').mockImplementation(() => now);

    const signedMessage = service.signMessage(testMessage);

    // Set time to exactly expiration time
    jest.spyOn(global.Date, 'now').mockImplementation(() => now + 60000);

    const isValid = service.verifyMessage(signedMessage);
    expect(isValid).toBe(true);
  });

  it('should reject message just past expiration boundary', () => {
    service.setExpirationTime(60000); // 1 minute

    const now = Date.now();
    jest.spyOn(global.Date, 'now').mockImplementation(() => now);

    const signedMessage = service.signMessage(testMessage);

    // Set time to just past expiration (1ms over)
    jest.spyOn(global.Date, 'now').mockImplementation(() => now + 60001);

    const isValid = service.verifyMessage(signedMessage);
    expect(isValid).toBe(false);
  });

  it('should accept message at start of validity period', () => {
    const signedMessage = service.signMessage(testMessage);
    const isValid = service.verifyMessage(signedMessage);

    expect(isValid).toBe(true);
  });

  it('should accept message very close to current time', () => {
    const now = Date.now();
    jest.spyOn(global.Date, 'now').mockImplementation(() => now);

    const signedMessage = service.signMessage(testMessage);

    // Set time to very close to signing time (1ms difference)
    jest.spyOn(global.Date, 'now').mockImplementation(() => now + 1);

    const isValid = service.verifyMessage(signedMessage);
    expect(isValid).toBe(true);
  });

  it('should reject message signed in the future', () => {
    const now = Date.now();
    jest.spyOn(global.Date, 'now').mockImplementation(() => now);

    const signedMessage = service.signMessage(testMessage);

    // Tamper with payload to set future timestamp
    const payloadObj = JSON.parse(signedMessage.payload);
    payloadObj.timestamp = now + 60000; // 1 minute in the future
    signedMessage.payload = JSON.stringify(payloadObj);

    const isValid = service.verifyMessage(signedMessage);
    expect(isValid).toBe(false);
  });

  it('should reject message with far future timestamp', () => {
    const now = Date.now();
    jest.spyOn(global.Date, 'now').mockImplementation(() => now);

    const signedMessage = service.signMessage(testMessage);

    // Tamper with payload to set far future timestamp
    const payloadObj = JSON.parse(signedMessage.payload);
    payloadObj.timestamp = now + 365 * 24 * 60 * 60 * 1000; // 1 year in the future
    signedMessage.payload = JSON.stringify(payloadObj);

    const isValid = service.verifyMessage(signedMessage);
    expect(isValid).toBe(false);
  });

  it('should reject very old message', () => {
    const now = Date.now();
    jest.spyOn(global.Date, 'now').mockImplementation(() => now);

    const signedMessage = service.signMessage(testMessage);

    // Tamper with payload to set very old timestamp
    const payloadObj = JSON.parse(signedMessage.payload);
    payloadObj.timestamp = now - (10 * 365 * 24 * 60 * 60 * 1000); // 10 years ago
    signedMessage.payload = JSON.stringify(payloadObj);

    const isValid = service.verifyMessage(signedMessage);
    expect(isValid).toBe(false);
  });

  it('should reject message with negative timestamp', () => {
    const signedMessage = service.signMessage(testMessage);

    // Tamper with payload to set negative timestamp
    const payloadObj = JSON.parse(signedMessage.payload);
    payloadObj.timestamp = -1000;
    signedMessage.payload = JSON.stringify(payloadObj);

    const isValid = service.verifyMessage(signedMessage);
    expect(isValid).toBe(false);
  });

  it('should reject message with zero timestamp', () => {
    const signedMessage = service.signMessage(testMessage);

    // Tamper with payload to set zero timestamp
    const payloadObj = JSON.parse(signedMessage.payload);
    payloadObj.timestamp = 0;
    signedMessage.payload = JSON.stringify(payloadObj);

    const isValid = service.verifyMessage(signedMessage);
    expect(isValid).toBe(false);
  });

  it('should work with custom expiration time of 1 second', () => {
    service.setExpirationTime(1000); // 1 second

    const now = Date.now();
    jest.spyOn(global.Date, 'now').mockImplementation(() => now);

    const signedMessage = service.signMessage(testMessage);

    // Test at 0.5 seconds (should pass)
    jest.spyOn(global.Date, 'now').mockImplementation(() => now + 500);
    expect(service.verifyMessage(signedMessage)).toBe(true);

    // Test at 1.5 seconds (should fail)
    jest.spyOn(global.Date, 'now').mockImplementation(() => now + 1500);
    expect(service.verifyMessage(signedMessage)).toBe(false);
  });

  it('should work with custom expiration time of 1 hour', () => {
    service.setExpirationTime(60 * 60 * 1000); // 1 hour

    const now = Date.now();
    jest.spyOn(global.Date, 'now').mockImplementation(() => now);

    const signedMessage = service.signMessage(testMessage);

    // Test at 30 minutes (should pass)
    jest.spyOn(global.Date, 'now').mockImplementation(() => now + 30 * 60 * 1000);
    expect(service.verifyMessage(signedMessage)).toBe(true);

    // Test at 1.5 hours (should fail)
    jest.spyOn(global.Date, 'now').mockImplementation(() => now + 90 * 60 * 1000);
    expect(service.verifyMessage(signedMessage)).toBe(false);
  });

  it('should work with custom expiration time of 24 hours', () => {
    service.setExpirationTime(24 * 60 * 60 * 1000); // 24 hours

    const now = Date.now();
    jest.spyOn(global.Date, 'now').mockImplementation(() => now);

    const signedMessage = service.signMessage(testMessage);

    // Test at 12 hours (should pass)
    jest.spyOn(global.Date, 'now').mockImplementation(() => now + 12 * 60 * 60 * 1000);
    expect(service.verifyMessage(signedMessage)).toBe(true);

    // Test at 25 hours (should fail)
    jest.spyOn(global.Date, 'now').mockImplementation(() => now + 25 * 60 * 60 * 1000);
    expect(service.verifyMessage(signedMessage)).toBe(false);
  });

  it('should handle clock skew tolerance for slightly future timestamps', () => {
    const now = Date.now();
    jest.spyOn(global.Date, 'now').mockImplementation(() => now);

    const signedMessage = service.signMessage(testMessage);

    // Tamper with payload to set slightly future timestamp (within tolerance)
    const payloadObj = JSON.parse(signedMessage.payload);
    payloadObj.timestamp = now + 30 * 1000; // 30 seconds in the future
    signedMessage.payload = JSON.stringify(payloadObj);

    const isValid = service.verifyMessage(signedMessage);
    expect(isValid).toBe(true);
  });

  it('should reject future timestamp beyond clock skew tolerance', () => {
    const now = Date.now();
    jest.spyOn(global.Date, 'now').mockImplementation(() => now);

    const signedMessage = service.signMessage(testMessage);

    // Tamper with payload to set future timestamp beyond tolerance
    const payloadObj = JSON.parse(signedMessage.payload);
    payloadObj.timestamp = now + 120 * 1000; // 2 minutes in the future (beyond 1 min tolerance)
    signedMessage.payload = JSON.stringify(payloadObj);

    const isValid = service.verifyMessage(signedMessage);
    expect(isValid).toBe(false);
  });

  it('should properly handle timestamp at Unix epoch', () => {
    const signedMessage = service.signMessage(testMessage);

    // Tamper with payload to set timestamp to Unix epoch
    const payloadObj = JSON.parse(signedMessage.payload);
    payloadObj.timestamp = 0;
    signedMessage.payload = JSON.stringify(payloadObj);

    const isValid = service.verifyMessage(signedMessage);
    expect(isValid).toBe(false);
  });
});
```

## Verification Commands
```bash
# Run the expiration tests
npm test -- src/security/__tests__/MessageAuthenticationService.expiration.test.ts

# Run all security tests
npm test -- src/security/

# Check that TypeScript compiles without errors
npx tsc --noEmit src/security/__tests__/MessageAuthenticationService.expiration.test.ts
```

## Success Criteria
- [ ] All expiration boundary conditions handled correctly
- [ ] Future timestamp rejection works with proper tolerance
- [ ] Very old timestamp rejection works
- [ ] Custom expiration times work correctly
- [ ] Clock skew tolerance is properly implemented
- [ ] All edge cases handled
- [ ] All tests pass
- [ ] TypeScript compiles without errors

## Dependencies Confirmed
- MessageAuthenticationService implementation
- Jest testing framework
- TypeScript compiler

## Next Task
task_10e_test_key_management.md