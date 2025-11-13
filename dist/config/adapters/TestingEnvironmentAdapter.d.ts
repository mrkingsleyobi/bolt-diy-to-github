import { EnvironmentAdapter, EnvironmentType } from '../EnvironmentAdapter';
import { ConfigurationSource, ValidationResult } from '../ConfigurationManager';
/**
 * Testing environment adapter
 */
export declare class TestingEnvironmentAdapter implements EnvironmentAdapter {
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
}
//# sourceMappingURL=TestingEnvironmentAdapter.d.ts.map