/**
 * Configuration provider interface
 */
export interface ConfigurationProvider {
    /**
     * Get provider name
     * @returns Provider name
     */
    getName(): string;
    /**
     * Load configuration from source
     * @returns Configuration data
     */
    load(): Promise<any>;
    /**
     * Save configuration to source
     * @param config - Configuration data
     */
    save(config: any): Promise<void>;
    /**
     * Check if provider is available
     * @returns Availability status
     */
    isAvailable(): Promise<boolean>;
}
//# sourceMappingURL=ConfigurationProvider.d.ts.map