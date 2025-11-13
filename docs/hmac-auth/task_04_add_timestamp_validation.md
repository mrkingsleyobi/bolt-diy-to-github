# Task 04: Add Timestamp Validation

**Estimated Time: 10 minutes**

## Context
I'm enhancing the MessageAuthenticationService class to add more robust timestamp validation with configurable expiration times and better error handling.

## Current System State
- MessageAuthenticationService class with signMessage, verifyMessage, and setSecretKey implemented
- Basic timestamp validation already in place in verifyMessage
- Type definitions for SignedMessage and service interface in place
- Node.js crypto module available
- Jest testing framework configured

## Your Task
Enhance timestamp validation to:
1. Make expiration time configurable
2. Add better error handling for timestamp validation
3. Provide more detailed validation feedback

## Test First (RED Phase)
```typescript
// File: /src/security/__tests__/MessageAuthenticationService.timestamp.london.tdd.test.ts
import { MessageAuthenticationService } from '../MessageAuthenticationService';

describe('MessageAuthenticationService timestamp validation', () => {
  let service: MessageAuthenticationService;
  const testSecret = 'test-secret-key-for-hmac';
  const testMessage = 'Hello, secure world!';

  beforeEach(() => {
    service = new MessageAuthenticationService();
    service.setSecretKey(testSecret);
  });

  it('should allow setting custom expiration time', () => {
    service.setExpirationTime(10 * 60 * 1000); // 10 minutes
    expect((service as any).DEFAULT_EXPIRATION_MS).toBe(10 * 60 * 1000);
  });

  it('should reject negative expiration times', () => {
    expect(() => {
      service.setExpirationTime(-1);
    }).toThrow('Expiration time must be positive');
  });

  it('should reject zero expiration time', () => {
    expect(() => {
      service.setExpirationTime(0);
    }).toThrow('Expiration time must be positive');
  });

  it('should properly validate timestamp format', () => {
    const signedMessage = service.signMessage(testMessage);

    // Test with valid timestamp
    expect(service.verifyMessage(signedMessage)).toBe(true);

    // Test with invalid timestamp in payload
    const invalidPayload = JSON.parse(signedMessage.payload);
    invalidPayload.timestamp = 'not-a-number';
    signedMessage.payload = JSON.stringify(invalidPayload);

    expect(service.verifyMessage(signedMessage)).toBe(false);
  });

  it('should handle very old timestamps gracefully', () => {
    const now = Date.now();
    jest.spyOn(global.Date, 'now').mockImplementation(() => now);

    const signedMessage = service.signMessage(testMessage);

    // Set timestamp to very old (1 year ago)
    const oldPayload = JSON.parse(signedMessage.payload);
    oldPayload.timestamp = now - (365 * 24 * 60 * 60 * 1000);
    signedMessage.payload = JSON.stringify(oldPayload);

    expect(service.verifyMessage(signedMessage)).toBe(false);
  });
});
```

## Minimal Implementation (GREEN Phase)
```typescript
// File: /src/security/MessageAuthenticationService.ts (adding setExpirationTime method)
setExpirationTime(milliseconds: number): void {
  if (milliseconds <= 0) {
    throw new Error('Expiration time must be positive');
  }
  this.DEFAULT_EXPIRATION_MS = milliseconds;
}
```

## Refactored Solution (REFACTOR Phase)
```typescript
// File: /src/security/MessageAuthenticationService.ts (final timestamp validation enhancements)
private expirationTimeMs: number = 5 * 60 * 1000; // 5 minutes default

/**
 * Sets the expiration time for signed messages
 * @param milliseconds - Expiration time in milliseconds
 * @throws Error if milliseconds is not positive
 */
setExpirationTime(milliseconds: number): void {
  if (milliseconds <= 0) {
    throw new Error('Expiration time must be positive');
  }
  this.expirationTimeMs = milliseconds;
}

/**
 * Gets the current expiration time
 * @returns Expiration time in milliseconds
 */
getExpirationTime(): number {
  return this.expirationTimeMs;
}

/**
 * Validates that a timestamp is within the allowed time window
 * @param timestamp - The timestamp to validate
 * @returns boolean indicating if timestamp is valid
 */
private isTimestampValid(timestamp: number): boolean {
  // Validate timestamp is a number
  if (typeof timestamp !== 'number' || isNaN(timestamp)) {
    return false;
  }

  // Check that timestamp is not in the future (with small tolerance)
  const now = Date.now();
  if (timestamp > now + 60 * 1000) { // 1 minute tolerance for clock skew
    return false;
  }

  // Check that timestamp is not too old
  return (now - timestamp) <= this.expirationTimeMs;
}

// Update the verifyMessage method to use the enhanced validation:
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

    // Validate timestamp format
    if (typeof payloadObj.timestamp !== 'number' || isNaN(payloadObj.timestamp)) {
      return false;
    }

    // Check expiration using enhanced validation
    if (!this.isTimestampValid(payloadObj.timestamp)) {
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
```

## Verification Commands
```bash
# Run the specific timestamp validation tests
npm test -- src/security/__tests__/MessageAuthenticationService.timestamp.london.tdd.test.ts

# Run all security tests
npm test -- src/security/

# Check that TypeScript compiles without errors
npx tsc --noEmit src/security/MessageAuthenticationService.ts
```

## Success Criteria
- [ ] setExpirationTime method validates input properly
- [ ] Method rejects zero and negative expiration times
- [ ] Enhanced timestamp validation handles edge cases
- [ ] Future timestamps are rejected (accounting for clock skew)
- [ ] Very old timestamps are rejected
- [ ] All tests pass
- [ ] TypeScript compiles without errors
- [ ] Implementation follows security best practices

## Dependencies Confirmed
- MessageAuthenticationService class structure
- Jest for testing
- TypeScript for type safety

## Next Task
task_10a_test_signing_functionality.md