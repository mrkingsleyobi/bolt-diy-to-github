# Environment Configuration Management System - Refinement Phase

## 1. Implementation Refinement Strategy

### 1.1 Test-Driven Development Approach

Following the London School TDD methodology, we'll implement the configuration management system with a focus on behavior-driven development and mock-based testing.

#### Test Structure Pattern
```typescript
// RED Phase - Write failing test first
describe('ConfigurationManager', () => {
  describe('initialize', () => {
    it('should create environment adapter based on environment', async () => {
      // Arrange
      const mockEnvironmentAdapter = createMockEnvironmentAdapter();
      const mockProviderFactory = createMockProviderFactory();
      const configManager = new BasicConfigurationManager(
        mockEncryptionService,
        mockAuthenticationService,
        mockEnvironmentAdapter,
        mockProviderFactory
      );

      const options = { environment: 'development' };

      // Act & Assert
      await expect(configManager.initialize(options))
        .rejects.toThrow('Environment adapter not properly initialized');
    });
  });
});

// GREEN Phase - Implement minimal solution
class BasicConfigurationManager implements ConfigurationManager {
  private environmentAdapter: EnvironmentAdapter | null = null;

  async initialize(options: ConfigurationOptions): Promise<void> {
    // Minimal implementation to make test pass
    if (!this.environmentAdapter) {
      throw new Error('Environment adapter not properly initialized');
    }
  }
}

// REFACTOR Phase - Improve implementation
class BasicConfigurationManager implements ConfigurationManager {
  private environmentAdapter: EnvironmentAdapter | null = null;
  private providerFactory: ProviderFactory;

  constructor(
    private encryptionService: PayloadEncryptionService,
    private authenticationService: MessageAuthenticationService,
    environmentAdapter?: EnvironmentAdapter,
    providerFactory?: ProviderFactory
  ) {
    this.providerFactory = providerFactory || new DefaultProviderFactory();
    if (environmentAdapter) {
      this.environmentAdapter = environmentAdapter;
    }
  }

  async initialize(options: ConfigurationOptions): Promise<void> {
    // Improved implementation with proper initialization
    if (!this.environmentAdapter) {
      this.environmentAdapter = this.createEnvironmentAdapter(
        options.environment || 'development'
      );
    }

    // Additional initialization logic...
  }

  private createEnvironmentAdapter(environment: string): EnvironmentAdapter {
    // Factory method implementation
  }
}
```

### 1.2 Incremental Implementation Approach

#### Phase 1: Core Interfaces and Basic Structure
1. ConfigurationManager interface
2. EnvironmentAdapter interface
3. ConfigurationProvider interface
4. Basic type definitions

#### Phase 2: Environment Adapter Implementations
1. DevelopmentEnvironmentAdapter
2. TestingEnvironmentAdapter
3. StagingEnvironmentAdapter
4. ProductionEnvironmentAdapter

#### Phase 3: Configuration Provider Implementations
1. FileConfigurationProvider
2. EnvironmentConfigurationProvider
3. SecureStorageConfigurationProvider
4. RemoteConfigurationProvider

#### Phase 4: Core ConfigurationManager Implementation
1. BasicConfigurationManager class
2. Configuration loading and retrieval
3. Caching mechanism
4. Change notification system

#### Phase 5: Advanced Features
1. Hot reloading
2. Configuration validation
3. Error handling and recovery
4. Performance optimization

## 2. Detailed Implementation Plans

### 2.1 ConfigurationManager Interface Implementation

