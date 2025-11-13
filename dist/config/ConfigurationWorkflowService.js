"use strict";
// ConfigurationWorkflowService.ts - Service for managing configuration loading and saving workflows
// Phase 4: Environment Configuration Management - Task 5: Create configuration loading and saving workflows
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigurationWorkflowService = void 0;
const EnvironmentConfigurationService_1 = require("../config/EnvironmentConfigurationService");
const EncryptedConfigStore_1 = require("../config/EncryptedConfigStore");
const ConfigValidator_1 = require("../config/ConfigValidator");
/**
 * Service for managing configuration loading and saving workflows
 */
class ConfigurationWorkflowService {
    constructor(options, payloadEncryptionService, messageAuthenticationService, tokenEncryptionService, githubPatAuthService, githubAppAuthService) {
        // Initialize services
        this.environmentConfigService = new EnvironmentConfigurationService_1.EnvironmentConfigurationService(payloadEncryptionService, messageAuthenticationService, tokenEncryptionService, options.encryptionPassword, githubPatAuthService, githubAppAuthService);
        this.encryptedConfigStore = new EncryptedConfigStore_1.EncryptedConfigStore(options.storagePath, payloadEncryptionService, messageAuthenticationService, options.encryptionPassword);
        this.configValidator = new ConfigValidator_1.ConfigValidatorImpl();
        this.validateOnLoad = options.validateOnLoad ?? true;
        this.validateOnSave = options.validateOnSave ?? true;
        this.encryptTokens = options.encryptTokens ?? true;
    }
    /**
     * Load configuration for a specific environment
     * @param environment - Environment name
     * @param configKey - Configuration key for secure storage
     * @returns Configuration workflow result
     */
    async loadConfiguration(environment, configKey) {
        try {
            // First, try to load from secure storage
            const storedConfig = await this.encryptedConfigStore.load(configKey);
            if (storedConfig) {
                // Validate if requested
                let validation;
                if (this.validateOnLoad) {
                    const schema = this.configValidator.createDefaultSchema();
                    validation = this.configValidator.validate(storedConfig, schema);
                    // If validation fails, return the result with errors
                    if (!validation.valid) {
                        return {
                            success: false,
                            validation,
                            error: 'Configuration validation failed',
                            truthScore: 0.75 // Lower truth score for invalid config
                        };
                    }
                }
                // Return the stored configuration
                return {
                    success: true,
                    config: storedConfig,
                    validation,
                    truthScore: validation?.valid !== false ? 0.95 : 0.75
                };
            }
            else {
                // If no stored config, get from environment configuration service
                const envConfig = await this.environmentConfigService.getEnvironmentConfig(environment);
                // Validate if requested
                let validation;
                if (this.validateOnLoad) {
                    const schema = this.configValidator.createDefaultSchema();
                    validation = this.configValidator.validate(envConfig, schema);
                    // If validation fails, return the result with errors
                    if (!validation.valid) {
                        return {
                            success: false,
                            config: envConfig,
                            validation,
                            error: 'Environment configuration validation failed',
                            truthScore: 0.8 // Lower truth score for env config with validation errors
                        };
                    }
                }
                return {
                    success: true,
                    config: envConfig,
                    validation,
                    truthScore: validation?.valid !== false ? 0.9 : 0.8
                };
            }
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to load configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
                truthScore: 0.1 // Very low truth score for errors
            };
        }
    }
    /**
     * Save configuration for a specific environment
     * @param environment - Environment name
     * @param configKey - Configuration key for secure storage
     * @param config - Configuration to save
     * @returns Configuration workflow result
     */
    async saveConfiguration(environment, configKey, config) {
        try {
            // Validate if requested
            let validation;
            if (this.validateOnSave) {
                const schema = this.configValidator.createDefaultSchema();
                validation = this.configValidator.validate(config, schema);
                // If validation fails, return the result with errors
                if (!validation.valid) {
                    return {
                        success: false,
                        config,
                        validation,
                        error: 'Configuration validation failed',
                        truthScore: 0.75 // Lower truth score for invalid config
                    };
                }
            }
            // Save to secure storage
            await this.encryptedConfigStore.save(configKey, config);
            // Also save to environment configuration service if requested
            if (this.encryptTokens) {
                await this.environmentConfigService.saveEnvironmentConfig(environment, config);
            }
            return {
                success: true,
                config,
                validation,
                truthScore: validation?.valid !== false ? 0.95 : 0.75
            };
        }
        catch (error) {
            return {
                success: false,
                config,
                error: `Failed to save configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
                truthScore: 0.1 // Very low truth score for errors
            };
        }
    }
    /**
     * Validate a configuration without saving or loading
     * @param config - Configuration to validate
     * @returns Configuration workflow result
     */
    async validateConfiguration(config) {
        try {
            const schema = this.configValidator.createDefaultSchema();
            const validation = this.configValidator.validate(config, schema);
            return {
                success: validation.valid,
                config,
                validation,
                truthScore: validation.valid ? 0.95 : 0.75
            };
        }
        catch (error) {
            return {
                success: false,
                config,
                error: `Failed to validate configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
                truthScore: 0.1 // Very low truth score for errors
            };
        }
    }
    /**
     * List all available configuration keys
     * @returns Array of configuration keys
     */
    async listConfigurations() {
        try {
            return await this.encryptedConfigStore.list();
        }
        catch (error) {
            console.error('Failed to list configurations:', error);
            return [];
        }
    }
    /**
     * Delete a configuration
     * @param configKey - Configuration key to delete
     * @returns Configuration workflow result
     */
    async deleteConfiguration(configKey) {
        try {
            await this.encryptedConfigStore.delete(configKey);
            return {
                success: true,
                truthScore: 0.95
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to delete configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
                truthScore: 0.1 // Very low truth score for errors
            };
        }
    }
    /**
     * Validate tokens in configuration
     * @param tokens - Map of token names to encrypted tokens and types
     * @returns Map of validation results
     */
    async validateTokens(tokens) {
        return await this.environmentConfigService.validateTokens(tokens);
    }
    /**
     * Refresh tokens in configuration
     * @param tokens - Map of token names to refresh tokens and types
     * @returns Map of refresh results
     */
    async refreshTokens(tokens) {
        return await this.environmentConfigService.refreshTokens(tokens);
    }
}
exports.ConfigurationWorkflowService = ConfigurationWorkflowService;
//# sourceMappingURL=ConfigurationWorkflowService.js.map