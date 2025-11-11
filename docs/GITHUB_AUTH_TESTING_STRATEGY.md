# GitHub Authentication Services Testing Strategy

## 1. Overview

This document outlines the comprehensive testing strategy for the GitHub authentication services implemented in Phase 1. The testing approach follows the London School Test-Driven Development methodology with a focus on behavior-driven testing, isolation, and comprehensive coverage.

## 2. Testing Philosophy

### 2.1 London School TDD

The testing approach follows the London School of Test-Driven Development which emphasizes:

- **Outside-In Development**: Tests are written from the perspective of the consumer of the service
- **Behavior Focus**: Tests focus on behavior and interactions rather than implementation details
- **Mocking**: External dependencies (GitHub API) are mocked to isolate the unit under test
- **Interaction Testing**: Verification of how services interact with dependencies

### 2.2 Test Pyramid

The testing strategy follows the test pyramid:

1. **Unit Tests** (70%): Individual component testing with mocks
2. **Integration Tests** (20%): Service integration and real API testing
3. **End-to-End Tests** (10%): Full workflow testing (covered in higher phases)

## 3. Test Environment

### 3.1 Tools

- **Jest**: Testing framework
- **TS-Jest**: TypeScript support for Jest
- **Jest Mocks**: For mocking external dependencies
- **Test Utilities**: Custom test helpers in `src/test-utils/`

### 3.2 Configuration

- **Test Environment**: Node.js with jsdom for DOM-related tests
- **Test Database**: In-memory storage for token storage tests
- **Mock API**: Jest mocks for GitHub API endpoints
- **Test Data**: Predefined test tokens and user data

### 3.3 Test Data

#### 3.3.1 Valid Test Tokens

```typescript
// Classic PATs
const VALID_CLASSIC_PAT = 'ghp_validtoken12345678901234567890123456';
const VALID_CLASSIC_PAT_2 = 'ghp_abcdefghijklmnopqrstuvwxyz1234567890';

// Fine-grained PATs
const VALID_FINE_GRAINED_PAT = 'github_pat_11AAABBBCCCCDDDDEEE_abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890abcdefghijk';

// GitHub App tokens
const VALID_APP_TOKEN = 'ghu_validtoken12345678901234567890123456';
```

#### 3.3.2 Invalid Test Tokens

```typescript
// Invalid formats
const INVALID_FORMAT_TOKEN = 'invalid-token';
const INVALID_PREFIX_TOKEN = 'invalid_validtoken12345678901234567890123456';
const TOO_SHORT_TOKEN = 'ghp_short';
const TOO_LONG_TOKEN = 'ghp_validtoken12345678901234567890123456toolong';
const INVALID_CHARS_TOKEN = 'ghp_validtoken1234567890123456789012345!';

// Invalid types
const NULL_TOKEN = null;
const UNDEFINED_TOKEN = undefined;
const NUMBER_TOKEN = 123;
const OBJECT_TOKEN = {};
```

#### 3.3.3 Mock User Data

```typescript
const MOCK_GITHUB_USER = {
  login: 'test-user',
  id: 123456,
  node_id: 'MDQ6VXNlcjEyMzQ1Ng==',
  avatar_url: 'https://avatars.githubusercontent.com/u/123456?v=4',
  gravatar_id: '',
  url: 'https://api.github.com/users/test-user',
  html_url: 'https://github.com/test-user',
  followers_url: 'https://api.github.com/users/test-user/followers',
  following_url: 'https://api.github.com/users/test-user/following{/other_user}',
  gists_url: 'https://api.github.com/users/test-user/gists{/gist_id}',
  starred_url: 'https://api.github.com/users/test-user/starred{/owner}{/repo}',
  subscriptions_url: 'https://api.github.com/users/test-user/subscriptions',
  organizations_url: 'https://api.github.com/users/test-user/orgs',
  repos_url: 'https://api.github.com/users/test-user/repos',
  events_url: 'https://api.github.com/users/test-user/events{/privacy}',
  received_events_url: 'https://api.github.com/users/test-user/received_events',
  type: 'User',
  site_admin: false,
  name: 'Test User',
  company: null,
  blog: '',
  location: 'San Francisco',
  email: null,
  hireable: null,
  bio: null,
  twitter_username: null,
  public_repos: 10,
  public_gists: 5,
  followers: 20,
  following: 30,
  created_at: '2020-01-01T00:00:00Z',
  updated_at: '2021-01-01T00:00:00Z'
};
```

