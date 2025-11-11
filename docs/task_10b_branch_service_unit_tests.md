# Task 10b: Branch Service Unit Tests (London School TDD)

**Estimated Time: 10 minutes**

## Context
I'm analyzing this fresh with no assumptions about prior implementation. We need to create unit tests for the BranchService following London School TDD methodology, where we mock dependencies and test interactions.

## Current System State
- BranchService implemented
- HttpClient available for mocking
- Jest testing framework with mocking capabilities
- GitHub branch types defined

## Your Task
Create unit tests for the BranchService using London School TDD approach with mocks.

## Test First (RED Phase)
```typescript
// London School TDD Unit Tests for BranchService
import { BranchService } from '../src/github/branches/BranchService';
import { HttpClient } from '../src/utils/http';
import { Branch } from '../src/github/types/github';

describe('BranchService (London School TDD)', () => {
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

  describe('list', () => {
    it('should call httpClient.get with correct parameters', async () => {
      // This will fail until we implement the test
      expect(true).toBe(false);
    });
  });
});
```

Minimal Implementation (GREEN Phase)
```typescript
// London School TDD Unit Tests for BranchService
import { BranchService } from '../src/github/branches/BranchService';
import { HttpClient } from '../src/utils/http';
import { Branch } from '../src/github/types/github';

describe('BranchService (London School TDD)', () => {
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

  describe('list', () => {
    it('should call httpClient.get with correct path and headers', async () => {
      // Arrange
      const mockBranches: Branch[] = [
        { name: 'main', commit: { sha: 'abc123', url: 'url1' }, protected: true },
        { name: 'develop', commit: { sha: 'def456', url: 'url2' }, protected: false }
      ];
      mockHttpClient.get.mockResolvedValue(mockBranches);

      // Act
      const result = await branchService.list('owner', 'repo');

      // Assert
      expect(mockHttpClient.get).toHaveBeenCalledWith('/repos/owner/repo/branches', { 'Authorization': 'token test-token' });
      expect(result).toEqual(mockBranches);
    });
  });
});
```

Refactored Solution (REFACTOR Phase)
```typescript
// London School TDD Unit Tests for BranchService
import { BranchService } from '../src/github/branches/BranchService';
import { HttpClient } from '../src/utils/http';
import { Branch } from '../src/github/types/github';

describe('BranchService (London School TDD)', () => {
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

  describe('list', () => {
    it('should call httpClient.get with correct path and headers', async () => {
      // Arrange
      const mockBranches: Branch[] = [
        { name: 'main', commit: { sha: 'abc123', url: 'url1' }, protected: true },
        { name: 'develop', commit: { sha: 'def456', url: 'url2' }, protected: false }
      ];
      mockHttpClient.get.mockResolvedValue(mockBranches);

      // Act
      const result = await branchService.list('owner', 'repo');

      // Assert
      expect(mockHttpClient.get).toHaveBeenCalledWith('/repos/owner/repo/branches', { 'Authorization': 'token test-token' });
      expect(result).toEqual(mockBranches);
    });

    it('should handle errors when listing branches fails', async () => {
      // Arrange
      mockHttpClient.get.mockRejectedValue(new Error('Repository not found'));

      // Act & Assert
      await expect(branchService.list('owner', 'repo')).rejects.toThrow('Failed to list branches: Repository not found');
      expect(mockHttpClient.get).toHaveBeenCalledWith('/repos/owner/repo/branches', { 'Authorization': 'token test-token' });
    });
  });

  describe('get', () => {
    it('should call httpClient.get with correct path and headers', async () => {
      // Arrange
      const mockBranch: Branch = { name: 'main', commit: { sha: 'abc123', url: 'url1' }, protected: true };
      mockHttpClient.get.mockResolvedValue(mockBranch);

      // Act
      const result = await branchService.get('owner', 'repo', 'main');

      // Assert
      expect(mockHttpClient.get).toHaveBeenCalledWith('/repos/owner/repo/branches/main', { 'Authorization': 'token test-token' });
      expect(result).toEqual(mockBranch);
    });

    it('should handle errors when getting branch fails', async () => {
      // Arrange
      mockHttpClient.get.mockRejectedValue(new Error('Branch not found'));

      // Act & Assert
      await expect(branchService.get('owner', 'repo', 'main')).rejects.toThrow('Failed to get branch: Branch not found');
    });
  });

  describe('create', () => {
    it('should call httpClient.post with correct parameters', async () => {
      // Arrange
      const mockBranch: Branch = { name: 'feature', commit: { sha: 'xyz789', url: 'url3' }, protected: false };
      mockHttpClient.post.mockResolvedValue(mockBranch);
      const branchData = {
        ref: 'refs/heads/feature',
        sha: 'abc123'
      };

      // Act
      const result = await branchService.create('owner', 'repo', 'feature', 'abc123');

      // Assert
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/repos/owner/repo/git/refs',
        branchData,
        { 'Authorization': 'token test-token' }
      );
      expect(result).toEqual(mockBranch);
    });

    it('should handle errors when creating branch fails', async () => {
      // Arrange
      mockHttpClient.post.mockRejectedValue(new Error('Invalid SHA'));

      // Act & Assert
      await expect(branchService.create('owner', 'repo', 'feature', 'invalid-sha')).rejects.toThrow('Failed to create branch: Invalid SHA');
    });
  });

  describe('delete', () => {
    it('should call httpClient.delete with correct path and headers', async () => {
      // Arrange
      mockHttpClient.delete.mockResolvedValue(undefined);

      // Act
      await branchService.delete('owner', 'repo', 'feature');

      // Assert
      expect(mockHttpClient.delete).toHaveBeenCalledWith('/repos/owner/repo/git/refs/heads/feature', { 'Authorization': 'token test-token' });
    });

    it('should handle errors when deleting branch fails', async () => {
      // Arrange
      mockHttpClient.delete.mockRejectedValue(new Error('Branch is protected'));

      // Act & Assert
      await expect(branchService.delete('owner', 'repo', 'main')).rejects.toThrow('Failed to delete branch: Branch is protected');
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
[ ] Unit tests written following London School TDD approach
[ ] All BranchService methods tested with mocks
[ ] Positive and negative test cases covered
[ ] Proper verification of interactions with HttpClient
[ ] Tests initially fail as expected (when written first)
[ ] Implementation makes all tests pass
[ ] Code compiles without warnings

Dependencies Confirmed
[BranchService class]
[HttpClient for mocking]
[Jest testing framework]

Next Task
task_20a_integration_tests.md