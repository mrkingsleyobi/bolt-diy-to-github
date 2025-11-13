import { ConfigurationProvider } from '../ConfigurationProvider';
/**
 * File configuration provider
 */
export declare class FileConfigurationProvider implements ConfigurationProvider {
    private name;
    private filePath;
    private format;
    private cache;
    private lastModified;
    constructor(name: string, filePath: string, format?: 'json' | 'yaml' | 'yml');
    /**
     * Get provider name
     * @returns Provider name
     */
    getName(): string;
    /**
     * Load configuration from file
     * @returns Configuration data
     */
    load(): Promise<any>;
    /**
     * Save configuration to file
     * @param config - Configuration data
     */
    save(config: any): Promise<void>;
    /**
     * Check if provider is available
     * @returns Availability status
     */
    isAvailable(): Promise<boolean>;
}
//# sourceMappingURL=FileConfigurationProvider.d.ts.map