#### Task: Define Core Configuration Manager Interface
```typescript
// ConfigurationManager.ts
export interface ConfigurationManager {
  initialize(options: ConfigurationOptions): Promise<void>;
  get<T>(key: string, defaultValue?: T): T;
  set<T>(key: string, value: T): void;
  load(): Promise<void>;
  reload(): Promise<void>;
  validate(): ValidationResult;
  onChange(listener: (change: ConfigurationChange) => void): void;
  getStatus(): ConfigurationStatus;
}

// Supporting interfaces
export interface ConfigurationOptions {
  environment?: string;
  sources?: ConfigurationSource[];
  enableCache?: boolean;
  cacheTTL?: number;
  enableHotReload?: boolean;
  hotReloadInterval?: number;
}

export interface ConfigurationSource {
  name: string;
  type: ConfigurationSourceType;
  options: any;
}

export enum ConfigurationSourceType {
  FILE = 'file',
  ENVIRONMENT = 'environment',
  REMOTE = 'remote',
  SECURE_STORAGE = 'secure-storage'
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ConfigurationChange {
  keys: string[];
  timestamp: number;
  source: string;
}

export interface ConfigurationStatus {
  loaded: boolean;
  lastLoad: number;
  sources: string[];
  cache: {
    enabled: boolean;
    size: number;
    hits: number;
    misses: number;
  };
  errorCount: number;
}
```

#### Implementation Considerations
- Strong typing for all configuration operations
- Async/await pattern for all I/O operations
- Error handling with custom error types
- Event-based change notification system
- Comprehensive status reporting

### 2.2 EnvironmentAdapter Interface Implementation

#### Task: Define Environment Adapter Interface
```typescript
// EnvironmentAdapter.ts
export interface EnvironmentAdapter {
  getEnvironment(): EnvironmentType;
  getConfigurationSources(): ConfigurationSource[];
  transformConfiguration(config: any): any;
  validateConfiguration(config: any): ValidationResult;
}

export enum EnvironmentType {
  DEVELOPMENT = 'development',
  TESTING = 'testing',
  STAGING = 'staging',
  PRODUCTION = 'production'
}
```

#### Task: Implement Development Environment Adapter
```typescript
// DevelopmentEnvironmentAdapter.ts
export class DevelopmentEnvironmentAdapter implements EnvironmentAdapter {
  private environment: EnvironmentType = EnvironmentType.DEVELOPMENT;

  getEnvironment(): EnvironmentType {
    return this.environment;
  }

  getConfigurationSources(): ConfigurationSource[] {
    return [
      {
        name: 'local-config',
        type: ConfigurationSourceType.FILE,
        options: {
          path: path.join(process.cwd(), 'config', 'development.json'),
          format: 'json'
        }
      },
      {
        name: 'environment-variables',
        type: ConfigurationSourceType.ENVIRONMENT,
        options: {
          prefix: 'APP_'
        }
      }
    ];
  }

  transformConfiguration(config: any): any {
    return {
      ...config,
      debug: config.debug ?? true,
      logging: config.logging ?? { level: 'debug', format: 'pretty' },
      hotReload: config.hotReload ?? true,
      api: {
        ...config.api,
        baseUrl: config.api?.baseUrl ?? 'http://localhost:3000'
      }
    };
  }

  validateConfiguration(config: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.api?.baseUrl) {
      warnings.push('API base URL not configured, using default development URL');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}
```

### 2.3 ConfigurationProvider Interface Implementation

#### Task: Define Configuration Provider Interface
```typescript
// ConfigurationProvider.ts
export interface ConfigurationProvider {
  getName(): string;
  load(): Promise<any>;
  save(config: any): Promise<void>;
  isAvailable(): Promise<boolean>;
}
```

