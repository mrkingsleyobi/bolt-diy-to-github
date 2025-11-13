// SecureStorageConfigurationProvider.ts - Secure storage configuration provider implementation
// Phase 4: Environment Configuration Management - Task 10: Implement Secure Storage Configuration Provider

import { ConfigurationProvider } from '../ConfigurationProvider';
import { PayloadEncryptionService } from '../../security/PayloadEncryptionService';
import { MessageAuthenticationService } from '../../security/MessageAuthenticationService';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * Secure storage configuration provider
 */
export class SecureStorageConfigurationProvider implements ConfigurationProvider {
  private name: string;
  private namespace: string;
  private encryptionService: PayloadEncryptionService;
  private authenticationService: MessageAuthenticationService;
  private storagePath: string;
  private inMemoryStorage: Map<string, { data: string; timestamp: number; signature: string }> = new Map();

  constructor(
    name: string,
    namespace: string,
    encryptionService: PayloadEncryptionService,
    authenticationService: MessageAuthenticationService,
    storagePath?: string
  ) {
    this.name = name;
    this.namespace = namespace;
    this.encryptionService = encryptionService;
    this.authenticationService = authenticationService;

    // Use provided storage path or default to system temp directory
    this.storagePath = storagePath || path.join(os.tmpdir(), 'secure-config-storage');

    // Ensure storage directory exists
    if (!fs.existsSync(this.storagePath)) {
      fs.mkdirSync(this.storagePath, { recursive: true });
    }
  }

  /**
   * Get provider name
   * @returns Provider name
   */
  getName(): string {
    return this.name;
  }

  /**
   * Load configuration from secure storage
   * @returns Configuration data
   */
  async load(): Promise<any> {
    try {
      const key = `${this.namespace}:config`;
      let stored: { data: string; timestamp: number; signature: string } | undefined;

      // Try to load from persistent storage first
      try {
        const filePath = path.join(this.storagePath, `${this.namespace}-config.json`);
        if (fs.existsSync(filePath)) {
          const fileContent = fs.readFileSync(filePath, 'utf8');
          const fileData = JSON.parse(fileContent);
          stored = fileData;
        }
      } catch (fileError: any) {
        // If file loading fails, try in-memory storage
        stored = this.inMemoryStorage.get(key);
      }

      // If nothing is stored, return empty object
      if (!stored) {
        return {};
      }

      // Verify integrity first
      const isValid = await this.authenticationService.verifyMessage({
        payload: stored.data,
        signature: stored.signature,
        timestamp: stored.timestamp
      });

      if (!isValid) {
        throw new Error('Configuration integrity verification failed');
      }

      // Decrypt the configuration
      const decrypted = await this.encryptionService.decryptPayload(
        JSON.parse(stored.data),
        'config-secret' // This would need to be a proper secret in a real implementation
      );
      return JSON.parse(decrypted);
    } catch (error: any) {
      throw new Error(`Failed to load secure configuration: ${error.message}`);
    }
  }

  /**
   * Save configuration to secure storage
   * @param config - Configuration data
   */
  async save(config: any): Promise<void> {
    try {
      const key = `${this.namespace}:config`;
      const configString = JSON.stringify(config);

      // Encrypt the configuration
      const encryptedMessage = await this.encryptionService.encryptPayload(configString, 'config-secret');

      // Create authentication tag
      const signedMessage = this.authenticationService.signMessage(configString);
      const signature = signedMessage.signature;

      // Store in both persistent and in-memory storage
      const storageData = {
        data: JSON.stringify(encryptedMessage),
        timestamp: Date.now(),
        signature: signature
      };

      // Save to in-memory storage
      this.inMemoryStorage.set(key, storageData);

      // Save to persistent storage
      try {
        const filePath = path.join(this.storagePath, `${this.namespace}-config.json`);
        fs.writeFileSync(filePath, JSON.stringify(storageData, null, 2));
      } catch (fileError: any) {
        console.warn(`Failed to save to persistent storage: ${fileError.message}`);
        // We'll still have the in-memory storage as backup
      }
    } catch (error: any) {
      throw new Error(`Failed to save secure configuration: ${error.message}`);
    }
  }

  /**
   * Check if provider is available
   * @returns Availability status
   */
  async isAvailable(): Promise<boolean> {
    // Check if encryption and authentication services are available
    try {
      // Test encryption service
      const testEncryption = await this.encryptionService.encryptPayload('test', 'test-secret');
      await this.encryptionService.decryptPayload(testEncryption, 'test-secret');

      // Test authentication service
      const testAuth = this.authenticationService.signMessage('test');
      const isValid = this.authenticationService.verifyMessage(testAuth);

      if (!isValid) {
        return false;
      }

      // Test file system access
      try {
        const testFilePath = path.join(this.storagePath, 'test-access.tmp');
        fs.writeFileSync(testFilePath, 'test');
        fs.unlinkSync(testFilePath);
      } catch (fsError: any) {
        console.warn(`File system access test failed: ${fsError.message}`);
        // File system access failed, but we can still use in-memory storage
      }

      return true;
    } catch (error: any) {
      return false;
    }
  }

  /**
   * Clear stored configuration
   */
  async clear(): Promise<void> {
    const key = `${this.namespace}:config`;

    // Clear in-memory storage
    this.inMemoryStorage.delete(key);

    // Clear persistent storage
    try {
      const filePath = path.join(this.storagePath, `${this.namespace}-config.json`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error: any) {
      console.warn(`Failed to clear persistent storage: ${error.message}`);
    }
  }

  /**
   * Get storage path
   * @returns Storage path
   */
  getStoragePath(): string {
    return this.storagePath;
  }
}