## 4. Unit Test Coverage

### 4.1 GitHubPATAuthService Tests

#### 4.1.1 validateToken Method Tests

```typescript
describe('validateToken', () => {
  // Valid token tests
  it('should return true for a valid PAT format', () => {
    expect(authService.validateToken(VALID_CLASSIC_PAT)).toBe(true);
  });

  // Invalid format tests
  it('should return false for an invalid PAT format', () => {
    expect(authService.validateToken(INVALID_FORMAT_TOKEN)).toBe(false);
  });

  // Null/undefined tests
  it('should return false for null or undefined tokens', () => {
    expect(authService.validateToken(NULL_TOKEN)).toBe(false);
    expect(authService.validateToken(UNDEFINED_TOKEN)).toBe(false);
  });

  // Type tests
  it('should return false for non-string tokens', () => {
    expect(authService.validateToken(NUMBER_TOKEN)).toBe(false);
    expect(authService.validateToken(OBJECT_TOKEN)).toBe(false);
  });

  // Length tests
  it('should return false for tokens with incorrect length', () => {
    expect(authService.validateToken(TOO_SHORT_TOKEN)).toBe(false);
    expect(authService.validateToken(TOO_LONG_TOKEN)).toBe(false);
  });

  // Character tests
  it('should return false for tokens with invalid characters', () => {
    expect(authService.validateToken(INVALID_CHARS_TOKEN)).toBe(false);
  });
});
```

#### 4.1.2 authenticate Method Tests

