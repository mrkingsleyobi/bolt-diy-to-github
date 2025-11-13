"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const GitHubAppAuthService_1 = require("../GitHubAppAuthService");
describe('GitHubAppAuthService - London School TDD', () => {
    let authService;
    const mockClientId = 'mock-client-id';
    const mockClientSecret = 'mock-client-secret';
    const validCode = 'valid-auth-code';
    const validToken = 'ghu_validtoken12345678901234567890123456';
    beforeEach(() => {
        authService = new GitHubAppAuthService_1.GitHubAppAuthService(mockClientId, mockClientSecret);
    });
    // Test the exchangeCodeForToken method in isolation
    describe('exchangeCodeForToken', () => {
        it('should exchange a valid authorization code for an access token', async () => {
            // Mock the fetch function to simulate a successful token exchange
            const mockTokenResponse = {
                access_token: validToken,
                token_type: 'bearer',
                scope: 'user:email'
            };
            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockTokenResponse)
            });
            const result = await authService.exchangeCodeForToken(validCode);
            expect(result).toEqual({
                success: true,
                token: validToken
            });
            // Verify fetch was called with correct parameters
            expect(global.fetch).toHaveBeenCalledWith('https://github.com/login/oauth/access_token', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'User-Agent': 'bolt-to-github-extension'
                },
                body: JSON.stringify({
                    client_id: mockClientId,
                    client_secret: mockClientSecret,
                    code: validCode
                })
            });
        });
        it('should handle network errors during token exchange', async () => {
            // Mock the fetch function to simulate a network error
            global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
            const result = await authService.exchangeCodeForToken(validCode);
            expect(result).toEqual({
                success: false,
                error: 'Network error: Network error'
            });
        });
        it('should handle HTTP errors during token exchange', async () => {
            // Mock the fetch function to simulate an HTTP error
            global.fetch = jest.fn().mockResolvedValue({
                ok: false,
                status: 400,
                statusText: 'Bad Request'
            });
            const result = await authService.exchangeCodeForToken(validCode);
            expect(result).toEqual({
                success: false,
                error: 'GitHub API error: 400 Bad Request'
            });
        });
        it('should handle missing code parameter', async () => {
            const result = await authService.exchangeCodeForToken('');
            expect(result).toEqual({
                success: false,
                error: 'Authorization code is required'
            });
        });
    });
    // Test the authenticate method with various scenarios
    describe('authenticate', () => {
        it('should authenticate successfully with a valid token', async () => {
            // Mock the fetch function to simulate a successful API call
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
            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockUser)
            });
            const result = await authService.authenticate(validToken);
            expect(result).toEqual({
                authenticated: true,
                user: mockUser
            });
            // Verify fetch was called with correct parameters
            expect(global.fetch).toHaveBeenCalledWith('https://api.github.com/user', {
                headers: {
                    'Authorization': `token ${validToken}`,
                    'User-Agent': 'bolt-to-github-extension'
                }
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
            // Mock the fetch function to simulate a 401 response
            global.fetch = jest.fn().mockResolvedValue({
                ok: false,
                status: 401
            });
            const result = await authService.authenticate(validToken);
            expect(result).toEqual({
                authenticated: false,
                error: 'Invalid token credentials'
            });
        });
        it('should handle other HTTP errors from GitHub API', async () => {
            // Mock the fetch function to simulate a 500 response
            global.fetch = jest.fn().mockResolvedValue({
                ok: false,
                status: 500
            });
            const result = await authService.authenticate(validToken);
            expect(result).toEqual({
                authenticated: false,
                error: 'GitHub API error: 500'
            });
        });
        it('should handle network errors', async () => {
            // Mock the fetch function to simulate a network error
            global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
            const result = await authService.authenticate(validToken);
            expect(result).toEqual({
                authenticated: false,
                error: 'Network error: Network error'
            });
        });
        it('should handle unknown errors', async () => {
            // Mock the fetch function to simulate an unknown error
            global.fetch = jest.fn().mockRejectedValue('Unknown error');
            const result = await authService.authenticate(validToken);
            expect(result).toEqual({
                authenticated: false,
                error: 'Network error: Unknown error'
            });
        });
    });
    // Test the full OAuth flow
    describe('OAuth Flow', () => {
        it('should complete the full OAuth flow successfully', async () => {
            // Mock the fetch function for token exchange
            const mockTokenResponse = {
                access_token: validToken,
                token_type: 'bearer',
                scope: 'user:email'
            };
            global.fetch = jest.fn()
                .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockTokenResponse)
            })
                .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
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
                })
            });
            const tokenResult = await authService.exchangeCodeForToken(validCode);
            expect(tokenResult).toEqual({
                success: true,
                token: validToken
            });
            const authResult = await authService.authenticate(validToken);
            expect(authResult.authenticated).toBe(true);
            expect(authResult.user).toBeDefined();
            expect(authResult.user?.login).toBe('test-user');
        });
    });
});
//# sourceMappingURL=githubAppAuth.london.tdd.test.js.map