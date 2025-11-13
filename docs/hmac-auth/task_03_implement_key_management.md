# Task 03: Implement Secret Key Management

**Estimated Time: 10 minutes**

## Context
I'm implementing the setSecretKey method in the MessageAuthenticationService class and enhancing the secret key management functionality. This is crucial for secure handling of the HMAC secret key.

## Current System State
- MessageAuthenticationService class with signMessage and verifyMessage implemented
- Type definitions for SignedMessage and service interface in place
- Node.js crypto module available
- Jest testing framework configured

## Your Task
Implement the setSecretKey method and enhance secret key management to:
1. Securely store the secret key
2. Validate the secret key input
3. Provide getter for key validation (for testing purposes)

## Test First (RED Phase)
```typescript
// File: /src/security/__tests__/MessageAuthenticationService.key.london.tdd.test.ts
import { MessageAuthenticationService } from '../MessageAuthenticationService';

describe('MessageAuthenticationService.setSecretKey', () => {
  let service: MessageAuthenticationService;

  beforeEach(() => {
    service = new MessageAuthenticationService();
  });

  it('should set the secret key', () => {
    const secretKey = 'test-secret-key';
    service.setSecretKey(secretKey);

    // We can't directly access private key, but we can test functionality
    expect(() => {
      service.signMessage('test');
    }).not.toThrow('Secret key not set');
  });

  it('should reject empty secret key', () => {
    expect(() => {
      service.setSecretKey('');
    }).toThrow('Secret key cannot be empty');
  });

  it('should reject null or undefined secret key', () => {
    expect(() => {
      service.setSecretKey(null as any);
    }).toThrow('Secret key must be a string');

    expect(() => {
      service.setSecretKey(undefined as any);
    }).toThrow('Secret key must be a string');
  });

  it('should reject non-string secret key', () => {
    expect(() => {
      service.setSecretKey(123 as any);
    }).toThrow('Secret key must be a string');

    expect(() => {
      service.setSecretKey({} as any);
    }).toThrow('Secret key must be a string');
  });

  it('should allow updating the secret key', () => {
    service.setSecretKey('first-key');
    service.setSecretKey('second-key');

    // Test that signing works with the new key
    expect(() => {
      service.signMessage('test');
    }).not.toThrow();
  });
});
```

## Minimal Implementation (GREEN Phase)
```typescript
// File: /src/security/MessageAuthenticationService.ts (updating setSecretKey method)
setSecretKey(key: string): void {
  if (typeof key !== 'string') {
    throw new Error('Secret key must be a string');
  }
  if (key.length === 0) {
    throw new Error('Secret key cannot be empty');
  }
  this.secretKey = key;
}
```

## Refactored Solution (REFACTOR Phase)
```typescript
// File: /src/security/MessageAuthenticationService.ts (final setSecretKey method and enhancements)
/**
 * Sets the secret key used for signing and verification
 * @param key - The secret key
 * @throws Error if key is invalid
 */
setSecretKey(key: string): void {
  // Validate input
  if (typeof key !== 'string') {
    throw new Error('Secret key must be a string');
  }
  if (key.length === 0) {
    throw new Error('Secret key cannot be empty');
  }

  // Store the key
  this.secretKey = key;
}

/**
 * Gets the secret key (for testing purposes only)
 * @returns The secret key or null if not set
 */
getSecretKey(): string | null {
  return this.secretKey;
}
```

## Verification Commands
```bash
# Run the specific key management tests
npm test -- src/security/__tests__/MessageAuthenticationService.key.london.tdd.test.ts

# Run all security tests
npm test -- src/security/

# Check that TypeScript compiles without errors
npx tsc --noEmit src/security/MessageAuthenticationService.ts
```

## Success Criteria
- [ ] setSecretKey method validates input properly
- [ ] Method rejects empty, null, undefined, and non-string keys
- [ ] Method securely stores the secret key
- [ ] Method allows updating the secret key
- [ ] All tests pass
- [ ] TypeScript compiles without errors
- [ ] Implementation follows security best practices

## Dependencies Confirmed
- MessageAuthenticationService class structure
- Jest for testing
- TypeScript for type safety

## Next Task
task_04_add_timestamp_validation.md