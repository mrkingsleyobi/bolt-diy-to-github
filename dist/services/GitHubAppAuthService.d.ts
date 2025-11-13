import { AuthResult } from '../types/github.js';
/**
 * Interface for token exchange result
 */
export interface TokenExchangeResult {
    success: boolean;
    token?: string;
    error?: string;
}
/**
 * Service for handling GitHub App OAuth authentication
 */
export declare class GitHubAppAuthService {
    private readonly clientId;
    private readonly clientSecret;
    private readonly TOKEN_REGEX;
    private readonly GITHUB_API_BASE;
    private readonly GITHUB_OAUTH_BASE;
    constructor(clientId: string, clientSecret: string);
    /**
     * Exchanges an authorization code for an access token
     * @param code The authorization code received from GitHub
     * @returns Promise resolving to token exchange result
     */
    exchangeCodeForToken(code: string): Promise<TokenExchangeResult>;
    /**
     * Validates the format of a GitHub App access token
     * @param token The token to validate
     * @returns boolean indicating if the token format is valid
     */
    validateToken(token: string): boolean;
    /**
     * Authenticates with GitHub API using an access token
     * @param token The GitHub access token to use for authentication
     * @returns Promise resolving to authentication result
     */
    authenticate(token: string): Promise<AuthResult>;
}
//# sourceMappingURL=GitHubAppAuthService.d.ts.map