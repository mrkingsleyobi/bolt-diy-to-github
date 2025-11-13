# Task 01: Implement GitHub Personal Access Token Authentication

**Estimated Time: 10 minutes**

## Context
I'm analyzing this fresh with no assumptions about prior implementation. This task implements GitHub Personal Access Token (PAT) authentication for the bolt-to-github integration. This is a core requirement for accessing GitHub APIs securely.

## Current System State
- Development environment is set up
- TypeScript project structure exists
- Basic GitHub API client foundation is in place

## Your Task
Implement Personal Access Token authentication for GitHub API access with proper token validation and error handling.

## Test First (RED Phase)
```typescript
// src/services/__tests__/githubAuth.test.ts
import { GitHubPATAuthService } from '../GitHubPATAuthService';

describe('GitHubPATAuthService', () => {
  it('should validate a valid PAT', () => {
    const authService = new GitHubPATAuthService();
    const validToken = 'ghp_validtoken1234567890abcdefghijklmnopqrstuvwxyz';
    expect(authService.validateToken(validToken)).toBe(true);
  });

  it('should reject an invalid PAT', () => {
    const authService = new GitHubPATAuthService();
    const invalidToken = 'invalid-token';
    expect(authService.validateToken(invalidToken)).toBe(false);
  });

  it('should authenticate with GitHub API using PAT', async () => {
    const authService = new GitHubPATAuthService();
    const validToken = 'ghp_validtoken1234567890abcdefghijklmnopqrstuvwxyz';
    await expect(authService.authenticate(validToken)).resolves.toHaveProperty('authenticated', true);
  });
});
```

Minimal Implementation (GREEN Phase)
```typescript
// src/services/GitHubPATAuthService.ts
export class GitHubPATAuthService {
  validateToken(token: string): boolean {
    // Basic PAT format validation (starts with ghp_ for personal access tokens)
    return /^ghp_[a-zA-Z0-9]{36}$/.test(token);
  }

  async authenticate(token: string): Promise<{ authenticated: boolean; user?: any }> {
    // Simple validation first
    if (!this.validateToken(token)) {
      return { authenticated: false };
    }

    // For minimal implementation, just return success
    return { authenticated: true, user: { login: 'test-user' } };
  }
}
```

Refactored Solution (REFACTOR Phase)
```typescript
// src/services/GitHubPATAuthService.ts
export class GitHubPATAuthService {
  private readonly PAT_REGEX = /^ghp_[a-zA-Z0-9]{36}$/;
  private readonly GITHUB_API_BASE = 'https://api.github.com';

  /**
   * Validates the format of a GitHub Personal Access Token
   * @param token The token to validate
   * @returns boolean indicating if the token format is valid
   */
  validateToken(token: string): boolean {
    if (!token || typeof token !== 'string') {
      return false;
    }
    return this.PAT_REGEX.test(token);
  }

  /**
   * Authenticates with GitHub API using a Personal Access Token
   * @param token The GitHub PAT to use for authentication
   * @returns Promise resolving to authentication result
   */
  async authenticate(token: string): Promise<{
    authenticated: boolean;
    user?: any;
    error?: string
  }> {
    // Validate input
    if (!token) {
      return {
        authenticated: false,
        error: 'Token is required'
      };
    }

    // Validate token format
    if (!this.validateToken(token)) {
      return {
        authenticated: false,
        error: 'Invalid token format'
      };
    }

    try {
      // Make a simple API call to verify the token
      const response = await fetch(`${this.GITHUB_API_BASE}/user`, {
        headers: {
          'Authorization': `token ${token}`,
          'User-Agent': 'bolt-to-github-extension'
        }
      });

      if (response.ok) {
        const user = await response.json();
        return { authenticated: true, user };
      } else if (response.status === 401) {
        return {
          authenticated: false,
          error: 'Invalid token credentials'
        };
      } else {
        return {
          authenticated: false,
          error: `GitHub API error: ${response.status}`
        };
      }
    } catch (error) {
      return {
        authenticated: false,
        error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}
```

Verification Commands
```bash
# Run the specific test for this implementation
npx jest src/services/__tests__/githubAuth.test.ts

# Run all tests to ensure no regressions
npm test

# Check TypeScript compilation
npm run typecheck
```

Success Criteria
- [ ] PAT validation function correctly identifies valid/invalid tokens
- [ ] Authentication method successfully verifies tokens with GitHub API
- [ ] Proper error handling for invalid tokens and network errors
- [ ] All tests pass with expected results
- [ ] TypeScript compiles without errors
- [ ] Implementation follows single responsibility principle

Dependencies Confirmed
- Node.js and npm/pnpm installed
- TypeScript configured for the project
- Jest testing framework available
- Internet connection for GitHub API calls
- GitHub Personal Access Token for testing (format: ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx)

Next Task
task_02_implement_github_app_authentication.md