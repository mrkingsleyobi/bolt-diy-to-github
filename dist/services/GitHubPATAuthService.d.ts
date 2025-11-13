import { AuthResult } from '../types/github.js';
/**
 * Service for handling GitHub Personal Access Token authentication
 */
export declare class GitHubPATAuthService {
    private readonly PAT_REGEX;
    private readonly GITHUB_API_BASE;
    /**
     * Validates the format of a GitHub Personal Access Token
     * @param token The token to validate
     * @returns boolean indicating if the token format is valid
     */
    validateToken(token: string): boolean;
    /**
     * Authenticates with GitHub API using a Personal Access Token
     * @param token The GitHub PAT to use for authentication
     * @returns Promise resolving to authentication result
     */
    authenticate(token: string): Promise<AuthResult>;
}
//# sourceMappingURL=GitHubPATAuthService.d.ts.map