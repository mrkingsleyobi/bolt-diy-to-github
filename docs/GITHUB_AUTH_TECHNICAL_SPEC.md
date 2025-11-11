# GitHub Authentication Services Technical Specification

## 1. Overview

This document provides a detailed technical specification for the GitHub authentication services implemented in Phase 1 of the bolt-diy-to-github integration. The implementation includes Personal Access Token (PAT) authentication, GitHub App OAuth authentication, secure token storage, and encryption services.

## 2. Architecture

### 2.1 Component Diagram

```
+---------------------+     +---------------------+
|  GitHubPATAuthService |<--->|   GitHub API        |
+---------------------+     +---------------------+
          |
          | validates & authenticates
          v
+---------------------+
| Token Format Regex  |
+---------------------+

+---------------------+     +---------------------+
| GitHubAppAuthService |<--->| GitHub OAuth API    |
+---------------------+     +---------------------+
          |
          | exchanges codes & authenticates
          v
+---------------------+
| Token Format Regex  |
+---------------------+

+---------------------+     +---------------------+
| EnhancedGitHubPATAuth|<--->|   GitHub API        |
+---------------------+     +---------------------+
          |
          | validates & stores tokens
          v
+---------------------+
| SecureTokenStorage  |
+---------------------+
          |
          | encrypts/decrypts
          v
+---------------------+
| TokenEncryptionService |
+---------------------+

+---------------------+     +---------------------+
|   GitHubClient      |<--->|   GitHub API        |
+---------------------+     +---------------------+
          |
          | uses authentication
          v
+---------------------+
| Service Integration |
+---------------------+
```

### 2.2 Data Flow

1. **PAT Authentication Flow**:
   - User provides PAT
   - Service validates token format
   - Service authenticates with GitHub API
   - Returns authentication result

2. **GitHub App OAuth Flow**:
   - User completes OAuth flow, receives authorization code
   - Service exchanges code for access token
   - Service validates and authenticates with access token
   - Returns authentication result

3. **Secure Storage Flow**:
   - User provides token and encryption password
   - Service encrypts token
   - Service stores encrypted token in localStorage
   - For retrieval, service decrypts stored token

## 3. Detailed Component Specifications

### 3.1 GitHubPATAuthService

#### 3.1.1 Class Definition

```typescript
export class GitHubPATAuthService {
  private readonly PAT_REGEX = /^ghp_[a-zA-Z0-9]{36}$/;
  private readonly GITHUB_API_BASE = 'https://api.github.com';
}
```

#### 3.1.2 Methods

##### validateToken(token: string): boolean

**Purpose**: Validates the format of a GitHub Personal Access Token

**Parameters**:
- `token`: The token to validate (string)

**Returns**: boolean indicating if the token format is valid

**Validation Rules**:
- Token must be a non-empty string
- Token must match the regex pattern `^ghp_[a-zA-Z0-9]{36}$`
- Token must start with `ghp_` prefix
- Token must be exactly 36 characters after the prefix

**Examples**:
```typescript
// Valid tokens
authService.validateToken('ghp_validtoken12345678901234567890123456'); // true

// Invalid tokens
authService.validateToken('invalid-token'); // false
authService.validateToken('ghp_short'); // false
authService.validateToken('ghp_validtoken12345678901234567890123456toolong'); // false
authService.validateToken('ghp_validtoken1234567890123456789012345!'); // false
```

##### authenticate(token: string): Promise<AuthResult>

**Purpose**: Authenticates with GitHub API using a Personal Access Token

**Parameters**:
- `token`: The GitHub PAT to use for authentication (string)

**Returns**: Promise resolving to authentication result

**Process**:
1. Validate input token
2. Validate token format
3. Make API call to `/user` endpoint
4. Handle various response scenarios
5. Return authentication result

