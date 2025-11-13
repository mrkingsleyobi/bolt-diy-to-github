import { GitHubAppAuthService } from '../GitHubAppAuthService';
import { AuthResult, GitHubUser } from '../../types/github';

describe('GitHubAppAuthService Integration Tests', () => {
  let authService: GitHubAppAuthService;
  const mockClientId = 'test-client-id';
  const mockClientSecret = 'test-client-secret';

  beforeAll(() => {
    // Set environment variables for testing
    process.env.GITHUB_APP_CLIENT_ID = mockClientId;
    process.env.GITHUB_APP_CLIENT_SECRET = mockClientSecret;
  });

  afterAll(() => {
    // Clean up environment variables
    delete process.env.GITHUB_APP_CLIENT_ID;
    delete process.env.GITHUB_APP_CLIENT_SECRET;
  });

  beforeEach(() => {
    authService = new GitHubAppAuthService(mockClientId, mockClientSecret);
  });

  // Integration test for the full OAuth flow
  describe('Full OAuth Flow', () => {
    it('should validate token format correctly', () => {
      const validToken = 'ghu_validtoken12345678901234567890123456';
      const invalidToken = 'invalid-token';

      expect(authService.validateToken(validToken)).toBe(true);
      expect(authService.validateToken(invalidToken)).toBe(false);
    });

    it('should reject null or undefined tokens', () => {
      expect(authService.validateToken(null as any)).toBe(false);
      expect(authService.validateToken(undefined as any)).toBe(false);
    });

    it('should reject non-string tokens', () => {
      expect(authService.validateToken(123 as any)).toBe(false);
      expect(authService.validateToken({} as any)).toBe(false);
    });
  });

  // Integration tests with mocked network calls
  describe('Network Integration', () => {
    it('should handle token exchange network errors gracefully', async () => {
      // Mock network failure
      global.fetch = jest.fn().mockRejectedValue(new Error('Network timeout')) as jest.Mock;

      const result = await authService.exchangeCodeForToken('test-code');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    it('should handle authentication network errors gracefully', async () => {
      const validToken = 'ghu_validtoken12345678901234567890123456';

      // Mock network failure
      global.fetch = jest.fn().mockRejectedValue(new Error('Network timeout')) as jest.Mock;

      const result: AuthResult = await authService.authenticate(validToken);
      expect(result.authenticated).toBe(false);
      expect(result.error).toContain('Network error');
    });

    it('should handle successful token exchange', async () => {
      const mockTokenResponse = {
        access_token: 'ghu_validtoken12345678901234567890123456',
        token_type: 'bearer',
        scope: 'user:email'
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockTokenResponse)
      }) as jest.Mock;

      const result = await authService.exchangeCodeForToken('valid-code');
      expect(result.success).toBe(true);
      expect(result.token).toBe('ghu_validtoken12345678901234567890123456');
    });

    it('should handle successful authentication', async () => {
      const validToken = 'ghu_validtoken12345678901234567890123456';
      const mockUser: GitHubUser = {
        login: 'testuser',
        id: 12345,
        node_id: 'MDQ6VXNlcjEyMzQ1',
        avatar_url: 'https://avatars.githubusercontent.com/u/12345?v=4',
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
        company: 'Test Company',
        blog: 'https://testuser.com',
        location: 'San Francisco, CA',
        email: 'test@example.com',
        hireable: true,
        bio: 'Test user for integration testing',
        twitter_username: 'testuser',
        public_repos: 42,
        public_gists: 7,
        followers: 100,
        following: 50,
        created_at: '2020-01-01T00:00:00Z',
        updated_at: '2021-01-01T00:00:00Z'
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockUser)
      }) as jest.Mock;

      const result: AuthResult = await authService.authenticate(validToken);
      expect(result.authenticated).toBe(true);
      expect(result.user).toEqual(mockUser);
    });
  });
});