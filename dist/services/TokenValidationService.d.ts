import { GitHubPATAuthService } from './GitHubPATAuthService.js';
import { GitHubAppAuthService } from './GitHubAppAuthService.js';
import { TokenEncryptionService } from '../security/TokenEncryptionService.js';
/**
 * Interface for token validation result
 */
export interface TokenValidationResult {
    /**
     * Whether the token is valid
     */
    valid: boolean;
    /**
     * Error message if validation failed
     */
    error?: string;
    /**
     * Whether the token needs to be refreshed
     */
    needsRefresh?: boolean;
    /**
     * Updated token if refreshed
     */
    refreshedToken?: string;
}
/**
 * Interface for token refresh result
 */
export interface TokenRefreshResult {
    /**
     * Whether the refresh was successful
     */
    success: boolean;
    /**
     * New token if successful
     */
    token?: string;
    /**
     * Error message if failed
     */
    error?: string;
}
/**
 * Service for validating and refreshing access tokens
 */
export declare class TokenValidationService {
    private readonly githubPatAuthService;
    private readonly githubAppAuthService;
    private readonly tokenEncryptionService;
    private readonly encryptionPassword;
    constructor(githubPatAuthService: GitHubPATAuthService, tokenEncryptionService: TokenEncryptionService, encryptionPassword: string, githubAppAuthService?: GitHubAppAuthService);
    /**
     * Validate an access token
     * @param encryptedToken - The encrypted token to validate
     * @param tokenType - The type of token (github-pat, github-app, etc.)
     * @returns Token validation result
     */
    validateToken(encryptedToken: string, tokenType: string): Promise<TokenValidationResult>;
    /**
     * Refresh an access token
     * @param refreshToken - The refresh token to use
     * @param tokenType - The type of token to refresh
     * @returns Token refresh result
     */
    refreshToken(refreshToken: string, tokenType: string): Promise<TokenRefreshResult>;
    /**
     * Validate a GitHub Personal Access Token
     * @param token - The token to validate
     * @returns Token validation result
     */
    private validateGitHubPat;
    /**
     * Validate a GitHub App access token
     * @param token - The token to validate
     * @returns Token validation result
     */
    private validateGitHubApp;
    /**
     * Batch validate multiple tokens
     * @param tokens - Map of token names to encrypted tokens and types
     * @returns Map of validation results
     */
    validateTokens(tokens: Record<string, {
        token: string;
        type: string;
    }>): Promise<Record<string, TokenValidationResult>>;
    /**
     * Refresh multiple tokens if needed
     * @param tokens - Map of token names to refresh tokens and types
     * @returns Map of refresh results
     */
    refreshTokens(tokens: Record<string, {
        refreshToken: string;
        type: string;
    }>): Promise<Record<string, TokenRefreshResult>>;
}
//# sourceMappingURL=TokenValidationService.d.ts.map