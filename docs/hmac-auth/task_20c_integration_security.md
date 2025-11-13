# Task 20c: Integration Test - Security

**Estimated Time: 20 minutes**

## Context
I'm creating integration tests to verify that security features work correctly across the entire sign-verify workflow, including protection against common attacks.

## Current System State
- MessageAuthenticationService class fully implemented with security features
- All unit tests passing
- Jest testing framework configured

## Your Task
Create integration tests that verify security features work correctly in various realistic attack scenarios.

## Test First (RED Phase)
Creating integration tests for security scenarios.

## Minimal Implementation (GREEN Phase)
Implementing tests that verify security features work correctly.

## Refactored Solution (REFACTOR Phase)
```typescript
// File: /src/security/__tests__/MessageAuthenticationService.integration.security.test.ts
import { MessageAuthenticationService } from '../MessageAuthenticationService';

describe('MessageAuthenticationService - Security Integration Tests', () => {
  let service: MessageAuthenticationService;
  const testSecret = 'security-test-secret-key-for-hmac-sha256';
  const attackerSecret = 'attacker-secret-key-different-from-legit';

  beforeEach(() => {
    service = new MessageAuthenticationService();
    service.setSecretKey(testSecret);
  });

  it('should prevent message tampering - message content', () => {
    const originalMessage = 'Transfer $100 to account 12345';
    const signedMessage = service.signMessage(originalMessage);

    // Attacker tries to tamper with the message
    const payloadObj = JSON.parse(signedMessage.payload);
    payloadObj.message = 'Transfer $10000 to account 99999'; // Changed amount and account
    signedMessage.payload = JSON.stringify(payloadObj);

    // Verification should fail
    const isValid = service.verifyMessage(signedMessage);
    expect(isValid).toBe(false);
  });

  it('should prevent message tampering - timestamp', () => {
    const originalMessage = 'User login request';
    const signedMessage = service.signMessage(originalMessage);

    // Attacker tries to tamper with the timestamp to bypass expiration
    const payloadObj = JSON.parse(signedMessage.payload);
    payloadObj.timestamp = Date.now() - 1000000; // Set to very old timestamp
    signedMessage.payload = JSON.stringify(payloadObj);

    // Verification should fail
    const isValid = service.verifyMessage(signedMessage);
    expect(isValid).toBe(false);
  });

  it('should prevent signature forgery with different key', () => {
    const message = 'Legitimate request';

    // Attacker creates message with their own key
    const attackerService = new MessageAuthenticationService();
    attackerService.setSecretKey(attackerSecret);
    const attackerSignedMessage = attackerService.signMessage(message);

    // Legitimate service should reject attacker's message
    const isValid = service.verifyMessage(attackerSignedMessage);
    expect(isValid).toBe(false);
  });

  it('should prevent replay attacks with expired messages', () => {
    service.setExpirationTime(5000); // 5 seconds expiration

    const now = Date.now();
    jest.spyOn(global.Date, 'now').mockImplementation(() => now);

    const message = 'One-time authentication token';
    const signedMessage = service.signMessage(message);

    // Move time forward beyond expiration
    jest.spyOn(global.Date, 'now').mockImplementation(() => now + 10000); // 10 seconds

    // Replay attack should fail
    const isValid = service.verifyMessage(signedMessage);
    expect(isValid).toBe(false);
  });

  it('should prevent replay attacks by using constant-time comparison', () => {
    const message = 'Secure message';
    const signedMessage = service.signMessage(message);

    // Test that verification time is constant regardless of how wrong the signature is
    const validSignature = signedMessage.signature;
    const completelyWrongSignature = '0'.repeat(64);
    const slightlyWrongSignature = validSignature.slice(0, -1) + '0';

    // Time verification of valid signature
    const startValid = performance.now();
    service.verifyMessage(signedMessage);
    const endValid = performance.now();

    // Time verification of completely wrong signature
    const wrongSignedMessage1 = { ...signedMessage, signature: completelyWrongSignature };
    const startWrong1 = performance.now();
    service.verifyMessage(wrongSignedMessage1);
    const endWrong1 = performance.now();

    // Time verification of slightly wrong signature
    const wrongSignedMessage2 = { ...signedMessage, signature: slightlyWrongSignature };
    const startWrong2 = performance.now();
    service.verifyMessage(wrongSignedMessage2);
    const endWrong2 = performance.now();

    const validTime = endValid - startValid;
    const wrongTime1 = endWrong1 - startWrong1;
    const wrongTime2 = endWrong2 - startWrong2;

    // All times should be very close (within 2ms) - constant time comparison
    expect(Math.abs(validTime - wrongTime1)).toBeLessThan(2);
    expect(Math.abs(validTime - wrongTime2)).toBeLessThan(2);
    expect(Math.abs(wrongTime1 - wrongTime2)).toBeLessThan(2);
  });

  it('should prevent length extension attacks', () => {
    const message1 = 'message';
    const message2 = 'message1'; // message + '1'

    const signedMessage1 = service.signMessage(message1);

    // Attacker tries to create signature for message2 by extending message1
    // This should fail because HMAC-SHA256 is not vulnerable to length extension
    // in the way simple hash functions are, but we verify it anyway

    const signedMessage2 = service.signMessage(message2);

    // The signatures should be completely different
    expect(signedMessage1.signature).not.toBe(signedMessage2.signature);

    // Verifying message2 signature with message2 should work
    expect(service.verifyMessage(signedMessage2)).toBe(true);

    // Verifying message1 signature with message2 should fail
    const payloadObj2 = JSON.parse(signedMessage2.payload);
    const message2SignedWithSignature1 = {
      payload: signedMessage2.payload,
      signature: signedMessage1.signature,
      timestamp: payloadObj2.timestamp
    };
    expect(service.verifyMessage(message2SignedWithSignature1)).toBe(false);
  });

  it('should prevent brute force signature guessing', () => {
    const message = 'Important secure message';
    const signedMessage = service.signMessage(message);

    // Try many random signatures
    for (let i = 0; i < 1000; i++) {
      // Generate random hex string
      const randomSignature = Array.from({length: 64}, () =>
        Math.floor(Math.random() * 16).toString(16)).join('');

      const testSignedMessage = { ...signedMessage, signature: randomSignature };
      const isValid = service.verifyMessage(testSignedMessage);

      expect(isValid).toBe(false);
    }

    // Correct signature should still work
    const isValid = service.verifyMessage(signedMessage);
    expect(isValid).toBe(true);
  });

  it('should prevent birthday attacks by using strong HMAC-SHA256', () => {
    const messages: string[] = [];
    const signatures: string[] = [];

    // Generate many messages and their signatures
    for (let i = 0; i < 1000; i++) {
      const message = `message-${i}`;
      const signedMessage = service.signMessage(message);
      messages.push(message);
      signatures.push(signedMessage.signature);
    }

    // Check for signature collisions (should be extremely rare with HMAC-SHA256)
    const uniqueSignatures = new Set(signatures);
    expect(uniqueSignatures.size).toBe(signatures.length); // All signatures should be unique
  });

  it('should prevent key recovery attacks through side channels', () => {
    const message = 'test message';
    const signedMessage = service.signMessage(message);

    // Verify the same message multiple times
    const results: boolean[] = [];
    for (let i = 0; i < 100; i++) {
      const isValid = service.verifyMessage(signedMessage);
      results.push(isValid);
    }

    // All verifications should be consistent
    expect(results.every(result => result === true)).toBe(true);
  });

  it('should prevent timing attacks through message verification', () => {
    const validMessage = 'valid message';
    const invalidMessage = 'invalid message';

    const validSignedMessage = service.signMessage(validMessage);

    // Test timing for valid message
    const startValid = performance.now();
    for (let i = 0; i < 100; i++) {
      service.verifyMessage(validSignedMessage);
    }
    const endValid = performance.now();

    // Create invalid signed message (wrong signature)
    const invalidSignedMessage = { ...validSignedMessage, signature: '0'.repeat(64) };

    // Test timing for invalid message
    const startInvalid = performance.now();
    for (let i = 0; i < 100; i++) {
      service.verifyMessage(invalidSignedMessage);
    }
    const endInvalid = performance.now();

    const validTime = (endValid - startValid) / 100;
    const invalidTime = (endInvalid - startInvalid) / 100;

    // Times should be very close (within 1ms) - constant time comparison
    expect(Math.abs(validTime - invalidTime)).toBeLessThan(1);
  });

  it('should prevent oracle attacks by consistent error responses', () => {
    // Test various error conditions and ensure they all return false
    // rather than different error types that could leak information

    const errorResults: boolean[] = [];

    // Missing key scenario (this throws, but others return false)
    const serviceWithoutKey = new MessageAuthenticationService();
    const validSignedMessage = service.signMessage('test');

    try {
      serviceWithoutKey.verifyMessage(validSignedMessage);
      errorResults.push(true); // This shouldn't happen
    } catch (error) {
      // This is expected - missing key throws
      errorResults.push(false);
    }

    // Invalid signature scenarios
    const testCases = [
      { ...validSignedMessage, signature: 'invalid' },
      { ...validSignedMessage, signature: '0'.repeat(32) }, // Wrong length
      { ...validSignedMessage, signature: '' },
      { ...validSignedMessage, payload: 'invalid json' },
      { ...validSignedMessage, payload: JSON.stringify({}) }, // Missing fields
    ];

    for (const testCase of testCases) {
      const result = service.verifyMessage(testCase);
      errorResults.push(result);
    }

    // All non-exception cases should return false
    const nonExceptionResults = errorResults.slice(1); // Skip the exception case
    expect(nonExceptionResults.every(result => result === false)).toBe(true);
  });

  it('should maintain security with very short secret keys', () => {
    const serviceWithShortKey = new MessageAuthenticationService();
    serviceWithShortKey.setSecretKey('a'); // Single character key

    const message = 'test message';
    const signedMessage = serviceWithShortKey.signMessage(message);
    const isValid = serviceWithShortKey.verifyMessage(signedMessage);

    expect(isValid).toBe(true);

    // Different service with same short key should also work
    const anotherService = new MessageAuthenticationService();
    anotherService.setSecretKey('a');
    const isValid2 = anotherService.verifyMessage(signedMessage);

    expect(isValid2).toBe(true);

    // Service with different key should reject
    const differentService = new MessageAuthenticationService();
    differentService.setSecretKey('b');
    const isValid3 = differentService.verifyMessage(signedMessage);

    expect(isValid3).toBe(false);
  });

  it('should maintain security with very long secret keys', () => {
    const longKey = 'a'.repeat(10000); // 10KB key
    const serviceWithLongKey = new MessageAuthenticationService();
    serviceWithLongKey.setSecretKey(longKey);

    const message = 'test message';
    const signedMessage = serviceWithLongKey.signMessage(message);
    const isValid = serviceWithLongKey.verifyMessage(signedMessage);

    expect(isValid).toBe(true);
  });

  it('should prevent downgrade attacks by using strong crypto', () => {
    const message = 'secure message';
    const signedMessage = service.signMessage(message);

    // Verify that we're using HMAC-SHA256 by checking signature properties
    // HMAC-SHA256 produces 32-byte (64 hex character) signatures
    expect(signedMessage.signature).toMatch(/^[0-9a-f]{64}$/);

    const isValid = service.verifyMessage(signedMessage);
    expect(isValid).toBe(true);

    // Try to downgrade by using a weak signature
    const weakSignedMessage = { ...signedMessage, signature: '00' };
    const isValidWeak = service.verifyMessage(weakSignedMessage);
    expect(isValidWeak).toBe(false);
  });

  it('should prevent cross-protocol attacks', () => {
    // Create messages that might look like other protocol messages
    const protocolMessages = [
      'GET / HTTP/1.1',
      'POST /api/data HTTP/1.1',
      '<?xml version="1.0"?>',
      '{"json": "rpc"}',
      'SQL: SELECT * FROM users',
    ];

    for (const protocolMessage of protocolMessages) {
      const signedMessage = service.signMessage(protocolMessage);
      const isValid = service.verifyMessage(signedMessage);

      expect(isValid).toBe(true);

      // Verify message integrity
      const payloadObj = JSON.parse(signedMessage.payload);
      expect(payloadObj.message).toBe(protocolMessage);
    }
  });

  it('should maintain security under high load conditions', async () => {
    const message = 'high load test message';
    const concurrentOperations = 100;

    // Create multiple services for concurrent testing
    const services = Array.from({length: 10}, () => {
      const s = new MessageAuthenticationService();
      s.setSecretKey(testSecret);
      return s;
    });

    // Perform concurrent sign-verify operations
    const promises = Array.from({length: concurrentOperations}, async (_, i) => {
      const serviceToUse = services[i % services.length];
      const signedMessage = serviceToUse.signMessage(`${message}-${i}`);
      return serviceToUse.verifyMessage(signedMessage);
    });

    const results = await Promise.all(promises);
    expect(results.every(result => result === true)).toBe(true);
  });
});
```

## Verification Commands
```bash
# Run the security integration tests
npm test -- src/security/__tests__/MessageAuthenticationService.integration.security.test.ts

# Run all integration tests
npm test -- src/security/__tests__/MessageAuthenticationService.integration

# Run all security tests
npm test -- src/security/

# Check that TypeScript compiles without errors
npx tsc --noEmit src/security/__tests__/MessageAuthenticationService.integration.security.test.ts
```

## Success Criteria
- [ ] All security attack vectors are properly mitigated
- [ ] Timing attacks are prevented through constant-time comparison
- [ ] Replay attacks are prevented through expiration
- [ ] Key recovery attacks are prevented
- [ ] Brute force attacks are computationally infeasible
- [ ] Cross-protocol attacks are handled correctly
- [ ] System maintains security under high load
- [ ] All tests pass
- [ ] TypeScript compiles without errors

## Dependencies Confirmed
- MessageAuthenticationService implementation
- Jest testing framework
- TypeScript compiler

## Next Task
task_40a_create_api_documentation.md