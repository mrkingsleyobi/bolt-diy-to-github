// Error Handling Tests for GitHub Client
import { GitHubClient } from '../GitHubClient';
import { RepositoryService } from '../repositories/RepositoryService';
import { BranchService } from '../branches/BranchService';
import { HttpClient } from '../../utils/http';

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