# Task 10b: Test Verification Functionality

**Estimated Time: 15 minutes**

## Context
I'm creating comprehensive unit tests for the verifyMessage functionality to ensure it correctly validates signatures and handles various security scenarios.

## Current System State
- MessageAuthenticationService class with verifyMessage implemented
- Type definitions for SignedMessage and service interface in place
- Jest testing framework configured

## Your Task
Create comprehensive unit tests for the verifyMessage method covering:
1. Normal operation with valid signatures
2. Invalid signature detection
3. Expiration handling
4. Security considerations
5. Error conditions

## Test First (RED Phase)
All tests already exist from task_02. Now ensuring comprehensive coverage.

## Minimal Implementation (GREEN Phase)
Tests already pass from task_02 implementation.

## Refactored Solution (REFACTOR Phase)
```typescript
// File: /src/security/__tests__/MessageAuthenticationService.verify.comprehensive.test.ts
import { MessageAuthenticationService } from '../MessageAuthenticationService';

describe('MessageAuthenticationService.verifyMessage - Comprehensive Tests', () => {
  let service: MessageAuthenticationService;
  const testSecret = 'test-secret-key-for-hmac';
  const differentSecret = 'different-secret-key';

  beforeEach(() => {
    service = new MessageAuthenticationService();
    service.setSecretKey(testSecret);
  });

  // Valid signature tests
  it('should verify a valid signed message', () => {
    const message = 'Hello, World!';
    const signedMessage = service.signMessage(message);
    const isValid = service.verifyMessage(signedMessage);

    expect(isValid).toBe(true);
  });

  it('should verify a valid signed message with empty string', () => {
    const message = '';
    const signedMessage = service.signMessage(message);
    const isValid = service.verifyMessage(signedMessage);

    expect(isValid).toBe(true);
  });

  it('should verify a valid signed message with special characters', () => {
    const message = 'Hello! @#$%^&*()_+-={}[]|\\:";\'<>?,./`~';
    const signedMessage = service.signMessage(message);
    const isValid = service.verifyMessage(signedMessage);

    expect(isValid).toBe(true);
  });

  it('should verify a valid signed message with unicode characters', () => {
    const message = 'Hello, 世界! 🌍';
    const signedMessage = service.signMessage(message);
    const isValid = service.verifyMessage(signedMessage);

    expect(isValid).toBe(true);
  });

  // Invalid signature tests
  it('should reject a message with completely invalid signature', () => {
    const message = 'test message';
    const signedMessage = service.signMessage(message);
    signedMessage.signature = 'completely-invalid-signature';
    const isValid = service.verifyMessage(signedMessage);

    expect(isValid).toBe(false);
  });

  it('should reject a message with modified signature', () => {
    const message = 'test message';
    const signedMessage = service.signMessage(message);
    // Change one character in the signature
    signedMessage.signature = signedMessage.signature.substring(0, signedMessage.signature.length - 1) + '0';
    const isValid = service.verifyMessage(signedMessage);

    expect(isValid).toBe(false);
  });

  it('should reject a message with wrong length signature', () => {
    const message = 'test message';
    const signedMessage = service.signMessage(message);
    signedMessage.signature = 'abcd1234'; // Much shorter
    const isValid = service.verifyMessage(signedMessage);

    expect(isValid).toBe(false);
  });

  // Tampered payload tests
  it('should reject a message with tampered payload message', () => {
    const message = 'original message';
    const signedMessage = service.signMessage(message);

    const payloadObj = JSON.parse(signedMessage.payload);
    payloadObj.message = 'tampered message';
    signedMessage.payload = JSON.stringify(payloadObj);

    const isValid = service.verifyMessage(signedMessage);
    expect(isValid).toBe(false);
  });

  it('should reject a message with tampered payload timestamp', () => {
    const message = 'test message';
    const signedMessage = service.signMessage(message);

    const payloadObj = JSON.parse(signedMessage.payload);
    payloadObj.timestamp = payloadObj.timestamp + 1000; // Change timestamp
    signedMessage.payload = JSON.stringify(payloadObj);

    const isValid = service.verifyMessage(signedMessage);
    expect(isValid).toBe(false);
  });

  it('should reject a message with additional payload fields', () => {
    const message = 'test message';
    const signedMessage = service.signMessage(message);

    const payloadObj = JSON.parse(signedMessage.payload);
    payloadObj.extraField = 'tampered data';
    signedMessage.payload = JSON.stringify(payloadObj);

    const isValid = service.verifyMessage(signedMessage);
    expect(isValid).toBe(false);
  });

  // Expiration tests
  it('should reject an expired message', () => {
    // Set short expiration for testing
    service.setExpirationTime(1000); // 1 second

    const now = Date.now();
    jest.spyOn(global.Date, 'now').mockImplementation(() => now);

    const message = 'test message';
    const signedMessage = service.signMessage(message);

    // Advance time beyond expiration
    jest.spyOn(global.Date, 'now').mockImplementation(() => now + 2000);

    const isValid = service.verifyMessage(signedMessage);
    expect(isValid).toBe(false);
  });

  it('should accept a recent message within expiration window', () => {
    service.setExpirationTime(60000); // 1 minute

    const now = Date.now();
    jest.spyOn(global.Date, 'now').mockImplementation(() => now);

    const message = 'test message';
    const signedMessage = service.signMessage(message);

    // Advance time within expiration window
    jest.spyOn(global.Date, 'now').mockImplementation(() => now + 30000); // 30 seconds

    const isValid = service.verifyMessage(signedMessage);
    expect(isValid).toBe(true);
  });

  it('should reject a message with future timestamp', () => {
    const message = 'test message';
    const signedMessage = service.signMessage(message);

    const payloadObj = JSON.parse(signedMessage.payload);
    payloadObj.timestamp = Date.now() + 5 * 60 * 1000; // 5 minutes in the future
    signedMessage.payload = JSON.stringify(payloadObj);

    const isValid = service.verifyMessage(signedMessage);
    expect(isValid).toBe(false);
  });

  // Malformed data tests
  it('should reject a message with malformed JSON payload', () => {
    const signedMessage = {
      payload: 'invalid-json-{',
      signature: 'some-signature',
      timestamp: Date.now()
    };

    const isValid = service.verifyMessage(signedMessage as any);
    expect(isValid).toBe(false);
  });

  it('should reject a message with missing payload fields', () => {
    const signedMessage = {
      payload: JSON.stringify({ message: 'test' }), // Missing timestamp
      signature: 'some-signature',
      timestamp: Date.now()
    };

    const isValid = service.verifyMessage(signedMessage as any);
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

  // Cross-secret validation tests
  it('should reject a message signed with different secret key', () => {
    const message = 'test message';

    // Sign with different secret
    const differentService = new MessageAuthenticationService();
    differentService.setSecretKey(differentSecret);
    const signedMessage = differentService.signMessage(message);

    // Try to verify with original service
    const isValid = service.verifyMessage(signedMessage);
    expect(isValid).toBe(false);
  });

  // Error condition tests
  it('should throw error when secret key is not set', () => {
    const serviceWithoutKey = new MessageAuthenticationService();
    const message = 'test message';
    const signedMessage = service.signMessage(message); // Using service with key

    expect(() => {
      serviceWithoutKey.verifyMessage(signedMessage);
    }).toThrow('Secret key not set');
  });

  // Security tests
  it('should use constant-time comparison to prevent timing attacks', () => {
    const message = 'test message';
    const signedMessage = service.signMessage(message);

    // This is a bit tricky to test directly, but we can at least verify
    // that valid and invalid signatures of same length take similar time
    const startValid = performance.now();
    service.verifyMessage(signedMessage);
    const endValid = performance.now();

    const invalidMessage = { ...signedMessage, signature: '0'.repeat(64) };
    const startInvalid = performance.now();
    service.verifyMessage(invalidMessage);
    const endInvalid = performance.now();

    const validTime = endValid - startValid;
    const invalidTime = endInvalid - startInvalid;

    // Times should be close (within 5ms) - this is a basic check
    expect(Math.abs(validTime - invalidTime)).toBeLessThan(5);
  });

  // Boundary condition tests
  it('should handle very large messages', () => {
    const largeMessage = 'A'.repeat(10000); // 10KB message
    const signedMessage = service.signMessage(largeMessage);
    const isValid = service.verifyMessage(signedMessage);

    expect(isValid).toBe(true);
  });

  it('should handle messages with null bytes', () => {
    const message = 'message with \0 null byte';
    const signedMessage = service.signMessage(message);
    const isValid = service.verifyMessage(signedMessage);

    expect(isValid).toBe(true);
  });
});
```

## Verification Commands
```bash
# Run the comprehensive verification tests
npm test -- src/security/__tests__/MessageAuthenticationService.verify.comprehensive.test.ts

# Run all verification tests
npm test -- src/security/__tests__/MessageAuthenticationService.verify

# Run all security tests
npm test -- src/security/

# Check that TypeScript compiles without errors
npx tsc --noEmit src/security/__tests__/MessageAuthenticationService.verify.comprehensive.test.ts
```

## Success Criteria
- [ ] All valid signature tests pass
- [ ] All invalid signature tests pass
- [ ] All tampering detection tests pass
- [ ] All expiration handling tests pass
- [ ] All malformed data tests pass
- [ ] All error condition tests pass
- [ ] Security considerations are tested
- [ ] Boundary conditions are handled
- [ ] Test coverage is comprehensive
- [ ] TypeScript compiles without errors

## Dependencies Confirmed
- MessageAuthenticationService implementation
- Jest testing framework
- TypeScript compiler

## Next Task
task_10c_test_invalid_signatures.md