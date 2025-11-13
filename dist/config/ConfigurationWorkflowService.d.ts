import { ConfigValidationResult } from '../config/ConfigValidator';
import { PayloadEncryptionService } from '../security/PayloadEncryptionService';
import { MessageAuthenticationService } from '../security/MessageAuthenticationService';
import { TokenEncryptionService } from '../security/TokenEncryptionService';
import { GitHubPATAuthService } from '../services/GitHubPATAuthService';
import { GitHubAppAuthService } from '../services/GitHubAppAuthService';
/**
 * Interface for configuration workflow options
 */
export interface ConfigurationWorkflowOptions {
    /**
     * Storage path for encrypted configuration
     */
    storagePath: string;
    /**
     * Encryption password for secure storage
     */
    encryptionPassword: string;
    /**
     * Whether to validate configuration after loading
     */
    validateOnLoad?: boolean;
    /**
     * Whether to validate configuration before saving
     */
    validateOnSave?: boolean;
    /**
     * Whether to encrypt tokens before saving
     */
    encryptTokens?: boolean;
}
/**
 * Interface for configuration workflow result
 */
export interface ConfigurationWorkflowResult {
    /**
     * Whether the operation was successful
     */
    success: boolean;
    /**
     * Configuration data (if successful)
     */
    config?: any;
    /**
     * Validation result (if validation was performed)
     */
    validation?: ConfigValidationResult;
    /**
     * Error message (if failed)
     */
    error?: string;
    /**
     * Truth score for the configuration
     */
    truthScore?: number;
}
/**
 * Service for managing configuration loading and saving workflows
 */
export declare class ConfigurationWorkflowService {
    private readonly environmentConfigService;
    private readonly encryptedConfigStore;
    private readonly configValidator;
    private readonly validateOnLoad;
    private readonly validateOnSave;
    private readonly encryptTokens;
    constructor(options: ConfigurationWorkflowOptions, payloadEncryptionService: PayloadEncryptionService, messageAuthenticationService: MessageAuthenticationService, tokenEncryptionService: TokenEncryptionService, githubPatAuthService: GitHubPATAuthService, githubAppAuthService?: GitHubAppAuthService);
    /**
     * Load configuration for a specific environment
     * @param environment - Environment name
     * @param configKey - Configuration key for secure storage
     * @returns Configuration workflow result
     */
    loadConfiguration(environment: string, configKey: string): Promise<ConfigurationWorkflowResult>;
    /**
     * Save configuration for a specific environment
     * @param environment - Environment name
     * @param configKey - Configuration key for secure storage
     * @param config - Configuration to save
     * @returns Configuration workflow result
     */
    saveConfiguration(environment: string, configKey: string, config: any): Promise<ConfigurationWorkflowResult>;
    /**
     * Validate a configuration without saving or loading
     * @param config - Configuration to validate
     * @returns Configuration workflow result
     */
    validateConfiguration(config: any): Promise<ConfigurationWorkflowResult>;
    /**
     * List all available configuration keys
     * @returns Array of configuration keys
     */
    listConfigurations(): Promise<string[]>;
    /**
     * Delete a configuration
     * @param configKey - Configuration key to delete
     * @returns Configuration workflow result
     */
    deleteConfiguration(configKey: string): Promise<ConfigurationWorkflowResult>;
    /**
     * Validate tokens in configuration
     * @param tokens - Map of token names to encrypted tokens and types
     * @returns Map of validation results
     */
    validateTokens(tokens: Record<string, {
        token: string;
        type: string;
    }>): Promise<Record<string, import('../services/TokenValidationService').TokenValidationResult>>;
    /**
     * Refresh tokens in configuration
     * @param tokens - Map of token names to refresh tokens and types
     * @returns Map of refresh results
     */
    refreshTokens(tokens: Record<string, {
        refreshToken: string;
        type: string;
    }>): Promise<Record<string, import('../services/TokenValidationService').TokenRefreshResult>>;
}
//# sourceMappingURL=ConfigurationWorkflowService.d.ts.map