import { ConfigurationSource, ValidationResult } from './ConfigurationManager';
/**
 * Environment types
 */
export declare enum EnvironmentType {
    DEVELOPMENT = "development",
    TESTING = "testing",
    STAGING = "staging",
    PRODUCTION = "production",
    CLOUD = "cloud",
    CICD = "cicd"
}
/**
 * Environment adapter interface
 */
export interface EnvironmentAdapter {
    /**
     * Get current environment
     * @returns Current environment
     */
    getEnvironment(): EnvironmentType;
    /**
     * Get environment-specific configuration sources
     * @returns Configuration sources
     */
    getConfigurationSources(): ConfigurationSource[];
    /**
     * Transform configuration for environment
     * @param config - Configuration to transform
     * @returns Transformed configuration
     */
    transformConfiguration(config: any): any;
    /**
     * Validate configuration for environment
     * @param config - Configuration to validate
     * @returns Validation result
     */
    validateConfiguration(config: any): ValidationResult;
}
//# sourceMappingURL=EnvironmentAdapter.d.ts.map