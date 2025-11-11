// London School TDD Unit Tests for RepositoryService
import { RepositoryService } from '../RepositoryService';
import { HttpClient } from '../../../utils/http';
import { Repository } from '../../types/github';

describe('RepositoryService (London School TDD)', () => {
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

  describe('list', () => {
    it('should call httpClient.get with correct path and headers', async () => {
      // Arrange
      const mockRepositories: Repository[] = [
        { id: 1, name: 'repo1' } as Repository,
        { id: 2, name: 'repo2' } as Repository
      ];
      mockHttpClient.get.mockResolvedValue(mockRepositories);

      // Act
      const result = await repositoryService.list();

      // Assert
      expect(mockHttpClient.get).toHaveBeenCalledWith('/user/repos', { 'Authorization': 'token test-token' });
      expect(result).toEqual(mockRepositories);
    });

    it('should handle HTTP errors when listing repositories fails', async () => {
      // Arrange
      mockHttpClient.get.mockRejectedValue(new Error('Network error'));

      // Act & Assert
      await expect(repositoryService.list()).rejects.toThrow('Failed to list repositories: Network error');
      expect(mockHttpClient.get).toHaveBeenCalledWith('/user/repos', { 'Authorization': 'token test-token' });
    });
  });

  describe('create', () => {
    it('should call httpClient.post with correct parameters', async () => {
      // Arrange
      const createParams = { name: 'new-repo', private: true };
      const mockRepository = { id: 1, name: 'new-repo' } as Repository;
      mockHttpClient.post.mockResolvedValue(mockRepository);

      // Act
      const result = await repositoryService.create(createParams);

      // Assert
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/user/repos',
        createParams,
        { 'Authorization': 'token test-token' }
      );
      expect(result).toEqual(mockRepository);
    });

    it('should handle errors when creating repository fails', async () => {
      // Arrange
      const createParams = { name: 'new-repo' };
      mockHttpClient.post.mockRejectedValue(new Error('Invalid repository name'));

      // Act & Assert
      await expect(repositoryService.create(createParams)).rejects.toThrow('Failed to create repository: Invalid repository name');
    });
  });

  describe('get', () => {
    it('should call httpClient.get with correct path and headers', async () => {
      // Arrange
      const mockRepository = { id: 1, name: 'test-repo' } as Repository;
      mockHttpClient.get.mockResolvedValue(mockRepository);

      // Act
      const result = await repositoryService.get('owner', 'repo');

      // Assert
      expect(mockHttpClient.get).toHaveBeenCalledWith('/repos/owner/repo', { 'Authorization': 'token test-token' });
      expect(result).toEqual(mockRepository);
    });

    it('should handle errors when getting repository fails', async () => {
      // Arrange
      mockHttpClient.get.mockRejectedValue(new Error('Repository not found'));

      // Act & Assert
      await expect(repositoryService.get('owner', 'repo')).rejects.toThrow('Failed to get repository: Repository not found');
    });
  });

  describe('delete', () => {
    it('should call httpClient.delete with correct path and headers', async () => {
      // Arrange
      mockHttpClient.delete.mockResolvedValue(undefined);

      // Act
      await repositoryService.delete('owner', 'repo');

      // Assert
      expect(mockHttpClient.delete).toHaveBeenCalledWith('/repos/owner/repo', { 'Authorization': 'token test-token' });
    });

    it('should handle errors when deleting repository fails', async () => {
      // Arrange
      mockHttpClient.delete.mockRejectedValue(new Error('Permission denied'));

      // Act & Assert
      await expect(repositoryService.delete('owner', 'repo')).rejects.toThrow('Failed to delete repository: Permission denied');
    });
  });
});