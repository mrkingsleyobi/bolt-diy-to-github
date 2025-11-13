// TokenValidationService.test.ts - Unit tests for TokenValidationService
// Phase 4: Environment Configuration Management - Task 10: Implement token validation and refresh tests

import { TokenValidationService } from '../../../src/services/TokenValidationService';
import { GitHubPATAuthService } from '../../../src/services/GitHubPATAuthService';
import { GitHubAppAuthService } from '../../../src/services/GitHubAppAuthService';
import { TokenEncryptionService } from '../../../src/security/TokenEncryptionService';
import { AuthResult } from '../../../src/types/github';

// Mock the GitHub authentication services
jest.mock('../../../src/services/GitHubPATAuthService');
jest.mock('../../../src/services/GitHubAppAuthService');

describe('TokenValidationService', () => {
  let tokenValidationService: TokenValidationService;
  let mockGitHubPatAuthService: jest.Mocked<GitHubPATAuthService>;
  let mockGitHubAppAuthService: jest.Mocked<GitHubAppAuthService>;
  let tokenEncryptionService: TokenEncryptionService;
  const encryptionPassword = 'test-password';

  beforeEach(() => {
    // Create mock instances
    mockGitHubPatAuthService = new GitHubPATAuthService() as jest.Mocked<GitHubPATAuthService>;
    mockGitHubAppAuthService = new GitHubAppAuthService('test-client-id', 'test-client-secret') as jest.Mocked<GitHubAppAuthService>;
    tokenEncryptionService = new TokenEncryptionService();

    // Create the service instance
    tokenValidationService = new TokenValidationService(
      mockGitHubPatAuthService,
      tokenEncryptionService,
      encryptionPassword,
      mockGitHubAppAuthService
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateToken', () => {
    it('should validate a GitHub PAT token successfully', async () => {
      // Mock the token encryption service to return a decrypted token
      jest.spyOn(tokenEncryptionService, 'decryptToken').mockResolvedValue('ghp_valid-token-string');

      // Mock the PAT auth service to return a successful authentication
      mockGitHubPatAuthService.validateToken.mockReturnValue(true);
      mockGitHubPatAuthService.authenticate.mockResolvedValue({
        authenticated: true,
        user: {
          login: 'testuser',
          id: 12345,
          node_id: 'test-node-id',
          avatar_url: 'https://avatars.githubusercontent.com/u/12345',
          gravatar_id: '',
          url: 'https://api.github.com/users/testuser',
          html_url: 'https://github.com/testuser',
          followers_url: 'https://api.github.com/users/testuser/followers',
          following_url: 'https://api.github.com/users/testuser/following{/other_user}',
          gists_url: 'https://api.github.com/users/testuser/gists{/gist_id}',
          starred_url: 'https://api.github.com/users/testuser/starred{/owner}{/repo}',
          subscriptions_url: 'https://api.github.com/users/testuser/subscriptions',
          organizations_url: 'https://api.github.com/users/testuser/orgs',
          repos_url: 'https://api.github.com/users/testuser/repos',
          events_url: 'https://api.github.com/users/testuser/events{/privacy}',
          received_events_url: 'https://api.github.com/users/testuser/received_events',
          type: 'User',
          site_admin: false,
          name: 'Test User',
          company: null,
          blog: '',
          location: null,
          email: null,
          hireable: null,
          bio: null,
          twitter_username: null,
          public_repos: 10,
          public_gists: 5,
          followers: 20,
          following: 30,
          created_at: '2020-01-01T00:00:00Z',
          updated_at: '2020-01-02T00:00:00Z'
        }
      });

      const encryptedToken = 'encrypted-token-string';
      const result = await tokenValidationService.validateToken(encryptedToken, 'github-pat');

      expect(result.valid).toBe(true);
      expect(tokenEncryptionService.decryptToken).toHaveBeenCalledWith(encryptedToken, encryptionPassword);
      expect(mockGitHubPatAuthService.validateToken).toHaveBeenCalledWith('ghp_valid-token-string');
      expect(mockGitHubPatAuthService.authenticate).toHaveBeenCalledWith('ghp_valid-token-string');
    });

    it('should handle decryption failure', async () => {
      // Mock the token encryption service to throw an error
      jest.spyOn(tokenEncryptionService, 'decryptToken').mockRejectedValue(new Error('Decryption failed'));

      const encryptedToken = 'invalid-encrypted-token';
      const result = await tokenValidationService.validateToken(encryptedToken, 'github-pat');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Failed to decrypt token');
    });

    it('should handle unsupported token type', async () => {
      const encryptedToken = 'encrypted-token-string';
      const result = await tokenValidationService.validateToken(encryptedToken, 'unsupported-type');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Unsupported token type: unsupported-type');
    });

    it('should handle GitHub PAT validation failure', async () => {
      // Mock the token encryption service to return a decrypted token
      jest.spyOn(tokenEncryptionService, 'decryptToken').mockResolvedValue('invalid-token-string');

      // Mock the PAT auth service to return a failed authentication
      mockGitHubPatAuthService.validateToken.mockReturnValue(false);

      const encryptedToken = 'encrypted-token-string';
      const result = await tokenValidationService.validateToken(encryptedToken, 'github-pat');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid GitHub PAT format');
    });

    it('should handle GitHub PAT authentication failure', async () => {
      // Mock the token encryption service to return a decrypted token
      jest.spyOn(tokenEncryptionService, 'decryptToken').mockResolvedValue('ghp_valid-token-string');

      // Mock the PAT auth service to return a failed authentication
      mockGitHubPatAuthService.validateToken.mockReturnValue(true);
      mockGitHubPatAuthService.authenticate.mockResolvedValue({
        authenticated: false,
        error: 'Invalid token credentials'
      });

      const encryptedToken = 'encrypted-token-string';
      const result = await tokenValidationService.validateToken(encryptedToken, 'github-pat');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('GitHub PAT authentication failed');
    });
  });

  describe('refreshToken', () => {
    it('should refresh a GitHub App token successfully', async () => {
      // Mock the token encryption service
      jest.spyOn(tokenEncryptionService, 'decryptToken').mockResolvedValue('refresh-code');
      jest.spyOn(tokenEncryptionService, 'encryptToken').mockResolvedValue('encrypted-new-token');

      // Mock the GitHub App auth service
      mockGitHubAppAuthService.exchangeCodeForToken.mockResolvedValue({
        success: true,
        token: 'new-access-token'
      });

      const refreshToken = 'encrypted-refresh-token';
      const result = await tokenValidationService.refreshToken(refreshToken, 'github-app');

      expect(result.success).toBe(true);
      expect(result.token).toBe('encrypted-new-token');
      expect(tokenEncryptionService.decryptToken).toHaveBeenCalledWith(refreshToken, encryptionPassword);
      expect(mockGitHubAppAuthService.exchangeCodeForToken).toHaveBeenCalledWith('refresh-code');
      expect(tokenEncryptionService.encryptToken).toHaveBeenCalledWith('new-access-token', encryptionPassword);
    });

    it('should handle refresh failure', async () => {
      // Mock the token encryption service
      jest.spyOn(tokenEncryptionService, 'decryptToken').mockResolvedValue('refresh-code');

      // Mock the GitHub App auth service to return a failure
      mockGitHubAppAuthService.exchangeCodeForToken.mockResolvedValue({
        success: false,
        error: 'Failed to refresh token'
      });

      const refreshToken = 'encrypted-refresh-token';
      const result = await tokenValidationService.refreshToken(refreshToken, 'github-app');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to refresh GitHub App token');
    });

    it('should handle GitHub PAT refresh attempt', async () => {
      const refreshToken = 'encrypted-refresh-token';
      const result = await tokenValidationService.refreshToken(refreshToken, 'github-pat');

      expect(result.success).toBe(false);
      expect(result.error).toBe('GitHub PAT tokens cannot be refreshed');
    });
  });

  describe('validateTokens', () => {
    it('should validate multiple tokens in parallel', async () => {
      // Mock the token encryption service
      jest.spyOn(tokenEncryptionService, 'decryptToken')
        .mockResolvedValueOnce('ghp_token1')
        .mockResolvedValueOnce('ghu_token2');

      // Mock the PAT auth service
      mockGitHubPatAuthService.validateToken.mockReturnValue(true);
      mockGitHubPatAuthService.authenticate.mockResolvedValue({
        authenticated: true,
        user: {
          login: 'testuser',
          id: 12345,
          node_id: 'test-node-id',
          avatar_url: 'https://avatars.githubusercontent.com/u/12345',
          gravatar_id: '',
          url: 'https://api.github.com/users/testuser',
          html_url: 'https://github.com/testuser',
          followers_url: 'https://api.github.com/users/testuser/followers',
          following_url: 'https://api.github.com/users/testuser/following{/other_user}',
          gists_url: 'https://api.github.com/users/testuser/gists{/gist_id}',
          starred_url: 'https://api.github.com/users/testuser/starred{/owner}{/repo}',
          subscriptions_url: 'https://api.github.com/users/testuser/subscriptions',
          organizations_url: 'https://api.github.com/users/testuser/orgs',
          repos_url: 'https://api.github.com/users/testuser/repos',
          events_url: 'https://api.github.com/users/testuser/events{/privacy}',
          received_events_url: 'https://api.github.com/users/testuser/received_events',
          type: 'User',
          site_admin: false,
          name: 'Test User',
          company: null,
          blog: '',
          location: null,
          email: null,
          hireable: null,
          bio: null,
          twitter_username: null,
          public_repos: 10,
          public_gists: 5,
          followers: 20,
          following: 30,
          created_at: '2020-01-01T00:00:00Z',
          updated_at: '2020-01-02T00:00:00Z'
        }
      });

      // Mock the App auth service
      mockGitHubAppAuthService.validateToken.mockReturnValue(true);
      mockGitHubAppAuthService.authenticate.mockResolvedValue({
        authenticated: true,
        user: {
          login: 'testuser',
          id: 12345,
          node_id: 'test-node-id',
          avatar_url: 'https://avatars.githubusercontent.com/u/12345',
          gravatar_id: '',
          url: 'https://api.github.com/users/testuser',
          html_url: 'https://github.com/testuser',
          followers_url: 'https://api.github.com/users/testuser/followers',
          following_url: 'https://api.github.com/users/testuser/following{/other_user}',
          gists_url: 'https://api.github.com/users/testuser/gists{/gist_id}',
          starred_url: 'https://api.github.com/users/testuser/starred{/owner}{/repo}',
          subscriptions_url: 'https://api.github.com/users/testuser/subscriptions',
          organizations_url: 'https://api.github.com/users/testuser/orgs',
          repos_url: 'https://api.github.com/users/testuser/repos',
          events_url: 'https://api.github.com/users/testuser/events{/privacy}',
          received_events_url: 'https://api.github.com/users/testuser/received_events',
          type: 'User',
          site_admin: false,
          name: 'Test User',
          company: null,
          blog: '',
          location: null,
          email: null,
          hireable: null,
          bio: null,
          twitter_username: null,
          public_repos: 10,
          public_gists: 5,
          followers: 20,
          following: 30,
          created_at: '2020-01-01T00:00:00Z',
          updated_at: '2020-01-02T00:00:00Z'
        }
      });

      const tokens = {
        githubPat: { token: 'encrypted-token1', type: 'github-pat' },
        githubApp: { token: 'encrypted-token2', type: 'github-app' }
      };

      const results = await tokenValidationService.validateTokens(tokens);

      expect(results.githubPat.valid).toBe(true);
      expect(results.githubApp.valid).toBe(true);
      expect(Object.keys(results)).toHaveLength(2);
    });
  });

  describe('refreshTokens', () => {
    it('should refresh multiple tokens in parallel', async () => {
      // Mock the token encryption service
      jest.spyOn(tokenEncryptionService, 'decryptToken')
        .mockResolvedValueOnce('refresh-code1')
        .mockResolvedValueOnce('refresh-code2');
      jest.spyOn(tokenEncryptionService, 'encryptToken')
        .mockResolvedValueOnce('encrypted-new-token1')
        .mockResolvedValueOnce('encrypted-new-token2');

      // Mock the GitHub App auth service
      mockGitHubAppAuthService.exchangeCodeForToken
        .mockResolvedValueOnce({ success: true, token: 'new-access-token1' })
        .mockResolvedValueOnce({ success: true, token: 'new-access-token2' });

      const tokens = {
        token1: { refreshToken: 'encrypted-refresh1', type: 'github-app' },
        token2: { refreshToken: 'encrypted-refresh2', type: 'github-app' }
      };

      const results = await tokenValidationService.refreshTokens(tokens);

      expect(results.token1.success).toBe(true);
      expect(results.token2.success).toBe(true);
      expect(results.token1.token).toBe('encrypted-new-token1');
      expect(results.token2.token).toBe('encrypted-new-token2');
      expect(Object.keys(results)).toHaveLength(2);
    });
  });
});