#### Task: Implement File Configuration Provider
```typescript
// FileConfigurationProvider.ts
export class FileConfigurationProvider implements ConfigurationProvider {
  private name: string;
  private filePath: string;
  private format: 'json' | 'yaml' | 'yml';
  private cache: any = null;
  private lastModified: number = 0;

  constructor(name: string, filePath: string, format: 'json' | 'yaml' | 'yml' = 'json') {
    this.name = name;
    this.filePath = filePath;
    this.format = format;
  }

  getName(): string {
    return this.name;
  }

  async load(): Promise<any> {
    try {
      const stats = await fs.stat(this.filePath);

      // Check if cached version is still valid
      if (stats.mtime.getTime() <= this.lastModified && this.cache) {
        return this.cache;
      }

      const content = await fs.readFile(this.filePath, 'utf8');
      let config: any;

      if (this.format === 'json') {
        config = JSON.parse(content);
      } else if (this.format === 'yaml' || this.format === 'yml') {
        config = yaml.load(content);
      } else {
        throw new Error(`Unsupported configuration format: ${this.format}`);
      }

      // Update cache
      this.cache = config;
      this.lastModified = stats.mtime.getTime();

      return config;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return {};
      }
      throw new Error(`Failed to load configuration from ${this.filePath}: ${error.message}`);
    }
  }

  async save(config: any): Promise<void> {
    try {
      let content: string;

      if (this.format === 'json') {
        content = JSON.stringify(config, null, 2);
      } else if (this.format === 'yaml' || this.format === 'yml') {
        content = yaml.dump(config);
      } else {
        throw new Error(`Unsupported configuration format: ${this.format}`);
      }

      const dir = path.dirname(this.filePath);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(this.filePath, content, 'utf8');

      // Update cache
      this.cache = config;
      const stats = await fs.stat(this.filePath);
      this.lastModified = stats.mtime.getTime();
    } catch (error) {
      throw new Error(`Failed to save configuration to ${this.filePath}: ${error.message}`);
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      await fs.access(this.filePath);
      return true;
    } catch {
      return false;
    }
  }
}
```

## 3. Testing Strategy Refinement

### 3.1 Unit Testing Approach

#### Mock-Based Testing for ConfigurationManager
```typescript
// ConfigurationManager unit tests
describe('BasicConfigurationManager', () => {
  let configManager: BasicConfigurationManager;
  let mockEncryptionService: jest.Mocked<PayloadEncryptionService>;
  let mockAuthenticationService: jest.Mocked<MessageAuthenticationService>;
  let mockEnvironmentAdapter: jest.Mocked<EnvironmentAdapter>;
  let mockProviderFactory: jest.Mocked<ProviderFactory>;

  beforeEach(() => {
    mockEncryptionService = createMockEncryptionService();
    mockAuthenticationService = createMockAuthenticationService();
    mockEnvironmentAdapter = createMockEnvironmentAdapter();
    mockProviderFactory = createMockProviderFactory();

    configManager = new BasicConfigurationManager(
      mockEncryptionService,
      mockAuthenticationService
    );
  });

  describe('initialize', () => {
    it('should initialize with default options', async () => {
      await configManager.initialize({});

      expect(configManager.getStatus().loaded).toBe(false);
      expect(configManager.getStatus().errorCount).toBe(0);
    });

    it('should create environment adapter based on environment', async () => {
      const options: ConfigurationOptions = { environment: 'development' };

      await configManager.initialize(options);

      // Verify environment adapter was created
      // This would require exposing the adapter or checking side effects
    });
  });

  describe('get', () => {
    it('should return default value for non-existent keys', () => {
      const result = configManager.get('non.existent.key', 'default');
      expect(result).toBe('default');
    });

    it('should return nested configuration values', async () => {
      // Setup mock configuration
      mockEnvironmentAdapter.getConfigurationSources.mockReturnValue([
        { name: 'test', type: ConfigurationSourceType.ENVIRONMENT, options: {} }
      ]);

      await configManager.initialize({ environment: 'test' });

      // Mock the provider to return test configuration
      // This requires more complex mocking setup
    });
  });
});
```

### 3.2 Integration Testing Approach

