"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BasicConfigurationManager_1 = require("../BasicConfigurationManager");
const PayloadEncryptionService_1 = require("../../security/PayloadEncryptionService");
const MessageAuthenticationService_1 = require("../../security/MessageAuthenticationService");
const EnvironmentAdapter_1 = require("../EnvironmentAdapter");
// Mock the dependencies
jest.mock('../../security/PayloadEncryptionService');
jest.mock('../../security/MessageAuthenticationService');
// Mock environment adapters
class MockEnvironmentAdapter {
    getEnvironment() {
        return EnvironmentAdapter_1.EnvironmentType.DEVELOPMENT;
    }
    getConfigurationSources() {
        return [
            { name: 'test-source', type: 'file', options: { path: '/test/path' } }
        ];
    }
    transformConfiguration(config) {
        return { ...config, transformed: true };
    }
    validateConfiguration(config) {
        return { valid: true, errors: [], warnings: [] };
    }
}
// Mock configuration provider
class MockConfigurationProvider {
    constructor(name, available = true, configData = {}) {
        this.name = name;
        this.available = available;
        this.configData = configData;
    }
    getName() {
        return this.name;
    }
    async load() {
        return this.configData;
    }
    async save(config) {
        this.configData = config;
    }
    async isAvailable() {
        return this.available;
    }
}
describe('BasicConfigurationManager - London School TDD', () => {
    let manager;
    let mockEncryptionService;
    let mockAuthenticationService;
    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();
        // Create mock instances
        mockEncryptionService = {};
        mockAuthenticationService = {};
        // Create manager instance
        manager = new BasicConfigurationManager_1.BasicConfigurationManager(mockEncryptionService, mockAuthenticationService);
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });
    // Test constructor and initialization
    describe('Constructor', () => {
        it('should create an instance with default options', () => {
            expect(manager).toBeInstanceOf(BasicConfigurationManager_1.BasicConfigurationManager);
        });
        it('should initialize with default configuration options', () => {
            const status = manager.getStatus();
            expect(status.loaded).toBe(false);
            expect(status.errorCount).toBe(0);
            expect(status.sources).toHaveLength(0);
        });
    });
    // Test initialize method
    describe('initialize', () => {
        const mockOptions = {
            environment: 'test',
            enableCache: true,
            cacheTTL: 60000,
            enableHotReload: false
        };
        it('should set configuration options', async () => {
            // Mock environment adapter
            const mockAdapter = new MockEnvironmentAdapter();
            jest.spyOn(manager, 'createEnvironmentAdapter').mockReturnValue(mockAdapter);
            // Mock providers
            const mockProvider = new MockConfigurationProvider('test-provider', true, { test: 'value' });
            jest.spyOn(manager, 'createProviders').mockResolvedValue([mockProvider]);
            // Mock load
            jest.spyOn(manager, 'load').mockResolvedValue(undefined);
            await manager.initialize(mockOptions);
            const status = manager.getStatus();
            expect(status.sources).toContain('test-provider');
        });
        it('should create environment adapter based on environment', async () => {
            const createAdapterSpy = jest.spyOn(manager, 'createEnvironmentAdapter').mockReturnValue(new MockEnvironmentAdapter());
            const createProvidersSpy = jest.spyOn(manager, 'createProviders').mockResolvedValue([]);
            const loadSpy = jest.spyOn(manager, 'load').mockResolvedValue(undefined);
            await manager.initialize(mockOptions);
            expect(createAdapterSpy).toHaveBeenCalledWith('test');
            expect(createProvidersSpy).toHaveBeenCalled();
            expect(loadSpy).toHaveBeenCalled();
        });
        it('should handle initialization errors gracefully', async () => {
            const errorMessage = 'Initialization failed';
            jest.spyOn(manager, 'createEnvironmentAdapter').mockImplementation(() => {
                throw new Error(errorMessage);
            });
            await expect(manager.initialize(mockOptions)).rejects.toThrow(errorMessage);
        });
    });
    // Test get method
    describe('get', () => {
        beforeEach(async () => {
            // Set up some test configuration
            manager.config = {
                simple: 'value',
                nested: {
                    deep: {
                        value: 'deep-value'
                    }
                },
                array: [1, 2, 3],
                boolean: true,
                number: 42
            };
        });
        it('should return simple configuration values', () => {
            expect(manager.get('simple')).toBe('value');
            expect(manager.get('boolean')).toBe(true);
            expect(manager.get('number')).toBe(42);
        });
        it('should return nested configuration values using dot notation', () => {
            expect(manager.get('nested.deep.value')).toBe('deep-value');
        });
        it('should return array values', () => {
            expect(manager.get('array')).toEqual([1, 2, 3]);
        });
        it('should return default value for non-existent keys', () => {
            expect(manager.get('non-existent', 'default')).toBe('default');
            expect(manager.get('non-existent.deep.value', 'default')).toBe('default');
        });
        it('should return undefined for non-existent keys without default', () => {
            expect(manager.get('non-existent')).toBeUndefined();
        });
        it('should handle caching when enabled', async () => {
            await manager.initialize({
                environment: 'test',
                enableCache: true,
                cacheTTL: 60000
            });
            // First access should populate cache
            const value1 = manager.get('simple');
            const status1 = manager.getStatus();
            // Second access should hit cache
            const value2 = manager.get('simple');
            const status2 = manager.getStatus();
            expect(value1).toBe(value2);
            expect(status2.cache.hits).toBeGreaterThan(status1.cache.hits);
        });
        it('should not cache when disabled', async () => {
            await manager.initialize({
                environment: 'test',
                enableCache: false
            });
            const value1 = manager.get('simple');
            const status1 = manager.getStatus();
            const value2 = manager.get('simple');
            const status2 = manager.getStatus();
            expect(value1).toBe(value2);
            expect(status1.cache.enabled).toBe(false);
            expect(status2.cache.enabled).toBe(false);
        });
    });
    // Test set method
    describe('set', () => {
        it('should set simple configuration values', () => {
            manager.set('new-key', 'new-value');
            expect(manager.get('new-key')).toBe('new-value');
        });
        it('should set nested configuration values using dot notation', () => {
            manager.set('nested.new.value', 'nested-value');
            expect(manager.get('nested.new.value')).toBe('nested-value');
        });
        it('should create nested objects when setting nested values', () => {
            manager.set('level1.level2.level3', 'deep-value');
            expect(manager.get('level1')).toBeDefined();
            expect(manager.get('level1.level2')).toBeDefined();
            expect(manager.get('level1.level2.level3')).toBe('deep-value');
        });
        it('should update existing values', () => {
            manager.set('existing', 'old-value');
            expect(manager.get('existing')).toBe('old-value');
            manager.set('existing', 'new-value');
            expect(manager.get('existing')).toBe('new-value');
        });
        it('should notify listeners when values change', () => {
            const listener = jest.fn();
            manager.onChange(listener);
            manager.set('test-key', 'test-value');
            expect(listener).toHaveBeenCalledWith({
                keys: ['test-key'],
                timestamp: expect.any(Number),
                source: 'direct-set'
            });
        });
        it('should not notify listeners when values are the same', () => {
            manager.set('test-key', 'test-value');
            const listener = jest.fn();
            manager.onChange(listener);
            manager.set('test-key', 'test-value');
            expect(listener).not.toHaveBeenCalled();
        });
        it('should update cache when caching is enabled', async () => {
            await manager.initialize({
                environment: 'test',
                enableCache: true,
                cacheTTL: 60000
            });
            // Set a value
            manager.set('cached-key', 'cached-value');
            // Access it to populate cache
            const value = manager.get('cached-key');
            expect(value).toBe('cached-value');
        });
    });
    // Test load method
    describe('load', () => {
        it('should load configuration from all available providers', async () => {
            const config1 = { key1: 'value1', common: 'from-provider-1' };
            const config2 = { key2: 'value2', common: 'from-provider-2' }; // Should override
            const provider1 = new MockConfigurationProvider('provider-1', true, config1);
            const provider2 = new MockConfigurationProvider('provider-2', true, config2);
            manager.providers = [provider1, provider2];
            // Mock environment adapter
            const mockAdapter = new MockEnvironmentAdapter();
            manager.environmentAdapter = mockAdapter;
            await manager.load();
            // Should have merged configurations with later providers overriding
            expect(manager.get('key1')).toBe('value1');
            expect(manager.get('key2')).toBe('value2');
            expect(manager.get('common')).toBe('from-provider-2'); // From provider-2
        });
        it('should handle unavailable providers gracefully', async () => {
            const config1 = { key1: 'value1' };
            const provider1 = new MockConfigurationProvider('provider-1', true, config1);
            const provider2 = new MockConfigurationProvider('provider-2', false); // Unavailable
            manager.providers = [provider1, provider2];
            // Mock environment adapter
            const mockAdapter = new MockEnvironmentAdapter();
            manager.environmentAdapter = mockAdapter;
            await manager.load();
            // Should still load from available providers
            expect(manager.get('key1')).toBe('value1');
            const status = manager.getStatus();
            expect(status.errorCount).toBe(0);
        });
        it('should handle provider load errors gracefully', async () => {
            const provider1 = new MockConfigurationProvider('provider-1', true, { key1: 'value1' });
            // Create a provider that throws on load
            const errorProvider = new MockConfigurationProvider('error-provider', true);
            jest.spyOn(errorProvider, 'load').mockRejectedValue(new Error('Load failed'));
            manager.providers = [provider1, errorProvider];
            // Mock environment adapter
            const mockAdapter = new MockEnvironmentAdapter();
            manager.environmentAdapter = mockAdapter;
            await manager.load();
            // Should still load from working providers
            expect(manager.get('key1')).toBe('value1');
            const status = manager.getStatus();
            expect(status.errorCount).toBe(1);
        });
        it('should transform configuration according to environment adapter', async () => {
            const config = { original: 'value' };
            const provider = new MockConfigurationProvider('test-provider', true, config);
            manager.providers = [provider];
            // Mock environment adapter
            const mockAdapter = new MockEnvironmentAdapter();
            manager.environmentAdapter = mockAdapter;
            await manager.load();
            // Should have transformed configuration
            expect(manager.get('transformed')).toBe(true);
        });
        it('should validate configuration after loading', async () => {
            const config = { test: 'value' };
            const provider = new MockConfigurationProvider('test-provider', true, config);
            manager.providers = [provider];
            // Mock environment adapter
            const mockAdapter = new MockEnvironmentAdapter();
            manager.environmentAdapter = mockAdapter;
            const validateSpy = jest.spyOn(mockAdapter, 'validateConfiguration').mockReturnValue({
                valid: true,
                errors: [],
                warnings: []
            });
            await manager.load();
            expect(validateSpy).toHaveBeenCalledWith(expect.objectContaining({ test: 'value' }));
        });
        it('should clear cache after loading', async () => {
            await manager.initialize({
                environment: 'test',
                enableCache: true,
                cacheTTL: 60000
            });
            // Access a value to populate cache
            manager.set('cached-key', 'cached-value');
            manager.get('cached-key'); // Populate cache
            const status1 = manager.getStatus();
            expect(status1.cache.size).toBe(1);
            // Load should clear cache
            const provider = new MockConfigurationProvider('test-provider', true, { new: 'config' });
            manager.providers = [provider];
            const mockAdapter = new MockEnvironmentAdapter();
            manager.environmentAdapter = mockAdapter;
            await manager.load();
            const status2 = manager.getStatus();
            expect(status2.cache.size).toBe(0);
        });
    });
    // Test reload method
    describe('reload', () => {
        it('should reload configuration from all providers', async () => {
            const initialConfig = { initial: 'value' };
            const updatedConfig = { updated: 'value' };
            const provider = new MockConfigurationProvider('test-provider', true, initialConfig);
            manager.providers = [provider];
            // Mock environment adapter
            const mockAdapter = new MockEnvironmentAdapter();
            manager.environmentAdapter = mockAdapter;
            // Load initial config
            await manager.load();
            expect(manager.get('initial')).toBe('value');
            // Update provider data and reload
            jest.spyOn(provider, 'load').mockResolvedValue(updatedConfig);
            await manager.reload();
            expect(manager.get('updated')).toBe('value');
            expect(manager.get('initial')).toBeUndefined();
        });
        it('should notify listeners of reload', async () => {
            const listener = jest.fn();
            manager.onChange(listener);
            const provider = new MockConfigurationProvider('test-provider', true, { test: 'value' });
            manager.providers = [provider];
            // Mock environment adapter
            const mockAdapter = new MockEnvironmentAdapter();
            manager.environmentAdapter = mockAdapter;
            await manager.reload();
            expect(listener).toHaveBeenCalledWith({
                keys: ['*'],
                timestamp: expect.any(Number),
                source: 'reload'
            });
        });
    });
    // Test validate method
    describe('validate', () => {
        it('should delegate validation to environment adapter', () => {
            const mockValidationResult = {
                valid: true,
                errors: [],
                warnings: ['test warning']
            };
            const mockAdapter = new MockEnvironmentAdapter();
            const validateSpy = jest.spyOn(mockAdapter, 'validateConfiguration').mockReturnValue(mockValidationResult);
            manager.environmentAdapter = mockAdapter;
            manager.config = { test: 'config' };
            const result = manager.validate();
            expect(validateSpy).toHaveBeenCalledWith({ test: 'config' });
            expect(result).toEqual(mockValidationResult);
        });
    });
    // Test getStatus method
    describe('getStatus', () => {
        it('should return current configuration status', async () => {
            // Initialize with some providers
            const provider1 = new MockConfigurationProvider('provider-1');
            const provider2 = new MockConfigurationProvider('provider-2');
            manager.providers = [provider1, provider2];
            const status = manager.getStatus();
            expect(status).toEqual({
                loaded: false,
                lastLoad: expect.any(Number),
                sources: ['provider-1', 'provider-2'],
                cache: {
                    enabled: true,
                    size: 0,
                    hits: 0,
                    misses: 0
                },
                errorCount: 0
            });
        });
        it('should update status after loading', async () => {
            const provider = new MockConfigurationProvider('test-provider', true, { test: 'value' });
            manager.providers = [provider];
            const mockAdapter = new MockEnvironmentAdapter();
            manager.environmentAdapter = mockAdapter;
            const status1 = manager.getStatus();
            expect(status1.loaded).toBe(false);
            await manager.load();
            const status2 = manager.getStatus();
            expect(status2.loaded).toBe(true);
            expect(status2.lastLoad).toBeGreaterThan(status1.lastLoad);
        });
    });
    // Test onChange method
    describe('onChange', () => {
        it('should register change listeners', () => {
            const listener1 = jest.fn();
            const listener2 = jest.fn();
            manager.onChange(listener1);
            manager.onChange(listener2);
            manager.set('test-key', 'test-value');
            expect(listener1).toHaveBeenCalledWith({
                keys: ['test-key'],
                timestamp: expect.any(Number),
                source: 'direct-set'
            });
            expect(listener2).toHaveBeenCalledWith({
                keys: ['test-key'],
                timestamp: expect.any(Number),
                source: 'direct-set'
            });
        });
        it('should handle listener errors gracefully', () => {
            const goodListener = jest.fn();
            const badListener = jest.fn().mockImplementation(() => {
                throw new Error('Listener error');
            });
            manager.onChange(badListener);
            manager.onChange(goodListener);
            // Should not throw when setting value
            expect(() => {
                manager.set('test-key', 'test-value');
            }).not.toThrow();
            // Good listener should still be called
            expect(goodListener).toHaveBeenCalledWith({
                keys: ['test-key'],
                timestamp: expect.any(Number),
                source: 'direct-set'
            });
        });
    });
    // Test private method: createEnvironmentAdapter
    describe('createEnvironmentAdapter (private method)', () => {
        it('should create correct adapter for development environment', () => {
            const adapter = manager.createEnvironmentAdapter('development');
            expect(adapter.getEnvironment()).toBe(EnvironmentAdapter_1.EnvironmentType.DEVELOPMENT);
        });
        it('should create correct adapter for testing environment', () => {
            const adapter = manager.createEnvironmentAdapter('testing');
            expect(adapter.getEnvironment()).toBe(EnvironmentAdapter_1.EnvironmentType.TESTING);
        });
        it('should create correct adapter for staging environment', () => {
            const adapter = manager.createEnvironmentAdapter('staging');
            expect(adapter.getEnvironment()).toBe(EnvironmentAdapter_1.EnvironmentType.STAGING);
        });
        it('should create correct adapter for production environment', () => {
            const adapter = manager.createEnvironmentAdapter('production');
            expect(adapter.getEnvironment()).toBe(EnvironmentAdapter_1.EnvironmentType.PRODUCTION);
        });
        it('should create correct adapter for cloud environment', () => {
            const adapter = manager.createEnvironmentAdapter('cloud');
            expect(adapter.getEnvironment()).toBe(EnvironmentAdapter_1.EnvironmentType.PRODUCTION);
        });
        it('should create correct adapter for CI/CD environment', () => {
            const adapter = manager.createEnvironmentAdapter('cicd');
            expect(adapter.getEnvironment()).toBe(EnvironmentAdapter_1.EnvironmentType.TESTING);
        });
        it('should default to development adapter for unknown environments', () => {
            const adapter = manager.createEnvironmentAdapter('unknown');
            expect(adapter.getEnvironment()).toBe(EnvironmentAdapter_1.EnvironmentType.DEVELOPMENT);
        });
    });
    // Test private method: createProviders
    describe('createProviders (private method)', () => {
        it('should create file configuration provider', async () => {
            const sources = [{
                    name: 'test-file',
                    type: 'file',
                    options: { path: '/test/path', format: 'json' }
                }];
            const providers = await manager.createProviders(sources);
            expect(providers).toHaveLength(1);
            expect(providers[0].getName()).toBe('test-file');
        });
        it('should create environment configuration provider', async () => {
            const sources = [{
                    name: 'test-env',
                    type: 'environment',
                    options: { prefix: 'TEST_' }
                }];
            const providers = await manager.createProviders(sources);
            expect(providers).toHaveLength(1);
            expect(providers[0].getName()).toBe('test-env');
        });
        it('should create secure storage configuration provider', async () => {
            const sources = [{
                    name: 'test-secure',
                    type: 'secure-storage',
                    options: { namespace: 'test-namespace' }
                }];
            // Mock the dependencies needed for SecureStorageConfigurationProvider
            const mockEncryptionService = new PayloadEncryptionService_1.PayloadEncryptionService();
            const mockAuthService = new MessageAuthenticationService_1.MessageAuthenticationService();
            mockAuthService.setSecretKey('test-secret');
            // Override the manager with real encryption service for this test
            const tempManager = new BasicConfigurationManager_1.BasicConfigurationManager(mockEncryptionService, mockAuthService);
            const providers = await tempManager.createProviders(sources);
            expect(providers).toHaveLength(1);
            expect(providers[0].getName()).toBe('test-secure');
        });
        it('should create remote configuration provider', async () => {
            const sources = [{
                    name: 'test-remote',
                    type: 'remote',
                    options: { url: 'https://config.example.com', timeout: 5000 }
                }];
            const providers = await manager.createProviders(sources);
            expect(providers).toHaveLength(1);
            expect(providers[0].getName()).toBe('test-remote');
        });
        it('should throw error for unsupported provider type', async () => {
            const sources = [{
                    name: 'test-unsupported',
                    type: 'unsupported-type',
                    options: {}
                }];
            await expect(manager.createProviders(sources))
                .rejects.toThrow('Unsupported configuration source type: unsupported-type');
        });
    });
    // Test private method: mergeConfig
    describe('mergeConfig (private method)', () => {
        it('should merge simple configurations', () => {
            const target = { a: 1, b: 2 };
            const source = { b: 3, c: 4 };
            manager.mergeConfig(target, source);
            expect(target).toEqual({ a: 1, b: 3, c: 4 });
        });
        it('should merge nested configurations', () => {
            const target = {
                nested: {
                    a: 1,
                    b: 2
                }
            };
            const source = {
                nested: {
                    b: 3,
                    c: 4
                },
                new: 'value'
            };
            manager.mergeConfig(target, source);
            expect(target).toEqual({
                nested: {
                    a: 1,
                    b: 3,
                    c: 4
                },
                new: 'value'
            });
        });
        it('should handle array values correctly', () => {
            const target = { arr: [1, 2, 3] };
            const source = { arr: [4, 5, 6] };
            manager.mergeConfig(target, source);
            expect(target).toEqual({ arr: [4, 5, 6] }); // Arrays are replaced, not merged
        });
        it('should handle null values correctly', () => {
            const target = { a: 1, b: { c: 2 } };
            const source = { a: null, b: null };
            manager.mergeConfig(target, source);
            expect(target).toEqual({ a: null, b: null });
        });
    });
    // Test private method: setupHotReloading
    describe('setupHotReloading (private method)', () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });
        afterEach(() => {
            jest.useRealTimers();
        });
        it('should set up hot reloading interval when enabled', async () => {
            const options = {
                environment: 'test',
                enableCache: true,
                cacheTTL: 60000,
                enableHotReload: true,
                hotReloadInterval: 1000
            };
            const reloadSpy = jest.spyOn(manager, 'reload').mockResolvedValue();
            await manager.initialize(options);
            // Advance timers to trigger hot reload
            jest.advanceTimersByTime(1000);
            expect(reloadSpy).toHaveBeenCalled();
        });
        it('should handle hot reload errors gracefully', async () => {
            // Set up manager with real error handling
            const realManager = new BasicConfigurationManager_1.BasicConfigurationManager(mockEncryptionService, mockAuthenticationService);
            const options = {
                environment: 'test',
                enableCache: true,
                cacheTTL: 60000,
                enableHotReload: true,
                hotReloadInterval: 1000
            };
            const errorMessage = 'Hot reload failed';
            jest.spyOn(realManager, 'reload').mockRejectedValue(new Error(errorMessage));
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
            await realManager.initialize(options);
            // Advance timers to trigger hot reload
            jest.advanceTimersByTime(1000);
            // Wait for the async operation to complete
            await Promise.resolve();
            expect(consoleErrorSpy).toHaveBeenCalledWith('Hot reload failed:', errorMessage);
            const status = realManager.getStatus();
            expect(status.errorCount).toBe(1);
        });
    });
    // Test private method: notifyListeners
    describe('notifyListeners (private method)', () => {
        it('should notify all registered listeners', () => {
            const listener1 = jest.fn();
            const listener2 = jest.fn();
            const change = {
                keys: ['test'],
                timestamp: Date.now(),
                source: 'test'
            };
            manager.onChange(listener1);
            manager.onChange(listener2);
            manager.notifyListeners(change);
            expect(listener1).toHaveBeenCalledWith(change);
            expect(listener2).toHaveBeenCalledWith(change);
        });
        it('should handle listener exceptions without affecting others', () => {
            const goodListener = jest.fn();
            const badListener = jest.fn().mockImplementation(() => {
                throw new Error('Listener error');
            });
            const change = {
                keys: ['test'],
                timestamp: Date.now(),
                source: 'test'
            };
            manager.onChange(badListener);
            manager.onChange(goodListener);
            manager.notifyListeners(change);
            expect(badListener).toHaveBeenCalledWith(change);
            expect(goodListener).toHaveBeenCalledWith(change);
        });
    });
});
//# sourceMappingURL=BasicConfigurationManager.london.tdd.test.js.map