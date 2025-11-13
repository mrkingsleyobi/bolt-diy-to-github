# Task 20a: Integration Test - Sign/Verify Cycle

**Estimated Time: 15 minutes**

## Context
I'm creating integration tests to verify the complete sign-verify cycle works correctly in realistic scenarios.

## Current System State
- MessageAuthenticationService class fully implemented
- All unit tests passing
- Jest testing framework configured

## Your Task
Create integration tests that verify the complete workflow of signing a message and then verifying it works correctly in various scenarios.

## Test First (RED Phase)
Creating integration tests for the complete sign-verify cycle.

## Minimal Implementation (GREEN Phase)
Implementing tests that verify the integration works correctly.

## Refactored Solution (REFACTOR Phase)
```typescript
// File: /src/security/__tests__/MessageAuthenticationService.integration.sign-verify.test.ts
import { MessageAuthenticationService } from '../MessageAuthenticationService';
import { SignedMessage } from '../MessageAuthenticationService.types';

describe('MessageAuthenticationService - Sign/Verify Integration Tests', () => {
  let service: MessageAuthenticationService;
  const testSecret = 'integration-test-secret-key-12345';

  beforeEach(() => {
    service = new MessageAuthenticationService();
    service.setSecretKey(testSecret);
  });

  it('should complete full sign-verify cycle with simple message', () => {
    const message = 'Hello, World!';

    // Sign the message
    const signedMessage = service.signMessage(message);

    // Verify the signed message
    const isValid = service.verifyMessage(signedMessage);

    expect(isValid).toBe(true);
  });

  it('should complete full sign-verify cycle with complex JSON message', () => {
    const message = JSON.stringify({
      action: 'update',
      resource: 'user-profile',
      data: {
        id: 12345,
        name: 'John Doe',
        email: 'john.doe@example.com',
        preferences: {
          theme: 'dark',
          notifications: true
        }
      },
      timestamp: Date.now()
    });

    // Sign the message
    const signedMessage = service.signMessage(message);

    // Verify the signed message
    const isValid = service.verifyMessage(signedMessage);

    expect(isValid).toBe(true);
  });

  it('should complete full sign-verify cycle with empty message', () => {
    const message = '';

    // Sign the message
    const signedMessage = service.signMessage(message);

    // Verify the signed message
    const isValid = service.verifyMessage(signedMessage);

    expect(isValid).toBe(true);
  });

  it('should complete full sign-verify cycle with very large message', () => {
    const message = 'A'.repeat(100000); // 100KB message

    // Sign the message
    const signedMessage = service.signMessage(message);

    // Verify the signed message
    const isValid = service.verifyMessage(signedMessage);

    expect(isValid).toBe(true);
  });

  it('should fail verification when different service tries to verify', () => {
    const message = 'test message';

    // Sign with first service
    const signedMessage = service.signMessage(message);

    // Try to verify with different service (different key)
    const differentService = new MessageAuthenticationService();
    differentService.setSecretKey('different-secret-key');
    const isValid = differentService.verifyMessage(signedMessage);

    expect(isValid).toBe(false);
  });

  it('should handle multiple sign-verify cycles with same service', () => {
    const messages = [
      'First message',
      'Second message',
      'Third message',
      'Fourth message',
      'Fifth message'
    ];

    for (const message of messages) {
      // Sign the message
      const signedMessage = service.signMessage(message);

      // Verify the signed message
      const isValid = service.verifyMessage(signedMessage);

      expect(isValid).toBe(true);
    }
  });

  it('should handle multiple sign-verify cycles with different messages', () => {
    const testCases = [
      { message: 'Simple text', description: 'simple text message' },
      { message: '', description: 'empty message' },
      { message: JSON.stringify({ key: 'value' }), description: 'JSON message' },
      { message: 'Message with special chars: !@#$%^&*()', description: 'special characters' },
      { message: 'Unicode: 你好世界 🌍', description: 'unicode characters' }
    ];

    for (const testCase of testCases) {
      // Sign the message
      const signedMessage = service.signMessage(testCase.message);

      // Verify the signed message
      const isValid = service.verifyMessage(signedMessage);

      expect(isValid).toBe(true);
    }
  });

  it('should maintain message integrity through sign-verify cycle', () => {
    const originalMessage = 'Important message that must not be tampered with';

    // Sign the message
    const signedMessage = service.signMessage(originalMessage);

    // Verify the signed message
    const isValid = service.verifyMessage(signedMessage);

    // Extract message from payload and verify it matches original
    const payloadObj = JSON.parse(signedMessage.payload);
    const extractedMessage = payloadObj.message;

    expect(isValid).toBe(true);
    expect(extractedMessage).toBe(originalMessage);
  });

  it('should handle rapid sign-verify cycles', () => {
    const message = 'rapid test message';

    // Perform multiple rapid sign-verify cycles
    for (let i = 0; i < 10; i++) {
      // Sign the message
      const signedMessage = service.signMessage(message);

      // Verify the signed message
      const isValid = service.verifyMessage(signedMessage);

      expect(isValid).toBe(true);
    }
  });

  it('should handle sign-verify with custom expiration time', () => {
    // Set custom expiration time
    service.setExpirationTime(10000); // 10 seconds

    const message = 'test message with custom expiration';

    // Sign the message
    const signedMessage = service.signMessage(message);

    // Verify immediately (should pass)
    const isValidImmediate = service.verifyMessage(signedMessage);
    expect(isValidImmediate).toBe(true);

    // Mock time to just before expiration
    const payloadObj = JSON.parse(signedMessage.payload);
    const timestamp = payloadObj.timestamp;
    jest.spyOn(global.Date, 'now').mockImplementation(() => timestamp + 9999);

    const isValidBeforeExp = service.verifyMessage(signedMessage);
    expect(isValidBeforeExp).toBe(true);

    // Mock time to just after expiration
    jest.spyOn(global.Date, 'now').mockImplementation(() => timestamp + 10001);

    const isValidAfterExp = service.verifyMessage(signedMessage);
    expect(isValidAfterExp).toBe(false);
  });

  it('should handle sign-verify with different key lengths', () => {
    const testKeys = [
      'a',
      'ab',
      'a'.repeat(16),
      'a'.repeat(32),
      'a'.repeat(64),
      'a'.repeat(128)
    ];

    const message = 'test message';

    for (const key of testKeys) {
      // Create new service with different key
      const keyService = new MessageAuthenticationService();
      keyService.setSecretKey(key);

      // Sign the message
      const signedMessage = keyService.signMessage(message);

      // Verify the signed message
      const isValid = keyService.verifyMessage(signedMessage);

      expect(isValid).toBe(true);
    }
  });

  it('should handle sign-verify with key containing special patterns', () => {
    const specialKeys = [
      'key with spaces',
      'key\nwith\nnewlines',
      'key\twith\ttabs',
      'key\0with\0nulls',
      'key with unicode: 你好世界',
      'key with symbols: !@#$%^&*()_+-=[]{}|;:,.<>?'
    ];

    const message = 'test message';

    for (const key of specialKeys) {
      // Create new service with different key
      const keyService = new MessageAuthenticationService();
      keyService.setSecretKey(key);

      // Sign the message
      const signedMessage = keyService.signMessage(message);

      // Verify the signed message
      const isValid = keyService.verifyMessage(signedMessage);

      expect(isValid).toBe(true);
    }
  });

  it('should properly handle timestamp consistency in sign-verify cycle', () => {
    const message = 'timestamp test message';

    // Capture time before signing
    const beforeSign = Date.now();

    // Sign the message
    const signedMessage = service.signMessage(message);

    // Capture time after signing
    const afterSign = Date.now();

    // Verify the signed message
    const isValid = service.verifyMessage(signedMessage);

    // Extract timestamp from payload
    const payloadObj = JSON.parse(signedMessage.payload);
    const timestamp = payloadObj.timestamp;

    expect(isValid).toBe(true);
    expect(timestamp).toBeGreaterThanOrEqual(beforeSign);
    expect(timestamp).toBeLessThanOrEqual(afterSign);
  });

  it('should handle sign-verify cycle with message containing payload-like structure', () => {
    // Create a message that looks like our payload structure
    const message = JSON.stringify({
      message: 'This looks like the payload structure',
      timestamp: 1234567890,
      signature: 'fake-signature'
    });

    // Sign the message
    const signedMessage = service.signMessage(message);

    // Verify the signed message
    const isValid = service.verifyMessage(signedMessage);

    expect(isValid).toBe(true);

    // Verify the original message is preserved
    const payloadObj = JSON.parse(signedMessage.payload);
    expect(payloadObj.message).toBe(message);
  });

  it('should handle concurrent sign-verify operations', async () => {
    const messages = Array.from({length: 10}, (_, i) => `Concurrent message ${i}`);

    // Create multiple services with same key for concurrent testing
    const services = Array.from({length: 3}, () => {
      const s = new MessageAuthenticationService();
      s.setSecretKey(testSecret);
      return s;
    });

    // Perform concurrent operations
    const promises = messages.map(async (message, index) => {
      const serviceToUse = services[index % services.length];

      // Sign the message
      const signedMessage = serviceToUse.signMessage(message);

      // Verify the signed message
      const isValid = serviceToUse.verifyMessage(signedMessage);

      return { message, isValid, signedMessage };
    });

    const results = await Promise.all(promises);

    // Verify all operations succeeded
    for (const result of results) {
      expect(result.isValid).toBe(true);
      const payloadObj = JSON.parse(result.signedMessage.payload);
      expect(payloadObj.message).toBe(result.message);
    }
  });
});
```

## Verification Commands
```bash
# Run the sign-verify integration tests
npm test -- src/security/__tests__/MessageAuthenticationService.integration.sign-verify.test.ts

# Run all integration tests
npm test -- src/security/__tests__/MessageAuthenticationService.integration

# Run all security tests
npm test -- src/security/

# Check that TypeScript compiles without errors
npx tsc --noEmit src/security/__tests__/MessageAuthenticationService.integration.sign-verify.test.ts
```

## Success Criteria
- [ ] Complete sign-verify cycle works for all message types
- [ ] Message integrity is maintained
- [ ] Different services with different keys properly reject each other's messages
- [ ] Custom expiration times work in integration
- [ ] Concurrent operations work correctly
- [ ] Edge cases are handled properly
- [ ] All tests pass
- [ ] TypeScript compiles without errors

## Dependencies Confirmed
- MessageAuthenticationService implementation
- Jest testing framework
- TypeScript compiler

## Next Task
task_20b_integration_error_handling.md