#### End-to-End Configuration Flow Testing
```typescript
// Integration tests for configuration loading flow
describe('Configuration Loading Integration', () => {
  let configManager: BasicConfigurationManager;
  let tempDir: string;

  beforeAll(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'config-test-'));
  });

  afterAll(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should load configuration from file and environment sources', async () => {
    // Create test configuration file
    const configPath = path.join(tempDir, 'test.json');
    const testConfig = {
      api: { baseUrl: 'http://test.example.com' },
      database: { host: 'localhost', port: 5432 }
    };

    await fs.writeFile(configPath, JSON.stringify(testConfig, null, 2));

    // Set environment variables
    process.env.APP_API_TIMEOUT = '5000';
    process.env.APP_LOGGING_LEVEL = 'info';

    // Create configuration manager with file and environment sources
    configManager = new BasicConfigurationManager(
      mockEncryptionService,
      mockAuthenticationService
    );

    await configManager.initialize({
      environment: 'test',
      sources: [
        {
          name: 'file-config',
          type: ConfigurationSourceType.FILE,
          options: { path: configPath, format: 'json' }
        },
        {
          name: 'env-config',
          type: ConfigurationSourceType.ENVIRONMENT,
          options: { prefix: 'APP_' }
        }
      ]
    });

    // Verify configuration was loaded and merged correctly
    expect(configManager.get('api.baseUrl')).toBe('http://test.example.com');
    expect(configManager.get('api.timeout')).toBe(5000);
    expect(configManager.get('logging.level')).toBe('info');
    expect(configManager.get('database.host')).toBe('localhost');
  });
});
```

## 4. Security Refinement

### 4.1 Encryption Integration

#### Task: Integrate Payload Encryption Service
```typescript
// SecureStorageConfigurationProvider with encryption
export class SecureStorageConfigurationProvider implements ConfigurationProvider {
  private name: string;
  private namespace: string;
  private encryptionService: PayloadEncryptionService;
  private authenticationService: MessageAuthenticationService;

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

  getName(): string {
    return this.name;
  }

  async load(): Promise<any> {
    try {
      // Load encrypted configuration from storage
      const encryptedData = await this.loadFromSecureStorage(this.namespace);

      if (!encryptedData) {
        return {};
      }

      // Verify data integrity
      const { data, signature } = encryptedData;
      const isValid = await this.authenticationService.verify(data, signature);

      if (!isValid) {
        throw new Error('Configuration data integrity verification failed');
      }

      // Decrypt configuration
      const decryptedData = await this.encryptionService.decrypt(data);

      return JSON.parse(decryptedData);
    } catch (error) {
      throw new Error(`Failed to load secure configuration: ${error.message}`);
    }
  }

  async save(config: any): Promise<void> {
    try {
      // Serialize configuration
      const configString = JSON.stringify(config);

      // Encrypt configuration
      const encryptedData = await this.encryptionService.encrypt(configString);

      // Create authentication signature
      const signature = await this.authenticationService.sign(encryptedData);

      // Save to secure storage
      await this.saveToSecureStorage(this.namespace, { data: encryptedData, signature });
    } catch (error) {
      throw new Error(`Failed to save secure configuration: ${error.message}`);
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Check if encryption and authentication services are available
      const encryptionAvailable = await this.encryptionService.isAvailable();
      const authAvailable = await this.authenticationService.isAvailable();

      return encryptionAvailable && authAvailable;
    } catch {
      return false;
    }
  }

  private async loadFromSecureStorage(namespace: string): Promise<any> {
    // Implementation for loading from secure storage
    // This would depend on the specific secure storage mechanism used
  }

  private async saveToSecureStorage(namespace: string, data: any): Promise<void> {
    // Implementation for saving to secure storage
  }
}
```

### 4.2 Access Control Implementation

