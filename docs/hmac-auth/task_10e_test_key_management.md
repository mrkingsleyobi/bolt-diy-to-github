# Task 10e: Test Key Management

**Estimated Time: 10 minutes**

## Context
I'm creating comprehensive tests specifically for secret key management to ensure the system properly handles key setting, validation, and updates.

## Current System State
- MessageAuthenticationService class with setSecretKey implemented
- Jest testing framework configured

## Your Task
Create specific tests for secret key management including validation, updates, and edge cases.

## Test First (RED Phase)
Creating tests for secret key management scenarios.

## Minimal Implementation (GREEN Phase)
Implementing tests that verify key management works correctly.

## Refactored Solution (REFACTOR Phase)
```typescript
// File: /src/security/__tests__/MessageAuthenticationService.key-management.test.ts
import { MessageAuthenticationService } from '../MessageAuthenticationService';

describe('MessageAuthenticationService - Key Management Tests', () => {
  let service: MessageAuthenticationService;

  beforeEach(() => {
    service = new MessageAuthenticationService();
  });

  it('should set and store a valid secret key', () => {
    const secretKey = 'valid-secret-key';
    service.setSecretKey(secretKey);

    // Use the getter for testing (in real implementation, key would be private)
    expect((service as any).secretKey).toBe(secretKey);
  });

  it('should allow setting key with minimum length', () => {
    const secretKey = 'a'; // Single character
    expect(() => {
      service.setSecretKey(secretKey);
    }).not.toThrow();
  });

  it('should allow setting key with maximum reasonable length', () => {
    const secretKey = 'a'.repeat(1000); // 1000 character key
    expect(() => {
      service.setSecretKey(secretKey);
    }).not.toThrow();
  });

  it('should allow setting key with special characters', () => {
    const secretKey = 'key!@#$%^&*()_+-=[]{}|;:,.<>?';
    expect(() => {
      service.setSecretKey(secretKey);
    }).not.toThrow();
  });

  it('should allow setting key with unicode characters', () => {
    const secretKey = 'key-with-unicode-αβγ-世界';
    expect(() => {
      service.setSecretKey(secretKey);
    }).not.toThrow();
  });

  it('should allow setting key with spaces', () => {
    const secretKey = 'key with spaces';
    expect(() => {
      service.setSecretKey(secretKey);
    }).not.toThrow();
  });

  it('should allow setting key with numbers', () => {
    const secretKey = 'key123456789';
    expect(() => {
      service.setSecretKey(secretKey);
    }).not.toThrow();
  });

  it('should reject empty string key', () => {
    expect(() => {
      service.setSecretKey('');
    }).toThrow('Secret key cannot be empty');
  });

  it('should reject null key', () => {
    expect(() => {
      service.setSecretKey(null as any);
    }).toThrow('Secret key must be a string');
  });

  it('should reject undefined key', () => {
    expect(() => {
      service.setSecretKey(undefined as any);
    }).toThrow('Secret key must be a string');
  });

  it('should reject number key', () => {
    expect(() => {
      service.setSecretKey(123 as any);
    }).toThrow('Secret key must be a string');
  });

  it('should reject object key', () => {
    expect(() => {
      service.setSecretKey({} as any);
    }).toThrow('Secret key must be a string');
  });

  it('should reject array key', () => {
    expect(() => {
      service.setSecretKey([] as any);
    }).toThrow('Secret key must be a string');
  });

  it('should reject boolean key', () => {
    expect(() => {
      service.setSecretKey(true as any);
    }).toThrow('Secret key must be a string');
  });

  it('should allow updating key multiple times', () => {
    const key1 = 'first-key';
    const key2 = 'second-key';
    const key3 = 'third-key';

    service.setSecretKey(key1);
    expect((service as any).secretKey).toBe(key1);

    service.setSecretKey(key2);
    expect((service as any).secretKey).toBe(key2);

    service.setSecretKey(key3);
    expect((service as any).secretKey).toBe(key3);
  });

  it('should work with same key set multiple times', () => {
    const secretKey = 'repeated-key';

    service.setSecretKey(secretKey);
    expect((service as any).secretKey).toBe(secretKey);

    service.setSecretKey(secretKey);
    expect((service as any).secretKey).toBe(secretKey);
  });

  it('should allow setting key after failed validation', () => {
    // First try to set invalid key
    expect(() => {
      service.setSecretKey('');
    }).toThrow('Secret key cannot be empty');

    // Then set valid key
    const validKey = 'valid-key';
    expect(() => {
      service.setSecretKey(validKey);
    }).not.toThrow();

    expect((service as any).secretKey).toBe(validKey);
  });

  it('should allow very long key names', () => {
    const secretKey = 'a'.repeat(10000); // 10KB key
    expect(() => {
      service.setSecretKey(secretKey);
    }).not.toThrow();
  });

  it('should work with keys containing newlines', () => {
    const secretKey = 'key\nwith\nnewlines';
    expect(() => {
      service.setSecretKey(secretKey);
    }).not.toThrow();
  });

  it('should work with keys containing tabs', () => {
    const secretKey = 'key\twith\ttabs';
    expect(() => {
      service.setSecretKey(secretKey);
    }).not.toThrow();
  });

  it('should work with keys containing null bytes', () => {
    const secretKey = 'key\0with\0null\0bytes';
    expect(() => {
      service.setSecretKey(secretKey);
    }).not.toThrow();
  });

  it('should properly handle key with only whitespace', () => {
    const secretKey = '   '; // Only spaces
    expect(() => {
      service.setSecretKey(secretKey);
    }).not.toThrow(); // Should not throw as it's not empty
  });

  it('should properly handle key with mixed whitespace', () => {
    const secretKey = ' \t\n key \t\n ';
    expect(() => {
      service.setSecretKey(secretKey);
    }).not.toThrow();
  });

  // Integration tests with signing/verification
  it('should work with key set and then used for signing', () => {
    const secretKey = 'integration-test-key';
    service.setSecretKey(secretKey);

    const message = 'test message';
    expect(() => {
      const signedMessage = service.signMessage(message);
      expect(signedMessage).toBeDefined();
    }).not.toThrow();
  });

  it('should work with key set and then used for verification', () => {
    const secretKey = 'integration-test-key';
    service.setSecretKey(secretKey);

    const message = 'test message';
    const signedMessage = service.signMessage(message);
    const isValid = service.verifyMessage(signedMessage);

    expect(isValid).toBe(true);
  });

  it('should reject signing when key is not set', () => {
    expect(() => {
      service.signMessage('test message');
    }).toThrow('Secret key not set');
  });

  it('should reject verification when key is not set', () => {
    // Create a signed message with a different service that has a key
    const otherService = new MessageAuthenticationService();
    otherService.setSecretKey('other-key');
    const signedMessage = otherService.signMessage('test message');

    expect(() => {
      service.verifyMessage(signedMessage);
    }).toThrow('Secret key not set');
  });
});
```

## Verification Commands
```bash
# Run the key management tests
npm test -- src/security/__tests__/MessageAuthenticationService.key-management.test.ts

# Run all security tests
npm test -- src/security/

# Check that TypeScript compiles without errors
npx tsc --noEmit src/security/__tests__/MessageAuthenticationService.key-management.test.ts
```

## Success Criteria
- [ ] All valid key formats are accepted
- [ ] All invalid key formats are rejected with proper errors
- [ ] Key updates work correctly
- [ ] Integration with signing/verification works
- [ ] Edge cases are handled properly
- [ ] All tests pass
- [ ] TypeScript compiles without errors

## Dependencies Confirmed
- MessageAuthenticationService implementation
- Jest testing framework
- TypeScript compiler

## Next Task
task_20a_integration_sign_verify.md