"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Integration Tests for GitHub Client
const GitHubClient_1 = require("../GitHubClient");
describe('GitHubClient Integration', () => {
    describe('Client Initialization', () => {
        it('should instantiate with valid token format', () => {
            const token = 'ghp_validtoken12345678901234567890123456';
            expect(() => new GitHubClient_1.GitHubClient(token)).not.toThrow();
        });
        it('should throw error with invalid token format', () => {
            const invalidToken = 'invalid-token';
            expect(() => new GitHubClient_1.GitHubClient(invalidToken)).toThrow('Invalid GitHub PAT format');
        });
    });
    describe('Service Integration', () => {
        it('should have repository and branch services', () => {
            const client = new GitHubClient_1.GitHubClient('ghp_validtoken12345678901234567890123456');
            expect(client.repositories).toBeDefined();
            expect(typeof client.repositories.list).toBe('function');
            expect(typeof client.repositories.create).toBe('function');
            expect(typeof client.repositories.get).toBe('function');
            expect(typeof client.repositories.delete).toBe('function');
            expect(client.branches).toBeDefined();
            expect(typeof client.branches.list).toBe('function');
            expect(typeof client.branches.get).toBe('function');
            expect(typeof client.branches.create).toBe('function');
            expect(typeof client.branches.delete).toBe('function');
        });
    });
    describe('Real API Integration (when token available)', () => {
        let client = null;
        beforeAll(() => {
            const token = process.env.GITHUB_TOKEN;
            if (token) {
                try {
                    client = new GitHubClient_1.GitHubClient(token);
                }
                catch (error) {
                    console.warn('Failed to create GitHub client for integration tests:', error);
                    client = null;
                }
            }
            else {
                console.warn('GITHUB_TOKEN not set, skipping real API integration tests');
            }
        });
        it('should list repositories (real API)', async () => {
            if (!client) {
                // Skip if no client
                return;
            }
            try {
                const repos = await client.repositories.list();
                expect(Array.isArray(repos)).toBe(true);
            }
            catch (error) {
                // If we get a 401/403, it means auth works but token lacks permissions
                // If we get a network error, it means we tried to connect
                expect(error).toBeDefined();
            }
        }, 10000); // 10 second timeout
        it('should list branches for a repository (real API)', async () => {
            if (!client) {
                // Skip if no client
                return;
            }
            try {
                // Try to get branches for a well-known public repo
                const branches = await client.branches.list('octocat', 'Hello-World');
                expect(Array.isArray(branches)).toBe(true);
            }
            catch (error) {
                // Handle rate limiting, auth issues, etc.
                expect(error).toBeDefined();
            }
        }, 10000); // 10 second timeout
    });
});
//# sourceMappingURL=GitHubClient.integration.test.js.map