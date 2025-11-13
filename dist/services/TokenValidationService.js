"use strict";
// TokenValidationService.ts - Service for validating and refreshing access tokens
// Phase 4: Environment Configuration Management - Task 4: Implement token validation and refresh logic
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenValidationService = void 0;
/**
 * Service for validating and refreshing access tokens
 */
class TokenValidationService {
    constructor(githubPatAuthService, tokenEncryptionService, encryptionPassword, githubAppAuthService) {
        this.githubPatAuthService = githubPatAuthService;
        this.githubAppAuthService = githubAppAuthService || null;
        this.tokenEncryptionService = tokenEncryptionService;
        this.encryptionPassword = encryptionPassword;
    }
    /**
     * Validate an access token
     * @param encryptedToken - The encrypted token to validate
     * @param tokenType - The type of token (github-pat, github-app, etc.)
     * @returns Token validation result
     */
    async validateToken(encryptedToken, tokenType) {
        try {
            // Decrypt the token
            const decryptedToken = await this.tokenEncryptionService.decryptToken(encryptedToken, this.encryptionPassword);
            // Validate based on token type
            switch (tokenType) {
                case 'github-pat':
                    return await this.validateGitHubPat(decryptedToken);
                case 'github-app':
                    return await this.validateGitHubApp(decryptedToken);
                default:
                    return {
                        valid: false,
                        error: `Unsupported token type: ${tokenType}`
                    };
            }
        }
        catch (error) {
            return {
                valid: false,
                error: `Failed to decrypt token: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
    /**
     * Refresh an access token
     * @param refreshToken - The refresh token to use
     * @param tokenType - The type of token to refresh
     * @returns Token refresh result
     */
    async refreshToken(refreshToken, tokenType) {
        try {
            // Decrypt the refresh token
            const decryptedRefreshToken = await this.tokenEncryptionService.decryptToken(refreshToken, this.encryptionPassword);
            // Refresh based on token type
            switch (tokenType) {
                case 'github-app':
                    if (this.githubAppAuthService) {
                        const result = await this.githubAppAuthService.exchangeCodeForToken(decryptedRefreshToken);
                        if (result.success && result.token) {
                            // Encrypt the new token
                            const encryptedToken = await this.tokenEncryptionService.encryptToken(result.token, this.encryptionPassword);
                            return {
                                success: true,
                                token: encryptedToken
                            };
                        }
                        else {
                            return {
                                success: false,
                                error: result.error || 'Failed to refresh GitHub App token'
                            };
                        }
                    }
                    else {
                        return {
                            success: false,
                            error: 'GitHub App authentication service not configured'
                        };
                    }
                case 'github-pat':
                    // PATs cannot be refreshed, only re-validated
                    return {
                        success: false,
                        error: 'GitHub PAT tokens cannot be refreshed'
                    };
                default:
                    return {
                        success: false,
                        error: `Unsupported token type for refresh: ${tokenType}`
                    };
            }
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to refresh token: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
    /**
     * Validate a GitHub Personal Access Token
     * @param token - The token to validate
     * @returns Token validation result
     */
    async validateGitHubPat(token) {
        // First check format
        if (!this.githubPatAuthService.validateToken(token)) {
            return {
                valid: false,
                error: 'Invalid GitHub PAT format'
            };
        }
        // Then check with GitHub API
        const authResult = await this.githubPatAuthService.authenticate(token);
        if (authResult.authenticated) {
            return {
                valid: true
            };
        }
        else {
            return {
                valid: false,
                error: authResult.error || 'GitHub PAT authentication failed'
            };
        }
    }
    /**
     * Validate a GitHub App access token
     * @param token - The token to validate
     * @returns Token validation result
     */
    async validateGitHubApp(token) {
        if (!this.githubAppAuthService) {
            return {
                valid: false,
                error: 'GitHub App authentication service not configured'
            };
        }
        // First check format
        if (!this.githubAppAuthService.validateToken(token)) {
            return {
                valid: false,
                error: 'Invalid GitHub App token format'
            };
        }
        // Then check with GitHub API
        const authResult = await this.githubAppAuthService.authenticate(token);
        if (authResult.authenticated) {
            return {
                valid: true
            };
        }
        else {
            // Check if it's an expired token error
            if (authResult.error && authResult.error.includes('Invalid token credentials')) {
                return {
                    valid: false,
                    needsRefresh: true,
                    error: 'GitHub App token expired'
                };
            }
            else {
                return {
                    valid: false,
                    error: authResult.error || 'GitHub App authentication failed'
                };
            }
        }
    }
    /**
     * Batch validate multiple tokens
     * @param tokens - Map of token names to encrypted tokens and types
     * @returns Map of validation results
     */
    async validateTokens(tokens) {
        const results = {};
        // Validate tokens in parallel
        const validationPromises = Object.entries(tokens).map(async ([name, tokenInfo]) => {
            const result = await this.validateToken(tokenInfo.token, tokenInfo.type);
            results[name] = result;
        });
        await Promise.all(validationPromises);
        return results;
    }
    /**
     * Refresh multiple tokens if needed
     * @param tokens - Map of token names to refresh tokens and types
     * @returns Map of refresh results
     */
    async refreshTokens(tokens) {
        const results = {};
        // Refresh tokens in parallel
        const refreshPromises = Object.entries(tokens).map(async ([name, tokenInfo]) => {
            const result = await this.refreshToken(tokenInfo.refreshToken, tokenInfo.type);
            results[name] = result;
        });
        await Promise.all(refreshPromises);
        return results;
    }
}
exports.TokenValidationService = TokenValidationService;
//# sourceMappingURL=TokenValidationService.js.map