// London School TDD Unit Tests for FileService
import { FileService } from '../FileService';
import { HttpClient } from '../../../utils/http';
import { FileContent, FileCreateParams, FileUpdateParams, FileDeleteParams, BatchFileOperation } from '../../types/github';

describe('FileService (London School TDD)', () => {
  let fileService: FileService;
  let mockHttpClient: jest.Mocked<HttpClient>;
  let mockGetAuthHeaders: jest.Mock;

  beforeEach(() => {
    mockHttpClient = {
      get: jest.fn(),
      post: jest.fn(),
      delete: jest.fn()
    } as any;

    mockGetAuthHeaders = jest.fn().mockReturnValue({ 'Authorization': 'token test-token' });

    fileService = new FileService(mockHttpClient, mockGetAuthHeaders);
  });

  describe('get', () => {
    it('should call httpClient.get with correct path and headers for file content', async () => {
      // Arrange
      const mockFileContent: FileContent = {
        type: 'file',
        encoding: 'base64',
        size: 123,
        name: 'test.txt',
        path: 'path/to/test.txt',
        content: 'dGVzdCBjb250ZW50',
        sha: 'abc123',
        url: 'https://api.github.com/repos/owner/repo/contents/path/to/test.txt',
        git_url: 'https://api.github.com/repos/owner/repo/git/blobs/abc123',
        html_url: 'https://github.com/owner/repo/blob/main/path/to/test.txt',
        download_url: 'https://raw.githubusercontent.com/owner/repo/main/path/to/test.txt'
      };
      mockHttpClient.get.mockResolvedValue(mockFileContent);

      // Act
      const result = await fileService.get('owner', 'repo', 'path/to/test.txt');

      // Assert
      expect(mockHttpClient.get).toHaveBeenCalledWith('/repos/owner/repo/contents/path/to/test.txt', { 'Authorization': 'token test-token' });
      expect(result).toEqual(mockFileContent);
    });

    it('should handle HTTP errors when getting file content fails', async () => {
      // Arrange
      mockHttpClient.get.mockRejectedValue(new Error('File not found'));

      // Act & Assert
      await expect(fileService.get('owner', 'repo', 'path/to/test.txt')).rejects.toThrow('Failed to get file content: File not found');
      expect(mockHttpClient.get).toHaveBeenCalledWith('/repos/owner/repo/contents/path/to/test.txt', { 'Authorization': 'token test-token' });
    });
  });

  describe('create', () => {
    it('should call httpClient.put with correct parameters for file creation', async () => {
      // Arrange
      const createParams: FileCreateParams = {
        message: 'Create test file',
        content: 'dGVzdCBjb250ZW50', // base64 encoded "test content"
        branch: 'main'
      };
      const mockResult = {
        content: {
          type: 'file',
          encoding: 'base64',
          size: 12,
          name: 'test.txt',
          path: 'path/to/test.txt',
          content: 'dGVzdCBjb250ZW50',
          sha: 'def456',
          url: 'https://api.github.com/repos/owner/repo/contents/path/to/test.txt',
          git_url: 'https://api.github.com/repos/owner/repo/git/blobs/def456',
          html_url: 'https://github.com/owner/repo/blob/main/path/to/test.txt',
          download_url: 'https://raw.githubusercontent.com/owner/repo/main/path/to/test.txt'
        },
        commit: {
          sha: 'commit123',
          node_id: 'commit_node123',
          url: 'https://api.github.com/repos/owner/repo/commits/commit123',
          html_url: 'https://github.com/owner/repo/commit/commit123',
          author: {
            date: '2023-01-01T00:00:00Z',
            name: 'Test User',
            email: 'test@example.com'
          },
          committer: {
            date: '2023-01-01T00:00:00Z',
            name: 'Test User',
            email: 'test@example.com'
          },
          message: 'Create test file',
          tree: {
            url: 'https://api.github.com/repos/owner/repo/tree/commit123',
            sha: 'tree123'
          },
          parents: [{
            url: 'https://api.github.com/repos/owner/repo/commits/parent123',
            html_url: 'https://github.com/owner/repo/commit/parent123',
            sha: 'parent123'
          }]
        }
      };
      mockHttpClient.post.mockResolvedValue(mockResult);

      // Act
      const result = await fileService.create('owner', 'repo', 'path/to/test.txt', createParams);

      // Assert
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/repos/owner/repo/contents/path/to/test.txt',
        createParams,
        { 'Authorization': 'token test-token' }
      );
      expect(result).toEqual(mockResult);
    });

    it('should handle errors when creating file fails', async () => {
      // Arrange
      const createParams: FileCreateParams = {
        message: 'Create test file',
        content: 'dGVzdCBjb250ZW50',
        branch: 'main'
      };
      mockHttpClient.post.mockRejectedValue(new Error('Invalid file path'));

      // Act & Assert
      await expect(fileService.create('owner', 'repo', 'path/to/test.txt', createParams)).rejects.toThrow('Failed to create file: Invalid file path');
    });
  });

  describe('update', () => {
    it('should call httpClient.put with correct parameters for file update', async () => {
      // Arrange
      const updateParams: FileUpdateParams = {
        message: 'Update test file',
        content: 'dXBkYXRlZCBjb250ZW50', // base64 encoded "updated content"
        sha: 'abc123',
        branch: 'main'
      };
      const mockResult = {
        content: {
          type: 'file',
          encoding: 'base64',
          size: 16,
          name: 'test.txt',
          path: 'path/to/test.txt',
          content: 'dXBkYXRlZCBjb250ZW50',
          sha: 'def456',
          url: 'https://api.github.com/repos/owner/repo/contents/path/to/test.txt',
          git_url: 'https://api.github.com/repos/owner/repo/git/blobs/def456',
          html_url: 'https://github.com/owner/repo/blob/main/path/to/test.txt',
          download_url: 'https://raw.githubusercontent.com/owner/repo/main/path/to/test.txt'
        },
        commit: {
          sha: 'commit456',
          node_id: 'commit_node456',
          url: 'https://api.github.com/repos/owner/repo/commits/commit456',
          html_url: 'https://github.com/owner/repo/commit/commit456',
          author: {
            date: '2023-01-01T00:00:00Z',
            name: 'Test User',
            email: 'test@example.com'
          },
          committer: {
            date: '2023-01-01T00:00:00Z',
            name: 'Test User',
            email: 'test@example.com'
          },
          message: 'Update test file',
          tree: {
            url: 'https://api.github.com/repos/owner/repo/tree/commit456',
            sha: 'tree456'
          },
          parents: [{
            url: 'https://api.github.com/repos/owner/repo/commits/parent456',
            html_url: 'https://github.com/owner/repo/commit/parent456',
            sha: 'parent456'
          }]
        }
      };
      mockHttpClient.post.mockResolvedValue(mockResult);

      // Act
      const result = await fileService.update('owner', 'repo', 'path/to/test.txt', updateParams);

      // Assert
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/repos/owner/repo/contents/path/to/test.txt',
        updateParams,
        { 'Authorization': 'token test-token' }
      );
      expect(result).toEqual(mockResult);
    });

    it('should handle errors when updating file fails', async () => {
      // Arrange
      const updateParams: FileUpdateParams = {
        message: 'Update test file',
        content: 'dXBkYXRlZCBjb250ZW50',
        sha: 'abc123',
        branch: 'main'
      };
      mockHttpClient.post.mockRejectedValue(new Error('SHA mismatch'));

      // Act & Assert
      await expect(fileService.update('owner', 'repo', 'path/to/test.txt', updateParams)).rejects.toThrow('Failed to update file: SHA mismatch');
    });
  });

  describe('delete', () => {
    it('should call httpClient.delete with correct parameters for file deletion', async () => {
      // Arrange
      const deleteParams: FileDeleteParams = {
        message: 'Delete test file',
        sha: 'abc123',
        branch: 'main'
      };
      const mockResult = {
        commit: {
          sha: 'commit789',
          node_id: 'commit_node789',
          url: 'https://api.github.com/repos/owner/repo/commits/commit789',
          html_url: 'https://github.com/owner/repo/commit/commit789',
          author: {
            date: '2023-01-01T00:00:00Z',
            name: 'Test User',
            email: 'test@example.com'
          },
          committer: {
            date: '2023-01-01T00:00:00Z',
            name: 'Test User',
            email: 'test@example.com'
          },
          message: 'Delete test file',
          tree: {
            url: 'https://api.github.com/repos/owner/repo/tree/commit789',
            sha: 'tree789'
          },
          parents: [{
            url: 'https://api.github.com/repos/owner/repo/commits/parent789',
            html_url: 'https://github.com/owner/repo/commit/parent789',
            sha: 'parent789'
          }]
        }
      };
      mockHttpClient.post.mockResolvedValue(mockResult);

      // Act
      const result = await fileService.delete('owner', 'repo', 'path/to/test.txt', deleteParams);

      // Assert
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/repos/owner/repo/contents/path/to/test.txt',
        deleteParams,
        { 'Authorization': 'token test-token' }
      );
      expect(result).toEqual(mockResult);
    });

    it('should handle errors when deleting file fails', async () => {
      // Arrange
      const deleteParams: FileDeleteParams = {
        message: 'Delete test file',
        sha: 'abc123',
        branch: 'main'
      };
      mockHttpClient.post.mockRejectedValue(new Error('File not found'));

      // Act & Assert
      await expect(fileService.delete('owner', 'repo', 'path/to/test.txt', deleteParams)).rejects.toThrow('Failed to delete file: File not found');
    });
  });

  describe('batch', () => {
    it('should process multiple file operations concurrently', async () => {
      // Arrange
      const operations: BatchFileOperation[] = [
        {
          path: 'file1.txt',
          operation: 'create',
          content: 'ZmlsZTEgY29udGVudA==', // base64 encoded "file1 content"
          message: 'Create file1'
        },
        {
          path: 'file2.txt',
          operation: 'create',
          content: 'ZmlsZTIgY29udGVudA==', // base64 encoded "file2 content"
          message: 'Create file2'
        }
      ];

      const mockResults = [
        {
          path: 'file1.txt',
          success: true,
          result: {
            content: {
              type: 'file',
              encoding: 'base64',
              size: 13,
              name: 'file1.txt',
              path: 'file1.txt',
              content: 'ZmlsZTEgY29udGVudA==',
              sha: 'sha1',
              url: 'url1',
              git_url: 'git_url1',
              html_url: 'html_url1',
              download_url: 'download_url1'
            },
            commit: {
              sha: 'commit1',
              node_id: 'node1',
              url: 'url1',
              html_url: 'html_url1',
              author: {
                date: '2023-01-01T00:00:00Z',
                name: 'Test User',
                email: 'test@example.com'
              },
              committer: {
                date: '2023-01-01T00:00:00Z',
                name: 'Test User',
                email: 'test@example.com'
              },
              message: 'Create file1',
              tree: {
                url: 'tree_url1',
                sha: 'tree1'
              },
              parents: [{
                url: 'parent_url1',
                html_url: 'parent_html_url1',
                sha: 'parent1'
              }]
            }
          }
        },
        {
          path: 'file2.txt',
          success: true,
          result: {
            content: {
              type: 'file',
              encoding: 'base64',
              size: 13,
              name: 'file2.txt',
              path: 'file2.txt',
              content: 'ZmlsZTIgY29udGVudA==',
              sha: 'sha2',
              url: 'url2',
              git_url: 'git_url2',
              html_url: 'html_url2',
              download_url: 'download_url2'
            },
            commit: {
              sha: 'commit2',
              node_id: 'node2',
              url: 'url2',
              html_url: 'html_url2',
              author: {
                date: '2023-01-01T00:00:00Z',
                name: 'Test User',
                email: 'test@example.com'
              },
              committer: {
                date: '2023-01-01T00:00:00Z',
                name: 'Test User',
                email: 'test@example.com'
              },
              message: 'Create file2',
              tree: {
                url: 'tree_url2',
                sha: 'tree2'
              },
              parents: [{
                url: 'parent_url2',
                html_url: 'parent_html_url2',
                sha: 'parent2'
              }]
            }
          }
        }
      ];

      // Mock the individual operations
      (fileService as any).create = jest.fn().mockResolvedValueOnce(mockResults[0].result).mockResolvedValueOnce(mockResults[1].result);

      // Act
      const result = await fileService.batch('owner', 'repo', operations);

      // Assert
      expect(result).toEqual(mockResults);
      expect((fileService as any).create).toHaveBeenCalledTimes(2);
      expect((fileService as any).create).toHaveBeenNthCalledWith(1, 'owner', 'repo', 'file1.txt', expect.any(Object));
      expect((fileService as any).create).toHaveBeenNthCalledWith(2, 'owner', 'repo', 'file2.txt', expect.any(Object));
    });

    it('should handle errors in batch operations gracefully', async () => {
      // Arrange
      const operations: BatchFileOperation[] = [
        {
          path: 'file1.txt',
          operation: 'create',
          content: 'ZmlsZTEgY29udGVudA==',
          message: 'Create file1'
        },
        {
          path: 'file2.txt',
          operation: 'create',
          content: 'ZmlsZTIgY29udGVudA==',
          message: 'Create file2'
        }
      ];

      // Mock the first operation to succeed and second to fail
      (fileService as any).create = jest.fn()
        .mockResolvedValueOnce({
          content: {
            type: 'file',
            encoding: 'base64',
            size: 13,
            name: 'file1.txt',
            path: 'file1.txt',
            content: 'ZmlsZTEgY29udGVudA==',
            sha: 'sha1',
            url: 'url1',
            git_url: 'git_url1',
            html_url: 'html_url1',
            download_url: 'download_url1'
          },
          commit: {
            sha: 'commit1',
            // ... rest of commit data
          }
        })
        .mockRejectedValueOnce(new Error('Insufficient permissions'));

      // Act
      const result = await fileService.batch('owner', 'repo', operations);

      // Assert
      expect(result[0].success).toBe(true);
      expect(result[1].success).toBe(false);
      expect(result[1].error).toBe('Insufficient permissions');
    });
  });
});