**Response Handling**:
- **200 OK**: Authentication successful, return user data
- **401 Unauthorized**: Invalid credentials
- **Other HTTP errors**: Return appropriate error message
- **Network errors**: Handle gracefully with descriptive error

**AuthResult Interface**:
```typescript
interface AuthResult {
  authenticated: boolean;
  user?: GitHubUser;
  error?: string;
}
```

### 3.2 GitHubAppAuthService

#### 3.2.1 Class Definition

```typescript
export class GitHubAppAuthService {
  private readonly TOKEN_REGEX = /^ghu_[a-zA-Z0-9]{36}$/;
  private readonly GITHUB_API_BASE = 'https://api.github.com';
  private readonly GITHUB_OAUTH_BASE = 'https://github.com/login/oauth';

  constructor(
    private readonly clientId: string,
    private readonly clientSecret: string
  );
}
```

#### 3.2.2 Methods

##### exchangeCodeForToken(code: string): Promise<TokenExchangeResult>

**Purpose**: Exchanges an authorization code for an access token

**Parameters**:
- `code`: The authorization code received from GitHub (string)

**Returns**: Promise resolving to token exchange result

**Process**:
1. Validate input code
2. Make POST request to GitHub OAuth token endpoint
3. Handle response scenarios
4. Return exchange result

**TokenExchangeResult Interface**:
```typescript
interface TokenExchangeResult {
  success: boolean;
  token?: string;
  error?: string;
}
```

##### validateToken(token: string): boolean

**Purpose**: Validates the format of a GitHub App access token

**Parameters**:
- `token`: The token to validate (string)

**Returns**: boolean indicating if the token format is valid

**Validation Rules**:
- Token must be a non-empty string
- Token must match the regex pattern `^ghu_[a-zA-Z0-9]{36}$`
- Token must start with `ghu_` prefix
- Token must be exactly 36 characters after the prefix

##### authenticate(token: string): Promise<AuthResult>

**Purpose**: Authenticates with GitHub API using an access token

**Parameters**:
- `token`: The GitHub access token to use for authentication (string)

**Returns**: Promise resolving to authentication result

**Process**: Same as GitHubPATAuthService.authenticate()

### 3.3 EnhancedGitHubPATAuthService

#### 3.3.1 Class Definition

```typescript
export class EnhancedGitHubPATAuthService {
  private readonly PAT_REGEX = /^ghp_[a-zA-Z0-9]{36}$|^github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59}$/;
  private readonly GITHUB_API_BASE = 'https://api.github.com';
  private readonly tokenStorage: Map<string, string> = new Map();
}
```

#### 3.3.2 Methods

##### validateTokenFormat(token: string): boolean

**Purpose**: Validates the format of both classic and fine-grained GitHub PATs

**Parameters**:
- `token`: The token to validate (string)

**Returns**: boolean indicating if the token format is valid

**Validation Rules**:
- Supports both `ghp_` (classic) and `github_pat_` (fine-grained) tokens
- Classic tokens: `^ghp_[a-zA-Z0-9]{36}$`
- Fine-grained tokens: `^github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59}$`

##### validateTokenWithAPI(token: string): Promise<TokenValidationResult>

**Purpose**: Validates token by making a request to GitHub API

**Parameters**:
- `token`: The GitHub PAT to validate (string)

**Returns**: Promise resolving to validation result

**TokenValidationResult Interface**:
```typescript
interface TokenValidationResult {
  valid: boolean;
  reason?: string;
  user?: GitHubUser;
}
```

##### storeToken(key: string, token: string): void

**Purpose**: Stores a token in memory (for demonstration)

**Parameters**:
- `key`: The key to store the token under (string)
- `token`: The token to store (string)

##### retrieveToken(key: string): string | undefined

**Purpose**: Retrieves a token from memory (for demonstration)

**Parameters**:
- `key`: The key to retrieve the token for (string)

**Returns**: The stored token or undefined

##### authenticate(token: string): Promise<AuthResult>

