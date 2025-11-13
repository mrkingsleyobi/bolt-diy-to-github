# Task 03: Implement Branch Service

**Estimated Time: 10 minutes**

## Context
I'm analyzing this fresh with no assumptions about prior implementation. We need to implement the branch service that will handle branch operations like listing, creating, and deleting branches.

## Current System State
- GitHubClient class created
- RepositoryService implemented
- HTTP utility functions available
- Extended GitHub types for branches
- Jest testing framework in place

## Your Task
Create the BranchService class that handles branch operations and integrate it with the GitHubClient.

## Test First (RED Phase)
```typescript
// Test for BranchService
import { GitHubClient } from '../src/github/GitHubClient';

describe('BranchService', () => {
  let client: GitHubClient;

  beforeEach(() => {
    // Using a valid token format for testing
    client = new GitHubClient('ghp_validtoken12345678901234567890123456');
  });

  it('should list branches for a repository', async () => {
    // This will fail until we implement the method
    await expect(client.branches.list('owner', 'repo')).rejects.toThrow();
  });

  it('should get a specific branch', async () => {
    // This will fail until we implement the method
    await expect(client.branches.get('owner', 'repo', 'branch')).rejects.toThrow();
  });

  it('should create a branch', async () => {
    // This will fail until we implement the method
    await expect(client.branches.create('owner', 'repo', 'branch', 'sha')).rejects.toThrow();
  });

  it('should delete a branch', async () => {
    // This will fail until we implement the method
    await expect(client.branches.delete('owner', 'repo', 'branch')).rejects.toThrow();
  });
});
```

Minimal Implementation (GREEN Phase)
```typescript
// Branch Service
import { HttpClient } from '../../utils/http';
import { Branch } from '../types/github';

export class BranchService {
  constructor(private httpClient: HttpClient, private getAuthHeaders: () => Record<string, string>) {}

  async list(owner: string, repo: string): Promise<Branch[]> {
    // Placeholder implementation
    throw new Error('Not implemented');
  }

  async get(owner: string, repo: string, branch: string): Promise<Branch> {
    // Placeholder implementation
    throw new Error('Not implemented');
  }

  async create(owner: string, repo: string, branch: string, sha: string): Promise<Branch> {
    // Placeholder implementation
    throw new Error('Not implemented');
  }

  async delete(owner: string, repo: string, branch: string): Promise<void> {
    // Placeholder implementation
    throw new Error('Not implemented');
  }
}
```

Refactored Solution (REFACTOR Phase)
```typescript
// Branch Service
import { HttpClient } from '../../utils/http';
import { Branch } from '../types/github';

export class BranchService {
  constructor(private httpClient: HttpClient, private getAuthHeaders: () => Record<string, string>) {}

  /**
   * List branches for a repository
   * @param owner Repository owner
   * @param repo Repository name
   * @returns Promise resolving to array of branches
   */
  async list(owner: string, repo: string): Promise<Branch[]> {
    try {
      const headers = this.getAuthHeaders();
      return await this.httpClient.get(`/repos/${owner}/${repo}/branches`, headers);
    } catch (error) {
      throw new Error(`Failed to list branches: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get a specific branch
   * @param owner Repository owner
   * @param repo Repository name
   * @param branch Branch name
   * @returns Promise resolving to the branch
   */
  async get(owner: string, repo: string, branch: string): Promise<Branch> {
    try {
      const headers = this.getAuthHeaders();
      return await this.httpClient.get(`/repos/${owner}/${repo}/branches/${branch}`, headers);
    } catch (error) {
      throw new Error(`Failed to get branch: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a new branch
   * @param owner Repository owner
   * @param repo Repository name
   * @param branch New branch name
   * @param sha SHA of the commit to branch from
   * @returns Promise resolving to the created branch
   */
  async create(owner: string, repo: string, branch: string, sha: string): Promise<Branch> {
    try {
      const headers = this.getAuthHeaders();
      const data = {
        ref: `refs/heads/${branch}`,
        sha
      };
      return await this.httpClient.post(`/repos/${owner}/${repo}/git/refs`, data, headers);
    } catch (error) {
      throw new Error(`Failed to create branch: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a branch
   * @param owner Repository owner
   * @param repo Repository name
   * @param branch Branch name
   * @returns Promise resolving when deletion is complete
   */
  async delete(owner: string, repo: string, branch: string): Promise<void> {
    try {
      const headers = this.getAuthHeaders();
      await this.httpClient.delete(`/repos/${owner}/${repo}/git/refs/heads/${branch}`, headers);
    } catch (error) {
      throw new Error(`Failed to delete branch: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
```

Verification Commands
```bash
npm run typecheck
npm run test
```

Success Criteria
[ ] BranchService class is created
[ ] list() method implemented for listing repository branches
[ ] get() method implemented for getting branch details
[ ] create() method implemented for creating branches
[ ] delete() method implemented for deleting branches
[ ] Proper error handling with descriptive messages
[ ] Integration with HTTP client and auth headers
[ ] Tests written and initially fail as expected
[ ] Implementation makes tests pass
[ ] Code compiles without warnings

Dependencies Confirmed
[HttpClient utility functions]
[GitHub branch types]
[Auth headers method from GitHubClient]

Next Task
task_10a_repository_service_unit_tests.md