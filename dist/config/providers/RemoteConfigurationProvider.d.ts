import { ConfigurationProvider } from '../ConfigurationProvider';
/**
 * Remote configuration provider
 */
export declare class RemoteConfigurationProvider implements ConfigurationProvider {
    private name;
    private url;
    private headers;
    private timeout;
    private cache;
    private lastFetch;
    private cacheTTL;
    constructor(name: string, url: string, headers?: Record<string, string>, timeout?: number, cacheTTL?: number);
    /**
     * Get provider name
     * @returns Provider name
     */
    getName(): string;
    /**
     * Load configuration from remote source
     * @returns Configuration data
     */
    load(): Promise<any>;
    /**
     * Save configuration to remote source
     * @param config - Configuration data
     */
    save(config: any): Promise<void>;
    /**
     * Check if provider is available
     * @returns Availability status
     */
    isAvailable(): Promise<boolean>;
}
//# sourceMappingURL=RemoteConfigurationProvider.d.ts.map