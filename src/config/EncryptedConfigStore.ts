// SecureConfigStore.ts - Secure configuration storage with encryption
// Phase 4: Environment Configuration Management - Task 11: Implement Environment Configuration Service (SecureConfigStore component)

import { PayloadEncryptionService } from '../security/PayloadEncryptionService';
import { MessageAuthenticationService } from '../security/MessageAuthenticationService';
import * as fs from 'fs/promises';
import * as path from 'path';

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
export class EncryptedConfigStore implements SecureConfigStore {
  private readonly storagePath: string;
  private readonly payloadEncryptionService: PayloadEncryptionService;
  private readonly messageAuthenticationService: MessageAuthenticationService;
  private readonly encryptionKey: string;

  constructor(
    storagePath: string,
    payloadEncryptionService: PayloadEncryptionService,
    messageAuthenticationService: MessageAuthenticationService,
    encryptionKey: string
  ) {
    this.storagePath = storagePath;
    this.payloadEncryptionService = payloadEncryptionService;
    this.messageAuthenticationService = messageAuthenticationService;
    this.encryptionKey = encryptionKey;

    // Ensure storage directory exists
    this.ensureStorageDirectory();
  }

  /**
   * Ensure storage directory exists
   */
  private async ensureStorageDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.storagePath, { recursive: true });
    } catch (error: any) {
      throw new Error(`Failed to create storage directory: ${error.message}`);
    }
  }

  /**
   * Load configuration from secure storage
   * @param key - Configuration key
   * @returns Encrypted configuration data
   */
  async load(key: string): Promise<any> {
    try {
      const filePath = this.getFilePath(key);
      const exists = await this.fileExists(filePath);

      if (!exists) {
        return null;
      }

      // Read encrypted configuration file
      const encryptedData = await fs.readFile(filePath, 'utf8');
      const parsedData = JSON.parse(encryptedData);

      // Verify integrity first
      const isValid = await this.messageAuthenticationService.verifyMessage({
        payload: parsedData.payload,
        signature: parsedData.signature,
        timestamp: parsedData.timestamp
      });

      if (!isValid) {
        throw new Error('Configuration integrity verification failed');
      }

      // Decrypt the configuration
      const decrypted = await this.payloadEncryptionService.decryptPayload(
        JSON.parse(parsedData.payload),
        this.encryptionKey
      );

      return JSON.parse(decrypted);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, return null
        return null;
      }
      throw new Error(`Failed to load secure configuration: ${error.message}`);
    }
  }

  /**
   * Save configuration to secure storage
   * @param key - Configuration key
   * @param config - Configuration data to save
   */
  async save(key: string, config: any): Promise<void> {
    try {
      const filePath = this.getFilePath(key);
      const configString = JSON.stringify(config);

      // Encrypt the configuration
      const encrypted = await this.payloadEncryptionService.encryptPayload(
        configString,
        this.encryptionKey
      );

      // Create authentication tag
      const payload = JSON.stringify(encrypted);
      const signedMessage = this.messageAuthenticationService.signMessage(payload);

      // Create storage object
      const storageObject = {
        payload: signedMessage.payload,
        signature: signedMessage.signature,
        timestamp: signedMessage.timestamp
      };

      // Ensure directory exists
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });

      // Write encrypted configuration to file
      await fs.writeFile(filePath, JSON.stringify(storageObject, null, 2), 'utf8');
    } catch (error: any) {
      throw new Error(`Failed to save secure configuration: ${error.message}`);
    }
  }

  /**
   * Delete configuration from secure storage
   * @param key - Configuration key
   */
  async delete(key: string): Promise<void> {
    try {
      const filePath = this.getFilePath(key);
      const exists = await this.fileExists(filePath);

      if (exists) {
        await fs.unlink(filePath);
      }
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw new Error(`Failed to delete configuration: ${error.message}`);
      }
    }
  }

  /**
   * List all configuration keys
   * @returns Array of configuration keys
   */
  async list(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.storagePath);
      return files
        .filter(file => file.endsWith('.conf'))
        .map(file => file.replace('.conf', ''));
    } catch (error: any) {
      throw new Error(`Failed to list configurations: ${error.message}`);
    }
  }

  /**
   * Get file path for configuration key
   * @param key - Configuration key
   * @returns File path
   */
  private getFilePath(key: string): string {
    // Sanitize key to prevent directory traversal
    const sanitizedKey = key.replace(/[^a-zA-Z0-9_-]/g, '_');
    return path.join(this.storagePath, `${sanitizedKey}.conf`);
  }

  /**
   * Check if file exists
   * @param filePath - File path to check
   * @returns True if file exists, false otherwise
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch (error: any) {
      return false;
    }
  }
}