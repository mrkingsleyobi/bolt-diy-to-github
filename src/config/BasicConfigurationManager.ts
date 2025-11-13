// BasicConfigurationManager.ts - Basic configuration manager implementation
// Phase 4: Environment Configuration Management - Task 12: Implement Basic Configuration Manager

import {
  ConfigurationManager,
  ConfigurationOptions,
  ConfigurationSource,
  ConfigurationSourceType,
  ValidationResult,
  ConfigurationChange,
  ConfigurationStatus
} from './ConfigurationManager';
import { EnvironmentAdapter, EnvironmentType } from './EnvironmentAdapter';
import { ConfigurationProvider } from './ConfigurationProvider';
import {
  DevelopmentEnvironmentAdapter
} from './adapters/DevelopmentEnvironmentAdapter';
import {
  TestingEnvironmentAdapter
} from './adapters/TestingEnvironmentAdapter';
import {
  StagingEnvironmentAdapter
} from './adapters/StagingEnvironmentAdapter';
import {
  ProductionEnvironmentAdapter
} from './adapters/ProductionEnvironmentAdapter';
import {
  FileConfigurationProvider
} from './providers/FileConfigurationProvider';
import {
  EnvironmentConfigurationProvider
} from './providers/EnvironmentConfigurationProvider';
import {
  SecureStorageConfigurationProvider
} from './providers/SecureStorageConfigurationProvider';
import {
  RemoteConfigurationProvider
} from './providers/RemoteConfigurationProvider';
import { PayloadEncryptionService } from '../security/PayloadEncryptionService';
import { MessageAuthenticationService } from '../security/MessageAuthenticationService';

/**
 * Basic configuration manager implementation
 */
export class BasicConfigurationManager implements ConfigurationManager {
  private options: ConfigurationOptions;
  private environmentAdapter: EnvironmentAdapter;
  private providers: ConfigurationProvider[] = [];
  private config: any = {};
  private listeners: ((change: ConfigurationChange) => void)[] = [];
  private cache: Map<string, any> = new Map();
  private cacheHits: number = 0;
  private cacheMisses: number = 0;
  private lastLoad: number = 0;
  private errorCount: number = 0;
  private encryptionService: PayloadEncryptionService;
  private authenticationService: MessageAuthenticationService;

  constructor(
    encryptionService: PayloadEncryptionService,
    authenticationService: MessageAuthenticationService
  ) {
    this.encryptionService = encryptionService;
    this.authenticationService = authenticationService;
    this.options = {
      environment: process.env.NODE_ENV || 'development',
      enableCache: true,
      cacheTTL: 60000,
      enableHotReload: false,
      hotReloadInterval: 5000
    };
  }

  /**
   * Initialize the configuration manager
   * @param options - Configuration options
   */
  async initialize(options: ConfigurationOptions): Promise<void> {
    this.options = { ...this.options, ...options };

    // Create environment adapter based on environment
    this.environmentAdapter = this.createEnvironmentAdapter(
      this.options.environment || 'development'
    );

    // Create providers based on environment sources
    const sources = this.environmentAdapter.getConfigurationSources();
    this.providers = await this.createProviders(sources);

    // Load initial configuration
    await this.load();

    // Set up hot reloading if enabled
    if (this.options.enableHotReload) {
      this.setupHotReloading();
    }
  }

