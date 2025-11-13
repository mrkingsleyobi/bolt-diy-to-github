# Message Authentication Service

This module provides secure message authentication using HMAC-SHA256 for cross-origin communication between the Chrome extension and bolt.diy platform.

## Features

- **HMAC-SHA256 Cryptographic Signing**: Industry-standard message authentication
- **Replay Attack Prevention**: Timestamp-based expiration with configurable time windows
- **Timing Attack Protection**: Constant-time signature comparison
- **Secure Key Management**: Validation and storage of secret keys
- **Comprehensive Error Handling**: Graceful handling of malformed inputs
- **TypeScript Support**: Full type safety with comprehensive interfaces

## Installation

The service is part of the bolt-diy-to-github project and requires no additional dependencies beyond the Node.js crypto module.

## Usage

### Basic Usage

```typescript
import { MessageAuthenticationService } from './MessageAuthenticationService';

// Create service instance
const authService = new MessageAuthenticationService();

// Set secret key (must be the same on both communicating parties)
authService.setSecretKey('your-shared-secret-key');

// Sign a message
const message = 'Hello, World!';
const signedMessage = authService.signMessage(message);

// Verify a signed message
const isValid = authService.verifyMessage(signedMessage);
console.log(isValid); // true
```

### Cross-Origin Communication Flow

```typescript
// Chrome Extension (sender)
const extensionService = new MessageAuthenticationService();
extensionService.setSecretKey('shared-secret');

const message = JSON.stringify({
  action: 'SYNC_PROJECT',
  projectId: 'project-123',
  branch: 'main'
});

const signedMessage = extensionService.signMessage(message);
// Send signedMessage over postMessage or HTTP request

// bolt.diy Platform (receiver)
const platformService = new MessageAuthenticationService();
platformService.setSecretKey('shared-secret');

const isAuthentic = platformService.verifyMessage(signedMessage);
if (isAuthentic) {
  // Process the message
  const payload = JSON.parse(signedMessage.payload);
  const originalMessage = JSON.parse(payload.message);
  // ... process originalMessage
}
```

### Configuration

```typescript
// Set custom expiration time (default is 5 minutes)
authService.setExpirationTime(10 * 60 * 1000); // 10 minutes

// Get current expiration time
const expirationMs = authService.getExpirationTime();
```

## API

### MessageAuthenticationService

#### Constructor
```typescript
new MessageAuthenticationService()
```

#### Methods

##### signMessage(message: string): SignedMessage
Signs a message with HMAC-SHA256.

##### verifyMessage(signedMessage: SignedMessage): boolean
Verifies a signed message.

##### setSecretKey(key: string): void
Sets the secret key used for signing and verification.

##### setExpirationTime(milliseconds: number): void
Sets the expiration time for signed messages.

##### getExpirationTime(): number
Gets the current expiration time in milliseconds.

### Types

#### SignedMessage
```typescript
interface SignedMessage {
  payload: string;    // JSON stringified {message, timestamp}
  signature: string;  // HMAC-SHA256 signature (hex)
  timestamp: number;  // Unix timestamp (milliseconds)
}
```

## Security Features

### Replay Attack Prevention
Messages include timestamps and are rejected if older than the configured expiration time.

### Timing Attack Protection
Signature verification uses constant-time comparison to prevent timing-based attacks.

### Message Integrity
Any tampering with the message content or timestamp will cause verification to fail.

## Best Practices

1. **Secret Key Management**
   - Use cryptographically secure random keys
   - Store keys securely (environment variables, secure storage)
   - Never hardcode keys in source code
   - Rotate keys periodically

2. **Expiration Time**
   - Use shorter times for sensitive operations (30-60 seconds)
   - Use moderate times for general communication (5-10 minutes)
   - Balance security with usability

3. **Error Handling**
   - Always handle verification failures gracefully
   - Do not expose internal error details to users
   - Log security events for monitoring

## Testing

The service includes comprehensive tests following London School TDD principles:

```bash
# Run all security tests
npm test -- src/security/

# Run specific test suites
npm test -- src/security/__tests__/MessageAuthenticationService.london.tdd.test.ts
npm test -- src/security/__tests__/MessageAuthenticationService.comprehensive.test.ts
npm test -- src/security/__tests__/MessageAuthenticationService.integration.test.ts
```

## Files

- `MessageAuthenticationService.ts` - Main implementation
- `MessageAuthenticationService.types.ts` - Type definitions
- `__tests__/MessageAuthenticationService.london.tdd.test.ts` - Basic TDD tests
- `__tests__/MessageAuthenticationService.comprehensive.test.ts` - Comprehensive tests
- `__tests__/MessageAuthenticationService.integration.test.ts` - Integration tests

## Documentation

See `docs/hmac-auth/` for detailed documentation including:
- Task breakdown and implementation plan
- Usage examples for Chrome extension and platform
- Security best practices
- API documentation