// EncryptedConfigStore.test.ts - Unit tests for EncryptedConfigStore
// Phase 4: Environment Configuration Management - Task 9: Write tests for configuration storage and encryption mechanisms

import { EncryptedConfigStore } from '../../src/config/EncryptedConfigStore';
import { PayloadEncryptionService } from '../../src/security/PayloadEncryptionService';
import { MessageAuthenticationService } from '../../src/security/MessageAuthenticationService';
import * as fs from 'fs/promises';

// Mock the file system operations
jest.mock('fs/promises');

// Mock the security services
jest.mock('../../src/security/PayloadEncryptionService');
jest.mock('../../src/security/MessageAuthenticationService');

describe('EncryptedConfigStore', () => {
  let encryptedConfigStore: EncryptedConfigStore;
  let mockPayloadEncryptionService: jest.Mocked<PayloadEncryptionService>;
  let mockMessageAuthenticationService: jest.Mocked<MessageAuthenticationService>;
  const storagePath = '/test/storage/path';
  const encryptionKey = 'test-encryption-key';

  beforeEach(() => {
    // Create mock instances
    mockPayloadEncryptionService = new PayloadEncryptionService() as jest.Mocked<PayloadEncryptionService>;
    mockMessageAuthenticationService = new MessageAuthenticationService() as jest.Mocked<MessageAuthenticationService>;

    // Create the store instance
    encryptedConfigStore = new EncryptedConfigStore(
      storagePath,
      mockPayloadEncryptionService,
      mockMessageAuthenticationService,
      encryptionKey
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create an instance and ensure storage directory exists', async () => {
      // Mock mkdir to succeed
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);

      const store = new EncryptedConfigStore(
        storagePath,
        mockPayloadEncryptionService,
        mockMessageAuthenticationService,
        encryptionKey
      );

      // The constructor calls ensureStorageDirectory, which calls fs.mkdir
      expect(fs.mkdir).toHaveBeenCalledWith(storagePath, { recursive: true });
    });

    it('should throw an error if storage directory creation fails', async () => {
      // Mock mkdir to fail
      (fs.mkdir as jest.Mock).mockRejectedValue(new Error('Permission denied'));

      expect(() => {
        new EncryptedConfigStore(
          storagePath,
          mockPayloadEncryptionService,
          mockMessageAuthenticationService,
          encryptionKey
        );
      }).toThrow('Failed to create storage directory: Permission denied');
    });
  });

  describe('save', () => {
    it('should save configuration with encryption and authentication', async () => {
      const key = 'test-config';
      const config = { test: 'value', secret: 'password' };

      // Mock file system operations
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

      // Mock encryption service
      mockPayloadEncryptionService.encryptPayload.mockResolvedValue('encrypted-data');

      // Mock authentication service
      mockMessageAuthenticationService.signMessage.mockReturnValue({
        payload: 'signed-payload',
        signature: 'test-signature',
        timestamp: Date.now()
      });

      await encryptedConfigStore.save(key, config);

      // Verify encryption was called
      expect(mockPayloadEncryptionService.encryptPayload).toHaveBeenCalledWith(
        JSON.stringify(config),
        encryptionKey
      );

      // Verify authentication was called
      expect(mockMessageAuthenticationService.signMessage).toHaveBeenCalledWith(
        JSON.stringify('encrypted-data')
      );

      // Verify file write was called with correct data
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining(`${key}.conf`),
        expect.stringContaining('"payload":"signed-payload"'),
        'utf8'
      );
    });

    it('should handle save errors gracefully', async () => {
      const key = 'test-config';
      const config = { test: 'value' };

      // Mock file system operations to fail
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
      (fs.writeFile as jest.Mock).mockRejectedValue(new Error('Disk full'));

      // Mock encryption service
      mockPayloadEncryptionService.encryptPayload.mockResolvedValue('encrypted-data');

      // Mock authentication service
      mockMessageAuthenticationService.signMessage.mockReturnValue({
        payload: 'signed-payload',
        signature: 'test-signature',
        timestamp: Date.now()
      });

      await expect(encryptedConfigStore.save(key, config)).rejects.toThrow(
        'Failed to save secure configuration: Disk full'
      );
    });
  });

  describe('load', () => {
    it('should load and decrypt configuration successfully', async () => {
      const key = 'test-config';
      const config = { test: 'value', secret: 'password' };
      const encryptedData = 'encrypted-data';
      const signedMessage = {
        payload: JSON.stringify(encryptedData),
        signature: 'test-signature',
        timestamp: Date.now()
      };

      // Mock file system operations
      (fs.access as jest.Mock).mockResolvedValue(undefined);
      (fs.readFile as jest.Mock).mockResolvedValue(
        JSON.stringify({
          payload: signedMessage.payload,
          signature: signedMessage.signature,
          timestamp: signedMessage.timestamp
        })
      );

      // Mock authentication service
      mockMessageAuthenticationService.verifyMessage.mockResolvedValue(true);

      // Mock encryption service
      mockPayloadEncryptionService.decryptPayload.mockResolvedValue(JSON.stringify(config));

      const result = await encryptedConfigStore.load(key);

      // Verify file read was called
      expect(fs.readFile).toHaveBeenCalledWith(expect.stringContaining(`${key}.conf`), 'utf8');

      // Verify authentication verification was called
      expect(mockMessageAuthenticationService.verifyMessage).toHaveBeenCalledWith(signedMessage);

      // Verify decryption was called
      expect(mockPayloadEncryptionService.decryptPayload).toHaveBeenCalledWith(
        encryptedData,
        encryptionKey
      );

      // Verify the result
      expect(result).toEqual(config);
    });

    it('should return null for non-existent configuration', async () => {
      const key = 'non-existent-config';

      // Mock file system operations to simulate file not found
      (fs.access as jest.Mock).mockRejectedValue({ code: 'ENOENT' });

      const result = await encryptedConfigStore.load(key);

      expect(result).toBeNull();
    });

    it('should throw an error if integrity verification fails', async () => {
      const key = 'test-config';
      const signedMessage = {
        payload: 'test-payload',
        signature: 'invalid-signature',
        timestamp: Date.now()
      };

      // Mock file system operations
      (fs.access as jest.Mock).mockResolvedValue(undefined);
      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(signedMessage));

      // Mock authentication service to fail verification
      mockMessageAuthenticationService.verifyMessage.mockResolvedValue(false);

      await expect(encryptedConfigStore.load(key)).rejects.toThrow(
        'Configuration integrity verification failed'
      );
    });

    it('should handle load errors gracefully', async () => {
      const key = 'test-config';

      // Mock file system operations to fail
      (fs.access as jest.Mock).mockResolvedValue(undefined);
      (fs.readFile as jest.Mock).mockRejectedValue(new Error('Disk read error'));

      await expect(encryptedConfigStore.load(key)).rejects.toThrow(
        'Failed to load secure configuration: Disk read error'
      );
    });
  });

  describe('delete', () => {
    it('should delete configuration file successfully', async () => {
      const key = 'test-config';

      // Mock file system operations
      (fs.access as jest.Mock).mockResolvedValue(undefined);
      (fs.unlink as jest.Mock).mockResolvedValue(undefined);

      await encryptedConfigStore.delete(key);

      // Verify file deletion was called
      expect(fs.unlink).toHaveBeenCalledWith(expect.stringContaining(`${key}.conf`));
    });

    it('should handle non-existent file gracefully', async () => {
      const key = 'non-existent-config';

      // Mock file system operations to simulate file not found
      (fs.access as jest.Mock).mockRejectedValue({ code: 'ENOENT' });
      (fs.unlink as jest.Mock).mockRejectedValue({ code: 'ENOENT' });

      // Should not throw an error
      await expect(encryptedConfigStore.delete(key)).resolves.toBeUndefined();
    });

    it('should handle delete errors gracefully', async () => {
      const key = 'test-config';

      // Mock file system operations to fail
      (fs.access as jest.Mock).mockResolvedValue(undefined);
      (fs.unlink as jest.Mock).mockRejectedValue(new Error('Permission denied'));

      await expect(encryptedConfigStore.delete(key)).rejects.toThrow(
        'Failed to delete configuration: Permission denied'
      );
    });
  });

  describe('list', () => {
    it('should list configuration keys successfully', async () => {
      // Mock file system operations
      (fs.readdir as jest.Mock).mockResolvedValue(['config1.conf', 'config2.conf', 'readme.txt']);

      const result = await encryptedConfigStore.list();

      // Should only return .conf files with extension removed
      expect(result).toEqual(['config1', 'config2']);
    });

    it('should handle list errors gracefully', async () => {
      // Mock file system operations to fail
      (fs.readdir as jest.Mock).mockRejectedValue(new Error('Directory read error'));

      await expect(encryptedConfigStore.list()).rejects.toThrow(
        'Failed to list configurations: Directory read error'
      );
    });
  });
});