import { BasicConfigurationManager } from '../../../src/config/BasicConfigurationManager';
import { PayloadEncryptionService } from '../../../src/security/PayloadEncryptionService';
import { MessageAuthenticationService } from '../../../src/security/MessageAuthenticationService';

describe('ConfigurationManager', () => {
  let configManager: BasicConfigurationManager;

  beforeEach(async () => {
    const encryptionService = new PayloadEncryptionService();
    const authenticationService = new MessageAuthenticationService();
    authenticationService.setSecretKey('test-secret-key');

    configManager = new BasicConfigurationManager(encryptionService, authenticationService);
    await configManager.initialize({
      environment: 'test',
      enableCache: true,
      cacheTTL: 1000,
      enableHotReload: false
    });
  });

  test('should set and get configuration values', () => {
    configManager.set('test.key', 'test-value');
    expect(configManager.get('test.key')).toBe('test-value');
  });

  test('should return default value for missing keys', () => {
    expect(configManager.get('missing.key', 'default-value')).toBe('default-value');
  });

  test('should handle different data types', () => {
    configManager.set('number.value', 42);
    configManager.set('boolean.value', true);
    configManager.set('array.value', [1, 2, 3]);
    configManager.set('object.value', { nested: 'value' });

    expect(configManager.get('number.value')).toBe(42);
    expect(configManager.get('boolean.value')).toBe(true);
    expect(configManager.get('array.value')).toEqual([1, 2, 3]);
    expect(configManager.get('object.value')).toEqual({ nested: 'value' });
  });
});