  /**
   * Get a configuration value
   * @param key - Configuration key
   * @param defaultValue - Default value if key not found
   * @returns Configuration value
   */
  get<T>(key: string, defaultValue?: T): T {
    // Check cache first if enabled
    if (this.options.enableCache) {
      if (this.cache.has(key)) {
        this.cacheHits++;
        return this.cache.get(key);
      }
      this.cacheMisses++;
    }

    // Navigate nested object structure
    const keys = key.split('.');
    let value = this.config;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Cache the default value if caching is enabled
        if (this.options.enableCache) {
          this.cache.set(key, defaultValue);
        }
        return defaultValue as T;
      }
    }

    // Cache the value if caching is enabled
    if (this.options.enableCache) {
      this.cache.set(key, value);
    }

    return value;
  }

  /**
   * Set a configuration value
   * @param key - Configuration key
   * @param value - Configuration value
   */
  set<T>(key: string, value: T): void {
    // Update config object
    const keys = key.split('.');
    let current = this.config;

    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!(k in current)) {
        current[k] = {};
      }
      current = current[k];
    }

    const oldValue = current[keys[keys.length - 1]];
    current[keys[keys.length - 1]] = value;

    // Update cache if enabled
    if (this.options.enableCache) {
      this.cache.set(key, value);
    }

    // Notify listeners of change
    if (oldValue !== value) {
      this.notifyListeners({
        keys: [key],
        timestamp: Date.now(),
        source: 'direct-set'
      });
    }
  }

  /**
   * Load configuration from sources
   */
  async load(): Promise<void> {
    try {
      const configs: any[] = [];

      // Load from all providers
      for (const provider of this.providers) {
        try {
          if (await provider.isAvailable()) {
            const config = await provider.load();
            configs.push(config);
          }
        } catch (error) {
          console.warn(`Failed to load configuration from ${provider.getName()}: ${error.message}`);
          this.errorCount++;
        }
      }

      // Merge configurations with priority (later sources override earlier ones)
      this.config = {};
      for (const config of configs) {
        this.mergeConfig(this.config, config);
      }

      // Transform configuration for environment
      this.config = this.environmentAdapter.transformConfiguration(this.config);

      // Validate configuration
      const validationResult = this.validate();
      if (!validationResult.valid) {
        console.warn('Configuration validation failed:', validationResult.errors);
      }

      // Clear cache
      if (this.options.enableCache) {
        this.cache.clear();
      }

      this.lastLoad = Date.now();
    } catch (error) {
      this.errorCount++;
      throw new Error(`Failed to load configuration: ${error.message}`);
    }
  }

  /**
   * Reload configuration from sources
   */
  async reload(): Promise<void> {
    await this.load();
    this.notifyListeners({
      keys: ['*'],
      timestamp: Date.now(),
      source: 'reload'
    });
  }

  /**
   * Validate current configuration
   * @returns Validation result
   */
  validate(): ValidationResult {
    return this.environmentAdapter.validateConfiguration(this.config);
  }

  /**
   * Subscribe to configuration changes
   * @param listener - Change listener
   */
  onChange(listener: (change: ConfigurationChange) => void): void {
    this.listeners.push(listener);
  }

  /**
   * Get current configuration status
   * @returns Configuration status
   */
  getStatus(): ConfigurationStatus {
    return {
      loaded: this.lastLoad > 0,
      lastLoad: this.lastLoad,
      sources: this.providers.map(p => p.getName()),
      cache: {
        enabled: this.options.enableCache || false,
        size: this.cache.size,
        hits: this.cacheHits,
        misses: this.cacheMisses
      },
      errorCount: this.errorCount
    };
  }

  /**
   * Create environment adapter based on environment type
   * @param environment - Environment type
   * @returns Environment adapter
   */
  private createEnvironmentAdapter(environment: string): EnvironmentAdapter {
    switch (environment.toLowerCase()) {
      case 'development':
        return new DevelopmentEnvironmentAdapter();
      case 'testing':
      case 'test':
        return new TestingEnvironmentAdapter();
      case 'staging':
        return new StagingEnvironmentAdapter();
      case 'production':
      case 'prod':
        return new ProductionEnvironmentAdapter();
      default:
        return new DevelopmentEnvironmentAdapter();
    }
  }

  /**
   * Create providers based on configuration sources
   * @param sources - Configuration sources
   * @returns Configuration providers
   */
  private async createProviders(sources: ConfigurationSource[]): Promise<ConfigurationProvider[]> {
    const providers: ConfigurationProvider[] = [];

    for (const source of sources) {
      let provider: ConfigurationProvider;

      switch (source.type) {
        case ConfigurationSourceType.FILE:
          provider = new FileConfigurationProvider(
            source.name,
            source.options.path,
            source.options.format
          );
          break;
        case ConfigurationSourceType.ENVIRONMENT:
          provider = new EnvironmentConfigurationProvider(
            source.name,
            source.options.prefix
          );
          break;
        case ConfigurationSourceType.SECURE_STORAGE:
          provider = new SecureStorageConfigurationProvider(
            source.name,
            source.options.namespace,
            this.encryptionService,
            this.authenticationService
          );
          break;
        case ConfigurationSourceType.REMOTE:
          provider = new RemoteConfigurationProvider(
            source.name,
            source.options.url,
            source.options.headers,
            source.options.timeout,
            source.options.cacheTTL
          );
          break;
        default:
          throw new Error(`Unsupported configuration source type: ${source.type}`);
      }

      providers.push(provider);
    }

    return providers;
  }

  /**
   * Merge configuration objects
   * @param target - Target configuration
   * @param source - Source configuration
   */
  private mergeConfig(target: any, source: any): void {
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (
          target.hasOwnProperty(key) &&
          typeof target[key] === 'object' &&
          typeof source[key] === 'object' &&
          target[key] !== null &&
          source[key] !== null &&
          !Array.isArray(target[key]) &&
          !Array.isArray(source[key])
        ) {
          this.mergeConfig(target[key], source[key]);
        } else {
          target[key] = source[key];
        }
      }
    }
  }

  /**
   * Set up hot reloading
   */
  private setupHotReloading(): void {
    if (this.options.hotReloadInterval) {
      setInterval(async () => {
        try {
          await this.reload();
        } catch (error) {
          console.error('Hot reload failed:', error.message);
          this.errorCount++;
        }
      }, this.options.hotReloadInterval);
    }
  }

  /**
   * Notify listeners of configuration changes
   * @param change - Configuration change
   */
  private notifyListeners(change: ConfigurationChange): void {
    for (const listener of this.listeners) {
      try {
        listener(change);
      } catch (error) {
        console.error('Error in configuration change listener:', error.message);
      }
    }
  }
}