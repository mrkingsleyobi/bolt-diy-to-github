import { EnvironmentAdapter, EnvironmentType } from '../EnvironmentAdapter';
import { ConfigurationSource, ValidationResult } from '../ConfigurationManager';
/**
 * Cloud environment adapter
 */
export declare class CloudEnvironmentAdapter implements EnvironmentAdapter {
    private environment;
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
    /**
     * Detect cloud provider based on environment
     * @returns Cloud provider name
     */
    private detectCloudProvider;
    /**
     * Get cloud metadata service URL based on detected provider
     * @returns Metadata service URL
     */
    private getCloudMetadataServiceUrl;
    /**
     * Get allowed origins based on cloud provider
     * @returns Array of allowed origins
     */
    private getAllowedOrigins;
}
//# sourceMappingURL=CloudEnvironmentAdapter.d.ts.map