#### Task: Implement Configuration Access Control
```typescript
// Configuration access control wrapper
export class ConfigAccessController {
  private authService: AuthenticationService;

  constructor(authService: AuthenticationService) {
    this.authService = authService;
  }

  async canAccessConfig(
    user: User,
    configKey: string,
    action: 'read' | 'write'
  ): Promise<boolean> {
    const permission = `config:${action}:${configKey}`;
    return await this.authService.hasPermission(user, permission);
  }

  async enforceAccess(
    user: User,
    configKey: string,
    action: 'read' | 'write'
  ): Promise<void> {
    const canAccess = await this.canAccessConfig(user, configKey, action);

    if (!canAccess) {
      throw new PermissionError(
        `User ${user.id} does not have permission to ${action} configuration ${configKey}`
      );
    }
  }

  async auditAccess(
    user: User,
    configKey: string,
    action: 'read' | 'write'
  ): Promise<void> {
    await this.authService.logAuditEvent({
      userId: user.id,
      action: `config:${action}`,
      resource: configKey,
      timestamp: Date.now()
    });
  }
}

// Wrapper for ConfigurationManager with access control
export class SecureConfigurationManager implements ConfigurationManager {
  private configManager: ConfigurationManager;
  private accessController: ConfigAccessController;

  constructor(
    configManager: ConfigurationManager,
    accessController: ConfigAccessController
  ) {
    this.configManager = configManager;
    this.accessController = accessController;
  }

  async get<T>(user: User, key: string, defaultValue?: T): Promise<T> {
    await this.accessController.enforceAccess(user, key, 'read');
    await this.accessController.auditAccess(user, key, 'read');

    return this.configManager.get(key, defaultValue);
  }

  async set<T>(user: User, key: string, value: T): Promise<void> {
    await this.accessController.enforceAccess(user, key, 'write');
    await this.accessController.auditAccess(user, key, 'write');

    return this.configManager.set(key, value);
  }

  // Delegate other methods to wrapped ConfigurationManager
  async initialize(options: ConfigurationOptions): Promise<void> {
    return this.configManager.initialize(options);
  }

  async load(): Promise<void> {
    return this.configManager.load();
  }

  async reload(): Promise<void> {
    return this.configManager.reload();
  }

  validate(): ValidationResult {
    return this.configManager.validate();
  }

  onChange(listener: (change: ConfigurationChange) => void): void {
    return this.configManager.onChange(listener);
  }

  getStatus(): ConfigurationStatus {
    return this.configManager.getStatus();
  }
}
```

## 5. Performance Optimization Refinement

### 5.1 Caching Strategy Enhancement

#### Task: Implement Advanced Configuration Caching
```typescript
// Advanced configuration cache with TTL and LRU eviction
export class AdvancedConfigurationCache {
  private cache: Map<string, CacheEntry>;
  private lruTracker: LRUCache<string, number>;
  private defaultTTL: number;
  private maxSize: number;

  constructor(defaultTTL: number = 60000, maxSize: number = 1000) {
    this.cache = new Map();
    this.lruTracker = new LRUCache({ max: maxSize });
    this.defaultTTL = defaultTTL;
    this.maxSize = maxSize;
  }

  get(key: string): any {
    const entry = this.cache.get(key);

    if (!entry) {
      return undefined;
    }

    // Check TTL
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      this.lruTracker.delete(key);
      return undefined;
    }

    // Update LRU tracking
    this.lruTracker.set(key, Date.now());

    return entry.value;
  }

  set(key: string, value: any, ttl?: number): void {
    // Check cache size and evict if necessary
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    const expiry = Date.now() + (ttl || this.defaultTTL);

    this.cache.set(key, { value, expiry });
    this.lruTracker.set(key, Date.now());
  }

  delete(key: string): void {
    this.cache.delete(key);
    this.lruTracker.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.lruTracker.clear();
  }

  private evictLRU(): void {
    const lruKey = this.lruTracker.keys().next().value;

    if (lruKey) {
      this.cache.delete(lruKey);
      this.lruTracker.delete(lruKey);
    }
  }

  getStats(): CacheStats {
    const now = Date.now();
    let expiredCount = 0;

    for (const entry of this.cache.values()) {
      if (now > entry.expiry) {
        expiredCount++;
      }
    }

    return {
      size: this.cache.size,
      expired: expiredCount,
      hits: this.lruTracker.size
    };
  }
}

interface CacheEntry {
  value: any;
  expiry: number;
}

interface CacheStats {
  size: number;
  expired: number;
  hits: number;
}
```

### 5.2 Configuration Loading Optimization

