import { EnhancedGitHubPATAuthService, TokenValidationResult } from '../../src/services/validation/EnhancedGitHubPATAuthService';
import { AuthResult } from '../../src/types/github';

describe('EnhancedGitHubPATAuthService', () => {
  let authService: EnhancedGitHubPATAuthService;
  const validClassicToken = 'ghp_validtoken12345678901234567890123456';
  const validFineGrainedToken = 'github_pat_abcdefghijklmnopqrstuv_0123456789abcdefghijklmnopqrstuvwxyABCDEFGHIJKLMNOPQRSTUVWX';
  const invalidToken = 'invalid-token';

  beforeEach(() => {
    authService = new EnhancedGitHubPATAuthService();
  });

  describe('validateTokenFormat', () => {
    it('should return true for a valid classic PAT format', () => {
      expect(authService.validateTokenFormat(validClassicToken)).toBe(true);
    });

    it('should return true for a valid fine-grained PAT format', () => {
      expect(authService.validateTokenFormat(validFineGrainedToken)).toBe(true);
    });

    it('should return false for an invalid PAT format', () => {
      expect(authService.validateTokenFormat(invalidToken)).toBe(false);
    });

    it('should return false for null or undefined tokens', () => {
      expect(authService.validateTokenFormat(null as any)).toBe(false);
      expect(authService.validateTokenFormat(undefined as any)).toBe(false);
    });

    it('should return false for non-string tokens', () => {
      expect(authService.validateTokenFormat(123 as any)).toBe(false);
      expect(authService.validateTokenFormat({} as any)).toBe(false);
    });

    it('should return false for tokens with incorrect length', () => {
      // Too short
      expect(authService.validateTokenFormat('ghp_shorttoken')).toBe(false);
      // Too long
      expect(authService.validateTokenFormat('ghp_validtoken12345678901234567890123456toolong')).toBe(false);
    });

    it('should return false for tokens with invalid characters', () => {
      // Contains invalid character
      expect(authService.validateTokenFormat('ghp_validtoken1234567890123456789012345!')).toBe(false);
    });
  });

  describe('validateTokenWithAPI', () => {
    const mockUser = {
      login: 'test-user',
      id: 123456,
      node_id: 'MDQ6VXNlcjEyMzQ1Ng==',
      avatar_url: 'https://avatars.githubusercontent.com/u/123456?v=4',
      gravatar_id: '',
      url: 'https://api.github.com/users/test-user',
      html_url: 'https://github.com/test-user',
      followers_url: 'https://api.github.com/users/test-user/followers',
      following_url: 'https://api.github.com/users/test-user/following{/other_user}',
      gists_url: 'https://api.github.com/users/test-user/gists{/gist_id}',
      starred_url: 'https://api.github.com/users/test-user/starred{/owner}{/repo}',
      subscriptions_url: 'https://api.github.com/users/test-user/subscriptions',
      organizations_url: 'https://api.github.com/users/test-user/orgs',
      repos_url: 'https://api.github.com/users/test-user/repos',
      events_url: 'https://api.github.com/users/test-user/events{/privacy}',
      received_events_url: 'https://api.github.com/users/test-user/received_events',
      type: 'User',
      site_admin: false,
      name: 'Test User',
      company: null,
      blog: '',
      location: 'San Francisco',
      email: null,
      hireable: null,
      bio: null,
      twitter_username: null,
      public_repos: 10,
      public_gists: 5,
      followers: 20,
      following: 30,
      created_at: '2020-01-01T00:00:00Z',
      updated_at: '2021-01-01T00:00:00Z'
    };

    it('should validate successfully with a valid token', async () => {
      // Mock the fetch function to simulate a successful API call
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockUser)
      }) as jest.Mock;

      const result: TokenValidationResult = await authService.validateTokenWithAPI(validClassicToken);

      expect(result).toEqual({
        valid: true,
        user: mockUser
      });

      // Verify fetch was called with correct parameters
      expect(global.fetch).toHaveBeenCalledWith('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${validClassicToken}`,
          'User-Agent': 'bolt-to-github-extension'
        }
      });
    });

    it('should handle invalid token during validation', async () => {
      const result: TokenValidationResult = await authService.validateTokenWithAPI(invalidToken);

      expect(result).toEqual({
        valid: false,
        reason: 'Invalid token format'
      });
    });

    it('should handle missing token during validation', async () => {
      const result: TokenValidationResult = await authService.validateTokenWithAPI('');
      expect(result).toEqual({
        valid: false,
        reason: 'Token is required'
      });
    });

    it('should handle 401 response from GitHub API', async () => {
      // Mock the fetch function to simulate a 401 response
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401
      }) as jest.Mock;

      const result: TokenValidationResult = await authService.validateTokenWithAPI(validClassicToken);
      expect(result).toEqual({
        valid: false,
        reason: 'Invalid token credentials'
      });
    });

    it('should handle other HTTP errors from GitHub API', async () => {
      // Mock the fetch function to simulate a 500 response
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500
      }) as jest.Mock;

      const result: TokenValidationResult = await authService.validateTokenWithAPI(validClassicToken);
      expect(result).toEqual({
        valid: false,
        reason: 'GitHub API error: 500'
      });
    });

    it('should handle network errors', async () => {
      // Mock the fetch function to simulate a network error
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error')) as jest.Mock;

      const result: TokenValidationResult = await authService.validateTokenWithAPI(validClassicToken);
      expect(result).toEqual({
        valid: false,
        reason: 'Network error: Network error'
      });
    });

    it('should handle unknown errors', async () => {
      // Mock the fetch function to simulate an unknown error
      global.fetch = jest.fn().mockRejectedValue('Unknown error') as jest.Mock;

      const result: TokenValidationResult = await authService.validateTokenWithAPI(validClassicToken);
      expect(result).toEqual({
        valid: false,
        reason: 'Network error: Unknown error'
      });
    });
  });

  describe('storeToken and retrieveToken', () => {
    it('should store and retrieve a token', () => {
      const key = 'test-key';
      authService.storeToken(key, validClassicToken);
      const retrievedToken = authService.retrieveToken(key);
      expect(retrievedToken).toBe(validClassicToken);
    });

    it('should throw an error when storing an invalid token', () => {
      const key = 'test-key';
      expect(() => authService.storeToken(key, invalidToken))
        .toThrow('Cannot store invalid token format');
    });

    it('should return undefined for non-existent token', () => {
      const retrievedToken = authService.retrieveToken('non-existent-key');
      expect(retrievedToken).toBeUndefined();
    });
  });

  describe('authenticate', () => {
    const mockUser = {
      login: 'test-user',
      id: 123456,
      node_id: 'MDQ6VXNlcjEyMzQ1Ng==',
      avatar_url: 'https://avatars.githubusercontent.com/u/123456?v=4',
      gravatar_id: '',
      url: 'https://api.github.com/users/test-user',
      html_url: 'https://github.com/test-user',
      followers_url: 'https://api.github.com/users/test-user/followers',
      following_url: 'https://api.github.com/users/test-user/following{/other_user}',
      gists_url: 'https://api.github.com/users/test-user/gists{/gist_id}',
      starred_url: 'https://api.github.com/users/test-user/starred{/owner}{/repo}',
      subscriptions_url: 'https://api.github.com/users/test-user/subscriptions',
      organizations_url: 'https://api.github.com/users/test-user/orgs',
      repos_url: 'https://api.github.com/users/test-user/repos',
      events_url: 'https://api.github.com/users/test-user/events{/privacy}',
      received_events_url: 'https://api.github.com/users/test-user/received_events',
      type: 'User',
      site_admin: false,
      name: 'Test User',
      company: null,
      blog: '',
      location: 'San Francisco',
      email: null,
      hireable: null,
      bio: null,
      twitter_username: null,
      public_repos: 10,
      public_gists: 5,
      followers: 20,
      following: 30,
      created_at: '2020-01-01T00:00:00Z',
      updated_at: '2021-01-01T00:00:00Z'
    };

    it('should authenticate successfully with a valid token', async () => {
      // Mock the fetch function to simulate a successful API call
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockUser)
      }) as jest.Mock;

      const result: AuthResult = await authService.authenticate(validClassicToken);

      expect(result).toEqual({
        authenticated: true,
        user: mockUser
      });
    });

    it('should handle authentication failure with invalid token', async () => {
      const result: AuthResult = await authService.authenticate(invalidToken);

      expect(result).toEqual({
        authenticated: false,
        error: 'Invalid token format'
      });
    });
  });

  describe('authenticateWithStoredToken', () => {
    const key = 'test-key';
    const mockUser = {
      login: 'test-user',
      id: 123456,
      node_id: 'MDQ6VXNlcjEyMzQ1Ng==',
      avatar_url: 'https://avatars.githubusercontent.com/u/123456?v=4',
      gravatar_id: '',
      url: 'https://api.github.com/users/test-user',
      html_url: 'https://github.com/test-user',
      followers_url: 'https://api.github.com/users/test-user/followers',
      following_url: 'https://api.github.com/users/test-user/following{/other_user}',
      gists_url: 'https://api.github.com/users/test-user/gists{/gist_id}',
      starred_url: 'https://api.github.com/users/test-user/starred{/owner}{/repo}',
      subscriptions_url: 'https://api.github.com/users/test-user/subscriptions',
      organizations_url: 'https://api.github.com/users/test-user/orgs',
      repos_url: 'https://api.github.com/users/test-user/repos',
      events_url: 'https://api.github.com/users/test-user/events{/privacy}',
      received_events_url: 'https://api.github.com/users/test-user/received_events',
      type: 'User',
      site_admin: false,
      name: 'Test User',
      company: null,
      blog: '',
      location: 'San Francisco',
      email: null,
      hireable: null,
      bio: null,
      twitter_username: null,
      public_repos: 10,
      public_gists: 5,
      followers: 20,
      following: 30,
      created_at: '2020-01-01T00:00:00Z',
      updated_at: '2021-01-01T00:00:00Z'
    };

    it('should authenticate successfully with a stored token', async () => {
      // Store a token first
      authService.storeToken(key, validClassicToken);

      // Mock the fetch function to simulate a successful API call
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockUser)
      }) as jest.Mock;

      const result: AuthResult = await authService.authenticateWithStoredToken(key);

      expect(result).toEqual({
        authenticated: true,
        user: mockUser
      });
    });

    it('should handle authentication failure with non-existent stored token', async () => {
      const result: AuthResult = await authService.authenticateWithStoredToken('non-existent-key');

      expect(result).toEqual({
        authenticated: false,
        error: 'No stored token found for key'
      });
    });
  });
});