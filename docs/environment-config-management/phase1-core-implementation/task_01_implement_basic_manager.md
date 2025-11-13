# Task 01: Implement Basic ConfigurationManager

## Overview

This task involves implementing the core ConfigurationManager with caching, change notification, and status reporting capabilities. The BasicConfigurationManager will serve as the foundation for the entire configuration management system.

## Objectives

1. Implement the ConfigurationManager interface with all required methods
2. Create configuration caching with TTL support
3. Implement change notification system
4. Add status reporting functionality
5. Ensure thread safety and performance optimization
6. Integrate with environment adapters and configuration providers

## Detailed Implementation

### BasicConfigurationManager Class

```typescript
// src/config/BasicConfigurationManager.ts

/**
 * Basic implementation of the ConfigurationManager interface
 */
class BasicConfigurationManager implements ConfigurationManager {
  private config: any = {};
  private readonly options: Required<ConfigurationOptions>;
  private readonly adapters: Map<EnvironmentType, EnvironmentAdapter>;
  private readonly providers: ConfigurationProvider[];
  private readonly cache: Map<string, { value: any; timestamp: number }>;
  private readonly listeners: Array<(change: ConfigurationChange) => void>;
  private readonly status: ConfigurationStatus;
  private readonly mutex: Mutex; // For thread safety
  private hotReloadIntervalId: NodeJS.Timeout | null = null;

  constructor(options: ConfigurationOptions = {}) {
    this.options = {
      environment: process.env.NODE_ENV || 'development',
      sources: [],
      enableCache: true,
      cacheTTL: 300000, // 5 minutes
      enableHotReload: false,
      hotReloadInterval: 5000, // 5 seconds
      ...options
    };

    this.adapters = new Map();
    this.providers = [];
    this.cache = new Map();
    this.listeners = [];
    this.status = {
      loaded: false,
      lastLoad: 0,
      sources: [],
      cache: {
        enabled: this.options.enableCache,
        size: 0,
        hits: 0,
        misses: 0
      },
      errorCount: 0
    };
    this.mutex = new Mutex();

    // Register built-in adapters
    this.registerAdapter(new DevelopmentEnvironmentAdapter());
    this.registerAdapter(new TestingEnvironmentAdapter());
    this.registerAdapter(new StagingEnvironmentAdapter());
    this.registerAdapter(new ProductionEnvironmentAdapter());
  }

  /**
   * Initialize the configuration manager with options
   * @param options - Configuration options
   */
  async initialize(options: ConfigurationOptions): Promise<void> {
    const release = await this.mutex.acquire();
    try {
      // Update options
      Object.assign(this.options, options);

      // Clear existing configuration
      this.config = {};
      this.cache.clear();
      this.status.sources = [];

      // Initialize providers
      await this.initializeProviders();

      // Load configuration
      await this.load();

      // Start hot reloading if enabled
      if (this.options.enableHotReload) {
        this.startHotReload();
      }

      this.status.loaded = true;
    } finally {
      release();
    }
  }

  /**
   * Get a configuration value by key with optional default
   * @param key - Configuration key (supports dot notation for nested objects)
   * @param defaultValue - Default value if key not found
   * @template T - Type of the configuration value
   * @returns Configuration value or default
   */
  get<T>(key: string, defaultValue?: T): T {
    try {
      // Check cache first if enabled
      if (this.options.enableCache) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.options.cacheTTL) {
          this.status.cache.hits++;
          return cached.value as T;
        }
        this.status.cache.misses++;
      }

      // Get value from configuration
      const value = this.getNestedValue(this.config, key);

      // Cache the result if enabled
      if (this.options.enableCache && value !== undefined) {
        this.cache.set(key, { value, timestamp: Date.now() });
        this.status.cache.size = this.cache.size;
      }

      // Return value or default
      return value !== undefined ? value : (defaultValue as T);
    } catch (error) {
      this.status.errorCount++;
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      throw new ConfigurationError(`Failed to get configuration value for key '${key}': ${error.message}`);
    }
  }

  /**
   * Set a configuration value by key
   * @param key - Configuration key
   * @param value - Configuration value
   * @template T - Type of the configuration value
   */
  set<T>(key: string, value: T): void {
    const release = this.mutex.tryAcquire();
    if (!release) {
      throw new ConfigurationError('Configuration manager is busy, cannot set value');
    }

    try {
      // Update configuration
      this.setNestedValue(this.config, key, value);

      // Clear cache for this key and related keys
      if (this.options.enableCache) {
        this.invalidateCache(key);
      }

      // Notify listeners
      this.notifyListeners([key]);

      // Update status
      this.status.lastLoad = Date.now();
    } finally {
      release();
    }
  }

  /**
   * Load configuration from all sources
   */
  async load(): Promise<void> {
    const release = await this.mutex.acquire();
    try {
      // Get current environment adapter
      const environment = this.getCurrentEnvironment();
      const adapter = this.adapters.get(environment);
      if (!adapter) {
        throw new ConfigurationError(`No adapter found for environment: ${environment}`);
      }

      // Get configuration sources for current environment
      const sources = adapter.getConfigurationSources();

      // Load configuration from all sources
      const configs: any[] = [];
      const sourceNames: string[] = [];

      for (const source of sources) {
        try {
          // Find matching provider
          const provider = this.providers.find(p => p.getName() === source.name);
          if (!provider) {
            console.warn(`No provider found for source: ${source.name}`);
            continue;
          }

          // Check if provider is available
          if (!(await provider.isAvailable())) {
            console.warn(`Provider ${source.name} is not available`);
            continue;
          }

          // Load configuration from provider
          const config = await provider.load();
          configs.push(config);
          sourceNames.push(source.name);
        } catch (error) {
          this.status.errorCount++;
          console.error(`Failed to load configuration from source ${source.name}: ${error.message}`);
        }
      }

      // Merge configurations
      this.config = this.mergeConfigurations(configs);

      // Transform configuration for current environment
      this.config = adapter.transformConfiguration(this.config);

      // Clear cache
      if (this.options.enableCache) {
        this.cache.clear();
        this.status.cache.size = 0;
      }

      // Update status
      this.status.lastLoad = Date.now();
      this.status.sources = sourceNames;

      // Notify listeners
      this.notifyListeners(['*']);
    } finally {
      release();
    }
  }

  /**
   * Reload configuration from all sources
   */
  async reload(): Promise<void> {
    await this.load();
  }

  /**
   * Validate current configuration
   * @returns Validation result
   */
  validate(): ValidationResult {
    try {
      // Get current environment adapter
      const environment = this.getCurrentEnvironment();
      const adapter = this.adapters.get(environment);
      if (!adapter) {
        return {
          valid: false,
          errors: [`No adapter found for environment: ${environment}`],
          warnings: []
        };
      }

      // Validate configuration
      return adapter.validateConfiguration(this.config);
    } catch (error) {
      this.status.errorCount++;
      return {
        valid: false,
        errors: [`Validation failed: ${error.message}`],
        warnings: []
      };
    }
  }

  /**
   * Subscribe to configuration changes
   * @param listener - Change listener function
   */
  onChange(listener: (change: ConfigurationChange) => void): void {
    this.listeners.push(listener);
  }

  /**
   * Get current configuration status
   * @returns Configuration status
   */
  getStatus(): ConfigurationStatus {
    return { ...this.status };
  }

  /**
   * Register an environment adapter
   * @param adapter - Environment adapter to register
   */
  registerAdapter(adapter: EnvironmentAdapter): void {
    this.adapters.set(adapter.getEnvironment(), adapter);
  }

  /**
   * Register a configuration provider
   * @param provider - Configuration provider to register
   */
  registerProvider(provider: ConfigurationProvider): void {
    this.providers.push(provider);
  }

  /**
   * Get current environment
   * @returns Current environment type
   */
  private getCurrentEnvironment(): EnvironmentType {
    return this.options.environment as EnvironmentType || EnvironmentType.DEVELOPMENT;
  }

  /**
   * Initialize configuration providers
   */
  private async initializeProviders(): Promise<void> {
    // Clear existing providers
    this.providers.length = 0;

    // Create providers from sources
    for (const source of this.options.sources) {
      const provider = await this.createProvider(source);
      if (provider) {
        this.providers.push(provider);
      }
    }
  }

  /**
   * Create configuration provider from source definition
   * @param source - Configuration source
   * @returns Configuration provider or null
   */
  private async createProvider(source: ConfigurationSource): Promise<ConfigurationProvider | null> {
    switch (source.type) {
      case ConfigurationSourceType.FILE:
        return new FileConfigurationProvider(
          source.name,
          source.options.path,
          source.options.format,
          source.options
        );

      case ConfigurationSourceType.ENVIRONMENT:
        return new EnvironmentConfigurationProvider(
          source.name,
          source.options.prefix,
          source.options
        );

      case ConfigurationSourceType.SECURE_STORAGE:
        // Note: This requires dependency injection of security services
        // In a real implementation, these would be injected via constructor
        return new SecureStorageConfigurationProvider(
          source.name,
          source.options.namespace,
          source.options.encryptionRequired,
          source.options,
          // These would be injected dependencies in real implementation:
          new PayloadEncryptionService(),
          new MessageAuthenticationService()
        );

      case ConfigurationSourceType.REMOTE:
        return new RemoteConfigurationProvider(
          source.name,
          source.options.url,
          source.options
        );

      default:
        console.warn(`Unknown configuration source type: ${source.type}`);
        return null;
    }
  }

  /**
   * Get nested value from object using dot notation
   * @param obj - Object to search
   * @param key - Key path (dot notation)
   * @returns Value or undefined
   */
  private getNestedValue(obj: any, key: string): any {
    const keys = key.split('.');
    let current = obj;

    for (const k of keys) {
      if (current === null || current === undefined || typeof current !== 'object') {
        return undefined;
      }
      current = current[k];
    }

    return current;
  }

  /**
   * Set nested value in object using dot notation
   * @param obj - Object to modify
   * @param key - Key path (dot notation)
   * @param value - Value to set
   */
  private setNestedValue(obj: any, key: string, value: any): void {
    const keys = key.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!(k in current)) {
        current[k] = {};
      }
      current = current[k];
    }

    current[keys[keys.length - 1]] = value;
  }

  /**
   * Merge multiple configuration objects
   * @param configs - Configuration objects to merge
   * @returns Merged configuration object
   */
  private mergeConfigurations(configs: any[]): any {
    const merged: any = {};

    for (const config of configs) {
      this.deepMerge(merged, config);
    }

    return merged;
  }

  /**
   * Deep merge two objects
   * @param target - Target object
   * @param source - Source object
   */
  private deepMerge(target: any, source: any): void {
    for (const key of Object.keys(source)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key]) {
          target[key] = {};
        }
        this.deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }

  /**
   * Invalidate cache for a key and related keys
   * @param key - Key to invalidate
   */
  private invalidateCache(key: string): void {
    // Remove exact match
    this.cache.delete(key);

    // Remove keys that are prefixes of this key (e.g., if setting 'database.host', remove 'database')
    for (const cacheKey of this.cache.keys()) {
      if (key.startsWith(cacheKey + '.')) {
        this.cache.delete(cacheKey);
      }
    }

    // Update cache size
    this.status.cache.size = this.cache.size;
  }

  /**
   * Notify listeners of configuration changes
   * @param keys - Changed keys
   */
  private notifyListeners(keys: string[]): void {
    const change: ConfigurationChange = {
      keys,
      timestamp: Date.now(),
      source: 'BasicConfigurationManager'
    };

    for (const listener of this.listeners) {
      try {
        listener(change);
      } catch (error) {
        console.error('Error in configuration change listener:', error);
      }
    }
  }

  /**
   * Start hot reloading
   */
  private startHotReload(): void {
    if (this.hotReloadIntervalId) {
      clearInterval(this.hotReloadIntervalId);
    }

    this.hotReloadIntervalId = setInterval(async () => {
      try {
        await this.reload();
      } catch (error) {
        console.error('Hot reload failed:', error);
        this.status.errorCount++;
      }
    }, this.options.hotReloadInterval);
  }

  /**
   * Stop hot reloading
   */
  private stopHotReload(): void {
    if (this.hotReloadIntervalId) {
      clearInterval(this.hotReloadIntervalId);
      this.hotReloadIntervalId = null;
    }
  }

  /**
   * Clean up resources
   */
  async destroy(): Promise<void> {
    this.stopHotReload();
    this.listeners.length = 0;
    this.cache.clear();
  }
}
```