#### Task: Implement Parallel Configuration Loading
```typescript
// Optimized configuration loading with parallel processing
export class OptimizedConfigurationManager extends BasicConfigurationManager {
  private parallelLoadLimit: number;

  constructor(
    encryptionService: PayloadEncryptionService,
    authenticationService: MessageAuthenticationService,
    parallelLoadLimit: number = 5
  ) {
    super(encryptionService, authenticationService);
    this.parallelLoadLimit = parallelLoadLimit;
  }

  protected async loadConfigurationParallel(): Promise<any[]> {
    const configs: any[] = [];
    const availableProviders = this.providers.filter(
      provider => provider.isAvailable()
    );

    // Process providers in parallel batches
    for (let i = 0; i < availableProviders.length; i += this.parallelLoadLimit) {
      const batch = availableProviders.slice(i, i + this.parallelLoadLimit);
      const batchPromises = batch.map(provider => this.loadFromProvider(provider));
      const batchResults = await Promise.allSettled(batchPromises);

      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          configs.push(result.value);
        } else {
          console.warn(
            `Failed to load configuration from ${batch[index].getName()}: ${result.reason}`
          );
          this.incrementErrorCount();
        }
      });
    }

    return configs;
  }

  private async loadFromProvider(provider: ConfigurationProvider): Promise<any> {
    try {
      return await provider.load();
    } catch (error) {
      throw new Error(`Provider ${provider.getName()} failed: ${error.message}`);
    }
  }

  private incrementErrorCount(): void {
    // Implementation to increment error count
  }
}
```

## 6. Error Handling and Recovery Refinement

### 6.1 Comprehensive Error Handling

#### Task: Implement Detailed Error Types
```typescript
// Configuration system specific error types
export class ConfigurationError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

export class ConfigurationLoadError extends ConfigurationError {
  constructor(
    message: string,
    public readonly source: string,
    public readonly underlyingError?: Error
  ) {
    super(message, 'CONFIG_LOAD_ERROR');
    this.name = 'ConfigurationLoadError';
  }
}

export class ConfigurationValidationError extends ConfigurationError {
  constructor(
    message: string,
    public readonly errors: string[],
    public readonly warnings: string[]
  ) {
    super(message, 'CONFIG_VALIDATION_ERROR');
    this.name = 'ConfigurationValidationError';
  }
}

export class ConfigurationSecurityError extends ConfigurationError {
  constructor(message: string) {
    super(message, 'CONFIG_SECURITY_ERROR');
    this.name = 'ConfigurationSecurityError';
  }
}

// Enhanced error handling in configuration manager
export class RobustConfigurationManager extends BasicConfigurationManager {
  async load(): Promise<void> {
    const startTime = Date.now();

    try {
      // Existing load logic...
      await super.load();

      this.recordLoadSuccess(Date.now() - startTime);
    } catch (error) {
      this.recordLoadFailure(error, Date.now() - startTime);

      // Implement fallback strategy
      await this.applyFallbackConfiguration();

      // Re-throw or handle based on severity
      if (this.shouldFailFast(error)) {
        throw error;
      }

      // Log and continue with fallback configuration
      console.warn('Configuration load failed, using fallback:', error.message);
    }
  }

  private async applyFallbackConfiguration(): Promise<void> {
    // Load minimal fallback configuration
    const fallbackConfig = await this.loadFallbackConfiguration();
    this.config = fallbackConfig;

    // Clear cache and notify listeners
    if (this.options.enableCache) {
      this.cache.clear();
    }

    this.notifyListeners({
      keys: ['*'],
      timestamp: Date.now(),
      source: 'fallback'
    });
  }

  private async loadFallbackConfiguration(): Promise<any> {
    // Implementation for loading fallback configuration
    // This could be from a built-in default or a minimal config file
    return {
      api: { baseUrl: 'http://localhost:3000' },
      logging: { level: 'error' },
      debug: false
    };
  }

  private shouldFailFast(error: Error): boolean {
    // Determine if error is critical enough to fail fast
    // Critical errors might include security issues or missing essential config
    return error instanceof ConfigurationSecurityError;
  }

  private recordLoadSuccess(duration: number): void {
    // Record successful load metrics
  }

  private recordLoadFailure(error: Error, duration: number): void {
    // Record failed load metrics
  }
}
```

## 7. Monitoring and Observability Refinement

### 7.1 Metrics Collection Enhancement

