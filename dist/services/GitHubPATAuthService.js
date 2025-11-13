"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitHubPATAuthService = void 0;
/**
 * Service for handling GitHub Personal Access Token authentication
 */
class GitHubPATAuthService {
    constructor() {
        this.PAT_REGEX = /^ghp_[a-zA-Z0-9]{36}$/;
        this.GITHUB_API_BASE = 'https://api.github.com';
    }
    /**
     * Validates the format of a GitHub Personal Access Token
     * @param token The token to validate
     * @returns boolean indicating if the token format is valid
     */
    validateToken(token) {
        if (!token || typeof token !== 'string') {
            return false;
        }
        return this.PAT_REGEX.test(token);
    }
    /**
     * Authenticates with GitHub API using a Personal Access Token
     * @param token The GitHub PAT to use for authentication
     * @returns Promise resolving to authentication result
     */
    async authenticate(token) {
        // Validate input
        if (!token) {
            return {
                authenticated: false,
                error: 'Token is required'
            };
        }
        // Validate token format
        if (!this.validateToken(token)) {
            return {
                authenticated: false,
                error: 'Invalid token format'
            };
        }
        try {
            // Make a simple API call to verify the token
            const response = await fetch(`${this.GITHUB_API_BASE}/user`, {
                headers: {
                    'Authorization': `token ${token}`,
                    'User-Agent': 'bolt-to-github-extension'
                }
            });
            if (response.ok) {
                const userData = await response.json();
                const user = userData;
                return { authenticated: true, user };
            }
            else if (response.status === 401) {
                return {
                    authenticated: false,
                    error: 'Invalid token credentials'
                };
            }
            else {
                return {
                    authenticated: false,
                    error: `GitHub API error: ${response.status}`
                };
            }
        }
        catch (error) {
            return {
                authenticated: false,
                error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
}
exports.GitHubPATAuthService = GitHubPATAuthService;
//# sourceMappingURL=GitHubPATAuthService.js.map