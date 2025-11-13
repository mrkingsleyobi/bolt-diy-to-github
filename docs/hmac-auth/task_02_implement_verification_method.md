# Task 02: Implement Message Verification Method

**Estimated Time: 15 minutes**

## Context
I'm implementing the verifyMessage method in the MessageAuthenticationService class. This method will verify HMAC-SHA256 signatures to ensure message integrity and authenticity.

## Current System State
- MessageAuthenticationService class with signMessage implemented
- Type definitions for SignedMessage and service interface in place
- Node.js crypto module available
- Jest testing framework configured

## Your Task
Implement the verifyMessage method to:
1. Verify the HMAC-SHA256 signature of a signed message
2. Check that the message has not expired (replay attack protection)
3. Use constant-time comparison to prevent timing attacks

## Test First (RED Phase)
```typescript
// File: /src/security/__tests__/MessageAuthenticationService.verify.london.tdd.test.ts
import { MessageAuthenticationService } from '../MessageAuthenticationService';

describe('MessageAuthenticationService.verifyMessage', () => {
  let service: MessageAuthenticationService;
  const testSecret = 'test-secret-key-for-hmac';
  const testMessage = 'Hello, secure world!';

  beforeEach(() => {
    service = new MessageAuthenticationService();
    service.setSecretKey(testSecret);
  });

  it('should verify a valid signed message', () => {
    const signedMessage = service.signMessage(testMessage);
    const isValid = service.verifyMessage(signedMessage);

    expect(isValid).toBe(true);
  });

  it('should reject a message with an invalid signature', () => {
    const signedMessage = service.signMessage(testMessage);
    // Tamper with the signature
    signedMessage.signature = 'invalid-signature';
    const isValid = service.verifyMessage(signedMessage);

    expect(isValid).toBe(false);
  });

  it('should reject a message with a tampered payload', () => {
    const signedMessage = service.signMessage(testMessage);
    // Tamper with the payload
    const payloadObj = JSON.parse(signedMessage.payload);
    payloadObj.message = 'tampered message';
    signedMessage.payload = JSON.stringify(payloadObj);
    const isValid = service.verifyMessage(signedMessage);

    expect(isValid).toBe(false);
  });

  it('should reject an expired message', () => {
    // Mock Date.now to control timestamp
    const now = Date.now();
    jest.spyOn(global.Date, 'now').mockImplementation(() => now);

    const signedMessage = service.signMessage(testMessage);

    // Advance time beyond expiration (5 minutes + 1 second)
    jest.spyOn(global.Date, 'now').mockImplementation(() => now + (5 * 60 * 1000) + 1000);

    const isValid = service.verifyMessage(signedMessage);

    expect(isValid).toBe(false);
  });

  it('should accept a recent message that is not expired', () => {
    // Mock Date.now to control timestamp
    const now = Date.now();
    jest.spyOn(global.Date, 'now').mockImplementation(() => now);

    const signedMessage = service.signMessage(testMessage);

    // Advance time within expiration window (4 minutes)
    jest.spyOn(global.Date, 'now').mockImplementation(() => now + (4 * 60 * 1000));

    const isValid = service.verifyMessage(signedMessage);

    expect(isValid).toBe(true);
  });

  it('should reject a message if secret key is not set', () => {
    const serviceWithoutKey = new MessageAuthenticationService();
    const signedMessage = service.signMessage(testMessage);

    expect(() => {
      serviceWithoutKey.verifyMessage(signedMessage);
    }).toThrow('Secret key not set');
  });

  it('should reject a message with malformed payload', () => {
    const signedMessage = {
      payload: 'invalid-json',
      signature: 'some-signature',
      timestamp: Date.now()
    };

    const isValid = service.verifyMessage(signedMessage as any);

    expect(isValid).toBe(false);
  });
});
```

## Minimal Implementation (GREEN Phase)
```typescript
// File: /src/security/MessageAuthenticationService.ts (updating verifyMessage method)
verifyMessage(signedMessage: SignedMessage): boolean {
  if (!this.secretKey) {
    throw new Error('Secret key not set');
  }

  try {
    // Parse the payload
    const payloadObj = JSON.parse(signedMessage.payload);

    // Check expiration (5 minutes)
    const now = Date.now();
    if (now - payloadObj.timestamp > this.DEFAULT_EXPIRATION_MS) {
      return false;
    }

    // Generate expected signature
    const expectedSignature = crypto.createHmac('sha256', this.secretKey)
      .update(signedMessage.payload)
      .digest('hex');

    // Compare signatures (simple comparison for now)
    return expectedSignature === signedMessage.signature;
  } catch (error) {
    return false;
  }
}
```

## Refactored Solution (REFACTOR Phase)
```typescript
// File: /src/security/MessageAuthenticationService.ts (final verifyMessage method)
/**
 * Verifies a signed message
 * @param signedMessage - The signed message to verify
 * @returns boolean indicating if the signature is valid and not expired
 * @throws Error if secret key is not set
 */
verifyMessage(signedMessage: SignedMessage): boolean {
  if (!this.secretKey) {
    throw new Error('Secret key not set');
  }

  try {
    // Parse the payload
    const payloadObj = JSON.parse(signedMessage.payload);

    // Check expiration (5 minutes)
    const now = Date.now();
    if (now - payloadObj.timestamp > this.DEFAULT_EXPIRATION_MS) {
      return false;
    }

    // Generate expected signature
    const expectedSignature = crypto.createHmac('sha256', this.secretKey)
      .update(signedMessage.payload)
      .digest('hex');

    // Use constant-time comparison to prevent timing attacks
    return this.constantTimeCompare(expectedSignature, signedMessage.signature);
  } catch (error) {
    // Any parsing error or other exception means invalid message
    return false;
  }
}

/**
 * Compares two strings in constant time to prevent timing attacks
 * @param a - First string
 * @param b - Second string
 * @returns boolean indicating if strings are equal
 */
private constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}
```

## Verification Commands
```bash
# Run the specific verification tests
npm test -- src/security/__tests__/MessageAuthenticationService.verify.london.tdd.test.ts

# Run all security tests
npm test -- src/security/

# Check that TypeScript compiles without errors
npx tsc --noEmit src/security/MessageAuthenticationService.ts
```

## Success Criteria
- [ ] verifyMessage method correctly validates signatures
- [ ] Method rejects expired messages
- [ ] Method uses constant-time comparison for security
- [ ] Method handles malformed payloads gracefully
- [ ] Method throws error when secret key is not set
- [ ] All tests pass
- [ ] TypeScript compiles without errors
- [ ] Implementation follows security best practices

## Dependencies Confirmed
- Node.js crypto module (built-in)
- MessageAuthenticationService.types.ts for type definitions
- Jest for testing
- signMessage method already implemented

## Next Task
task_03_implement_key_management.md