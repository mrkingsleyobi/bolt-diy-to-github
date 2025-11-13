# Task 01: Implement Message Signing Method

**Estimated Time: 15 minutes**

## Context
I'm implementing the signMessage method in the MessageAuthenticationService class. This method will create HMAC-SHA256 signatures for messages to enable secure cross-origin communication.

## Current System State
- MessageAuthenticationService class created with empty method stubs
- Type definitions for SignedMessage and service interface in place
- Node.js crypto module available
- Jest testing framework configured

## Your Task
Implement the signMessage method to:
1. Create a timestamped payload containing the message
2. Generate an HMAC-SHA256 signature using the secret key
3. Return a SignedMessage object with payload, signature, and timestamp

## Test First (RED Phase)
```typescript
// File: /src/security/__tests__/MessageAuthenticationService.sign.london.tdd.test.ts
import { MessageAuthenticationService } from '../MessageAuthenticationService';

describe('MessageAuthenticationService.signMessage', () => {
  let service: MessageAuthenticationService;
  const testSecret = 'test-secret-key-for-hmac';
  const testMessage = 'Hello, secure world!';

  beforeEach(() => {
    service = new MessageAuthenticationService();
    service.setSecretKey(testSecret);
  });

  it('should create a signed message with payload, signature, and timestamp', () => {
    const signedMessage = service.signMessage(testMessage);

    expect(signedMessage).toHaveProperty('payload');
    expect(signedMessage).toHaveProperty('signature');
    expect(signedMessage).toHaveProperty('timestamp');
    expect(typeof signedMessage.payload).toBe('string');
    expect(typeof signedMessage.signature).toBe('string');
    expect(typeof signedMessage.timestamp).toBe('number');
  });

  it('should include the original message in the payload', () => {
    const signedMessage = service.signMessage(testMessage);
    const payload = JSON.parse(signedMessage.payload);

    expect(payload.message).toBe(testMessage);
  });

  it('should include a timestamp in the payload', () => {
    const signedMessage = service.signMessage(testMessage);
    const payload = JSON.parse(signedMessage.payload);

    expect(payload.timestamp).toBeCloseTo(Date.now(), -3); // Within 1 second
  });

  it('should generate a different signature each time (due to timestamp)', () => {
    const signedMessage1 = service.signMessage(testMessage);
    // Small delay to ensure different timestamps
    jest.advanceTimersByTime(10);
    const signedMessage2 = service.signMessage(testMessage);

    expect(signedMessage1.signature).not.toBe(signedMessage2.signature);
  });

  it('should throw an error if secret key is not set', () => {
    const serviceWithoutKey = new MessageAuthenticationService();
    expect(() => {
      serviceWithoutKey.signMessage(testMessage);
    }).toThrow('Secret key not set');
  });
});
```

## Minimal Implementation (GREEN Phase)
```typescript
// File: /src/security/MessageAuthenticationService.ts (updating signMessage method)
signMessage(message: string): SignedMessage {
  if (!this.secretKey) {
    throw new Error('Secret key not set');
  }

  const timestamp = Date.now();
  const payloadObj = { message, timestamp };
  const payload = JSON.stringify(payloadObj);
  const signature = crypto.createHmac('sha256', this.secretKey)
    .update(payload)
    .digest('hex');

  return { payload, signature, timestamp };
}
```

## Refactored Solution (REFACTOR Phase)
```typescript
// File: /src/security/MessageAuthenticationService.ts (final signMessage method)
/**
 * Signs a message with HMAC-SHA256
 * @param message - The message to sign
 * @returns SignedMessage containing payload, signature, and timestamp
 * @throws Error if secret key is not set
 */
signMessage(message: string): SignedMessage {
  if (!this.secretKey) {
    throw new Error('Secret key not set');
  }

  // Create timestamped payload
  const timestamp = Date.now();
  const payloadObj = { message, timestamp };
  const payload = JSON.stringify(payloadObj);

  // Generate HMAC-SHA256 signature
  const signature = crypto.createHmac('sha256', this.secretKey)
    .update(payload)
    .digest('hex');

  return { payload, signature, timestamp };
}
```

## Verification Commands
```bash
# Run the specific signing tests
npm test -- src/security/__tests__/MessageAuthenticationService.sign.london.tdd.test.ts

# Run all security tests
npm test -- src/security/

# Check that TypeScript compiles without errors
npx tsc --noEmit src/security/MessageAuthenticationService.ts
```

## Success Criteria
- [ ] signMessage method creates valid SignedMessage objects
- [ ] Payload contains original message and timestamp
- [ ] HMAC-SHA256 signature is correctly generated
- [ ] Method throws error when secret key is not set
- [ ] All tests pass
- [ ] TypeScript compiles without errors
- [ ] Implementation follows security best practices

## Dependencies Confirmed
- Node.js crypto module (built-in)
- MessageAuthenticationService.types.ts for type definitions
- Jest for testing

## Next Task
task_02_implement_verification_method.md