import { EnvironmentAdapter, EnvironmentType } from '../EnvironmentAdapter';
import { ConfigurationSource, ValidationResult } from '../ConfigurationManager';
/**
 * CI/CD environment adapter
 */
export declare class CICDEnvironmentAdapter implements EnvironmentAdapter {
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
     * Detect CI pipeline based on environment variables
     * @returns CI pipeline name
     */
    private detectCIPipeline;
}
//# sourceMappingURL=CICDEnvironmentAdapter.d.ts.map