# Task 10c: Test Invalid Signatures

**Estimated Time: 10 minutes**

## Context
I'm creating focused tests specifically for invalid signature detection to ensure the system properly rejects tampered or malformed messages.

## Current System State
- MessageAuthenticationService class with verifyMessage implemented
- Comprehensive tests for normal verification
- Jest testing framework configured

## Your Task
Create specific tests for various types of invalid signatures including edge cases and attack scenarios.

## Test First (RED Phase)
Creating tests for specific invalid signature scenarios.

## Minimal Implementation (GREEN Phase)
Implementing tests that verify invalid signatures are properly rejected.

## Refactored Solution (REFACTOR Phase)
```typescript
// File: /src/security/__tests__/MessageAuthenticationService.invalid-signatures.test.ts
import { MessageAuthenticationService } from '../MessageAuthenticationService';

describe('MessageAuthenticationService - Invalid Signature Tests', () => {
  let service: MessageAuthenticationService;
  const testSecret = 'test-secret-key-for-hmac';
  const testMessage = 'Hello, secure world!';

  beforeEach(() => {
    service = new MessageAuthenticationService();
    service.setSecretKey(testSecret);
  });

  it('should reject signature with wrong character encoding', () => {
    const signedMessage = service.signMessage(testMessage);

    // Change signature to base64-like (different encoding)
    signedMessage.signature = btoa(signedMessage.signature.substring(0, 48));
    const isValid = service.verifyMessage(signedMessage);

    expect(isValid).toBe(false);
  });

  it('should reject signature with uppercase letters changed to lowercase', () => {
    const signedMessage = service.signMessage(testMessage);

    // If signature has uppercase letters, change them to lowercase
    if (/[A-F]/.test(signedMessage.signature)) {
      signedMessage.signature = signedMessage.signature.replace(/[A-F]/g,
        match => match.toLowerCase());
      const isValid = service.verifyMessage(signedMessage);
      expect(isValid).toBe(false);
    }
  });

  it('should reject signature with lowercase letters changed to uppercase', () => {
    const signedMessage = service.signMessage(testMessage);

    // If signature has lowercase letters, change them to uppercase
    if (/[a-f]/.test(signedMessage.signature)) {
      signedMessage.signature = signedMessage.signature.replace(/[a-f]/g,
        match => match.toUpperCase());
      const isValid = service.verifyMessage(signedMessage);
      expect(isValid).toBe(false);
    }
  });

  it('should reject signature with extra characters appended', () => {
    const signedMessage = service.signMessage(testMessage);

    // Add extra characters
    signedMessage.signature += '00';
    const isValid = service.verifyMessage(signedMessage);

    expect(isValid).toBe(false);
  });

  it('should reject signature with characters prepended', () => {
    const signedMessage = service.signMessage(testMessage);

    // Prepend extra characters
    signedMessage.signature = '00' + signedMessage.signature;
    const isValid = service.verifyMessage(signedMessage);

    expect(isValid).toBe(false);
  });

  it('should reject signature with characters removed from middle', () => {
    const signedMessage = service.signMessage(testMessage);

    // Remove characters from middle
    const mid = Math.floor(signedMessage.signature.length / 2);
    signedMessage.signature = signedMessage.signature.substring(0, mid - 1) +
                             signedMessage.signature.substring(mid + 1);
    const isValid = service.verifyMessage(signedMessage);

    expect(isValid).toBe(false);
  });

  it('should reject completely random signature', () => {
    const signedMessage = service.signMessage(testMessage);

    // Generate random hex string of same length
    const randomSignature = Array.from({length: 64}, () =>
      Math.floor(Math.random() * 16).toString(16)).join('');
    signedMessage.signature = randomSignature;
    const isValid = service.verifyMessage(signedMessage);

    expect(isValid).toBe(false);
  });

  it('should reject signature with all same character', () => {
    const signedMessage = service.signMessage(testMessage);

    // Replace with all zeros
    signedMessage.signature = '0'.repeat(64);
    const isValid = service.verifyMessage(signedMessage);

    expect(isValid).toBe(false);
  });

  it('should reject signature with all same character (non-zero)', () => {
    const signedMessage = service.signMessage(testMessage);

    // Replace with all 'a'
    signedMessage.signature = 'a'.repeat(64);
    const isValid = service.verifyMessage(signedMessage);

    expect(isValid).toBe(false);
  });

  it('should reject empty signature', () => {
    const signedMessage = service.signMessage(testMessage);

    // Empty signature
    signedMessage.signature = '';
    const isValid = service.verifyMessage(signedMessage);

    expect(isValid).toBe(false);
  });

  it('should reject signature with non-hex characters', () => {
    const signedMessage = service.signMessage(testMessage);

    // Replace with characters that are not valid hex
    signedMessage.signature = signedMessage.signature.replace(/[0-9a-f]/g, 'g');
    const isValid = service.verifyMessage(signedMessage);

    expect(isValid).toBe(false);
  });

  it('should reject signature with spaces', () => {
    const signedMessage = service.signMessage(testMessage);

    // Insert spaces
    signedMessage.signature = signedMessage.signature.substring(0, 32) + ' ' +
                             signedMessage.signature.substring(32);
    const isValid = service.verifyMessage(signedMessage);

    expect(isValid).toBe(false);
  });

  it('should reject signature with special characters', () => {
    const signedMessage = service.signMessage(testMessage);

    // Replace some characters with special chars
    signedMessage.signature = signedMessage.signature.replace(/a/g, '@');
    const isValid = service.verifyMessage(signedMessage);

    expect(isValid).toBe(false);
  });

  it('should reject signature with unicode characters', () => {
    const signedMessage = service.signMessage(testMessage);

    // Replace some characters with unicode
    signedMessage.signature = signedMessage.signature.replace(/a/g, 'α');
    const isValid = service.verifyMessage(signedMessage);

    expect(isValid).toBe(false);
  });

  it('should reject signature that is too long', () => {
    const signedMessage = service.signMessage(testMessage);

    // Make signature longer
    signedMessage.signature += '0'.repeat(100);
    const isValid = service.verifyMessage(signedMessage);

    expect(isValid).toBe(false);
  });

  it('should reject signature that is too short', () => {
    const signedMessage = service.signMessage(testMessage);

    // Make signature shorter
    signedMessage.signature = signedMessage.signature.substring(0, 8);
    const isValid = service.verifyMessage(signedMessage);

    expect(isValid).toBe(false);
  });
});
```

## Verification Commands
```bash
# Run the invalid signature tests
npm test -- src/security/__tests__/MessageAuthenticationService.invalid-signatures.test.ts

# Run all security tests
npm test -- src/security/

# Check that TypeScript compiles without errors
npx tsc --noEmit src/security/__tests__/MessageAuthenticationService.invalid-signatures.test.ts
```

## Success Criteria
- [ ] All invalid signature variations are rejected
- [ ] Edge cases with character encoding are handled
- [ ] Length validation works correctly
- [ ] Character set validation works correctly
- [ ] All tests pass
- [ ] TypeScript compiles without errors

## Dependencies Confirmed
- MessageAuthenticationService implementation
- Jest testing framework
- TypeScript compiler

## Next Task
task_10d_test_expired_messages.md