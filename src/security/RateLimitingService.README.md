# Rate Limiting Service

## Overview

The Rate Limiting Service implements the token bucket algorithm for rate limiting cross-origin communication in the Bolt.DIY to GitHub Chrome extension. It provides configurable rate limiting with built-in authentication and encryption capabilities.

## Features

- **Token Bucket Algorithm**: Efficient rate limiting with configurable bucket size and refill rate
- **Cross-Origin Communication Security**: Integrated with HMAC-SHA256 authentication and AES-256-GCM encryption
- **Configurable Limits**: Adjustable bucket size and refill rate for different use cases
- **Token Expiration**: Automatic expiration of rate limit tokens to prevent replay attacks
- **Multi-Environment Support**: Works across different deployment environments
- **Comprehensive Testing**: 100% test coverage with London School TDD approach

## Architecture

The Rate Limiting Service follows a layered security approach:

```
[Client Application]
        ↓
[Rate Limiting Service]
        ↓
[Message Authentication Service] → HMAC-SHA256
        ↓
[Payload Encryption Service] → AES-256-GCM
        ↓
[Cross-Origin Communication]
```

## Installation

```typescript
import { RateLimitingService } from './security/RateLimitingService';

// Create a new rate limiting service
const rateLimiter = new RateLimitingService(
  10,  // bucketSize: Maximum tokens
  1,   // refillRate: Tokens per second
  'your-secret-key' // secret key for authentication
);
```

## Usage Examples

### Basic Rate Limiting

```typescript
// Check if request can proceed
if (rateLimiter.consume(1)) {
  // Proceed with request
  console.log('Request allowed');
} else {
  // Rate limit exceeded
  console.log('Rate limit exceeded');
}
```

### Creating Authenticated Rate Limit Tokens

```typescript
// Create a rate limit token with expiration
const payload = {
  action: 'export-project',
  projectId: '12345',
  userId: 'user-abc'
};

const token = rateLimiter.createRateLimitToken(payload, 5); // 5 minutes expiration
```

### Validating Rate Limit Tokens

```typescript
// Validate a rate limit token
const isValid = rateLimiter.validateRateLimitToken(token);
if (isValid) {
  console.log('Token is valid');
} else {
  console.log('Token is invalid or expired');
}
```

### Encrypted Communication with Rate Limiting

```typescript
// Encrypt data with rate limit metadata
const encryptedData = await rateLimiter.encryptWithRateLimit(
  JSON.stringify({ sensitive: 'data' }),
  'encryption-secret'
);

// Decrypt data and validate rate limit
const decryptedData = await rateLimiter.decryptWithRateLimit(
  encryptedData,
  'encryption-secret'
);
```

### Configuration Management

```typescript
// Update rate limiting configuration
rateLimiter.updateConfiguration(20, 2); // 20 tokens, 2 tokens/second

// Get current configuration
const bucketSize = rateLimiter.getBucketSize();
const refillRate = rateLimiter.getRefillRate();
const availableTokens = rateLimiter.getAvailableTokens();
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `bucketSize` | number | 10 | Maximum number of tokens in the bucket |
| `refillRate` | number | 1 | Rate at which tokens are added (tokens/second) |
| `secretKey` | string | '' | Secret key for HMAC-SHA256 authentication |
| `defaultExpirationMinutes` | number | 5 | Default expiration time for tokens |

## Security Features

### Token Bucket Algorithm
- Prevents abuse by limiting request frequency
- Allows burst requests up to bucket capacity
- Automatically refills tokens over time

### Authentication
- HMAC-SHA256 message authentication
- Timestamp-based expiration prevention
- Replay attack protection
- Timing attack resistance

### Encryption
- AES-256-GCM authenticated encryption
- Secure key derivation with PBKDF2
- Random IV and salt generation
- Authentication tag verification

## Cross-Origin Communication Flow

1. **Client Request**:
   - Check rate limit availability
   - Create authenticated rate limit token
   - Encrypt sensitive data if needed

2. **Server Validation**:
   - Validate rate limit token
   - Check token expiration
   - Process request if valid

3. **Server Response**:
   - Encrypt response data
   - Include rate limit metadata

4. **Client Processing**:
   - Decrypt response
   - Update local rate limit state

## Error Handling

The service throws specific errors for different scenarios:

- `Error('Secret key not set')` - When trying to create tokens without a secret key
- `Error('Bucket size and refill rate must be positive')` - Invalid configuration
- `Error('Secret key must be a non-empty string')` - Invalid secret key
- `Error('Failed to decrypt with rate limit: ...')` - Decryption failures

## Testing

The service includes comprehensive tests:

- **London School TDD Tests**: Behavior-focused tests for public API
- **Comprehensive Tests**: Full coverage of all functionality
- **Integration Tests**: Cross-origin communication scenarios
- **Security Tests**: Attack scenario simulations

Run tests with:
```bash
npm test -- src/security/__tests__/RateLimitingService.*.test.ts
```

## Performance Considerations

- **Memory Efficient**: Minimal memory footprint
- **Fast Operations**: O(1) token consumption and validation
- **Lazy Refill**: Tokens refilled only when needed
- **Asynchronous Encryption**: Non-blocking encryption/decryption

## Best Practices

1. **Set Appropriate Limits**: Configure bucket size and refill rate based on expected usage patterns
2. **Use Strong Secrets**: Generate cryptographically secure secret keys
3. **Monitor Usage**: Track rate limit consumption for optimization
4. **Handle Errors Gracefully**: Implement proper error handling for rate limit exceeded scenarios
5. **Regular Updates**: Keep secret keys updated and rotated periodically

## Integration with Chrome Extension

The Rate Limiting Service integrates seamlessly with the Bolt.DIY to GitHub Chrome extension:

```typescript
// In background script
const rateLimiter = new RateLimitingService(10, 1, chrome.runtime.id);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'EXPORT_REQUEST') {
    // Check rate limit
    if (!rateLimiter.consume(1)) {
      sendResponse({ error: 'Rate limit exceeded' });
      return;
    }

    // Process export request
    // ...
  }
});
```

## API Reference

### RateLimitingService

#### Constructor
```typescript
new RateLimitingService(bucketSize?: number, refillRate?: number, secretKey?: string)
```

#### Methods

| Method | Description |
|--------|-------------|
| `consume(tokens?: number): boolean` | Attempts to consume tokens from the bucket |
| `getAvailableTokens(): number` | Gets the current number of available tokens |
| `getBucketSize(): number` | Gets the bucket size |
| `getRefillRate(): number` | Gets the refill rate |
| `updateConfiguration(bucketSize: number, refillRate: number): void` | Updates the bucket configuration |
| `setSecretKey(secretKey: string): void` | Sets the secret key for message authentication |
| `getSecretKey(): string` | Gets the current secret key |
| `createRateLimitToken(payload: any, expirationMinutes?: number): string` | Creates a rate limit token with expiration |
| `validateRateLimitToken(token: string): boolean` | Validates a rate limit token |
| `encryptWithRateLimit(data: string, secret: string): Promise<string>` | Encrypts data with rate limit metadata |
| `decryptWithRateLimit(encryptedData: string, secret: string): Promise<string>` | Decrypts data and validates rate limit |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add comprehensive tests
4. Implement functionality
5. Update documentation
6. Submit a pull request

## License

MIT License - see LICENSE file for details.