**Purpose**: Authenticates with GitHub API using a Personal Access Token

**Parameters**:
- `token`: The GitHub PAT to use for authentication (string)

**Returns**: Promise resolving to authentication result

##### authenticateWithStoredToken(key: string): Promise<AuthResult>

**Purpose**: Authenticates with GitHub API using a stored token

**Parameters**:
- `key`: The key for the stored token (string)

**Returns**: Promise resolving to authentication result

### 3.4 SecureTokenStorage

#### 3.4.1 Class Definition

```typescript
export class SecureTokenStorage {
  private readonly encryptionService: TokenEncryptionService;
  private readonly storageKey = 'github_tokens';
}
```

#### 3.4.2 Methods

##### storeToken(token: string, password: string, key: string): Promise<void>

**Purpose**: Stores an encrypted token in secure storage

**Parameters**:
- `token`: The token to store (string)
- `password`: The password to encrypt the token with (string)
- `key`: An optional key to associate with the token (string, default: 'default')

##### retrieveToken(password: string, key: string): Promise<string>

**Purpose**: Retrieves and decrypts a token from secure storage

**Parameters**:
- `password`: The password to decrypt the token with (string)
- `key`: The key associated with the token to retrieve (string, default: 'default')

**Returns**: Promise that resolves to the decrypted token

##### removeToken(key: string): void

**Purpose**: Removes a token from storage

**Parameters**:
- `key`: The key associated with the token to remove (string, default: 'default')

##### hasToken(key: string): boolean

**Purpose**: Checks if a token exists for the given key

**Parameters**:
- `key`: The key to check (string, default: 'default')

**Returns**: boolean indicating if a token exists

##### getTokenKeys(): string[]

**Purpose**: Gets all stored token keys

**Returns**: Array of token keys

### 3.5 TokenEncryptionService

#### 3.5.1 Class Definition

```typescript
export class TokenEncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 12;  // 96 bits for GCM
  private readonly authTagLength = 16;
  private readonly saltLength = 16;
}
```

#### 3.5.2 Methods

##### encryptToken(token: string, password: string): Promise<string>

**Purpose**: Encrypts a token using AES-256-GCM

**Parameters**:
- `token`: The token to encrypt (string)
- `password`: The password to derive the encryption key from (string)

**Returns**: The encrypted token as a hex string

**Process**:
1. Generate random salt and IV
2. Derive encryption key using PBKDF2 (100,000 iterations)
3. Create cipher with AES-256-GCM
4. Encrypt token
5. Get authentication tag
6. Combine salt, IV, authTag, and encrypted data

##### decryptToken(encryptedToken: string, password: string): Promise<string>

**Purpose**: Decrypts a token using AES-256-GCM

**Parameters**:
- `encryptedToken`: The encrypted token as a hex string (string)
- `password`: The password to derive the decryption key from (string)

**Returns**: The decrypted token

**Process**:
1. Convert hex string back to buffer
2. Extract salt, IV, authTag, and encrypted data
3. Derive decryption key using PBKDF2
4. Create decipher with AES-256-GCM
5. Set authentication tag
6. Decrypt token

### 3.6 GitHubClient

#### 3.6.1 Class Definition

```typescript
export class GitHubClient {
  private httpClient: HttpClient;
  private authService: GitHubPATAuthService;
  private token: string;
  private _repositories: RepositoryService;
  private _branches: BranchService;
}
```

#### 3.6.2 Constructor

```typescript
constructor(token: string) {
  // Validate token format
  this.authService = new GitHubPATAuthService();
  if (!this.authService.validateToken(token)) {
    throw new Error('Invalid GitHub PAT format');
  }

  this.token = token;
  this.httpClient = new HttpClient({
    baseUrl: 'https://api.github.com',
    userAgent: 'bolt-diy-to-github-client'
  });

  // Initialize services
  this._repositories = new RepositoryService(this.httpClient, this.getAuthHeaders.bind(this));
  this._branches = new BranchService(this.httpClient, this.getAuthHeaders.bind(this));
}
```

