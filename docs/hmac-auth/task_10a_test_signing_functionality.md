# Task 10a: Test Signing Functionality

**Estimated Time: 15 minutes**

## Context
I'm creating comprehensive unit tests for the signMessage functionality to ensure it works correctly under various conditions.

## Current System State
- MessageAuthenticationService class with signMessage implemented
- Type definitions for SignedMessage and service interface in place
- Jest testing framework configured

## Your Task
Create comprehensive unit tests for the signMessage method covering:
1. Normal operation with valid inputs
2. Error conditions
3. Edge cases
4. Security considerations

## Test First (RED Phase)
All tests already exist from task_01. Now ensuring comprehensive coverage.

## Minimal Implementation (GREEN Phase)
Tests already pass from task_01 implementation.

## Refactored Solution (REFACTOR Phase)
```typescript
// File: /src/security/__tests__/MessageAuthenticationService.sign.comprehensive.test.ts
import { MessageAuthenticationService } from '../MessageAuthenticationService';

describe('MessageAuthenticationService.signMessage - Comprehensive Tests', () => {
  let service: MessageAuthenticationService;
  const testSecret = 'test-secret-key-for-hmac';

  beforeEach(() => {
    service = new MessageAuthenticationService();
    service.setSecretKey(testSecret);
  });

  // Normal operation tests
  it('should create a valid signed message with string input', () => {
    const message = 'Hello, World!';
    const signedMessage = service.signMessage(message);

    expect(signedMessage.payload).toBeDefined();
    expect(signedMessage.signature).toBeDefined();
    expect(signedMessage.timestamp).toBeDefined();

    // Verify payload structure
    const payloadObj = JSON.parse(signedMessage.payload);
    expect(payloadObj.message).toBe(message);
    expect(typeof payloadObj.timestamp).toBe('number');
  });

  it('should create a valid signed message with empty string', () => {
    const message = '';
    const signedMessage = service.signMessage(message);

    const payloadObj = JSON.parse(signedMessage.payload);
    expect(payloadObj.message).toBe(message);
  });

  it('should create a valid signed message with special characters', () => {
    const message = 'Hello! @#$%^&*()_+-={}[]|\\:";\'<>?,./`~';
    const signedMessage = service.signMessage(message);

    const payloadObj = JSON.parse(signedMessage.payload);
    expect(payloadObj.message).toBe(message);
  });

  it('should create a valid signed message with unicode characters', () => {
    const message = 'Hello, 世界! 🌍';
    const signedMessage = service.signMessage(message);

    const payloadObj = JSON.parse(signedMessage.payload);
    expect(payloadObj.message).toBe(message);
  });

  it('should create a valid signed message with JSON string', () => {
    const message = '{"key": "value", "number": 42}';
    const signedMessage = service.signMessage(message);

    const payloadObj = JSON.parse(signedMessage.payload);
    expect(payloadObj.message).toBe(message);
  });

  // Error condition tests
  it('should throw error when secret key is not set', () => {
    const serviceWithoutKey = new MessageAuthenticationService();
    expect(() => {
      serviceWithoutKey.signMessage('test message');
    }).toThrow('Secret key not set');
  });

  it('should throw error when secret key is empty', () => {
    const serviceWithEmptyKey = new MessageAuthenticationService();
    serviceWithEmptyKey.setSecretKey('');
    // This should have been caught in setSecretKey, but let's test signMessage behavior
    expect(() => {
      serviceWithEmptyKey.signMessage('test message');
    }).toThrow(); // Should throw some error
  });

  // Consistency tests
  it('should produce consistent payload structure', () => {
    const message = 'test message';
    const signedMessage = service.signMessage(message);

    const payloadObj = JSON.parse(signedMessage.payload);
    expect(payloadObj).toHaveProperty('message');
    expect(payloadObj).toHaveProperty('timestamp');
    expect(Object.keys(payloadObj).length).toBe(2); // Only these two properties
  });

  it('should produce hex-encoded signatures', () => {
    const message = 'test message';
    const signedMessage = service.signMessage(message);

    // Should be a valid hex string
    expect(signedMessage.signature).toMatch(/^[0-9a-f]+$/);
    // HMAC-SHA256 produces 32 bytes = 64 hex characters
    expect(signedMessage.signature).toHaveLength(64);
  });

  it('should produce valid timestamps', () => {
    const before = Date.now();
    const signedMessage = service.signMessage('test');
    const after = Date.now();

    expect(signedMessage.timestamp).toBeGreaterThanOrEqual(before);
    expect(signedMessage.timestamp).toBeLessThanOrEqual(after);
  });

  // Security tests
  it('should produce different signatures for same message at different times', () => {
    const message = 'test message';
    const signedMessage1 = service.signMessage(message);

    // Advance time slightly
    jest.advanceTimersByTime(10);

    const signedMessage2 = service.signMessage(message);

    expect(signedMessage1.signature).not.toBe(signedMessage2.signature);
    expect(signedMessage1.payload).not.toBe(signedMessage2.payload);
  });

  it('should produce different signatures for different messages', () => {
    const message1 = 'message one';
    const message2 = 'message two';
    const signedMessage1 = service.signMessage(message1);
    const signedMessage2 = service.signMessage(message2);

    expect(signedMessage1.signature).not.toBe(signedMessage2.signature);
  });

  it('should produce different signatures with different secret keys', () => {
    const message = 'test message';
    const signedMessage1 = service.signMessage(message);

    const service2 = new MessageAuthenticationService();
    service2.setSecretKey('different-secret-key');
    const signedMessage2 = service2.signMessage(message);

    expect(signedMessage1.signature).not.toBe(signedMessage2.signature);
  });

  // Performance tests
  it('should sign messages quickly', () => {
    const message = 'test message';
    const start = performance.now();
    service.signMessage(message);
    const end = performance.now();

    // Should complete in less than 10ms
    expect(end - start).toBeLessThan(10);
  });
});
```

## Verification Commands
```bash
# Run the comprehensive signing tests
npm test -- src/security/__tests__/MessageAuthenticationService.sign.comprehensive.test.ts

# Run all signing tests
npm test -- src/security/__tests__/MessageAuthenticationService.sign

# Run all security tests
npm test -- src/security/

# Check that TypeScript compiles without errors
npx tsc --noEmit src/security/__tests__/MessageAuthenticationService.sign.comprehensive.test.ts
```

## Success Criteria
- [ ] All normal operation tests pass
- [ ] All error condition tests pass
- [ ] All edge case tests pass
- [ ] All security tests pass
- [ ] Performance is acceptable
- [ ] Test coverage is comprehensive
- [ ] TypeScript compiles without errors

## Dependencies Confirmed
- MessageAuthenticationService implementation
- Jest testing framework
- TypeScript compiler

## Next Task
task_10b_test_verification_functionality.md