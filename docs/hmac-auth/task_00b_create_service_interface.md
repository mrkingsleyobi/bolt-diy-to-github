# Task 00b: Create MessageAuthenticationService Interface

**Estimated Time: 10 minutes**

## Context
I'm starting fresh with no assumptions about prior implementation. I've created the type definitions in the previous task. Now I need to create the actual service interface implementation that will handle HMAC-SHA256 signing and verification.

## Current System State
- TypeScript project with ES modules
- Type definitions created in /src/security/MessageAuthenticationService.types.ts
- Node.js crypto module available
- Jest testing framework configured
- Existing security services pattern to follow (TokenEncryptionService.ts)

## Your Task
Create the MessageAuthenticationService class with method signatures but no implementation yet. This follows the London School TDD approach where we define the interface first.

## Test First (RED Phase)
```typescript
// File: /src/security/__tests__/MessageAuthenticationService.london.tdd.test.ts
import { MessageAuthenticationService } from '../MessageAuthenticationService.types';
import { MessageAuthenticationService as ActualService } from '../MessageAuthenticationService';

describe('MessageAuthenticationService', () => {
  let service: MessageAuthenticationService;

  beforeEach(() => {
    service = new ActualService();
  });

  it('should have a signMessage method', () => {
    expect(typeof service.signMessage).toBe('function');
  });

  it('should have a verifyMessage method', () => {
    expect(typeof service.verifyMessage).toBe('function');
  });

  it('should have a setSecretKey method', () => {
    expect(typeof service.setSecretKey).toBe('function');
  });
});
```

## Minimal Implementation (GREEN Phase)
```typescript
// File: /src/security/MessageAuthenticationService.ts
import { SignedMessage, MessageAuthenticationService as IMessageAuthenticationService } from './MessageAuthenticationService.types';
import * as crypto from 'crypto';

export class MessageAuthenticationService implements IMessageAuthenticationService {
  signMessage(message: string): SignedMessage {
    // TODO: Implementation will come later
    return {
      payload: '',
      signature: '',
      timestamp: Date.now()
    };
  }

  verifyMessage(signedMessage: SignedMessage): boolean {
    // TODO: Implementation will come later
    return false;
  }

  setSecretKey(key: string): void {
    // TODO: Implementation will come later
  }
}
```

## Refactored Solution (REFACTOR Phase)
```typescript
// File: /src/security/MessageAuthenticationService.ts
import { SignedMessage, MessageAuthenticationService as IMessageAuthenticationService } from './MessageAuthenticationService.types';
import * as crypto from 'crypto';

/**
 * Service for message authentication using HMAC-SHA256
 * Provides signing and verification capabilities for cross-origin communication
 */
export class MessageAuthenticationService implements IMessageAuthenticationService {
  private secretKey: string | null = null;
  private readonly DEFAULT_EXPIRATION_MS = 5 * 60 * 1000; // 5 minutes

  /**
   * Signs a message with HMAC-SHA256
   * @param message - The message to sign
   * @returns SignedMessage containing payload, signature, and timestamp
   */
  signMessage(message: string): SignedMessage {
    // TODO: Implementation will be added in task_01
    return {
      payload: '',
      signature: '',
      timestamp: Date.now()
    };
  }

  /**
   * Verifies a signed message
   * @param signedMessage - The signed message to verify
   * @returns boolean indicating if the signature is valid and not expired
   */
  verifyMessage(signedMessage: SignedMessage): boolean {
    // TODO: Implementation will be added in task_02
    return false;
  }

  /**
   * Sets the secret key used for signing and verification
   * @param key - The secret key
   */
  setSecretKey(key: string): void {
    // TODO: Implementation will be added in task_03
    this.secretKey = key;
  }
}
```

## Verification Commands
```bash
# Run the specific test to verify interface
npm test -- src/security/__tests__/MessageAuthenticationService.london.tdd.test.ts

# Check that TypeScript compiles without errors
npx tsc --noEmit src/security/MessageAuthenticationService.ts
```

## Success Criteria
- [ ] Service class created implementing the interface
- [ ] All methods have correct signatures
- [ ] Proper documentation comments added
- [ ] TypeScript compiles without errors
- [ ] Initial tests pass (testing method existence, not functionality)
- [ ] No actual implementation logic added yet

## Dependencies Confirmed
- TypeScript compiler (dev dependency)
- Node.js crypto module (built-in)
- Jest testing framework (dev dependency)
- Type definitions from task_00a

## Next Task
task_01_implement_signing_method.md