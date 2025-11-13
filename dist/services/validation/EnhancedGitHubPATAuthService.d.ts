import { GitHubUser, AuthResult } from '../../types/github.js';
/**
 * Enhanced service for handling GitHub Personal Access Token authentication
 * with secure storage capabilities
 */
export interface TokenValidationResult {
    valid: boolean;
    reason?: string;
    user?: GitHubUser;
}
/**
 * Enhanced service for handling GitHub Personal Access Token authentication
 * with validation, secure storage, and retrieval mechanisms
 */
export declare class EnhancedGitHubPATAuthService {
    private readonly PAT_REGEX;
    private readonly GITHUB_API_BASE;
    private readonly tokenStorage;
    /**
     * Validates the format of a GitHub Personal Access Token
     * Supports both classic PATs (ghp_) and fine-grained PATs (github_pat_)
     * @param token The token to validate
     * @returns boolean indicating if the token format is valid
     */
    validateTokenFormat(token: string): boolean;
    /**
     * Validates token by making a request to GitHub API
     * @param token The GitHub PAT to validate
     * @returns Promise resolving to validation result
     */
    validateTokenWithAPI(token: string): Promise<TokenValidationResult>;
    /**
     * Stores a token in memory (for demonstration)
     * In a real implementation, this would use SecureTokenStorage
     * @param key The key to store the token under
     * @param token The token to store
     */
    storeToken(key: string, token: string): void;
    /**
     * Retrieves a token from memory (for demonstration)
     * In a real implementation, this would use SecureTokenStorage
     * @param key The key to retrieve the token for
     * @returns The stored token or undefined
     */
    retrieveToken(key: string): string | undefined;
    /**
     * Authenticates with GitHub API using a Personal Access Token
     * @param token The GitHub PAT to use for authentication
     * @returns Promise resolving to authentication result
     */
    authenticate(token: string): Promise<AuthResult>;
    /**
     * Authenticates with GitHub API using a stored token
     * @param key The key for the stored token
     * @returns Promise resolving to authentication result
     */
    authenticateWithStoredToken(key: string): Promise<AuthResult>;
}
//# sourceMappingURL=EnhancedGitHubPATAuthService.d.ts.map