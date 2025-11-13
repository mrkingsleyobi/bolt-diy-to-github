import { PayloadEncryptionService } from '../security/PayloadEncryptionService';
import { MessageAuthenticationService } from '../security/MessageAuthenticationService';
/**
 * Secure configuration storage interface
 */
export interface SecureConfigStore {
    /**
     * Load configuration from secure storage
     * @param key - Configuration key
     * @returns Encrypted configuration data
     */
    load(key: string): Promise<any>;
    /**
     * Save configuration to secure storage
     * @param key - Configuration key
     * @param config - Configuration data to save
     */
    save(key: string, config: any): Promise<void>;
    /**
     * Delete configuration from secure storage
     * @param key - Configuration key
     */
    delete(key: string): Promise<void>;
    /**
     * List all configuration keys
     * @returns Array of configuration keys
     */
    list(): Promise<string[]>;
}
/**
 * Secure configuration storage implementation
 */
export declare class EncryptedConfigStore implements SecureConfigStore {
    private readonly storagePath;
    private readonly payloadEncryptionService;
    private readonly messageAuthenticationService;
    private readonly encryptionKey;
    constructor(storagePath: string, payloadEncryptionService: PayloadEncryptionService, messageAuthenticationService: MessageAuthenticationService, encryptionKey: string);
    /**
     * Ensure storage directory exists
     */
    private ensureStorageDirectory;
    /**
     * Load configuration from secure storage
     * @param key - Configuration key
     * @returns Encrypted configuration data
     */
    load(key: string): Promise<any>;
    /**
     * Save configuration to secure storage
     * @param key - Configuration key
     * @param config - Configuration data to save
     */
    save(key: string, config: any): Promise<void>;
    /**
     * Delete configuration from secure storage
     * @param key - Configuration key
     */
    delete(key: string): Promise<void>;
    /**
     * List all configuration keys
     * @returns Array of configuration keys
     */
    list(): Promise<string[]>;
    /**
     * Get file path for configuration key
     * @param key - Configuration key
     * @returns File path
     */
    private getFilePath;
    /**
     * Check if file exists
     * @param filePath - File path to check
     * @returns True if file exists, false otherwise
     */
    private fileExists;
}
//# sourceMappingURL=EncryptedConfigStore.d.ts.map