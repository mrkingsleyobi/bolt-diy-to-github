"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Integration tests for FileService
const GitHubClient_1 = require("../../GitHubClient");
const GitHubPATAuthService_1 = require("../../../services/GitHubPATAuthService");
// Mock the auth service to bypass token validation for tests
jest.mock('../../../services/GitHubPATAuthService');
describe('FileService Integration', () => {
    let githubClient;
    let testToken;
    beforeAll(() => {
        // Mock the validateToken method to always return true
        GitHubPATAuthService_1.GitHubPATAuthService.mockImplementation(() => {
            return {
                validateToken: jest.fn().mockReturnValue(true)
            };
        });
        // Use a properly formatted mock token
        testToken = 'github_pat_1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        githubClient = new GitHubClient_1.GitHubClient(testToken);
    });
    describe('File Operations', () => {
        it('should have file service available', () => {
            expect(githubClient.files).toBeDefined();
        });
        it('should have all required methods', () => {
            expect(typeof githubClient.files.get).toBe('function');
            expect(typeof githubClient.files.create).toBe('function');
            expect(typeof githubClient.files.update).toBe('function');
            expect(typeof githubClient.files.delete).toBe('function');
            expect(typeof githubClient.files.batch).toBe('function');
        });
    });
    describe('Batch Operations', () => {
        it('should process batch operations correctly', async () => {
            // This would be a real test with a valid token and repository
            // For now, we'll just verify the method exists and has the right signature
            expect(githubClient.files.batch).toBeDefined();
        });
    });
});
//# sourceMappingURL=FileService.integration.test.js.map