### Supporting Types and Utilities

```typescript
// src/config/utils/Mutex.ts

/**
 * Simple mutex implementation for thread safety
 */
class Mutex {
  private locked = false;
  private waiting: Array<() => void> = [];

  /**
   * Acquire the mutex
   * @returns Release function
   */
  async acquire(): Promise<() => void> {
    return new Promise(resolve => {
      if (!this.locked) {
        this.locked = true;
        resolve(this.release.bind(this));
      } else {
        this.waiting.push(() => {
          this.locked = true;
          resolve(this.release.bind(this));
        });
      }
    });
  }

  /**
   * Try to acquire the mutex without waiting
   * @returns Release function or null if not acquired
   */
  tryAcquire(): (() => void) | null {
    if (!this.locked) {
      this.locked = true;
      return this.release.bind(this);
    }
    return null;
  }

  /**
   * Release the mutex
   */
  private release(): void {
    this.locked = false;
    if (this.waiting.length > 0) {
      const next = this.waiting.shift();
      if (next) {
        next();
      }
    }
  }
}
```

```typescript
// src/config/errors/ConfigurationError.ts

/**
 * Custom error class for configuration-related errors
 */
class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}
```

## Implementation Plan

### Phase 1: Core Implementation (4 hours)

1. Implement BasicConfigurationManager class with core methods (2 hours)
2. Implement configuration loading and merging logic (1 hour)
3. Implement caching and change notification systems (1 hour)

