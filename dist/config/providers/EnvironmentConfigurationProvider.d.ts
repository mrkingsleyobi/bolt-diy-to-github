import { ConfigurationProvider } from '../ConfigurationProvider';
/**
 * Environment configuration provider
 */
export declare class EnvironmentConfigurationProvider implements ConfigurationProvider {
    private name;
    private prefix;
    constructor(name: string, prefix?: string);
    /**
     * Get provider name
     * @returns Provider name
     */
    getName(): string;
    /**
     * Load configuration from environment variables
     * @returns Configuration data
     */
    load(): Promise<any>;
    /**
     * Save configuration to environment variables
     * @param config - Configuration data
     */
    save(config: any): Promise<void>;
    /**
     * Check if provider is available
     * @returns Availability status
     */
    isAvailable(): Promise<boolean>;
    /**
     * Set nested value in config object
     * @param obj - Configuration object
     * @param key - Key with dot notation
     * @param value - Value to set
     */
    private setNestedValue;
}
//# sourceMappingURL=EnvironmentConfigurationProvider.d.ts.map