import { ConfigurationOptions } from './ConfigurationManager';
import { PayloadEncryptionService } from '../security/PayloadEncryptionService';
import { MessageAuthenticationService } from '../security/MessageAuthenticationService';
import { TokenEncryptionService } from '../security/TokenEncryptionService';
import { GitHubPATAuthService } from '../services/GitHubPATAuthService';
import { GitHubAppAuthService } from '../services/GitHubAppAuthService';
/**
 * Environment configuration service
 */
export declare class EnvironmentConfigurationService {
    private configurationManager;
    private tokenEncryptionService;
    private tokenValidationService;
    private encryptionPassword;
    constructor(payloadEncryptionService: PayloadEncryptionService, messageAuthenticationService: MessageAuthenticationService, tokenEncryptionService: TokenEncryptionService, encryptionPassword: string, githubPatAuthService: GitHubPATAuthService, githubAppAuthService?: GitHubAppAuthService);
    /**
     * Initialize the configuration service
     * @param options - Configuration options
     */
    initialize(options: ConfigurationOptions): Promise<void>;
    /**
     * Get environment-specific configuration
     * @param environment - Environment name
     * @returns Environment configuration
     */
    getEnvironmentConfig(environment: string): Promise<any>;
    /**
     * Get full configuration (internal use only)
     * @returns Full configuration
     */
    private getFullConfig;
    /**
     * Validate access tokens in configuration
     * @param config - Configuration to validate
     * @returns Validation result
     */
    private validateAccessTokens;
    /**
     * Public method to validate tokens
     * @param tokens - Map of token names to encrypted tokens and types
     * @returns Map of validation results
     */
    validateTokens(tokens: Record<string, {
        token: string;
        type: string;
    }>): Promise<Record<string, import('../services/TokenValidationService').TokenValidationResult>>;
    /**
     * Public method to refresh tokens
     * @param tokens - Map of token names to refresh tokens and types
     * @returns Map of refresh results
     */
    refreshTokens(tokens: Record<string, {
        refreshToken: string;
        type: string;
    }>): Promise<Record<string, import('../services/TokenValidationService').TokenRefreshResult>>;
    /**
     * Sanitize configuration for transmission by removing sensitive data
     * @param config - Configuration to sanitize
     * @returns Sanitized configuration
     */
    private sanitizeForTransmission;
    /**
     * Save environment-specific configuration
     * @param environment - Environment name
     * @param config - Configuration to save
     */
    saveEnvironmentConfig(environment: string, config: any): Promise<void>;
    /**
     * Encrypt sensitive data in configuration
     * @param config - Configuration to encrypt
     * @returns Configuration with encrypted sensitive data
     */
    private encryptSensitiveData;
    /**
     * Decrypt sensitive data in configuration
     * @param config - Configuration to decrypt
     * @returns Configuration with decrypted sensitive data
     */
    private decryptSensitiveData;
    /**
     * Get current configuration status
     * @returns Configuration status
     */
    getStatus(): any;
    /**
     * Reload configuration from sources
     */
    reload(): Promise<void>;
}
//# sourceMappingURL=EnvironmentConfigurationService.d.ts.map