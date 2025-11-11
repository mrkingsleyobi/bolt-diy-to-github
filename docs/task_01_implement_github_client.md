# Task 01: Implement GitHub Client Class

**Estimated Time: 10 minutes**

## Context
I'm analyzing this fresh with no assumptions about prior implementation. We need to create the main GitHubClient class that will coordinate authentication and API requests.

## Current System State
- Existing GitHub PAT authentication service
- HTTP utility functions created
- Extended GitHub types available
- Jest testing framework in place

## Your Task
Create the main GitHubClient class that integrates with the existing authentication service and uses our HTTP utilities.

## Test First (RED Phase)
```typescript
// Test for GitHubClient
import { GitHubClient } from '../src/github/GitHubClient';

describe('GitHubClient', () => {
  it('should create an instance with a valid token', () => {
    const client = new GitHubClient('ghp_validtoken12345678901234567890123456');
    expect(client).toBeInstanceOf(GitHubClient);
  });

  it('should throw an error for invalid token format', () => {
    expect(() => {
      new GitHubClient('invalid-token');
    }).toThrow('Invalid GitHub PAT format');
  });

  it('should have repository and branch services', () => {
    const client = new GitHubClient('ghp_validtoken12345678901234567890123456');
    expect(client.repositories).toBeDefined();
    expect(client.branches).toBeDefined();
  });
});
```

Minimal Implementation (GREEN Phase)
```typescript
// Main GitHub Client
import { HttpClient } from '../utils/http';
import { GitHubPATAuthService } from '../../services/GitHubPATAuthService';

export class GitHubClient {
  private httpClient: HttpClient;
  private authService: GitHubPATAuthService;
  private token: string;

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
  }

  get repositories() {
    // Placeholder for repository service
    return {};
  }

  get branches() {
    // Placeholder for branch service
    return {};
  }
}
```

Refactored Solution (REFACTOR Phase)
```typescript
// Main GitHub Client
import { HttpClient } from '../utils/http';
import { GitHubPATAuthService } from '../../services/GitHubPATAuthService';

export class GitHubClient {
  private httpClient: HttpClient;
  private authService: GitHubPATAuthService;
  private token: string;

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
  }

  private getAuthHeaders(): Record<string, string> {
    return {
      'Authorization': `token ${this.token}`
    };
  }

  get repositories() {
    // Placeholder for repository service
    return {};
  }

  get branches() {
    // Placeholder for branch service
    return {};
  }
}
```

Verification Commands
```bash
npm run typecheck
npm run test
```

Success Criteria
[ ] GitHubClient class is created with token validation
[ ] Integration with existing PAT authentication service
[ ] HTTP client instantiated with proper configuration
[ ] Auth headers method for API requests
[ ] Tests written and initially fail as expected
[ ] Implementation makes tests pass
[ ] Code compiles without warnings
[ ] Invalid token format throws appropriate error

Dependencies Confirmed
[Existing GitHubPATAuthService]
[HttpClient utility functions]
[GitHub types]

Next Task
task_02_implement_repository_service.md