# Task 00a: Create Types File for HMAC Authentication

**Estimated Time: 8 minutes**

## Context
I'm starting fresh with no assumptions about prior implementation. The project already has a TypeScript structure with existing security services. I need to create type definitions for the HMAC authentication system.

## Current System State
- TypeScript project with ES modules
- Existing security services in /src/security/
- Jest testing framework configured
- Node.js crypto module available

## Your Task
Create a type definitions file for the HMAC authentication system including:
- SignedMessage interface
- MessageAuthenticationService interface
- Any required enums or types

## Test First (RED Phase)
```typescript
// This is just to verify the types can be imported - real tests will come later
import { SignedMessage, MessageAuthenticationService } from '../../src/security/MessageAuthenticationService.types';

describe('Type Definitions', () => {
  it('should compile without errors', () => {
    // This test will pass if types are correctly defined
    expect(true).toBe(true);
  });
});
```

## Minimal Implementation (GREEN Phase)
```typescript
// File: /src/security/MessageAuthenticationService.types.ts
export interface SignedMessage {
  payload: string;
  signature: string;
  timestamp: number;
}

export interface MessageAuthenticationService {
  signMessage(message: string): SignedMessage;
  verifyMessage(signedMessage: SignedMessage): boolean;
  setSecretKey(key: string): void;
}
```

## Refactored Solution (REFACTOR Phase)
```typescript
// File: /src/security/MessageAuthenticationService.types.ts
/**
 * Represents a signed message with its signature and metadata
 */
export interface SignedMessage {
  /**
   * The JSON stringified payload containing the original message and timestamp
   */
  payload: string;

  /**
   * The HMAC-SHA256 signature of the payload
   */
  signature: string;

  /**
   * Unix timestamp when the message was signed (milliseconds)
   */
  timestamp: number;
}

/**
 * Service interface for message authentication using HMAC-SHA256
 */
export interface MessageAuthenticationService {
  /**
   * Signs a message with HMAC-SHA256
   * @param message - The message to sign
   * @returns SignedMessage containing payload, signature, and timestamp
   */
  signMessage(message: string): SignedMessage;

  /**
   * Verifies a signed message
   * @param signedMessage - The signed message to verify
   * @returns boolean indicating if the signature is valid and not expired
   */
  verifyMessage(signedMessage: SignedMessage): boolean;

  /**
   * Sets the secret key used for signing and verification
   * @param key - The secret key
   */
  setSecretKey(key: string): void;
}
```

## Verification Commands
```bash
# Check that TypeScript compiles without errors
npx tsc --noEmit src/security/MessageAuthenticationService.types.ts
```

## Success Criteria
- [ ] Type definitions file created
- [ ] All required interfaces defined
- [ ] Proper documentation comments added
- [ ] TypeScript compiles without errors
- [ ] No implementation details included

## Dependencies Confirmed
- TypeScript compiler (dev dependency)
- Node.js types available
- Project structure supports src/security/ directory

## Next Task
task_00b_create_service_interface.md