"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const GitHubPATAuthService_1 = require("../GitHubPATAuthService");
describe('GitHubPATAuthService - London School TDD', () => {
    let authService;
    const validToken = 'ghp_validtoken12345678901234567890123456';
    beforeEach(() => {
        authService = new GitHubPATAuthService_1.GitHubPATAuthService();
    });
    // Test the validateToken method in isolation
    describe('validateToken', () => {
        it('should return true for a valid PAT format', () => {
            expect(authService.validateToken(validToken)).toBe(true);
        });
        it('should return false for an invalid PAT format', () => {
            expect(authService.validateToken('invalid-token')).toBe(false);
        });
        it('should return false for null or undefined tokens', () => {
            expect(authService.validateToken(null)).toBe(false);
            expect(authService.validateToken(undefined)).toBe(false);
        });
        it('should return false for non-string tokens', () => {
            expect(authService.validateToken(123)).toBe(false);
            expect(authService.validateToken({})).toBe(false);
        });
        it('should return false for tokens with incorrect length', () => {
            // Too short
            expect(authService.validateToken('ghp_shorttoken')).toBe(false);
            // Too long
            expect(authService.validateToken('ghp_validtoken12345678901234567890123456toolong')).toBe(false);
        });
        it('should return false for tokens with invalid characters', () => {
            // Contains invalid character
            expect(authService.validateToken('ghp_validtoken1234567890123456789012345!')).toBe(false);
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
});
//# sourceMappingURL=githubAuth.london.tdd.test.js.map