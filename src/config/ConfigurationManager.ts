// ConfigurationManager.ts - Configuration manager interface for Cross-Origin Communication Framework
// Phase 4: Environment Configuration Management - Task 1: Create Configuration Manager Interface

/**
 * Configuration options
 */
export interface ConfigurationOptions {
  /**
   * Environment name
   */
  environment?: string;

  /**
   * Configuration sources
   */
  sources?: ConfigurationSource[];

  /**
   * Enable configuration caching
   */
  enableCache?: boolean;

  /**
   * Cache TTL in milliseconds
   */
  cacheTTL?: number;

  /**
   * Enable hot reloading
   */
  enableHotReload?: boolean;

  /**
   * Hot reload interval in milliseconds
   */
  hotReloadInterval?: number;
}

/**
 * Configuration source
 */
export interface ConfigurationSource {
  /**
   * Source name
   */
  name: string;

  /**
   * Source type
   */
  type: ConfigurationSourceType;

  /**
   * Source options
   */
  options: any;
}

/**
 * Configuration source types
 */
export enum ConfigurationSourceType {
  FILE = 'file',
  ENVIRONMENT = 'environment',
  REMOTE = 'remote',
  SECURE_STORAGE = 'secure-storage'
}

/**
 * Validation result
 */
export interface ValidationResult {
  /**
   * Whether validation passed
   */
  valid: boolean;

  /**
   * Validation errors
   */
  errors: string[];

  /**
   * Validation warnings
   */
  warnings: string[];
}

/**
 * Configuration change event
 */
export interface ConfigurationChange {
  /**
   * Changed keys
   */
  keys: string[];

  /**
   * Timestamp of change
   */
  timestamp: number;

  /**
   * Source of change
   */
  source: string;
}

/**
 * Configuration status
 */
export interface ConfigurationStatus {
  /**
   * Whether configuration is loaded
   */
  loaded: boolean;

  /**
   * Last load timestamp
   */
  lastLoad: number;

  /**
   * Configuration sources
   */
  sources: string[];

  /**
   * Cache status
   */
  cache: {
    enabled: boolean;
    size: number;
    hits: number;
    misses: number;
  };

  /**
   * Error count
   */
  errorCount: number;
}

/**
 * Configuration manager interface
 */
export interface ConfigurationManager {
  /**
   * Initialize the configuration manager
   * @param options - Configuration options
   */
  initialize(options: ConfigurationOptions): Promise<void>;

  /**
   * Get a configuration value
   * @param key - Configuration key
   * @param defaultValue - Default value if key not found
   * @returns Configuration value
   */
  get<T>(key: string, defaultValue?: T): T;

  /**
   * Set a configuration value
   * @param key - Configuration key
   * @param value - Configuration value
   */
  set<T>(key: string, value: T): void;

  /**
   * Load configuration from sources
   */
  load(): Promise<void>;

  /**
   * Reload configuration from sources
   */
  reload(): Promise<void>;

  /**
   * Validate current configuration
   * @returns Validation result
   */
  validate(): ValidationResult;

  /**
   * Subscribe to configuration changes
   * @param listener - Change listener
   */
  onChange(listener: (change: ConfigurationChange) => void): void;

  /**
   * Get current configuration status
   * @returns Configuration status
   */
  getStatus(): ConfigurationStatus;
}