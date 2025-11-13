"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnhancedGitHubPATAuthService = void 0;
/**
 * Enhanced service for handling GitHub Personal Access Token authentication
 * with validation, secure storage, and retrieval mechanisms
 */
class EnhancedGitHubPATAuthService {
    constructor() {
        this.PAT_REGEX = /^ghp_[a-zA-Z0-9]{36}$|^github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59}$/;
        this.GITHUB_API_BASE = 'https://api.github.com';
        this.tokenStorage = new Map();
    }
    /**
     * Validates the format of a GitHub Personal Access Token
     * Supports both classic PATs (ghp_) and fine-grained PATs (github_pat_)
     * @param token The token to validate
     * @returns boolean indicating if the token format is valid
     */
    validateTokenFormat(token) {
        if (!token || typeof token !== 'string') {
            return false;
        }
        return this.PAT_REGEX.test(token);
    }
    /**
     * Validates token by making a request to GitHub API
     * @param token The GitHub PAT to validate
     * @returns Promise resolving to validation result
     */
    async validateTokenWithAPI(token) {
        // Validate input
        if (!token) {
            return {
                valid: false,
                reason: 'Token is required'
            };
        }
        // Validate token format
        if (!this.validateTokenFormat(token)) {
            return {
                valid: false,
                reason: 'Invalid token format'
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
                return { valid: true, user };
            }
            else if (response.status === 401) {
                return {
                    valid: false,
                    reason: 'Invalid token credentials'
                };
            }
            else {
                return {
                    valid: false,
                    reason: `GitHub API error: ${response.status}`
                };
            }
        }
        catch (error) {
            return {
                valid: false,
                reason: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
    /**
     * Stores a token in memory (for demonstration)
     * In a real implementation, this would use SecureTokenStorage
     * @param key The key to store the token under
     * @param token The token to store
     */
    storeToken(key, token) {
        if (!this.validateTokenFormat(token)) {
            throw new Error('Cannot store invalid token format');
        }
        this.tokenStorage.set(key, token);
    }
    /**
     * Retrieves a token from memory (for demonstration)
     * In a real implementation, this would use SecureTokenStorage
     * @param key The key to retrieve the token for
     * @returns The stored token or undefined
     */
    retrieveToken(key) {
        return this.tokenStorage.get(key);
    }
    /**
     * Authenticates with GitHub API using a Personal Access Token
     * @param token The GitHub PAT to use for authentication
     * @returns Promise resolving to authentication result
     */
    async authenticate(token) {
        const validationResult = await this.validateTokenWithAPI(token);
        if (!validationResult.valid) {
            return {
                authenticated: false,
                error: validationResult.reason
            };
        }
        return {
            authenticated: true,
            user: validationResult.user
        };
    }
    /**
     * Authenticates with GitHub API using a stored token
     * @param key The key for the stored token
     * @returns Promise resolving to authentication result
     */
    async authenticateWithStoredToken(key) {
        const token = this.retrieveToken(key);
        if (!token) {
            return {
                authenticated: false,
                error: 'No stored token found for key'
            };
        }
        return this.authenticate(token);
    }
}
exports.EnhancedGitHubPATAuthService = EnhancedGitHubPATAuthService;
//# sourceMappingURL=EnhancedGitHubPATAuthService.js.map