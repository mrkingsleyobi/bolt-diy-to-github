# Task 04: Integrate Services with GitHub Client

**Estimated Time: 8 minutes**

## Context
I'm analyzing this fresh with no assumptions about prior implementation. We need to integrate the RepositoryService and BranchService with the GitHubClient.

## Current System State
- GitHubClient class created with basic structure
- RepositoryService implemented
- BranchService implemented
- HTTP utility functions available
- Jest testing framework in place

## Your Task
Update the GitHubClient to instantiate and expose the RepositoryService and BranchService.

## Test First (RED Phase)
```typescript
// Test for GitHubClient service integration
import { GitHubClient } from '../src/github/GitHubClient';

describe('GitHubClient Service Integration', () => {
  let client: GitHubClient;

  beforeEach(() => {
    // Using a valid token format for testing
    client = new GitHubClient('ghp_validtoken12345678901234567890123456');
  });

  it('should have repository service with all methods', () => {
    expect(client.repositories).toBeDefined();
    expect(typeof client.repositories.list).toBe('function');
    expect(typeof client.repositories.create).toBe('function');
    expect(typeof client.repositories.get).toBe('function');
    expect(typeof client.repositories.delete).toBe('function');
  });

  it('should have branch service with all methods', () => {
    expect(client.branches).toBeDefined();
    expect(typeof client.branches.list).toBe('function');
    expect(typeof client.branches.get).toBe('function');
    expect(typeof client.branches.create).toBe('function');
    expect(typeof client.branches.delete).toBe('function');
  });
});
```

Minimal Implementation (GREEN Phase)
```typescript
// Main GitHub Client with service integration
import { HttpClient } from '../utils/http';
import { GitHubPATAuthService } from '../../services/GitHubPATAuthService';
import { RepositoryService } from './repositories/RepositoryService';
import { BranchService } from './branches/BranchService';

export class GitHubClient {
  private httpClient: HttpClient;
  private authService: GitHubPATAuthService;
  private token: string;
  private _repositories: RepositoryService;
  private _branches: BranchService;

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

  private getAuthHeaders(): Record<string, string> {
    return {
      'Authorization': `token ${this.token}`
    };
  }

  get repositories() {
    return this._repositories;
  }

  get branches() {
    return this._branches;
  }
}
```

Refactored Solution (REFACTOR Phase)
Same as implementation since we're just integrating the services.

Verification Commands
```bash
npm run typecheck
npm run test
```

Success Criteria
[ ] GitHubClient instantiates RepositoryService and BranchService
[ ] Services are accessible via repositories and branches properties
[ ] Services receive HTTP client and auth headers function
[ ] Tests written and initially fail as expected
[ ] Implementation makes tests pass
[ ] Code compiles without warnings

Dependencies Confirmed
[RepositoryService class]
[BranchService class]
[HttpClient utility functions]
[GitHubPATAuthService]

Next Task
task_10a_repository_service_unit_tests.md