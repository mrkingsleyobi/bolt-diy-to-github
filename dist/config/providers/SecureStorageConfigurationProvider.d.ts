import { ConfigurationProvider } from '../ConfigurationProvider';
import { PayloadEncryptionService } from '../../security/PayloadEncryptionService';
import { MessageAuthenticationService } from '../../security/MessageAuthenticationService';
/**
 * Secure storage configuration provider
 */
export declare class SecureStorageConfigurationProvider implements ConfigurationProvider {
    private name;
    private namespace;
    private encryptionService;
    private authenticationService;
    private storagePath;
    private inMemoryStorage;
    constructor(name: string, namespace: string, encryptionService: PayloadEncryptionService, authenticationService: MessageAuthenticationService, storagePath?: string);
    /**
     * Get provider name
     * @returns Provider name
     */
    getName(): string;
    /**
     * Load configuration from secure storage
     * @returns Configuration data
     */
    load(): Promise<any>;
    /**
     * Save configuration to secure storage
     * @param config - Configuration data
     */
    save(config: any): Promise<void>;
    /**
     * Check if provider is available
     * @returns Availability status
     */
    isAvailable(): Promise<boolean>;
    /**
     * Clear stored configuration
     */
    clear(): Promise<void>;
    /**
     * Get storage path
     * @returns Storage path
     */
    getStoragePath(): string;
}
//# sourceMappingURL=SecureStorageConfigurationProvider.d.ts.map