#### Task: Implement Detailed Metrics Collection
```typescript
// Enhanced metrics collection for configuration system
export class ConfigurationMetricsCollector {
  private metrics: ConfigurationMetrics;

  constructor() {
    this.metrics = {
      loadCount: 0,
      loadSuccessCount: 0,
      loadFailureCount: 0,
      loadDuration: [],
      cacheHits: 0,
      cacheMisses: 0,
      providerMetrics: new Map(),
      errorMetrics: new Map(),
      changeEvents: 0
    };
  }

  recordLoadStart(): number {
    this.metrics.loadCount++;
    return Date.now();
  }

  recordLoadSuccess(duration: number): void {
    this.metrics.loadSuccessCount++;
    this.metrics.loadDuration.push(duration);

    // Keep only last 1000 duration measurements
    if (this.metrics.loadDuration.length > 1000) {
      this.metrics.loadDuration.shift();
    }
  }

  recordLoadFailure(error: Error, duration: number): void {
    this.metrics.loadFailureCount++;
    this.metrics.loadDuration.push(duration);

    // Track error types
    const errorType = error.constructor.name;
    const currentCount = this.metrics.errorMetrics.get(errorType) || 0;
    this.metrics.errorMetrics.set(errorType, currentCount + 1);
  }

  recordCacheHit(): void {
    this.metrics.cacheHits++;
  }

  recordCacheMiss(): void {
    this.metrics.cacheMisses++;
  }

  recordProviderLoad(providerName: string, success: boolean, duration: number): void {
    let providerMetric = this.metrics.providerMetrics.get(providerName);

    if (!providerMetric) {
      providerMetric = {
        loadCount: 0,
        successCount: 0,
        failureCount: 0,
        durations: []
      };
      this.metrics.providerMetrics.set(providerName, providerMetric);
    }

    providerMetric.loadCount++;
    if (success) {
      providerMetric.successCount++;
    } else {
      providerMetric.failureCount++;
    }

    providerMetric.durations.push(duration);
    if (providerMetric.durations.length > 100) {
      providerMetric.durations.shift();
    }
  }

  recordChangeEvent(): void {
    this.metrics.changeEvents++;
  }

  getMetrics(): ConfigurationMetrics {
    return {
      ...this.metrics,
      cacheHitRate: this.calculateCacheHitRate(),
      avgLoadDuration: this.calculateAverage(this.metrics.loadDuration),
      providerMetrics: this.serializeProviderMetrics()
    };
  }

  private calculateCacheHitRate(): number {
    const total = this.metrics.cacheHits + this.metrics.cacheMisses;
    return total > 0 ? this.metrics.cacheHits / total : 0;
  }

  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  private serializeProviderMetrics(): Record<string, any> {
    const serialized: Record<string, any> = {};

    for (const [name, metrics] of this.metrics.providerMetrics) {
      serialized[name] = {
        ...metrics,
        avgDuration: this.calculateAverage(metrics.durations)
      };
    }

    return serialized;
  }

  reset(): void {
    this.metrics = {
      loadCount: 0,
      loadSuccessCount: 0,
      loadFailureCount: 0,
      loadDuration: [],
      cacheHits: 0,
      cacheMisses: 0,
      providerMetrics: new Map(),
      errorMetrics: new Map(),
      changeEvents: 0
    };
  }
}

interface ConfigurationMetrics {
  loadCount: number;
  loadSuccessCount: number;
  loadFailureCount: number;
  loadDuration: number[];
  cacheHits: number;
  cacheMisses: number;
  providerMetrics: Map<string, ProviderMetrics>;
  errorMetrics: Map<string, number>;
  changeEvents: number;
  cacheHitRate?: number;
  avgLoadDuration?: number;
}

interface ProviderMetrics {
  loadCount: number;
  successCount: number;
  failureCount: number;
  durations: number[];
  avgDuration?: number;
}
```

### 7.2 Health Check Enhancement

