# Task 20b: Integration Test - Error Handling

**Estimated Time: 15 minutes**

## Context
I'm creating integration tests to verify that error handling works correctly across the entire sign-verify workflow.

## Current System State
- MessageAuthenticationService class fully implemented
- All unit tests passing
- Jest testing framework configured

## Your Task
Create integration tests that verify error handling works correctly in various realistic scenarios.

## Test First (RED Phase)
Creating integration tests for error handling scenarios.

## Minimal Implementation (GREEN Phase)
Implementing tests that verify error handling works correctly.

## Refactored Solution (REFACTOR Phase)
```typescript
// File: /src/security/__tests__/MessageAuthenticationService.integration.error-handling.test.ts
import { MessageAuthenticationService } from '../MessageAuthenticationService';

describe('MessageAuthenticationService - Error Handling Integration Tests', () => {
  let service: MessageAuthenticationService;
  const testSecret = 'error-handling-test-secret-key';

  beforeEach(() => {
    service = new MessageAuthenticationService();
    service.setSecretKey(testSecret);
  });

  it('should handle missing secret key error in signing', () => {
    const serviceWithoutKey = new MessageAuthenticationService();

    expect(() => {
      serviceWithoutKey.signMessage('test message');
    }).toThrow('Secret key not set');
  });

  it('should handle missing secret key error in verification', () => {
    const serviceWithoutKey = new MessageAuthenticationService();
    const signedMessage = service.signMessage('test message');

    expect(() => {
      serviceWithoutKey.verifyMessage(signedMessage);
    }).toThrow('Secret key not set');
  });

  it('should gracefully handle malformed signed message objects', () => {
    // Various malformed message objects
    const malformedMessages: any[] = [
      null,
      undefined,
      {},
      { payload: 'test' }, // missing signature and timestamp
      { signature: 'test' }, // missing payload and timestamp
      { timestamp: 1234567890 }, // missing payload and signature
      { payload: null, signature: 'test', timestamp: 1234567890 },
      { payload: 'test', signature: null, timestamp: 1234567890 },
      { payload: 'test', signature: 'test', timestamp: null },
      { payload: '', signature: '', timestamp: 0 },
      { payload: 123, signature: 'test', timestamp: 1234567890 }, // payload not string
      { payload: 'test', signature: 123, timestamp: 1234567890 }, // signature not string
      { payload: 'test', signature: 'test', timestamp: 'not-a-number' }, // timestamp not number
    ];

    for (const malformedMessage of malformedMessages) {
      const isValid = service.verifyMessage(malformedMessage);
      expect(isValid).toBe(false);
    }
  });

  it('should gracefully handle completely invalid input to verifyMessage', () => {
    const invalidInputs: any[] = [
      null,
      undefined,
      'not-an-object',
      123,
      [],
      true,
      false,
      () => {},
      Symbol('test')
    ];

    for (const invalidInput of invalidInputs) {
      const isValid = service.verifyMessage(invalidInput);
      expect(isValid).toBe(false);
    }
  });

  it('should handle key validation errors during verification', () => {
    // Create a valid signed message
    const signedMessage = service.signMessage('test message');

    // Create service without key and try to verify
    const serviceWithoutKey = new MessageAuthenticationService();

    expect(() => {
      serviceWithoutKey.verifyMessage(signedMessage);
    }).toThrow('Secret key not set');
  });

  it('should handle key validation errors with empty key during verification', () => {
    // This is a bit contrived since setSecretKey validates, but testing edge case
    const signedMessage = service.signMessage('test message');

    // Manually set empty key (bypassing validation)
    (service as any).secretKey = '';

    // Verification should fail gracefully
    const isValid = service.verifyMessage(signedMessage);
    expect(isValid).toBe(false);
  });

  it('should handle JSON parsing errors in payload gracefully', () => {
    const signedMessage = service.signMessage('test message');

    // Tamper with payload to make it invalid JSON
    signedMessage.payload = 'invalid-json-{';

    const isValid = service.verifyMessage(signedMessage);
    expect(isValid).toBe(false);
  });

  it('should handle missing fields in parsed payload gracefully', () => {
    const signedMessage = service.signMessage('test message');

    // Tamper with payload to remove fields
    const tamperedPayloads = [
      '{}', // empty object
      JSON.stringify({ message: 'test' }), // missing timestamp
      JSON.stringify({ timestamp: 1234567890 }), // missing message
      JSON.stringify({ extra: 'field' }), // missing required fields
    ];

    for (const tamperedPayload of tamperedPayloads) {
      signedMessage.payload = tamperedPayload;
      const isValid = service.verifyMessage(signedMessage);
      expect(isValid).toBe(false);
    }
  });

  it('should handle wrong data types in parsed payload gracefully', () => {
    const signedMessage = service.signMessage('test message');

    // Tamper with payload to have wrong data types
    const tamperedPayloads = [
      JSON.stringify({ message: 123, timestamp: 'not-a-number' }), // wrong types
      JSON.stringify({ message: null, timestamp: null }), // null values
      JSON.stringify({ message: [], timestamp: {} }), // array/object instead of primitives
    ];

    for (const tamperedPayload of tamperedPayloads) {
      signedMessage.payload = tamperedPayload;
      const isValid = service.verifyMessage(signedMessage);
      expect(isValid).toBe(false);
    }
  });

  it('should handle extremely large payload gracefully', () => {
    const signedMessage = service.signMessage('test message');

    // Create extremely large payload
    signedMessage.payload = 'A'.repeat(1000000); // 1MB payload

    const isValid = service.verifyMessage(signedMessage);
    expect(isValid).toBe(false);
  });

  it('should handle extremely long signature gracefully', () => {
    const signedMessage = service.signMessage('test message');

    // Create extremely long signature
    signedMessage.signature = 'A'.repeat(100000); // 100KB signature

    const isValid = service.verifyMessage(signedMessage);
    expect(isValid).toBe(false);
  });

  it('should handle signature with non-hex characters gracefully', () => {
    const signedMessage = service.signMessage('test message');

    // Replace signature with non-hex characters
    signedMessage.signature = 'g'.repeat(64); // 'g' is not a valid hex character

    const isValid = service.verifyMessage(signedMessage);
    expect(isValid).toBe(false);
  });

  it('should handle concurrent error scenarios gracefully', async () => {
    // Test multiple services with missing keys
    const servicesWithoutKeys = Array.from({length: 5}, () => new MessageAuthenticationService());
    const validSignedMessage = service.signMessage('test message');

    // Try to verify with services that don't have keys
    const promises = servicesWithoutKeys.map(async (serviceWithoutKey) => {
      try {
        serviceWithoutKey.verifyMessage(validSignedMessage);
        return 'should-have-thrown';
      } catch (error) {
        return 'threw-correctly';
      }
    });

    const results = await Promise.all(promises);
    expect(results).toEqual(Array(results.length).fill('threw-correctly'));
  });

  it('should handle rapid error conditions without state corruption', () => {
    // Rapidly try to sign without key
    for (let i = 0; i < 100; i++) {
      const serviceWithoutKey = new MessageAuthenticationService();
      expect(() => {
        serviceWithoutKey.signMessage(`test message ${i}`);
      }).toThrow('Secret key not set');
    }

    // After many errors, normal service should still work
    const message = 'message after errors';
    const signedMessage = service.signMessage(message);
    const isValid = service.verifyMessage(signedMessage);

    expect(isValid).toBe(true);
  });

  it('should handle error recovery - set key after errors', () => {
    const serviceWithoutKey = new MessageAuthenticationService();

    // Try to sign without key (should fail)
    expect(() => {
      serviceWithoutKey.signMessage('test message');
    }).toThrow('Secret key not set');

    // Set key and try again (should work)
    serviceWithoutKey.setSecretKey('new-key');
    expect(() => {
      const signedMessage = serviceWithoutKey.signMessage('test message');
      const isValid = serviceWithoutKey.verifyMessage(signedMessage);
      expect(isValid).toBe(true);
    }).not.toThrow();
  });

  it('should handle timestamp validation errors gracefully', () => {
    const signedMessage = service.signMessage('test message');

    // Test various invalid timestamp scenarios
    const invalidTimestamps = [
      NaN,
      Infinity,
      -Infinity,
      Number.MAX_SAFE_INTEGER,
      Number.MIN_SAFE_INTEGER,
    ];

    for (const invalidTimestamp of invalidTimestamps) {
      const payloadObj = JSON.parse(signedMessage.payload);
      payloadObj.timestamp = invalidTimestamp;
      signedMessage.payload = JSON.stringify(payloadObj);

      const isValid = service.verifyMessage(signedMessage);
      expect(isValid).toBe(false);
    }
  });

  it('should handle edge case payloads that might cause JSON parsing issues', () => {
    const signedMessage = service.signMessage('test message');

    // Test edge case payloads
    const edgeCasePayloads = [
      '{"message":"test", "timestamp": 123}  ', // trailing whitespace
      '  {"message":"test", "timestamp": 123}', // leading whitespace
      '{"message":"test", "timestamp": 123}\n', // trailing newline
      '\r\n{"message":"test", "timestamp": 123}\r\n', // leading/trailing newlines
      '{"message":"\\"quoted\\" test", "timestamp": 123}', // escaped quotes
      '{"message":"test\\\\test", "timestamp": 123}', // escaped backslashes
    ];

    for (const edgeCasePayload of edgeCasePayloads) {
      signedMessage.payload = edgeCasePayload;
      // These should work since they're valid JSON
      expect(() => {
        JSON.parse(edgeCasePayload);
      }).not.toThrow(); // Verify they are actually valid JSON

      // But verification should still fail because signature won't match
      const isValid = service.verifyMessage(signedMessage);
      expect(isValid).toBe(false);
    }
  });

  it('should handle service re-initialization after errors', () => {
    // Create service and use it successfully
    let testService = new MessageAuthenticationService();
    testService.setSecretKey('test-key');
    const signedMessage = testService.signMessage('test');
    expect(testService.verifyMessage(signedMessage)).toBe(true);

    // Re-initialize service (simulate new instance)
    testService = new MessageAuthenticationService();
    testService.setSecretKey('test-key');

    // Should work with new instance
    const newSignedMessage = testService.signMessage('test');
    expect(testService.verifyMessage(newSignedMessage)).toBe(true);
  });
});
```

## Verification Commands
```bash
# Run the error handling integration tests
npm test -- src/security/__tests__/MessageAuthenticationService.integration.error-handling.test.ts

# Run all integration tests
npm test -- src/security/__tests__/MessageAuthenticationService.integration

# Run all security tests
npm test -- src/security/

# Check that TypeScript compiles without errors
npx tsc --noEmit src/security/__tests__/MessageAuthenticationService.integration.error-handling.test.ts
```

## Success Criteria
- [ ] All error conditions are handled gracefully
- [ ] No state corruption occurs during error handling
- [ ] Proper error messages are thrown for invalid operations
- [ ] Malformed inputs are rejected without crashing
- [ ] Recovery from error states works correctly
- [ ] Concurrent error scenarios are handled properly
- [ ] All tests pass
- [ ] TypeScript compiles without errors

## Dependencies Confirmed
- MessageAuthenticationService implementation
- Jest testing framework
- TypeScript compiler

## Next Task
task_20c_integration_security.md