### Phase 2: Advanced Features (2 hours)

1. Implement hot reloading functionality (0.5 hours)
2. Implement thread safety with mutex (0.5 hours)
3. Implement status reporting (0.5 hours)
4. Implement error handling and logging (0.5 hours)

### Phase 3: Integration (1 hour)

1. Integrate with environment adapters (0.5 hours)
2. Integrate with configuration providers (0.5 hours)

### Phase 4: Documentation and Testing (1 hour)

1. Add comprehensive JSDoc comments (0.5 hours)
2. Write unit tests (0.5 hours)

## Acceptance Criteria

- [ ] ConfigurationManager interface fully implemented
- [ ] Configuration loading from multiple sources
- [ ] Nested object retrieval with dot notation
- [ ] Configuration setting with change notifications
- [ ] Cache management with TTL support
- [ ] Hot reloading functionality
- [ ] Status reporting capabilities
- [ ] Thread safety with mutex implementation
- [ ] Error handling and logging
- [ ] Integration with environment adapters
- [ ] Integration with configuration providers
- [ ] Unit tests pass (100% coverage)
- [ ] Peer review completed

## Dependencies

- Task 00a: Create Core Interfaces (ConfigurationManager interface)
- Task 00b: Create Environment Adapters (EnvironmentAdapter implementations)
- Task 00c: Create Configuration Providers (ConfigurationProvider implementations)