```typescript
describe('authenticate', () => {
  // Successful authentication
  it('should authenticate successfully with a valid token', async () => {
    // Mock successful API response
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(MOCK_GITHUB_USER)
    });

    const result = await authService.authenticate(VALID_CLASSIC_PAT);

    expect(result).toEqual({
      authenticated: true,
      user: MOCK_GITHUB_USER
    });

    // Verify API call
    expect(global.fetch).toHaveBeenCalledWith('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${VALID_CLASSIC_PAT}`,
        'User-Agent': 'bolt-to-github-extension'
      }
    });
  });

  // Invalid token format
  it('should handle invalid token during authentication', async () => {
    const result = await authService.authenticate(INVALID_FORMAT_TOKEN);

    expect(result).toEqual({
      authenticated: false,
      error: 'Invalid token format'
    });
  });

  // Missing token
  it('should handle missing token during authentication', async () => {
    const result = await authService.authenticate('');
    expect(result).toEqual({
      authenticated: false,
      error: 'Token is required'
    });
  });

  // 401 Unauthorized
  it('should handle 401 response from GitHub API', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401
    });

    const result = await authService.authenticate(VALID_CLASSIC_PAT);
    expect(result).toEqual({
      authenticated: false,
      error: 'Invalid token credentials'
    });
  });

  // Other HTTP errors
  it('should handle other HTTP errors from GitHub API', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500
    });

    const result = await authService.authenticate(VALID_CLASSIC_PAT);
    expect(result).toEqual({
      authenticated: false,
      error: 'GitHub API error: 500'
    });
  });

  // Network errors
  it('should handle network errors', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

    const result = await authService.authenticate(VALID_CLASSIC_PAT);
    expect(result).toEqual({
      authenticated: false,
      error: 'Network error: Network error'
    });
  });

  // Unknown errors
  it('should handle unknown errors', async () => {
    global.fetch = jest.fn().mockRejectedValue('Unknown error');

    const result = await authService.authenticate(VALID_CLASSIC_PAT);
    expect(result).toEqual({
      authenticated: false,
      error: 'Network error: Unknown error'
    });
  });
});
```

### 4.2 GitHubAppAuthService Tests

#### 4.2.1 exchangeCodeForToken Method Tests

```typescript
describe('exchangeCodeForToken', () => {
  // Successful token exchange
  it('should exchange code for token successfully', async () => {
    const mockTokenResponse = { access_token: 'ghu_testtoken12345678901234567890123456' };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockTokenResponse)
    });

    const result = await appAuthService.exchangeCodeForToken('auth-code');

    expect(result).toEqual({
      success: true,
      token: 'ghu_testtoken12345678901234567890123456'
    });
  });

  // Missing code
  it('should handle missing authorization code', async () => {
    const result = await appAuthService.exchangeCodeForToken('');
    expect(result).toEqual({
      success: false,
      error: 'Authorization code is required'
    });
  });

  // API error response
  it('should handle API error response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request'
    });

    const result = await appAuthService.exchangeCodeForToken('auth-code');
    expect(result).toEqual({
      success: false,
      error: 'GitHub API error: 400 Bad Request'
    });
  });

  // No access token in response
  it('should handle missing access token in response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({})
    });

    const result = await appAuthService.exchangeCodeForToken('auth-code');
    expect(result).toEqual({
      success: false,
      error: 'Failed to obtain access token from GitHub'
    });
  });

  // Network error
  it('should handle network errors', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

    const result = await appAuthService.exchangeCodeForToken('auth-code');
    expect(result).toEqual({
      success: false,
      error: 'Network error: Network error'
    });
  });
});
```

#### 4.2.2 validateToken Method Tests

```typescript
describe('validateToken', () => {
  it('should return true for a valid app token format', () => {
    expect(appAuthService.validateToken(VALID_APP_TOKEN)).toBe(true);
  });

  it('should return false for an invalid app token format', () => {
    expect(appAuthService.validateToken(INVALID_FORMAT_TOKEN)).toBe(false);
  });

  // Additional tests similar to PAT validation
});
```

#### 4.2.3 authenticate Method Tests

```typescript
describe('authenticate', () => {
  // Similar tests to GitHubPATAuthService authenticate method
  // but using app tokens
});
```

### 4.3 EnhancedGitHubPATAuthService Tests

#### 4.3.1 validateTokenFormat Method Tests

```typescript
describe('validateTokenFormat', () => {
  it('should validate classic PATs', () => {
    expect(enhancedAuthService.validateTokenFormat(VALID_CLASSIC_PAT)).toBe(true);
  });

  it('should validate fine-grained PATs', () => {
    expect(enhancedAuthService.validateTokenFormat(VALID_FINE_GRAINED_PAT)).toBe(true);
  });

  it('should reject invalid formats', () => {
    expect(enhancedAuthService.validateTokenFormat(INVALID_FORMAT_TOKEN)).toBe(false);
  });
});
```

#### 4.3.2 validateTokenWithAPI Method Tests

```typescript
describe('validateTokenWithAPI', () => {
  it('should validate token with API successfully', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(MOCK_GITHUB_USER)
    });

    const result = await enhancedAuthService.validateTokenWithAPI(VALID_CLASSIC_PAT);

    expect(result).toEqual({
      valid: true,
      user: MOCK_GITHUB_USER
    });
  });

  // Similar tests for error conditions
});
```

#### 4.3.3 Storage Methods Tests

```typescript
describe('storage methods', () => {
  it('should store and retrieve tokens', () => {
    enhancedAuthService.storeToken('user1', VALID_CLASSIC_PAT);
    const token = enhancedAuthService.retrieveToken('user1');
    expect(token).toBe(VALID_CLASSIC_PAT);
  });

  it('should reject invalid tokens for storage', () => {
    expect(() => {
      enhancedAuthService.storeToken('user1', INVALID_FORMAT_TOKEN);
    }).toThrow('Cannot store invalid token format');
  });

  it('should return undefined for non-existent tokens', () => {
    const token = enhancedAuthService.retrieveToken('non-existent');
    expect(token).toBeUndefined();
  });
});
```

#### 4.3.4 authenticate Methods Tests

```typescript
describe('authenticate methods', () => {
  it('should authenticate with stored token', async () => {
    enhancedAuthService.storeToken('user1', VALID_CLASSIC_PAT);

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(MOCK_GITHUB_USER)
    });

    const result = await enhancedAuthService.authenticateWithStoredToken('user1');

    expect(result).toEqual({
      authenticated: true,
      user: MOCK_GITHUB_USER
    });
  });

  it('should handle missing stored token', async () => {
    const result = await enhancedAuthService.authenticateWithStoredToken('non-existent');

    expect(result).toEqual({
      authenticated: false,
      error: 'No stored token found for key'
    });
  });
});
```

### 4.4 TokenEncryptionService Tests

#### 4.4.1 encryptToken Method Tests

```typescript
describe('encryptToken', () => {
  it('should encrypt and decrypt tokens successfully', async () => {
    const password = 'test-password';
    const token = VALID_CLASSIC_PAT;

    const encrypted = await encryptionService.encryptToken(token, password);
    const decrypted = await encryptionService.decryptToken(encrypted, password);

    expect(decrypted).toBe(token);
    expect(encrypted).not.toBe(token);
  });

  it('should produce different encrypted output for same input', async () => {
    const password = 'test-password';
    const token = VALID_CLASSIC_PAT;

    const encrypted1 = await encryptionService.encryptToken(token, password);
    const encrypted2 = await encryptionService.encryptToken(token, password);

    expect(encrypted1).not.toBe(encrypted2);
  });
});
```

#### 4.4.2 decryptToken Method Tests

```typescript
describe('decryptToken', () => {
  it('should decrypt previously encrypted tokens', async () => {
    const password = 'test-password';
    const token = VALID_CLASSIC_PAT;

    const encrypted = await encryptionService.encryptToken(token, password);
    const decrypted = await encryptionService.decryptToken(encrypted, password);

    expect(decrypted).toBe(token);
  });

  it('should throw error for invalid password', async () => {
    const password = 'test-password';
    const wrongPassword = 'wrong-password';
    const token = VALID_CLASSIC_PAT;

    const encrypted = await encryptionService.encryptToken(token, password);

    await expect(encryptionService.decryptToken(encrypted, wrongPassword))
      .rejects.toThrow('Failed to decrypt token');
  });

  it('should throw error for corrupted data', async () => {
    const corruptedData = 'invalid-hex-data';
    const password = 'test-password';

    await expect(encryptionService.decryptToken(corruptedData, password))
      .rejects.toThrow('Failed to decrypt token');
  });
});
```

### 4.5 SecureTokenStorage Tests

#### 4.5.1 storeToken Method Tests

```typescript
describe('storeToken', () => {
  it('should store encrypted tokens', async () => {
    const password = 'test-password';
    const token = VALID_CLASSIC_PAT;
    const key = 'test-key';

    await tokenStorage.storeToken(token, password, key);

    // Verify token is stored (encrypted)
    const storedTokens = JSON.parse(localStorage.getItem('github_tokens'));
    expect(storedTokens[key]).toBeDefined();
    expect(storedTokens[key]).not.toBe(token);
  });
});
```

#### 4.5.2 retrieveToken Method Tests

```typescript
describe('retrieveToken', () => {
  it('should retrieve and decrypt stored tokens', async () => {
    const password = 'test-password';
    const token = VALID_CLASSIC_PAT;
    const key = 'test-key';

    await tokenStorage.storeToken(token, password, key);
    const retrievedToken = await tokenStorage.retrieveToken(password, key);

    expect(retrievedToken).toBe(token);
  });

  it('should throw error for non-existent keys', async () => {
    const password = 'test-password';
    const key = 'non-existent-key';

    await expect(tokenStorage.retrieveToken(password, key))
      .rejects.toThrow('No token found for key');
  });
});
```

#### 4.5.3 Utility Methods Tests

```typescript
describe('utility methods', () => {
  it('should check token existence', async () => {
    const password = 'test-password';
    const token = VALID_CLASSIC_PAT;
    const key = 'test-key';

    expect(tokenStorage.hasToken(key)).toBe(false);

    await tokenStorage.storeToken(token, password, key);

    expect(tokenStorage.hasToken(key)).toBe(true);
  });

  it('should remove tokens', async () => {
    const password = 'test-password';
    const token = VALID_CLASSIC_PAT;
    const key = 'test-key';

    await tokenStorage.storeToken(token, password, key);
    expect(tokenStorage.hasToken(key)).toBe(true);

    tokenStorage.removeToken(key);
    expect(tokenStorage.hasToken(key)).toBe(false);
  });

  it('should list token keys', async () => {
    const password = 'test-password';
    const token1 = VALID_CLASSIC_PAT;
    const token2 = VALID_CLASSIC_PAT_2;
    const key1 = 'test-key-1';
    const key2 = 'test-key-2';

    await tokenStorage.storeToken(token1, password, key1);
    await tokenStorage.storeToken(token2, password, key2);

    const keys = tokenStorage.getTokenKeys();
    expect(keys).toContain(key1);
    expect(keys).toContain(key2);
    expect(keys.length).toBe(2);
  });
});
```

## 5. Integration Test Coverage

### 5.1 Real API Integration Tests

```typescript
describe('GitHub API Integration', () => {
  // Only run if environment variables are set
  const testToken = process.env.GITHUB_TEST_TOKEN;

  if (testToken) {
    it('should authenticate with real GitHub API', async () => {
      const result = await authService.authenticate(testToken);
      expect(result.authenticated).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user.login).toBeDefined();
    }, 10000); // 10 second timeout

    it('should handle invalid real tokens', async () => {
      const result = await authService.authenticate('ghp_invalidtoken12345678901234567890123456');
      expect(result.authenticated).toBe(false);
      expect(result.error).toBeDefined();
    }, 10000);
  } else {
    it('should skip real API tests (no test token provided)', () => {
      console.log('Skipping real API tests - set GITHUB_TEST_TOKEN environment variable to run');
    });
  }
});
```

### 5.2 Service Integration Tests

```typescript
describe('Service Integration', () => {
  it('should work with SecureTokenStorage and TokenEncryptionService', async () => {
    const password = 'test-password';
    const token = VALID_CLASSIC_PAT;
    const key = 'integration-test';

    // Store token using SecureTokenStorage
    await tokenStorage.storeToken(token, password, key);

    // Retrieve token using SecureTokenStorage
    const retrievedToken = await tokenStorage.retrieveToken(password, key);

    // Validate retrieved token using GitHubPATAuthService
    const isValid = authService.validateToken(retrievedToken);
    expect(isValid).toBe(true);
  });
});
```

## 6. Error Scenario Testing

### 6.1 Network Error Scenarios

```typescript
describe('Network Error Scenarios', () => {
  it('should handle timeout errors', async () => {
    // Mock timeout scenario
    global.fetch = jest.fn().mockImplementation(() => {
      return new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), 100);
      });
    });

    const result = await authService.authenticate(VALID_CLASSIC_PAT);
    expect(result.authenticated).toBe(false);
    expect(result.error).toContain('Network error');
  });

  it('should handle DNS errors', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('ENOTFOUND'));

    const result = await authService.authenticate(VALID_CLASSIC_PAT);
    expect(result.authenticated).toBe(false);
    expect(result.error).toContain('Network error');
  });
});
```

### 6.2 Authentication Error Scenarios

```typescript
describe('Authentication Error Scenarios', () => {
  it('should handle rate limiting', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 403,
      headers: {
        get: (header) => {
          if (header === 'x-ratelimit-remaining') return '0';
          if (header === 'x-ratelimit-reset') return Math.floor(Date.now()/1000 + 3600);
          return null;
        }
      }
    });

    const result = await authService.authenticate(VALID_CLASSIC_PAT);
    expect(result.authenticated).toBe(false);
    expect(result.error).toContain('GitHub API error');
  });

  it('should handle account suspension', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: () => Promise.resolve({ message: 'Sorry. Your account was suspended.' })
    });

    const result = await authService.authenticate(VALID_CLASSIC_PAT);
    expect(result.authenticated).toBe(false);
    expect(result.error).toContain('GitHub API error');
  });
});
```

## 7. Security Testing

### 7.1 Token Validation Security Tests

```typescript
describe('Token Validation Security', () => {
  it('should not expose token values in validation', () => {
    const result = authService.validateToken(VALID_CLASSIC_PAT);
    // Validation should not log or expose token values
    expect(console.log).not.toHaveBeenCalledWith(expect.stringContaining(VALID_CLASSIC_PAT));
  });

  it('should not leak information through error messages', () => {
    const result = authService.authenticate('invalid-token');
    expect(result.error).not.toContain('ghp_');
    expect(result.error).not.toContain('github_pat_');
  });
});
```

### 7.2 Encryption Security Tests

```typescript
describe('Encryption Security', () => {
  it('should not store plain text tokens', async () => {
    const password = 'test-password';
    const token = VALID_CLASSIC_PAT;
    const key = 'security-test';

    await tokenStorage.storeToken(token, password, key);

    const storedData = localStorage.getItem('github_tokens');
    expect(storedData).not.toContain(token);
    expect(storedData).toContain('github_tokens');
  });

  it('should use secure key derivation', async () => {
    // This would require mocking the crypto module to verify PBKDF2 usage
    // with 100,000 iterations
  });

  it('should generate different IVs for each encryption', async () => {
    const password = 'test-password';
    const token = VALID_CLASSIC_PAT;

    const encrypted1 = await encryptionService.encryptToken(token, password);
    const encrypted2 = await encryptionService.encryptToken(token, password);

    // Extract IVs (implementation dependent)
    // Verify they are different
  });
});
```

## 8. Performance Testing

### 8.1 Token Validation Performance

```typescript
describe('Performance', () => {
  it('should validate tokens quickly', () => {
    const startTime = performance.now();

    for (let i = 0; i < 1000; i++) {
      authService.validateToken(VALID_CLASSIC_PAT);
    }

    const endTime = performance.now();
    const avgTime = (endTime - startTime) / 1000;

    expect(avgTime).toBeLessThan(1); // Less than 1ms per validation
  });

  it('should encrypt/decrypt tokens within reasonable time', async () => {
    const password = 'test-password';
    const token = VALID_CLASSIC_PAT;

    const startTime = performance.now();

    for (let i = 0; i < 100; i++) {
      const encrypted = await encryptionService.encryptToken(token, password);
      await encryptionService.decryptToken(encrypted, password);
    }

    const endTime = performance.now();
    const avgTime = (endTime - startTime) / 100;

    expect(avgTime).toBeLessThan(50); // Less than 50ms per encrypt/decrypt cycle
  });
});
```

## 9. Test Execution Strategy

### 9.1 Test Commands

```bash
# Run all authentication service tests
npm run test:auth

