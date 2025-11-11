# Task 30a: Error Handling Tests

**Estimated Time: 10 minutes**

## Context
I'm analyzing this fresh with no assumptions about prior implementation. We need to create comprehensive error handling tests to ensure our GitHub client properly handles various error scenarios.

## Current System State
- GitHubClient with RepositoryService and BranchService implemented
- HTTP utility functions with error handling
- Jest testing framework
- Existing error handling in services

## Your Task
Create error handling tests that verify proper error responses for various failure scenarios.

## Test First (RED Phase)
```typescript
// Error Handling Tests for GitHub Client
import { GitHubClient } from '../src/github/GitHubClient';

describe('GitHubClient Error Handling', () => {
  it('should handle network errors gracefully', () => {
    // This will fail until we implement the test
    expect(true).toBe(false);
  });
});
```

Minimal Implementation (GREEN Phase)
```typescript
// Error Handling Tests for GitHub Client
import { GitHubClient } from '../src/github/GitHubClient';

describe('GitHubClient Error Handling', () => {
  it('should handle invalid token format during initialization', () => {
    expect(() => new GitHubClient('invalid-token')).toThrow('Invalid GitHub PAT format');
  });
});
```

Refactored Solution (REFACTOR Phase)
```typescript
// Error Handling Tests for GitHub Client
import { GitHubClient } from '../src/github/GitHubClient';
import { RepositoryService } from '../src/github/repositories/RepositoryService';
import { BranchService } from '../src/github/branches/BranchService';
import { HttpClient } from '../src/utils/http';

describe('GitHubClient Error Handling', () => {
  describe('Client Initialization Errors', () => {
    it('should handle invalid token format during initialization', () => {
      expect(() => new GitHubClient('invalid-token')).toThrow('Invalid GitHub PAT format');
      expect(() => new GitHubClient('')).toThrow('Invalid GitHub PAT format');
      expect(() => new GitHubClient(null as any)).toThrow('Invalid GitHub PAT format');
    });

    it('should handle valid token format during initialization', () => {
      expect(() => new GitHubClient('ghp_validtoken12345678901234567890123456')).not.toThrow();
    });
  });

  describe('Repository Service Errors', () => {
    let repositoryService: RepositoryService;
    let mockHttpClient: jest.Mocked<HttpClient>;
    let mockGetAuthHeaders: jest.Mock;

    beforeEach(() => {
      mockHttpClient = {
        get: jest.fn(),
        post: jest.fn(),
        delete: jest.fn()
      } as any;

      mockGetAuthHeaders = jest.fn().mockReturnValue({ 'Authorization': 'token test-token' });

      repositoryService = new RepositoryService(mockHttpClient, mockGetAuthHeaders);
    });

    it('should handle network errors when listing repositories', async () => {
      mockHttpClient.get.mockRejectedValue(new Error('Network error'));

      await expect(repositoryService.list()).rejects.toThrow('Failed to list repositories: Network error');
    });

    it('should handle HTTP error responses when listing repositories', async () => {
      mockHttpClient.get.mockRejectedValue(new Error('HTTP 404: Not Found'));

      await expect(repositoryService.list()).rejects.toThrow('Failed to list repositories: HTTP 404: Not Found');
    });

    it('should handle timeout errors when listing repositories', async () => {
      mockHttpClient.get.mockRejectedValue(new Error('Timeout'));

      await expect(repositoryService.list()).rejects.toThrow('Failed to list repositories: Timeout');
    });

    it('should handle errors when creating repository with invalid data', async () => {
      mockHttpClient.post.mockRejectedValue(new Error('Invalid repository name'));

      await expect(repositoryService.create({ name: '' })).rejects.toThrow('Failed to create repository: Invalid repository name');
    });

    it('should handle authentication errors when accessing repository', async () => {
      mockHttpClient.get.mockRejectedValue(new Error('HTTP 401: Unauthorized'));

      await expect(repositoryService.get('owner', 'repo')).rejects.toThrow('Failed to get repository: HTTP 401: Unauthorized');
    });

    it('should handle permission errors when deleting repository', async () => {
      mockHttpClient.delete.mockRejectedValue(new Error('HTTP 403: Forbidden'));

      await expect(repositoryService.delete('owner', 'repo')).rejects.toThrow('Failed to delete repository: HTTP 403: Forbidden');
    });
  });

  describe('Branch Service Errors', () => {
    let branchService: BranchService;
    let mockHttpClient: jest.Mocked<HttpClient>;
    let mockGetAuthHeaders: jest.Mock;

    beforeEach(() => {
      mockHttpClient = {
        get: jest.fn(),
        post: jest.fn(),
        delete: jest.fn()
      } as any;

      mockGetAuthHeaders = jest.fn().mockReturnValue({ 'Authorization': 'token test-token' });

      branchService = new BranchService(mockHttpClient, mockGetAuthHeaders);
    });

    it('should handle repository not found when listing branches', async () => {
      mockHttpClient.get.mockRejectedValue(new Error('HTTP 404: Not Found'));

      await expect(branchService.list('nonexistent', 'repo')).rejects.toThrow('Failed to list branches: HTTP 404: Not Found');
    });

    it('should handle branch not found when getting specific branch', async () => {
      mockHttpClient.get.mockRejectedValue(new Error('HTTP 404: Not Found'));

      await expect(branchService.get('owner', 'repo', 'nonexistent')).rejects.toThrow('Failed to get branch: HTTP 404: Not Found');
    });

    it('should handle invalid SHA when creating branch', async () => {
      mockHttpClient.post.mockRejectedValue(new Error('Invalid SHA'));

      await expect(branchService.create('owner', 'repo', 'new-branch', 'invalid-sha')).rejects.toThrow('Failed to create branch: Invalid SHA');
    });

    it('should handle protected branch errors when deleting', async () => {
      mockHttpClient.delete.mockRejectedValue(new Error('HTTP 422: Cannot delete protected branch'));

      await expect(branchService.delete('owner', 'repo', 'main')).rejects.toThrow('Failed to delete branch: HTTP 422: Cannot delete protected branch');
    });
  });

  describe('HTTP Client Errors', () => {
    let mockGetAuthHeaders: jest.Mock;

    beforeEach(() => {
      mockGetAuthHeaders = jest.fn().mockReturnValue({ 'Authorization': 'token test-token' });
    });

    it('should handle timeout errors in HTTP client', async () => {
      const httpClient = new HttpClient({ timeout: 1 }); // 1ms timeout
      const repositoryService = new RepositoryService(httpClient, mockGetAuthHeaders);

      // This will likely timeout
      await expect(repositoryService.list()).rejects.toThrow();
    });

    it('should handle invalid base URL errors', async () => {
      const httpClient = new HttpClient({ baseUrl: 'invalid-url' });
      const repositoryService = new RepositoryService(httpClient, mockGetAuthHeaders);

      await expect(repositoryService.list()).rejects.toThrow();
    });
  });
});
```

Verification Commands
```bash
npm run typecheck
npm run test
```

Success Criteria
[ ] All error scenarios properly tested
[ ] Invalid token format handling verified
[ ] Network error handling verified
[ ] HTTP error response handling verified
[ ] Timeout error handling verified
[ ] Authentication error handling verified
[ ] Permission error handling verified
[ ] Repository/branch not found error handling verified
[ ] Tests pass with appropriate error messages
[ ] Code compiles without warnings

Dependencies Confirmed
[GitHubClient class]
[RepositoryService and BranchService]
[HttpClient utility functions]
[Jest testing framework]

Next Task
task_40a_documentation.md