import { ConfigurationManager, ConfigurationOptions, ValidationResult, ConfigurationChange, ConfigurationStatus } from './ConfigurationManager';
import { PayloadEncryptionService } from '../security/PayloadEncryptionService';
import { MessageAuthenticationService } from '../security/MessageAuthenticationService';
/**
 * Basic configuration manager implementation
 */
export declare class BasicConfigurationManager implements ConfigurationManager {
    private options;
    private environmentAdapter;
    private providers;
    private config;
    private listeners;
    private cache;
    private cacheHits;
    private cacheMisses;
    private lastLoad;
    private errorCount;
    private encryptionService;
    private authenticationService;
    constructor(encryptionService: PayloadEncryptionService, authenticationService: MessageAuthenticationService);
    /**
     * Initialize the configuration manager
     * @param options - Configuration options
     */
    initialize(options: ConfigurationOptions): Promise<void>;
    /**
     * Get a configuration value
     * @param key - Configuration key
     * @param defaultValue - Default value if key not found
     * @returns Configuration value
     */
    get<T>(key: string, defaultValue?: T): T;
    /**
     * Set a configuration value
     * @param key - Configuration key
     * @param value - Configuration value
     */
    set<T>(key: string, value: T): void;
    /**
     * Load configuration from sources
     */
    load(): Promise<void>;
    /**
     * Reload configuration from sources
     */
    reload(): Promise<void>;
    /**
     * Validate current configuration
     * @returns Validation result
     */
    validate(): ValidationResult;
    /**
     * Subscribe to configuration changes
     * @param listener - Change listener
     */
    onChange(listener: (change: ConfigurationChange) => void): void;
    /**
     * Get current configuration status
     * @returns Configuration status
     */
    getStatus(): ConfigurationStatus;
    /**
     * Create environment adapter based on environment type
     * @param environment - Environment type
     * @returns Environment adapter
     */
    private createEnvironmentAdapter;
    /**
     * Create providers based on configuration sources
     * @param sources - Configuration sources
     * @returns Configuration providers
     */
    private createProviders;
    /**
     * Merge configuration objects
     * @param target - Target configuration
     * @param source - Source configuration
     */
    private mergeConfig;
    /**
     * Set up hot reloading
     */
    private setupHotReloading;
    /**
     * Notify listeners of configuration changes
     * @param change - Configuration change
     */
    private notifyListeners;
}
//# sourceMappingURL=BasicConfigurationManager.d.ts.map