## Risks and Mitigations

### Risk 1: Performance Issues
**Risk**: Configuration loading and retrieval may be slow with many sources
**Mitigation**: Implement caching, asynchronous loading, and efficient merging algorithms

### Risk 2: Thread Safety
**Risk**: Concurrent access may cause data corruption
**Mitigation**: Implement mutex for thread safety and proper locking mechanisms

### Risk 3: Memory Leaks
**Risk**: Cache and listeners may cause memory leaks
**Mitigation**: Implement proper cleanup methods and cache size limits

## Testing Approach

### Unit Testing
1. Test configuration loading from single and multiple sources
2. Test nested object retrieval with dot notation
3. Test configuration setting with change notifications
4. Test cache management with TTL expiration
5. Test hot reloading functionality
6. Test status reporting capabilities
7. Test error handling scenarios

### Integration Testing
1. Test integration with all environment adapters
2. Test integration with all configuration providers
3. Test end-to-end configuration loading flow
4. Test configuration validation with environment-specific rules

### Performance Testing
1. Measure configuration loading time with various source combinations
2. Measure cache hit/miss ratios
3. Test concurrent access performance
4. Validate memory usage patterns

## Code Quality Standards

### TypeScript Best Practices
- Use strict typing with no implicit any
- Leverage TypeScript generics for flexible type safety
- Follow consistent naming conventions
- Use proper access modifiers
- Include comprehensive documentation

### Design Principles
- Follow Single Responsibility Principle
- Implement proper separation of concerns
- Ensure thread safety with mutex
- Provide comprehensive error handling
- Maintain backward compatibility

## Deliverables

1. **BasicConfigurationManager.ts**: Core configuration manager implementation
2. **Mutex.ts**: Thread safety implementation
3. **ConfigurationError.ts**: Custom error class
4. **Unit Tests**: Comprehensive test suite
5. **Documentation**: Comprehensive JSDoc comments

## Timeline

**Estimated Duration**: 8 hours
**Start Date**: [To be determined]
**End Date**: [To be determined]

## Resources Required

- TypeScript development environment
- Code editor with TypeScript support
- Access to project repository
- Peer review participants
- Testing framework (Jest)

## Success Metrics

- ConfigurationManager implemented within estimated time
- 100% test coverage achieved
- No critical bugs identified in peer review
- Performance benchmarks met
- Clear and comprehensive documentation
- Ready for integration with other components

This task implements the core configuration management functionality that serves as the foundation for the entire system.