#### Task: Implement Comprehensive Health Checks
```typescript
// Enhanced health checking for configuration system
export class ConfigurationHealthChecker {
  constructor(
    private configManager: ConfigurationManager,
    private metricsCollector: ConfigurationMetricsCollector
  ) {}

  async checkHealth(): Promise<HealthCheckResult> {
    const checks: HealthCheck[] = [];

    // Check configuration loading health
    checks.push(await this.checkConfigurationLoading());

    // Check provider health
    checks.push(await this.checkProviders());

    // Check cache health
    checks.push(this.checkCacheHealth());

    // Check security health
    checks.push(await this.checkSecurity());

    // Check performance health
    checks.push(this.checkPerformance());

    const overallStatus = this.calculateOverallStatus(checks);

    return {
      status: overallStatus,
      timestamp: Date.now(),
      checks,
      metrics: this.metricsCollector.getMetrics()
    };
  }

  private async checkConfigurationLoading(): Promise<HealthCheck> {
    try {
      const startTime = Date.now();
      await this.configManager.reload();
      const duration = Date.now() - startTime;

      return {
        name: 'configuration-loading',
        status: duration < 1000 ? 'healthy' : 'degraded',
        message: `Configuration loaded in ${duration}ms`,
        details: { duration }
      };
    } catch (error) {
      return {
        name: 'configuration-loading',
        status: 'unhealthy',
        message: `Configuration loading failed: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  private async checkProviders(): Promise<HealthCheck> {
    // This would require access to the providers array
    // Implementation depends on how providers are exposed
    return {
      name: 'configuration-providers',
      status: 'unknown',
      message: 'Provider health check not implemented',
      details: {}
    };
  }

  private checkCacheHealth(): HealthCheck {
    const metrics = this.metricsCollector.getMetrics();
    const cacheHitRate = metrics.cacheHitRate || 0;

    let status: HealthStatus = 'healthy';
    let message = `Cache hit rate: ${(cacheHitRate * 100).toFixed(2)}%`;

    if (cacheHitRate < 0.5) {
      status = 'degraded';
      message += ' (low cache efficiency)';
    }

    return {
      name: 'configuration-cache',
      status,
      message,
      details: { cacheHitRate }
    };
  }

  private async checkSecurity(): Promise<HealthCheck> {
    // Check if encryption and authentication services are available
    // This would require access to those services
    return {
      name: 'configuration-security',
      status: 'unknown',
      message: 'Security health check not implemented',
      details: {}
    };
  }

  private checkPerformance(): HealthCheck {
    const metrics = this.metricsCollector.getMetrics();

    // Check average load duration
    const avgLoadDuration = metrics.avgLoadDuration || 0;
    let loadStatus: HealthStatus = 'healthy';

    if (avgLoadDuration > 2000) {
      loadStatus = 'degraded';
    } else if (avgLoadDuration > 5000) {
      loadStatus = 'unhealthy';
    }

    // Check error rate
    const totalLoads = metrics.loadCount || 1;
    const errorRate = (metrics.loadFailureCount || 0) / totalLoads;
    let errorStatus: HealthStatus = 'healthy';

    if (errorRate > 0.1) {
      errorStatus = 'degraded';
    } else if (errorRate > 0.5) {
      errorStatus = 'unhealthy';
    }

    return {
      name: 'configuration-performance',
      status: loadStatus === 'unhealthy' || errorStatus === 'unhealthy'
        ? 'unhealthy'
        : loadStatus === 'degraded' || errorStatus === 'degraded'
          ? 'degraded'
          : 'healthy',
      message: `Avg load: ${avgLoadDuration}ms, Error rate: ${(errorRate * 100).toFixed(2)}%`,
      details: { avgLoadDuration, errorRate }
    };
  }

  private calculateOverallStatus(checks: HealthCheck[]): HealthStatus {
    if (checks.some(check => check.status === 'unhealthy')) {
      return 'unhealthy';
    }

    if (checks.some(check => check.status === 'degraded')) {
      return 'degraded';
    }

    return 'healthy';
  }
}

interface HealthCheckResult {
  status: HealthStatus;
  timestamp: number;
  checks: HealthCheck[];
  metrics?: any;
}

interface HealthCheck {
  name: string;
  status: HealthStatus;
  message: string;
  details: Record<string, any>;
}

type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
```