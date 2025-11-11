# Task 02: Implement Repository Service

**Estimated Time: 10 minutes**

## Context
I'm analyzing this fresh with no assumptions about prior implementation. We need to implement the repository service that will handle repository operations like listing, creating, and deleting repositories.

## Current System State
- GitHubClient class created
- HTTP utility functions available
- Extended GitHub types for repositories
- Jest testing framework in place

## Your Task
Create the RepositoryService class that handles repository operations and integrate it with the GitHubClient.

## Test First (RED Phase)
```typescript
// Test for RepositoryService
import { GitHubClient } from '../src/github/GitHubClient';

describe('RepositoryService', () => {
  let client: GitHubClient;

  beforeEach(() => {
    // Using a valid token format for testing
    client = new GitHubClient('ghp_validtoken12345678901234567890123456');
  });

  it('should list repositories', async () => {
    // This will fail until we implement the method
    await expect(client.repositories.list()).rejects.toThrow();
  });

  it('should create a repository', async () => {
    // This will fail until we implement the method
    await expect(client.repositories.create({ name: 'test-repo' })).rejects.toThrow();
  });

  it('should get a repository', async () => {
    // This will fail until we implement the method
    await expect(client.repositories.get('owner', 'repo')).rejects.toThrow();
  });

  it('should delete a repository', async () => {
    // This will fail until we implement the method
    await expect(client.repositories.delete('owner', 'repo')).rejects.toThrow();
  });
});
```

Minimal Implementation (GREEN Phase)
```typescript
// Repository Service
import { HttpClient } from '../../utils/http';
import { Repository } from '../types/github';

export class RepositoryService {
  constructor(private httpClient: HttpClient, private getAuthHeaders: () => Record<string, string>) {}

  async list(): Promise<Repository[]> {
    // Placeholder implementation
    throw new Error('Not implemented');
  }

  async create(params: { name: string; [key: string]: any }): Promise<Repository> {
    // Placeholder implementation
    throw new Error('Not implemented');
  }

  async get(owner: string, repo: string): Promise<Repository> {
    // Placeholder implementation
    throw new Error('Not implemented');
  }

  async delete(owner: string, repo: string): Promise<void> {
    // Placeholder implementation
    throw new Error('Not implemented');
  }
}
```

Refactored Solution (REFACTOR Phase)
```typescript
// Repository Service
import { HttpClient } from '../../utils/http';
import { Repository } from '../types/github';

export class RepositoryService {
  constructor(private httpClient: HttpClient, private getAuthHeaders: () => Record<string, string>) {}

  /**
   * List repositories for the authenticated user
   * @returns Promise resolving to array of repositories
   */
  async list(): Promise<Repository[]> {
    try {
      const headers = this.getAuthHeaders();
      return await this.httpClient.get('/user/repos', headers);
    } catch (error) {
      throw new Error(`Failed to list repositories: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a new repository
   * @param params Repository creation parameters
   * @returns Promise resolving to the created repository
   */
  async create(params: { name: string; [key: string]: any }): Promise<Repository> {
    try {
      const headers = this.getAuthHeaders();
      return await this.httpClient.post('/user/repos', params, headers);
    } catch (error) {
      throw new Error(`Failed to create repository: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get a specific repository
   * @param owner Repository owner
   * @param repo Repository name
   * @returns Promise resolving to the repository
   */
  async get(owner: string, repo: string): Promise<Repository> {
    try {
      const headers = this.getAuthHeaders();
      return await this.httpClient.get(`/repos/${owner}/${repo}`, headers);
    } catch (error) {
      throw new Error(`Failed to get repository: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a repository
   * @param owner Repository owner
   * @param repo Repository name
   * @returns Promise resolving when deletion is complete
   */
  async delete(owner: string, repo: string): Promise<void> {
    try {
      const headers = this.getAuthHeaders();
      await this.httpClient.delete(`/repos/${owner}/${repo}`, headers);
    } catch (error) {
      throw new Error(`Failed to delete repository: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
[ ] RepositoryService class is created
[ ] list() method implemented for listing user repositories
[ ] create() method implemented for creating repositories
[ ] get() method implemented for getting repository details
[ ] delete() method implemented for deleting repositories
[ ] Proper error handling with descriptive messages
[ ] Integration with HTTP client and auth headers
[ ] Tests written and initially fail as expected
[ ] Implementation makes tests pass
[ ] Code compiles without warnings

Dependencies Confirmed
[HttpClient utility functions]
[GitHub repository types]
[Auth headers method from GitHubClient]

Next Task
task_03_implement_branch_service.md