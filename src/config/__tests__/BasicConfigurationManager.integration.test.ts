import { BasicConfigurationManager } from '../BasicConfigurationManager';
import { PayloadEncryptionService } from '../../security/PayloadEncryptionService';
import { MessageAuthenticationService } from '../../security/MessageAuthenticationService';
import { ConfigurationProvider } from '../ConfigurationProvider';
import { EnvironmentAdapter, EnvironmentType } from '../EnvironmentAdapter';

// Integration tests that test real interactions between components
describe('BasicConfigurationManager - Integration Tests', () => {
  let manager: BasicConfigurationManager;
  let encryptionService: PayloadEncryptionService;
  let authenticationService: MessageAuthenticationService;

  beforeEach(() => {
    // Create real instances for integration testing
    encryptionService = new PayloadEncryptionService();
    authenticationService = new MessageAuthenticationService();
    authenticationService.setSecretKey('test-secret');

    manager = new BasicConfigurationManager(encryptionService, authenticationService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Test the complete configuration lifecycle
  describe('Complete Configuration Lifecycle', () => {
    it('should handle the complete configuration management flow', async () => {
      // Test initialization with default options
      await manager.initialize({
        environment: 'development',
        enableCache: true,
        cacheTTL: 60000
      });

      // Verify initial state
      const initialStatus = manager.getStatus();
      expect(initialStatus.loaded).toBe(true);
      expect(initialStatus.errorCount).toBe(0);
      expect(Array.isArray(initialStatus.sources)).toBe(true);

      // Test setting and getting values
      manager.set('test.string', 'test-value');
      manager.set('test.number', 42);
      manager.set('test.boolean', true);
      manager.set('test.object', { nested: 'value' });
      manager.set('test.array', [1, 2, 3]);

      expect(manager.get('test.string')).toBe('test-value');
      expect(manager.get('test.number')).toBe(42);
      expect(manager.get('test.boolean')).toBe(true);
      expect(manager.get('test.object')).toEqual({ nested: 'value' });
      expect(manager.get('test.array')).toEqual([1, 2, 3]);

      // Test nested access
      expect(manager.get('test.object.nested')).toBe('value');

      // Test default values
      expect(manager.get('non.existent.key', 'default')).toBe('default');
      expect(manager.get('non.existent.key')).toBeUndefined();

      // Verify status after operations
      const finalStatus = manager.getStatus();
      expect(finalStatus.loaded).toBe(true);
      expect(finalStatus.errorCount).toBe(0);
    });

    it('should maintain configuration consistency across operations', async () => {
      await manager.initialize({
        environment: 'test',
        enableCache: true,
        cacheTTL: 30000
      });

      // Set a complex configuration structure
      const complexConfig = {
        application: {
          name: 'TestApp',
          version: '1.0.0',
          environment: 'integration'
        },
        database: {
          host: 'localhost',
          port: 5432,
          name: 'testdb',
          ssl: true,
          pool: {
            min: 2,
            max: 10,
            acquire: 30000,
            idle: 10000
          }
        },
        api: {
          baseUrl: 'https://api.example.com',
          timeout: 5000,
          retries: 3,
          endpoints: {
            users: '/users',
            posts: '/posts',
            comments: '/comments'
          }
        },
        features: {
          authentication: true,
          notifications: false,
          analytics: true,
          caching: {
            enabled: true,
            ttl: 3600
          }
        },
        security: {
          cors: {
            enabled: true,
            origins: ['https://app.example.com']
          },
          rateLimiting: {
            windowMs: 900000,
            max: 100
          },
          encryption: {
            enabled: true,
            algorithm: 'aes-256-gcm'
          }
        }
      };

      // Set all values from complex config
      const setNestedValue = (obj: any, prefix: string = '') => {
        Object.entries(obj).forEach(([key, value]) => {
          const fullKey = prefix ? `${prefix}.${key}` : key;
          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            setNestedValue(value, fullKey);
          } else {
            manager.set(fullKey, value);
          }
        });
      };

      setNestedValue(complexConfig);

      // Verify all values can be retrieved correctly
      const verifyNestedValue = (obj: any, prefix: string = '') => {
        Object.entries(obj).forEach(([key, value]) => {
          const fullKey = prefix ? `${prefix}.${key}` : key;
          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            verifyNestedValue(value, fullKey);
          } else {
            expect(manager.get(fullKey)).toEqual(value);
          }
        });
      };

      verifyNestedValue(complexConfig);
    });
  });

  // Test caching functionality
  describe('Caching Functionality', () => {
    it('should properly cache and invalidate configuration values', async () => {
      await manager.initialize({
        environment: 'test',
        enableCache: true,
        cacheTTL: 60000
      });

      // Set and access values to populate cache
      manager.set('cached.value', 'test-value');
      const value1 = manager.get('cached.value');
      const status1 = manager.getStatus();

      // Access again to hit cache
      const value2 = manager.get('cached.value');
      const status2 = manager.getStatus();

      expect(value1).toBe(value2);
      expect(status2.cache.hits).toBeGreaterThan(status1.cache.hits);
      expect(status2.cache.size).toBe(1);

      // Update value should invalidate cache entry
      manager.set('cached.value', 'new-value');
      const value3 = manager.get('cached.value');
      const status3 = manager.getStatus();

      expect(value3).toBe('new-value');
      expect(status3.cache.size).toBe(1); // Cache size should remain the same
    });

    it('should handle cache with disabled caching', async () => {
      await manager.initialize({
        environment: 'test',
        enableCache: false
      });

      manager.set('uncached.value', 'test-value');
      const value = manager.get('uncached.value');
      const status = manager.getStatus();

      expect(value).toBe('test-value');
      expect(status.cache.enabled).toBe(false);
      expect(status.cache.size).toBe(0);
      expect(status.cache.hits).toBe(0);
      expect(status.cache.misses).toBe(0);
    });
  });

  // Test change notification system
  describe('Change Notification System', () => {
    it('should notify all listeners of configuration changes', async () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      manager.onChange(listener1);
      manager.onChange(listener2);

      // Make changes
      manager.set('test.key1', 'value1');
      manager.set('test.key2', 'value2');

      expect(listener1).toHaveBeenCalledTimes(2);
      expect(listener2).toHaveBeenCalledTimes(2);

      // Verify change events
      expect(listener1).toHaveBeenNthCalledWith(1, {
        keys: ['test.key1'],
        timestamp: expect.any(Number),
        source: 'direct-set'
      });
      expect(listener1).toHaveBeenNthCalledWith(2, {
        keys: ['test.key2'],
        timestamp: expect.any(Number),
        source: 'direct-set'
      });
    });

    it('should handle multiple listeners with different behaviors', async () => {
      const listeners = Array(5).fill(null).map(() => jest.fn());
      listeners.forEach(listener => manager.onChange(listener));

      // Some listeners throw errors
      listeners[2].mockImplementation(() => { throw new Error('Listener error'); });
      listeners[4].mockImplementation(() => { throw new Error('Another error'); });

      // Should not throw when setting values
      expect(() => {
        manager.set('test.multi', 'value');
      }).not.toThrow();

      // All listeners should have been called despite errors
      listeners.forEach(listener => {
        expect(listener).toHaveBeenCalledWith({
          keys: ['test.multi'],
          timestamp: expect.any(Number),
          source: 'direct-set'
        });
      });
    });
  });

  // Test configuration validation and transformation
  describe('Configuration Validation and Transformation', () => {
    it('should handle configuration validation correctly', async () => {
      // Test with a real configuration structure
      const testConfig = {
        environment: 'test',
        api: {
          baseUrl: 'https://api.test.com',
          timeout: 5000
        },
        features: {
          enabled: true
        }
      };

      // Set configuration values
      Object.entries(testConfig).forEach(([key, value]) => {
        manager.set(key, value);
      });

      // Validate configuration
      const validationResult = manager.validate();

      // Should have validation result structure
      expect(validationResult).toBeDefined();
      expect(typeof validationResult.valid).toBe('boolean');
      expect(Array.isArray(validationResult.errors)).toBe(true);
      expect(Array.isArray(validationResult.warnings)).toBe(true);
    });

    it('should handle configuration with special data types', async () => {
      // Test various data types
      manager.set('string.value', 'test string');
      manager.set('number.value', 42.5);
      manager.set('boolean.value', true);
      manager.set('null.value', null);
      manager.set('undefined.value', undefined);
      manager.set('array.value', [1, 'two', true, null]);
      manager.set('object.value', {
        nested: {
          deep: 'value'
        }
      });
      manager.set('date.value', new Date('2023-01-01'));
      manager.set('regex.value', /test/g);

      expect(manager.get('string.value')).toBe('test string');
      expect(manager.get('number.value')).toBe(42.5);
      expect(manager.get('boolean.value')).toBe(true);
      expect(manager.get('null.value')).toBeNull();
      expect(manager.get('undefined.value')).toBeUndefined();
      expect(manager.get('array.value')).toEqual([1, 'two', true, null]);
      expect(manager.get('object.value')).toEqual({ nested: { deep: 'value' } });
      expect(manager.get('object.value.nested.deep')).toBe('value');
      expect(manager.get('date.value')).toEqual(new Date('2023-01-01'));
      expect(manager.get('regex.value')).toEqual(/test/g);
    });
  });

  // Test error handling and edge cases
  describe('Error Handling and Edge Cases', () => {
    it('should handle deeply nested configuration gracefully', async () => {
      // Create a very deeply nested configuration
      let deepConfig: any = 'deep-value';
      for (let i = 0; i < 100; i++) {
        deepConfig = { [`level${i}`]: deepConfig };
      }

      // This should not cause stack overflow or performance issues
      manager.set('deep.config', deepConfig);
      const retrieved = manager.get('deep.config');

      expect(retrieved).toBeDefined();
      // Verify we can access deeply nested values
      expect(manager.get('deep.config.level0.level1.level2.level3.level4.level5.level6.level7.level8.level9.level10'))
        .toBeDefined();
    });

    it('should handle configuration keys with special characters', async () => {
      // Test keys with special characters
      manager.set('key-with-dashes', 'dash-value');
      manager.set('key_with_underscores', 'underscore-value');
      manager.set('key.with.dots', 'dot-value');
      manager.set('key with spaces', 'space-value');
      manager.set('key$with@symbols#', 'symbol-value');

      expect(manager.get('key-with-dashes')).toBe('dash-value');
      expect(manager.get('key_with_underscores')).toBe('underscore-value');
      expect(manager.get('key.with.dots')).toBe('dot-value');
      expect(manager.get('key with spaces')).toBe('space-value');
      expect(manager.get('key$with@symbols#')).toBe('symbol-value');
    });

    it('should handle very large configuration values', async () => {
      // Create a large string value
      const largeString = 'A'.repeat(100000); // 100KB string
      manager.set('large.string', largeString);

      const retrieved: any = manager.get('large.string');
      expect(retrieved).toBe(largeString);
      expect(retrieved.length).toBe(100000);

      // Create a large array
      const largeArray = Array(10000).fill(null).map((_, i) => `item-${i}`);
      manager.set('large.array', largeArray);

      const retrievedArray: any = manager.get('large.array');
      expect(retrievedArray).toEqual(largeArray);
      expect(retrievedArray.length).toBe(10000);

      // Create a large object
      const largeObject: any = {};
      for (let i = 0; i < 1000; i++) {
        largeObject[`key${i}`] = `value${i}`;
      }
      manager.set('large.object', largeObject);

      const retrievedObject = manager.get('large.object');
      expect(retrievedObject).toEqual(largeObject);
      expect(Object.keys(retrievedObject as object).length).toBe(1000);
    });
  });

  // Test performance characteristics
  describe('Performance Characteristics', () => {
    it('should handle high-frequency configuration access efficiently', async () => {
      // Set up test configuration
      for (let i = 0; i < 100; i++) {
        manager.set(`key${i}`, `value${i}`);
      }

      // Measure access performance
      const startTime = performance.now();

      // Perform 10000 get operations
      for (let i = 0; i < 10000; i++) {
        const key = `key${i % 100}`;
        manager.get(key);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete in reasonable time (less than 100ms for 10k operations)
      expect(duration).toBeLessThan(100);

      // Verify cache statistics
      const status = manager.getStatus();
      expect(status.cache.hits).toBeGreaterThan(9000); // Most should be cache hits
    });

    it('should maintain consistent memory usage', async () => {
      // Get initial memory usage
      const initialMemory = process.memoryUsage().heapUsed;

      // Create and manipulate large configuration
      for (let i = 0; i < 1000; i++) {
        manager.set(`test.key${i}`, {
          id: i,
          data: `test-data-${i}`,
          nested: {
            value: `nested-${i}`,
            array: Array(10).fill(null).map((_, j) => `item-${i}-${j}`)
          }
        });
      }

      // Access values multiple times
      for (let i = 0; i < 1000; i++) {
        for (let j = 0; j < 10; j++) {
          manager.get(`test.key${i}`);
        }
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      // Get final memory usage
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 50MB for this test)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });

  // Test security aspects
  describe('Security Aspects', () => {
    it('should not expose internal configuration structure', async () => {
      // Set some configuration
      manager.set('public.config', 'public-value');
      manager.set('sensitive.token', 'secret-token');

      // The manager should not expose its internal config object directly
      const status = manager.getStatus();

      // Status should be a plain object without exposing internal structure
      expect(typeof status).toBe('object');
      expect(status).not.toHaveProperty('config'); // Internal config should not be exposed
      expect(status).not.toHaveProperty('listeners'); // Internal listeners should not be exposed
      expect(status).not.toHaveProperty('cacheHits'); // Internal counters should not be exposed directly

      // But it should expose safe properties
      expect(status).toHaveProperty('loaded');
      expect(status).toHaveProperty('sources');
      expect(status).toHaveProperty('errorCount');
    });

    it('should handle configuration tampering attempts gracefully', async () => {
      // Set normal configuration
      manager.set('normal.key', 'normal-value');

      // Try to set prototype pollution attempts
      expect(() => {
        manager.set('__proto__.polluted', 'polluted-value');
      }).not.toThrow();

      expect(() => {
        manager.set('constructor.prototype.polluted', 'polluted-value');
      }).not.toThrow();

      // These should not affect normal operation
      expect(manager.get('normal.key')).toBe('normal-value');
      expect(manager.get('__proto__.polluted')).toBeUndefined();
      expect(manager.get('constructor.prototype.polluted')).toBeUndefined();
    });
  });
});