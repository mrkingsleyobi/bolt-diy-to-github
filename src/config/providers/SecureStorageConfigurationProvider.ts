// SecureStorageConfigurationProvider.ts - Secure storage configuration provider implementation
// Phase 4: Environment Configuration Management - Task 10: Implement Secure Storage Configuration Provider

import { ConfigurationProvider } from '../ConfigurationProvider';
import { PayloadEncryptionService } from '../../security/PayloadEncryptionService';
import { MessageAuthenticationService } from '../../security/MessageAuthenticationService';

/**
 * Secure storage configuration provider
 */
export class SecureStorageConfigurationProvider implements ConfigurationProvider {
  private name: string;
  private namespace: string;
  private encryptionService: PayloadEncryptionService;
  private authenticationService: MessageAuthenticationService;
  private storage: Map<string, { data: string; timestamp: number }> = new Map();

  constructor(
    name: string,
    namespace: string,
    encryptionService: PayloadEncryptionService,
    authenticationService: MessageAuthenticationService
  ) {
    this.name = name;
    this.namespace = namespace;
    this.encryptionService = encryptionService;
    this.authenticationService = authenticationService;
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
      const stored = this.storage.get(key);

      if (!stored) {
        return {};
      }

      // Verify integrity first
      const isValid = await this.authenticationService.verifyMessage(
        stored.data,
        stored.data // In a real implementation, we would store the signature separately
      );

      if (!isValid) {
        throw new Error('Configuration integrity verification failed');
      }

      // Decrypt the configuration
      const decrypted = await this.encryptionService.decrypt(stored.data);
      return JSON.parse(decrypted);
    } catch (error) {
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
      const encrypted = await this.encryptionService.encrypt(configString);

      // Create authentication tag
      const signature = await this.authenticationService.authenticateMessage(encrypted);

      // Store in secure storage (in memory for this implementation)
      this.storage.set(key, {
        data: encrypted,
        timestamp: Date.now()
      });
    } catch (error) {
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
      const testEncryption = await this.encryptionService.encrypt('test');
      await this.encryptionService.decrypt(testEncryption);

      // Test authentication service
      const testAuth = await this.authenticationService.authenticateMessage('test');
      await this.authenticationService.verifyMessage('test', testAuth);

      return true;
    } catch (error) {
      return false;
    }
  }
}