#### 3.6.3 Methods

##### getAuthHeaders(): Record<string, string>

**Purpose**: Returns authentication headers for API requests

**Returns**: Object containing Authorization header

##### repositories

**Purpose**: Provides access to repository operations service

**Returns**: RepositoryService instance

##### branches

**Purpose**: Provides access to branch operations service

**Returns**: BranchService instance

## 4. Security Considerations

### 4.1 Token Validation

All tokens are validated before any API calls:
- Format validation using regular expressions
- Length and character set validation
- Null/undefined input validation

### 4.2 Secure Storage

Tokens are stored securely:
- Encryption using AES-256-GCM
- PBKDF2 key derivation with 100,000 iterations
- Random salt and IV for each encryption
- Authentication tags for data integrity

### 4.3 Error Handling

Proper error handling prevents information leakage:
- Generic error messages for authentication failures
- Specific error messages for validation failures
- No exposure of sensitive data in error messages

### 4.4 Communication Security

All communication with GitHub uses HTTPS:
- Secure API endpoints
- Proper TLS configuration
- Certificate validation

### 4.5 Input Validation

All inputs are validated:
- Type checking
- Length validation
- Format validation
- Sanitization where appropriate

## 5. Performance Considerations

### 5.1 Caching

Token validation results could be cached to improve performance:
- In-memory caching of validation results
- Time-based expiration of cached results

### 5.2 Asynchronous Operations

All network operations are asynchronous:
- Non-blocking API calls
- Proper error handling for timeouts
- Configurable timeout values

### 5.3 Memory Management

Efficient memory usage:
- Proper cleanup of resources
- Avoiding memory leaks
- Efficient data structures

## 6. Testing Strategy

### 6.1 Unit Testing

Comprehensive unit tests for all components:
- Input validation tests
- Error handling tests
- Success scenario tests
- Edge case tests

### 6.2 Integration Testing

Integration tests with GitHub API:
- Mocked API responses
- Real API calls for critical paths
- Performance testing

### 6.3 Security Testing

Security-focused testing:
- Token validation boundary testing
- Encryption/decryption verification
- Storage security testing

## 7. API Compatibility

### 7.1 GitHub API Versions

Compatible with GitHub REST API v3:
- Standard authentication headers
- Expected response formats
- Error handling conventions

### 7.2 Token Format Support

Support for current GitHub token formats:
- Classic Personal Access Tokens (ghp_)
- Fine-grained Personal Access Tokens (github_pat_)
- GitHub App tokens (ghu_)

## 8. Error Handling

### 8.1 Error Types

Defined error types for different scenarios:
- Authentication errors
- Validation errors
- Network errors
- Storage errors
- Encryption errors

### 8.2 Error Propagation

Proper error propagation:
- Maintaining error context
- Converting low-level errors to meaningful messages
- Preserving original error information

### 8.3 Recovery Strategies

Recovery strategies for different error types:
- Retry mechanisms for network errors
- Fallback mechanisms for authentication failures
- Graceful degradation for non-critical errors

## 9. Monitoring and Logging

### 9.1 Logging

Structured logging for debugging:
- Authentication attempts
- Token validation results
- Error conditions
- Performance metrics

### 9.2 Monitoring

Performance and health monitoring:
- Response time metrics
- Error rate tracking
- Authentication success rates
- Storage usage metrics

## 10. Future Enhancements

### 10.1 Multi-Factor Authentication

Support for additional authentication factors:
- TOTP support
- Hardware security keys
- Biometric authentication

### 10.2 Token Lifecycle Management

Advanced token management:
- Automatic token rotation
- Expiration monitoring
- Revocation handling

### 10.3 Enhanced Security Features

Additional security enhancements:
- Rate limiting
- Brute force protection
- Anomaly detection