# Run specific service tests
npm run test:auth -- src/services/__tests__/githubAuth.test.ts
npm run test:auth -- src/services/__tests__/githubAppAuth.test.ts
npm run test:auth -- src/security/__tests__/TokenEncryptionService.test.ts
npm run test:auth -- src/services/storage/__tests__/SecureTokenStorage.test.ts

# Run integration tests
npm run test:integration:auth

# Run security tests
npm run test:security:auth

# Run performance tests
npm run test:performance:auth

# Run with coverage
npm run test:auth -- --coverage
```

### 9.2 Continuous Integration

```yaml
# GitHub Actions workflow for authentication tests
name: Authentication Tests

on:
  push:
    branches: [ main, develop ]
    paths:
      - 'src/services/**'
      - 'src/security/**'
      - 'src/services/storage/**'
      - 'tests/auth/**'
  pull_request:
    branches: [ main ]
    paths:
      - 'src/services/**'
      - 'src/security/**'
      - 'src/services/storage/**'
      - 'tests/auth/**'

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [16.x, 18.x, 20.x]

    steps:
    - uses: actions/checkout@v3
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    - run: npm ci
    - run: npm run test:auth
    - run: npm run test:integration:auth
    - run: npm run test:security:auth
```

## 10. Test Quality Metrics

### 10.1 Coverage Requirements

- **Statement Coverage**: 100%
- **Branch Coverage**: 100%
- **Function Coverage**: 100%
- **Line Coverage**: 100%

### 10.2 Quality Gates

```javascript
// jest.config.js coverage thresholds
coverageThreshold: {
  global: {
    branches: 100,
    functions: 100,
    lines: 100,
    statements: 100
  }
}
```

### 10.3 Mutation Testing

```bash
# Run mutation tests to verify test quality
npx stryker run stryker.auth.conf.js
```

## 11. Test Maintenance

### 11.1 Test Data Management

- Use factory functions for test data creation
- Maintain separate test data sets for different scenarios
- Regularly update mock data to match GitHub API changes

### 11.2 Test Environment Management

- Use environment variables for sensitive test data
- Implement proper test isolation
- Clean up test data after each test run

### 11.3 Test Documentation

- Document complex test scenarios
- Maintain test naming conventions
- Update tests when requirements change

## 12. Monitoring and Reporting

### 12.1 Test Execution Reports

- Generate HTML test reports
- Track test execution times
- Monitor coverage trends over time

### 12.2 Test Health Metrics

- Track flaky test occurrences
- Monitor test execution performance
- Report on test coverage gaps

This comprehensive testing strategy ensures that the GitHub authentication services are robust, secure, and reliable, meeting the high standards required for production use in the bolt-diy-to-github integration.