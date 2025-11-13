# Task 40a: Create API Documentation

**Estimated Time: 15 minutes**

## Context
I'm creating comprehensive API documentation for the MessageAuthenticationService to help developers understand how to use the HMAC-SHA256 authentication system.

## Current System State
- MessageAuthenticationService class fully implemented
- All tests passing
- Type definitions available

## Your Task
Create comprehensive API documentation including:
1. Class documentation
2. Method documentation
3. Usage examples
4. Security considerations
5. Error handling information

## Test First (RED Phase)
No tests needed for documentation.

## Minimal Implementation (GREEN Phase)
Creating basic API documentation.

## Refactored Solution (REFACTOR Phase)
```typescript
// File: /src/security/MessageAuthenticationService.docs.ts
/**
 * # MessageAuthenticationService
 *
 * A service for secure message authentication using HMAC-SHA256. This service provides
 * signing and verification capabilities for cross-origin communication between the
 * Chrome extension and bolt.diy platform.
 *
 * ## Security Features
 * - HMAC-SHA256 cryptographic signing for message integrity
 * - Replay attack prevention through timestamp validation
 * - Constant-time signature comparison to prevent timing attacks
 * - Configurable expiration times
 * - Secure secret key management
 *
 * ## Usage
 * ```typescript
 * import { MessageAuthenticationService } from './MessageAuthenticationService';
 *
 * // Create service instance
 * const authService = new MessageAuthenticationService();
 *
 * // Set secret key
 * authService.setSecretKey('your-secret-key');
 *
 * // Sign a message
 * const signedMessage = authService.signMessage('Hello, World!');
 *
 * // Verify a signed message
 * const isValid = authService.verifyMessage(signedMessage);
 * ```
 *
 * ## Cross-Origin Communication Flow
 * 1. Extension signs message with secret key before sending
 * 2. Platform receives message and verifies signature
 * 3. Platform processes only valid messages
 * 4. Both sides reject expired or tampered messages
 *
 * @module security
 * @category Authentication
 * @since 1.0.0
 */
export class MessageAuthenticationServiceDocs {
  /**
   * Creates a new MessageAuthenticationService instance
   *
   * The service is initialized without a secret key. You must call setSecretKey()
   * before using signMessage() or verifyMessage().
   *
   * @example
   * ```typescript
   * const authService = new MessageAuthenticationService();
   * ```
   */
  constructor() {}

  /**
   * Signs a message with HMAC-SHA256
   *
   * Creates a signed message containing:
   * - The original message
   * - A timestamp (milliseconds since Unix epoch)
   * - An HMAC-SHA256 signature of the payload
   *
   * The payload is a JSON object with 'message' and 'timestamp' properties.
   * The signature is computed over the JSON string representation of the payload.
   *
   * @param message - The message to sign (string)
   * @returns SignedMessage object containing payload, signature, and timestamp
   * @throws {Error} If secret key is not set
   * @throws {Error} If message is not a string
   *
   * @example
   * ```typescript
   * authService.setSecretKey('my-secret-key');
   * const signedMessage = authService.signMessage('Hello, World!');
   * console.log(signedMessage);
   * // Output: {
   * //   payload: '{"message":"Hello, World!","timestamp":1234567890123}',
   * //   signature: 'a1b2c3d4e5f6...',
   * //   timestamp: 1234567890123
   * // }
   * ```
   *
   * @security
   * - Uses HMAC-SHA256 for cryptographic signing
   * - Includes timestamp to prevent replay attacks
   * - Requires secret key to be set
   * - Throws error if secret key is missing
   */
  signMessage(message: string): SignedMessage {}

  /**
   * Verifies a signed message
   *
   * Validates that:
   * - The signature is valid (computed with same secret key)
   * - The message has not expired (default 5 minutes, configurable)
   * - The payload has not been tampered with
   * - The timestamp is valid (not in future, not too old)
   *
   * Uses constant-time comparison to prevent timing attacks.
   *
   * @param signedMessage - The signed message to verify
   * @returns boolean indicating if the signature is valid and not expired
   * @throws {Error} If secret key is not set
   *
   * @example
   * ```typescript
   * authService.setSecretKey('my-secret-key');
   * const isValid = authService.verifyMessage(signedMessage);
   * if (isValid) {
   *   console.log('Message is authentic and not expired');
   * } else {
   *   console.log('Message is invalid or expired');
   * }
   * ```
   *
   * @security
   * - Uses constant-time comparison to prevent timing attacks
   * - Validates message expiration to prevent replay attacks
   * - Rejects tampered messages
   * - Requires secret key to be set
   * - Throws error if secret key is missing
   * - Gracefully handles malformed inputs
   */
  verifyMessage(signedMessage: SignedMessage): boolean {}

  /**
   * Sets the secret key used for signing and verification
   *
   * The secret key is used for HMAC-SHA256 operations. It should be:
   * - At least 16 characters long for adequate security
   * - Randomly generated and securely stored
   * - The same on both communicating parties
   * - Kept secret and never exposed
   *
   * @param key - The secret key (string)
   * @throws {Error} If key is not a string
   * @throws {Error} If key is empty
   *
   * @example
   * ```typescript
   * // Good: Strong random key
   * authService.setSecretKey('K7#mP9$xQ2&vR4*nZ8!');
   *
   * // Good: Key from environment variable
   * authService.setSecretKey(process.env.MESSAGE_AUTH_SECRET);
   *
   * // Bad: Empty key
   * // authService.setSecretKey(''); // Throws error
   *
   * // Bad: Non-string key
   * // authService.setSecretKey(123); // Throws error
   * ```
   *
   * @security
   * - Validates key is non-empty string
   * - Stores key securely in memory
   * - Does not log or expose the key
   * - Allows key rotation by calling again
   */
  setSecretKey(key: string): void {}

  /**
   * Sets the expiration time for signed messages
   *
   * Messages older than this time will be rejected during verification.
   * This prevents replay attacks by limiting the window of validity.
   *
   * Default is 5 minutes (300,000 milliseconds).
   *
   * @param milliseconds - Expiration time in milliseconds
   * @throws {Error} If milliseconds is not positive
   *
   * @example
   * ```typescript
   * // Set expiration to 10 minutes
   * authService.setExpirationTime(10 * 60 * 1000);
   *
   * // Set expiration to 1 hour
   * authService.setExpirationTime(60 * 60 * 1000);
   *
   * // Set expiration to 30 seconds (minimum recommended)
   * authService.setExpirationTime(30 * 1000);
   * ```
   *
   * @security
   * - Prevents replay attacks
   * - Balances security with usability
   * - Should be as short as practical for your use case
   * - Validates input is positive
   */
  setExpirationTime(milliseconds: number): void {}

  /**
   * Gets the current expiration time
   *
   * Returns the current expiration time setting in milliseconds.
   *
   * @returns Expiration time in milliseconds
   *
   * @example
   * ```typescript
   * const expirationMs = authService.getExpirationTime();
   * console.log(`Messages expire after ${expirationMs} ms`);
   * ```
   */
  getExpirationTime(): number {}
}

/**
 * # SignedMessage Interface
 *
 * Represents a signed message with its signature and metadata.
 *
 * @property {string} payload - The JSON stringified payload containing the original message and timestamp
 * @property {string} signature - The HMAC-SHA256 signature of the payload
 * @property {number} timestamp - Unix timestamp when the message was signed (milliseconds)
 *
 * @example
 * ```typescript
 * const signedMessage: SignedMessage = {
 *   payload: '{"message":"Hello","timestamp":1234567890123}',
 *   signature: 'a1b2c3d4e5f6...',
 *   timestamp: 1234567890123
 * };
 * ```
 */
export interface SignedMessage {
  /** The JSON stringified payload containing the original message and timestamp */
  payload: string;
  /** The HMAC-SHA256 signature of the payload */
  signature: string;
  /** Unix timestamp when the message was signed (milliseconds) */
  timestamp: number;
}

/**
 * # Security Best Practices
 *
 * ## Secret Key Management
 * - Generate cryptographically secure random keys
 * - Store keys in environment variables or secure vaults
 * - Never hardcode keys in source code
 * - Rotate keys periodically
 * - Use different keys for different environments
 *
 * ## Key Generation Example
 * ```typescript
 * import * as crypto from 'crypto';
 *
 * // Generate a secure random key
 * const secretKey = crypto.randomBytes(32).toString('hex');
 * ```
 *
 * ## Expiration Time Guidelines
 * - Use shorter times for sensitive operations (30-60 seconds)
 * - Use moderate times for general communication (5-10 minutes)
 * - Use longer times only when necessary (≤1 hour)
 * - Consider user experience vs security requirements
 *
 * ## Error Handling
 * - Always handle verification failures gracefully
 * - Do not expose internal error details to users
 * - Log security events for monitoring
 * - Implement rate limiting to prevent abuse
 *
 * ## Cross-Origin Communication Security
 * - Validate message authenticity before processing
 * - Sanitize all message content
 * - Use HTTPS for all communication
 * - Implement Content Security Policy (CSP)
 * - Validate message structure and content types
 */
```

## Verification Commands
```bash
# Check that TypeScript compiles without errors
npx tsc --noEmit src/security/MessageAuthenticationService.docs.ts

# Run documentation linting (if configured)
npm run lint:docs
```

## Success Criteria
- [ ] Comprehensive class documentation created
- [ ] All methods documented with parameters, returns, throws
- [ ] Usage examples provided
- [ ] Security considerations documented
- [ ] Error handling information included
- [ ] Best practices documented
- [ ] TypeScript compiles without errors
- [ ] Documentation follows JSDoc standards

## Dependencies Confirmed
- MessageAuthenticationService implementation
- TypeScript compiler
- JSDoc documentation standards

## Next Task
task_40b_create_usage_examples.md