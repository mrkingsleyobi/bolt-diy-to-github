import { GitHubPATAuthService } from '../GitHubPATAuthService';

describe('GitHubPATAuthService', () => {
  let authService: GitHubPATAuthService;

  beforeEach(() => {
    authService = new GitHubPATAuthService();
  });

  it('should validate a valid PAT', () => {
    const validToken = 'ghp_validtoken12345678901234567890123456';
    expect(authService.validateToken(validToken)).toBe(true);
  });

  it('should reject an invalid PAT', () => {
    const invalidToken = 'invalid-token';
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

  it('should authenticate with GitHub API using PAT', async () => {
    const validToken = 'ghp_validtoken12345678901234567890123456';

    // Mock the fetch function to simulate a successful API call
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ login: 'test-user' })
    }) as jest.Mock;

    const result = await authService.authenticate(validToken);
    expect(result).toEqual({
      authenticated: true,
      user: { login: 'test-user' }
    });
  });

  it('should handle invalid token during authentication', async () => {
    const invalidToken = 'invalid-token';
    const result = await authService.authenticate(invalidToken);
    expect(result).toEqual({
      authenticated: false,
      error: 'Invalid token format'
    });
  });

  it('should handle missing token during authentication', async () => {
    const result = await authService.authenticate('');
    expect(result).toEqual({
      authenticated: false,
      error: 'Token is required'
    });
  });

  it('should handle 401 response from GitHub API', async () => {
    const validToken = 'ghp_validtoken12345678901234567890123456';

    // Mock the fetch function to simulate a 401 response
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401
    }) as jest.Mock;

    const result = await authService.authenticate(validToken);
    expect(result).toEqual({
      authenticated: false,
      error: 'Invalid token credentials'
    });
  });

  it('should handle network errors', async () => {
    const validToken = 'ghp_validtoken12345678901234567890123456';

    // Mock the fetch function to simulate a network error
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error')) as jest.Mock;

    const result = await authService.authenticate(validToken);
    expect(result).toEqual({
      authenticated: false,
      error: 'Network error: Network error'
    });
  });
});