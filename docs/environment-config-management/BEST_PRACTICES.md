# Environment Configuration Management System - Best Practices

## Overview

This document outlines the best practices for using, maintaining, and extending the Environment Configuration Management system. These practices ensure optimal performance, security, maintainability, and reliability while following industry standards and the project's truth verification requirements.

## Configuration Design Principles

### 1. Configuration as Code

Treat configuration like application code with the same rigor:

```typescript
// ✅ Good: Configuration with clear structure and documentation
interface ApiConfig {
  /**
   * Base URL for API endpoints
   * @example "https://api.production.example.com"
   */
  baseUrl: string;

  /**
   * Request timeout in milliseconds
   * @default 5000
   */
  timeout: number;

  /**
   * Retry configuration for failed requests
   */
  retry: {
    /**
     * Maximum number of retry attempts
     * @default 3
     */
    maxAttempts: number;

    /**
     * Delay between retries in milliseconds
     * @default 1000
     */
    delay: number;
  };
}

// ✅ Good: Environment-specific configuration extension
interface ProductionApiConfig extends ApiConfig {
  /**
   * Additional security headers for production
   */
  securityHeaders: Record<string, string>;
}
```

### 2. Environment-Specific Configuration

Design configuration with environment boundaries in mind:

```typescript
// ✅ Good: Environment-specific configuration patterns
class ConfigurationFactory {
  static create(environment: EnvironmentType): ConfigurationOptions {
    switch (environment) {
      case EnvironmentType.DEVELOPMENT:
        return {
          enableCache: true,
          cacheTTL: 30000, // 30 seconds for development
          enableHotReload: true,
          debug: true
        };

      case EnvironmentType.TESTING:
        return {
          enableCache: false, // Disable cache for test consistency
          enableHotReload: false,
          debug: true
        };

      case EnvironmentType.STAGING:
        return {
          enableCache: true,
          cacheTTL: 60000, // 1 minute for staging
          enableHotReload: false,
          debug: false
        };

      case EnvironmentType.PRODUCTION:
        return {
          enableCache: true,
          cacheTTL: 300000, // 5 minutes for production
          enableHotReload: false,
          debug: false
        };

      default:
        throw new Error(`Unsupported environment: ${environment}`);
    }
  }
}
```

### 3. Secure by Default

Implement security-first configuration practices:

```typescript
// ✅ Good: Secure configuration defaults
interface SecurityConfig {
  /**
   * Enable encryption for sensitive configuration values
   * @default true
   */
  encryptionEnabled: boolean;

  /**
   * Encryption algorithm for sensitive data
   * @default "aes-256-gcm"
   */
  encryptionAlgorithm: string;

  /**
   * Enable authentication for configuration access
   * @default true
   */
  authenticationEnabled: boolean;

  /**
   * Minimum permission level for configuration access
   * @default "authenticated"
   */
  minimumPermissionLevel: string;

  /**
   * Audit logging for configuration access
   * @default true
   */
  auditLoggingEnabled: boolean;
}

// ✅ Good: Sensitive data handling
class SecureConfigurationManager extends BasicConfigurationManager {
  private sensitiveKeys: Set<string> = new Set([
    'database.password',
    'api.secretKey',
    'auth.jwtSecret',
    'encryption.masterKey'
  ]);

  set<T>(key: string, value: T): void {
    // Automatically encrypt sensitive data
    if (this.sensitiveKeys.has(key) && this.securityConfig.encryptionEnabled) {
      const encryptedValue = this.encryptionService.encrypt(JSON.stringify(value));
      super.set(key, encryptedValue);
    } else {
      super.set(key, value);
    }
  }

  get<T>(key: string, defaultValue?: T): T {
    const value = super.get(key, defaultValue);

    // Automatically decrypt sensitive data
    if (this.sensitiveKeys.has(key) && this.securityConfig.encryptionEnabled) {
      const decryptedValue = this.encryptionService.decrypt(value as string);
      return JSON.parse(decryptedValue);
    }

    return value;
  }
}
```

## Implementation Best Practices

### 1. Interface-First Development

Always start with clear interfaces:

```typescript
// ✅ Good: Define interfaces before implementation
interface ConfigurationProvider {
  /**
   * Get provider name
   */
  getName(): string;

  /**
   * Load configuration from source
   */
  load(): Promise<any>;

  /**
   * Save configuration to source
   */
  save(config: any): Promise<void>;

  /**
   * Check if provider is available
   */
  isAvailable(): Promise<boolean>;

  /**
   * Validate provider configuration
   */
  validate(): ValidationResult;
}

// ✅ Good: Implementation follows interface contract
class FileConfigurationProvider implements ConfigurationProvider {
  constructor(
    private readonly name: string,
    private readonly filePath: string,
    private readonly format: 'json' | 'yaml' = 'json'
  ) {
    // Validate constructor parameters
    if (!name) throw new Error('Provider name is required');
    if (!filePath) throw new Error('File path is required');
  }

  getName(): string {
    return this.name;
  }

  async load(): Promise<any> {
    // Implementation with proper error handling
    try {
      await fs.access(this.filePath);
      const content = await fs.readFile(this.filePath, 'utf8');

      switch (this.format) {
        case 'json':
          return JSON.parse(content);
        case 'yaml':
          return yaml.load(content);
        default:
          throw new Error(`Unsupported format: ${this.format}`);
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        return {}; // Return empty config if file doesn't exist
      }
      throw new ConfigurationLoadError(
        `Failed to load configuration from ${this.filePath}`,
        this.name,
        { error: error.message }
      );
    }
  }

  // ... other methods
}
```

### 2. Dependency Injection

Use constructor injection for better testability:

```typescript
// ✅ Good: Clear dependency injection
class SecureStorageConfigurationProvider implements ConfigurationProvider {
  constructor(
    private readonly name: string,
    private readonly namespace: string,
    private readonly encryptionService: PayloadEncryptionService,
    private readonly authenticationService: MessageAuthenticationService,
    private readonly logger: ConfigurationLogger
  ) {
    // Validate required dependencies
    if (!encryptionService) {
      throw new Error('Encryption service is required');
    }
    if (!authenticationService) {
      throw new Error('Authentication service is required');
    }
  }

  // Implementation using injected dependencies
  async load(): Promise<any> {
    try {
      const encryptedData = await this.loadFromStorage();
      if (!encryptedData) return {};

      // Verify integrity before decryption
      const isValid = await this.authenticationService.verify(
        encryptedData.data,
        encryptedData.signature,
        encryptedData.publicKey
      );

      if (!isValid) {
        this.logger.error('Configuration integrity verification failed', {
          namespace: this.namespace
        });
        throw new ConfigurationError(
          'Configuration integrity verification failed',
          'INTEGRITY_ERROR'
        );
      }

      const decryptedData = await this.encryptionService.decrypt(encryptedData.data);
      return JSON.parse(decryptedData);
    } catch (error) {
      this.logger.error('Failed to load secure configuration', {
        namespace: this.namespace,
        error: error.message
      });
      throw error;
    }
  }
}
```

### 3. Comprehensive Error Handling

Implement robust error handling with meaningful error types:

```typescript
// ✅ Good: Specific error types for different scenarios
class ConfigurationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

class ConfigurationLoadError extends ConfigurationError {
  constructor(
    message: string,
    public readonly source: string,
    details?: any
  ) {
    super(message, 'CONFIG_LOAD_ERROR', details);
    this.name = 'ConfigurationLoadError';
  }
}

class ConfigurationValidationError extends ConfigurationError {
  constructor(
    message: string,
    public readonly errors: string[],
    details?: any
  ) {
    super(message, 'CONFIG_VALIDATION_ERROR', details);
    this.name = 'ConfigurationValidationError';
  }
}

class PermissionError extends ConfigurationError {
  constructor(message: string, details?: any) {
    super(message, 'PERMISSION_ERROR', details);
    this.name = 'PermissionError';
  }
}

// ✅ Good: Graceful error handling with fallbacks
class ResilientConfigurationManager extends BasicConfigurationManager {
  async load(): Promise<void> {
    const errors: Error[] = [];
    const configs: any[] = [];

    // Load from all providers, continue on individual failures
    for (const provider of this.providers) {
      try {
        if (await provider.isAvailable()) {
          const config = await provider.load();
          configs.push({ provider: provider.getName(), config });
          this.logger.debug('Configuration loaded from provider', {
            provider: provider.getName()
          });
        }
      } catch (error) {
        errors.push(error);
        this.logger.warn('Failed to load configuration from provider', {
          provider: provider.getName(),
          error: error.message
        });
        this.metrics.recordError('provider_load_failure', provider.getName());
      }
    }

    // Process successfully loaded configurations
    this.processConfigurations(configs);

    // Log errors but don't fail completely
    if (errors.length > 0) {
      this.logger.error('Configuration loading completed with errors', {
        errorCount: errors.length,
        providers: this.providers.map(p => p.getName())
      });

      // Update error count for status reporting
      this.errorCount += errors.length;
    }
  }
}
```

## Security Best Practices

### 1. Input Validation and Sanitization

Always validate and sanitize configuration inputs:

```typescript
// ✅ Good: Input validation for configuration keys
class ConfigurationValidator {
  static validateKey(key: string): void {
    if (!key || typeof key !== 'string') {
      throw new ConfigurationError('Invalid configuration key', 'INVALID_KEY');
    }

    // Prevent prototype pollution
    if (key.includes('__proto__') || key.includes('constructor')) {
      throw new ConfigurationError('Malicious key detected', 'MALICIOUS_KEY');
    }

    // Validate key format (alphanumeric, dots, underscores, hyphens)
    if (!/^[a-zA-Z0-9._-]+$/.test(key)) {
      throw new ConfigurationError('Invalid key format', 'INVALID_KEY_FORMAT');
    }
  }

  static sanitizeValue(value: any): any {
    // Prevent prototype pollution in objects
    if (value && typeof value === 'object') {
      if ('__proto__' in value || 'constructor' in value) {
        throw new ConfigurationError('Malicious value detected', 'MALICIOUS_VALUE');
      }

      // Recursively sanitize nested objects
      if (!Array.isArray(value)) {
        const sanitized: any = {};
        for (const [k, v] of Object.entries(value)) {
          if (k !== '__proto__' && k !== 'constructor') {
            sanitized[k] = this.sanitizeValue(v);
          }
        }
        return sanitized;
      }
    }

    return value;
  }
}

// ✅ Good: Use validation in configuration operations
class SecureConfigurationManager extends BasicConfigurationManager {
  set<T>(key: string, value: T): void {
    // Validate inputs
    ConfigurationValidator.validateKey(key);
    const sanitizedValue = ConfigurationValidator.sanitizeValue(value);

    // Check permissions
    this.checkWritePermission(key);

    // Proceed with setting value
    super.set(key, sanitizedValue);

    // Log the change
    this.auditLogger.logModification(key, undefined, sanitizedValue, this.getCurrentUser());
  }

  get<T>(key: string, defaultValue?: T): T {
    // Validate input
    ConfigurationValidator.validateKey(key);

    // Check permissions
    this.checkReadPermission(key);

    // Retrieve value
    const value = super.get(key, defaultValue);

    // Log access
    this.auditLogger.logAccess(key, this.getCurrentUser(), 'read');

    return value;
  }
}
```

### 2. Secure Configuration Storage

Implement proper encryption and access controls:

```typescript
// ✅ Good: Secure storage with encryption and authentication
class SecureStorageManager {
  private readonly encryptionService: PayloadEncryptionService;
  private readonly authenticationService: MessageAuthenticationService;
  private readonly keyRotationManager: KeyRotationManager;

  constructor(
    encryptionService: PayloadEncryptionService,
    authenticationService: MessageAuthenticationService
  ) {
    this.encryptionService = encryptionService;
    this.authenticationService = authenticationService;
    this.keyRotationManager = new KeyRotationManager(encryptionService);
  }

  async storeSecure(key: string, value: any, options?: SecureStorageOptions): Promise<void> {
    try {
      // Serialize value
      const serializedValue = JSON.stringify(value);

      // Encrypt value
      const encryptedValue = await this.encryptionService.encrypt(
        serializedValue,
        options?.encryptionKeyId
      );

      // Generate signature for integrity
      const signature = await this.authenticationService.sign(
        encryptedValue,
        options?.signingKeyId
      );

      // Store with metadata
      const storageEntry: SecureStorageEntry = {
        data: encryptedValue,
        signature,
        publicKey: this.authenticationService.getPublicKey(options?.signingKeyId),
        createdAt: new Date(),
        updatedAt: new Date(),
        version: options?.version || 1,
        ttl: options?.ttl,
        tags: options?.tags || []
      };

      await this.storageBackend.set(key, storageEntry);

      // Log storage operation
      this.auditLogger.logSecureStorage(key, 'store', this.getCurrentUser());
    } catch (error) {
      this.auditLogger.logSecureStorage(key, 'store-failed', this.getCurrentUser(), {
        error: error.message
      });
      throw new ConfigurationError(
        `Failed to store secure configuration: ${error.message}`,
        'SECURE_STORAGE_ERROR'
      );
    }
  }

  async retrieveSecure(key: string): Promise<any> {
    try {
      // Retrieve encrypted data
      const storageEntry = await this.storageBackend.get(key);

      if (!storageEntry) {
        return undefined;
      }

      // Check TTL
      if (storageEntry.ttl && storageEntry.createdAt) {
        const expiryTime = storageEntry.createdAt.getTime() + storageEntry.ttl;
        if (Date.now() > expiryTime) {
          await this.storageBackend.delete(key);
          return undefined;
        }
      }

      // Verify integrity
      const isValid = await this.authenticationService.verify(
        storageEntry.data,
        storageEntry.signature,
        storageEntry.publicKey
      );

      if (!isValid) {
        this.auditLogger.logSecureStorage(key, 'integrity-failed', this.getCurrentUser());
        throw new ConfigurationError(
          'Configuration integrity verification failed',
          'INTEGRITY_ERROR'
        );
      }

      // Decrypt value
      const decryptedValue = await this.encryptionService.decrypt(
        storageEntry.data,
        storageEntry.encryptionKeyId
      );

      // Log retrieval
      this.auditLogger.logSecureStorage(key, 'retrieve', this.getCurrentUser());

      return JSON.parse(decryptedValue);
    } catch (error) {
      this.auditLogger.logSecureStorage(key, 'retrieve-failed', this.getCurrentUser(), {
        error: error.message
      });
      throw error;
    }
  }
}
```

### 3. Access Control and Auditing

Implement comprehensive access control and auditing:

```typescript
// ✅ Good: Role-based access control
class AccessControlManager {
  private readonly permissionStore: PermissionStore;
  private readonly auditLogger: AuditLogger;

  constructor(permissionStore: PermissionStore, auditLogger: AuditLogger) {
    this.permissionStore = permissionStore;
    this.auditLogger = auditLogger;
  }

  async hasPermission(user: string, action: string, resource: string): Promise<boolean> {
    // Check explicit permissions
    const hasExplicitPermission = await this.permissionStore.hasPermission(
      user,
      action,
      resource
    );

    if (hasExplicitPermission) {
      return true;
    }

    // Check role-based permissions
    const userRoles = await this.permissionStore.getUserRoles(user);
    for (const role of userRoles) {
      const hasRolePermission = await this.permissionStore.hasRolePermission(
        role,
        action,
        resource
      );

      if (hasRolePermission) {
        return true;
      }
    }

    // Check default permissions
    return await this.permissionStore.hasDefaultPermission(action, resource);
  }

  async enforcePermission(user: string, action: string, resource: string): Promise<void> {
    const hasPermission = await this.hasPermission(user, action, resource);

    if (!hasPermission) {
      // Log unauthorized access attempt
      await this.auditLogger.logAccess(resource, user, 'denied', {
        action,
        reason: 'insufficient-permissions'
      });

      throw new PermissionError(
        `Access denied for ${action} on ${resource}`,
        { user, action, resource }
      );
    }

    // Log authorized access
    await this.auditLogger.logAccess(resource, user, 'granted', { action });
  }
}

// ✅ Good: Comprehensive audit logging
class AuditLogger {
  private readonly logStore: LogStore;
  private readonly alertManager: AlertManager;

  constructor(logStore: LogStore, alertManager: AlertManager) {
    this.logStore = logStore;
    this.alertManager = alertManager;
  }

  async logAccess(
    resource: string,
    user: string,
    result: 'granted' | 'denied',
    details?: any
  ): Promise<void> {
    const logEntry: AuditLogEntry = {
      id: this.generateLogId(),
      timestamp: new Date(),
      type: 'access',
      resource,
      user,
      result,
      details: {
        ...details,
        ipAddress: this.getClientIpAddress(),
        userAgent: this.getUserAgent()
      }
    };

    await this.logStore.append(logEntry);

    // Check for suspicious patterns
    if (result === 'denied') {
      await this.checkForSuspiciousActivity(logEntry);
    }
  }

  async logModification(
    resource: string,
    oldValue: any,
    newValue: any,
    user: string,
    details?: any
  ): Promise<void> {
    const logEntry: AuditLogEntry = {
      id: this.generateLogId(),
      timestamp: new Date(),
      type: 'modification',
      resource,
      user,
      result: 'success',
      details: {
        oldValue,
        newValue,
        ...details,
        ipAddress: this.getClientIpAddress(),
        userAgent: this.getUserAgent()
      }
    };

    await this.logStore.append(logEntry);

    // Check for sensitive modifications
    await this.checkForSensitiveChanges(logEntry);
  }

  private async checkForSuspiciousActivity(logEntry: AuditLogEntry): Promise<void> {
    // Check for repeated failed access attempts
    const recentFailures = await this.logStore.query({
      type: 'access',
      result: 'denied',
      user: logEntry.user,
      timeframe: 300000 // 5 minutes
    });

    if (recentFailures.length > 10) {
      await this.alertManager.sendAlert({
        type: 'suspicious_access',
        severity: 'high',
        user: logEntry.user,
        resource: logEntry.resource,
        failureCount: recentFailures.length,
        timeframe: '5 minutes'
      });
    }
  }

  private async checkForSensitiveChanges(logEntry: AuditLogEntry): Promise<void> {
    // Check if modification involves sensitive resources
    const sensitivePatterns = [
      'password',
      'secret',
      'key',
      'token',
      'certificate'
    ];

    const isSensitive = sensitivePatterns.some(pattern =>
      logEntry.resource.toLowerCase().includes(pattern)
    );

    if (isSensitive) {
      await this.alertManager.sendAlert({
        type: 'sensitive_configuration_change',
        severity: 'medium',
        user: logEntry.user,
        resource: logEntry.resource,
        oldValue: logEntry.details?.oldValue,
        newValue: logEntry.details?.newValue
      });
    }
  }
}
```

## Performance Best Practices

### 1. Efficient Caching Strategy

Implement intelligent caching with proper TTL management:

```typescript
// ✅ Good: Advanced caching with LRU and TTL
class AdvancedConfigurationCache {
  private readonly cache: Map<string, CacheEntry>;
  private readonly maxSize: number;
  private readonly defaultTTL: number;
  private readonly accessOrder: Set<string>; // For LRU implementation

  constructor(options: CacheOptions = {}) {
    this.cache = new Map();
    this.maxSize = options.maxSize || 1000;
    this.defaultTTL = options.defaultTTL || 300000; // 5 minutes
    this.accessOrder = new Set();
  }

  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      this.metrics.recordCacheMiss();
      return undefined;
    }

    // Check TTL
    if (entry.expiry && Date.now() > entry.expiry) {
      this.cache.delete(key);
      this.accessOrder.delete(key);
      this.metrics.recordCacheMiss();
      return undefined;
    }

    // Update access order for LRU
    this.accessOrder.delete(key);
    this.accessOrder.add(key);

    this.metrics.recordCacheHit();
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttl?: number): void {
    // Evict oldest entry if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.accessOrder.values().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
        this.accessOrder.delete(oldestKey);
        this.metrics.recordCacheEviction();
      }
    }

    const expiry = ttl !== undefined
      ? Date.now() + ttl
      : Date.now() + this.defaultTTL;

    this.cache.set(key, {
      value,
      expiry,
      createdAt: Date.now()
    });

    this.accessOrder.add(key);
    this.metrics.recordCacheSet();
  }

  invalidate(key: string): void {
    this.cache.delete(key);
    this.accessOrder.delete(key);
    this.metrics.recordCacheInvalidation();
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder.clear();
    this.metrics.recordCacheClear();
  }

  getStats(): CacheStats {
    const now = Date.now();
    let expiredCount = 0;

    // Count expired entries
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiry && now > entry.expiry) {
        expiredCount++;
      }
    }

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      expiredCount,
      hitRate: this.metrics.getHitRate(),
      evictionCount: this.metrics.getEvictionCount()
    };
  }
}

interface CacheEntry {
  value: any;
  expiry?: number;
  createdAt: number;
}

interface CacheStats {
  size: number;
  maxSize: number;
  expiredCount: number;
  hitRate: number;
  evictionCount: number;
}
```

### 2. Asynchronous Operations

Use async/await patterns for non-blocking operations:

```typescript
// ✅ Good: Non-blocking configuration loading
class AsyncConfigurationManager extends BasicConfigurationManager {
  private loadingPromise: Promise<void> | null = null;

  async load(): Promise<void> {
    // Return existing loading promise if already loading
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    // Create new loading promise
    this.loadingPromise = this.performLoad();

    try {
      await this.loadingPromise;
    } finally {
      // Clear loading promise when complete
      this.loadingPromise = null;
    }
  }

  private async performLoad(): Promise<void> {
    const startTime = Date.now();

    try {
      // Load from all providers concurrently
      const providerPromises = this.providers.map(async (provider) => {
        try {
          if (await provider.isAvailable()) {
            const config = await provider.load();
            return { provider: provider.getName(), config, success: true };
          }
          return { provider: provider.getName(), config: null, success: false };
        } catch (error) {
          this.logger.warn('Provider load failed', {
            provider: provider.getName(),
            error: error.message
          });
          return { provider: provider.getName(), config: null, success: false, error };
        }
      });

      // Wait for all providers to complete
      const results = await Promise.all(providerPromises);

      // Process successful results
      const successfulResults = results.filter(r => r.success);
      this.processConfigurations(successfulResults.map(r => r.config));

      // Log timing
      const duration = Date.now() - startTime;
      this.metrics.recordLoadDuration(duration / 1000);

      this.logger.info('Configuration loading completed', {
        duration,
        providers: results.length,
        successful: successfulResults.length,
        failed: results.length - successfulResults.length
      });

    } catch (error) {
      this.logger.error('Configuration loading failed', {
        error: error.message,
        duration: Date.now() - startTime
      });
      throw error;
    }
  }

  async reload(): Promise<void> {
    // Clear cache before reloading
    if (this.options.enableCache) {
      this.cache.clear();
      this.logger.debug('Cache cleared for reload');
    }

    // Perform reload
    await this.load();

    // Notify listeners
    this.notifyListeners({
      keys: ['*'],
      timestamp: Date.now(),
      source: 'reload'
    });

    this.logger.info('Configuration reloaded');
  }
}
```

### 3. Memory Management

Implement proper memory management to prevent leaks:

```typescript
// ✅ Good: Memory-efficient configuration management
class MemoryEfficientConfigurationManager extends BasicConfigurationManager {
  private readonly maxConfigSize: number;
  private readonly memoryMonitor: MemoryMonitor;

  constructor(
    encryptionService: PayloadEncryptionService,
    authenticationService: MessageAuthenticationService,
    options: MemoryOptions = {}
  ) {
    super(encryptionService, authenticationService);
    this.maxConfigSize = options.maxConfigSize || 10 * 1024 * 1024; // 10MB
    this.memoryMonitor = new MemoryMonitor();
  }

  set<T>(key: string, value: T): void {
    // Check memory usage before setting
    const valueSize = this.calculateSize(value);

    if (valueSize > this.maxConfigSize) {
      throw new ConfigurationError(
        `Configuration value too large: ${valueSize} bytes (max: ${this.maxConfigSize})`,
        'CONFIG_TOO_LARGE'
      );
    }

    // Check total memory usage
    const totalSize = this.calculateTotalSize();
    if (totalSize + valueSize > this.maxConfigSize * 10) {
      this.logger.warn('High memory usage detected', {
        currentSize: totalSize,
        newSize: totalSize + valueSize,
        maxSize: this.maxConfigSize * 10
      });

      // Trigger garbage collection if available
      if (global.gc) {
        global.gc();
      }
    }

    super.set(key, value);
  }

  private calculateSize(value: any): number {
    if (value === null || value === undefined) return 0;

    switch (typeof value) {
      case 'string':
        return Buffer.byteLength(value, 'utf8');
      case 'number':
      case 'boolean':
        return 8; // Approximate
      case 'object':
        if (Array.isArray(value)) {
          return value.reduce((sum, item) => sum + this.calculateSize(item), 0);
        } else {
          return Object.keys(value).reduce(
            (sum, key) => sum + Buffer.byteLength(key, 'utf8') + this.calculateSize(value[key]),
            0
          );
        }
      default:
        return 0;
    }
  }

  private calculateTotalSize(): number {
    let totalSize = 0;

    for (const [key, value] of Object.entries(this.config)) {
      totalSize += Buffer.byteLength(key, 'utf8') + this.calculateSize(value);
    }

    return totalSize;
  }

  async cleanup(): Promise<void> {
    // Clean up resources
    if (this.hotReloadTimer) {
      clearInterval(this.hotReloadTimer);
      this.hotReloadTimer = undefined;
    }

    // Clear cache
    if (this.options.enableCache) {
      this.cache.clear();
    }

    // Clear listeners
    this.listeners = [];

    // Log cleanup
    this.logger.info('Configuration manager cleaned up');
  }
}
```

## Testing Best Practices

### 1. Comprehensive Test Coverage

Implement thorough testing with multiple test types:

```typescript
// ✅ Good: Unit test with comprehensive coverage
describe('FileConfigurationProvider', () => {
  let provider: FileConfigurationProvider;
  let testFilePath: string;

  beforeEach(() => {
    testFilePath = path.join(os.tmpdir(), `test-config-${Date.now()}.json`);
    provider = new FileConfigurationProvider('test', testFilePath);
  });

  afterEach(async () => {
    // Clean up test files
    try {
      await fs.unlink(testFilePath);
    } catch (error) {
      // File may not exist, ignore
    }
  });

  describe('constructor', () => {
    it('should throw error for missing name', () => {
      expect(() => {
        new FileConfigurationProvider('', testFilePath);
      }).toThrow('Provider name is required');
    });

    it('should throw error for missing file path', () => {
      expect(() => {
        new FileConfigurationProvider('test', '');
      }).toThrow('File path is required');
    });

    it('should create provider with valid parameters', () => {
      const validProvider = new FileConfigurationProvider('test', testFilePath);
      expect(validProvider.getName()).toBe('test');
    });
  });

  describe('load', () => {
    it('should load configuration from existing JSON file', async () => {
      const testConfig = { test: 'value', number: 42 };
      await fs.writeFile(testFilePath, JSON.stringify(testConfig));

      const result = await provider.load();
      expect(result).toEqual(testConfig);
    });

    it('should return empty object for non-existent file', async () => {
      const result = await provider.load();
      expect(result).toEqual({});
    });

    it('should handle file read errors gracefully', async () => {
      // Create directory instead of file to cause read error
      await fs.mkdir(testFilePath, { recursive: true });

      await expect(provider.load()).rejects.toThrow('Failed to load configuration');
    });

    it('should load configuration from YAML file', async () => {
      const yamlProvider = new FileConfigurationProvider(
        'yaml-test',
        testFilePath.replace('.json', '.yaml'),
        'yaml'
      );

      const testConfig = { nested: { key: 'value' } };
      jest.spyOn(yaml, 'load').mockReturnValue(testConfig);
      await fs.writeFile(testFilePath.replace('.json', '.yaml'), 'test: data');

      const result = await yamlProvider.load();
      expect(result).toEqual(testConfig);
    });
  });

  describe('save', () => {
    it('should save configuration to JSON file', async () => {
      const testConfig = { saved: 'data', number: 123 };
      await provider.save(testConfig);

      const fileContent = await fs.readFile(testFilePath, 'utf8');
      const savedConfig = JSON.parse(fileContent);

      expect(savedConfig).toEqual(testConfig);
    });

    it('should create directory if it does not exist', async () => {
      const nestedPath = path.join(os.tmpdir(), 'nested', `config-${Date.now()}.json`);
      const nestedProvider = new FileConfigurationProvider('nested', nestedPath);

      const testConfig = { nested: 'config' };
      await nestedProvider.save(testConfig);

      const exists = await fs.access(path.dirname(nestedPath)).then(() => true).catch(() => false);
      expect(exists).toBe(true);

      // Clean up
      await fs.unlink(nestedPath);
      await fs.rmdir(path.dirname(nestedPath));
    });
  });

  describe('isAvailable', () => {
    it('should return true for existing file', async () => {
      await fs.writeFile(testFilePath, '{}');
      const result = await provider.isAvailable();
      expect(result).toBe(true);
    });

    it('should return false for non-existent file', async () => {
      const result = await provider.isAvailable();
      expect(result).toBe(false);
    });
  });
});

// ✅ Good: Integration test for multiple providers
describe('ConfigurationManager - Multi-Provider Integration', () => {
  let configManager: BasicConfigurationManager;

  beforeEach(() => {
    configManager = new BasicConfigurationManager(
      mockEncryptionService,
      mockAuthenticationService
    );
  });

  it('should merge configurations from multiple providers with correct precedence', async () => {
    // Setup mock providers with different configurations
    const fileProvider = new FileConfigurationProvider('file', '/tmp/test.json');
    const envProvider = new EnvironmentConfigurationProvider('env', 'TEST_');

    // Mock file configuration
    jest.spyOn(fileProvider as any, 'load').mockResolvedValue({
      api: {
        baseUrl: 'http://file-config.com',
        timeout: 5000
      },
      feature: {
        enabled: false
      }
    });

    // Mock environment configuration
    process.env.TEST_API_BASE_URL = 'http://env-config.com';
    process.env.TEST_FEATURE_ENABLED = 'true';

    // Initialize with both providers
    await configManager.initialize({
      sources: [
        {
          name: 'file-config',
          type: ConfigurationSourceType.FILE,
          options: { path: '/tmp/test.json' }
        },
        {
          name: 'env-config',
          type: ConfigurationSourceType.ENVIRONMENT,
          options: { prefix: 'TEST_' }
        }
      ]
    });

    await configManager.load();

    // Environment variables should override file configuration
    expect(configManager.get('api.baseUrl')).toBe('http://env-config.com');
    expect(configManager.get('api.timeout')).toBe(5000); // From file
    expect(configManager.get('feature.enabled')).toBe(true); // From env
  });
});

// ✅ Good: Security test for access control
describe('SecureConfigurationManager - Access Control', () => {
  let secureConfigManager: SecureConfigurationManager;

  beforeEach(() => {
    secureConfigManager = new SecureConfigurationManager(
      mockEncryptionService,
      mockAuthenticationService
    );
  });

  it('should enforce read permissions', async () => {
    const mockAuthService = createMock<AuthenticationService>();
    (secureConfigManager as any).authService = mockAuthService;

    // User without read permission
    mockAuthService.hasPermission.mockResolvedValue(false);

    await secureConfigManager.initialize({});
    secureConfigManager.set('sensitive.data', 'secret-value');

    await expect(
      secureConfigManager.get('sensitive.data', undefined, 'unauthorized-user')
    ).rejects.toThrow('Access denied for read on sensitive.data');
  });
});
```

### 2. Performance Testing

Implement performance tests to ensure system efficiency:

```typescript
// ✅ Good: Performance test for configuration loading
describe('ConfigurationManager - Performance', () => {
  let configManager: BasicConfigurationManager;

  beforeEach(() => {
    configManager = new BasicConfigurationManager(
      mockEncryptionService,
      mockAuthenticationService
    );
  });

  it('should load configuration within acceptable time limits', async () => {
    // Mock providers with realistic delays
    const mockProvider = createMock<ConfigurationProvider>();
    mockProvider.getName.mockReturnValue('perf-test-provider');
    mockProvider.isAvailable.mockResolvedValue(true);
    mockProvider.load.mockImplementation(async () => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 10));
      return { perf: 'test-data' };
    });

    jest.spyOn(configManager as any, 'createProviders').mockResolvedValue([
      mockProvider
    ]);

    const startTime = performance.now();
    await configManager.initialize({});
    await configManager.load();
    const endTime = performance.now();

    const loadTime = endTime - startTime;
    expect(loadTime).toBeLessThan(100); // Should load within 100ms

    // Verify configuration was loaded
    expect(configManager.get('perf')).toBe('test-data');
  });

  it('should retrieve cached values quickly', async () => {
    await configManager.initialize({ enableCache: true });
    configManager.set('cached.key', 'cached-value');

    // Warm up cache
    configManager.get('cached.key');

    // Measure cache retrieval performance
    const times: number[] = [];
    for (let i = 0; i < 100; i++) {
      const startTime = performance.now();
      configManager.get('cached.key');
      const endTime = performance.now();
      times.push(endTime - startTime);
    }

    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    expect(avgTime).toBeLessThan(1); // Should retrieve within 1ms
  });
});
```

## Monitoring and Observability Best Practices

### 1. Comprehensive Metrics Collection

Implement detailed metrics for system monitoring:

```typescript
// ✅ Good: Comprehensive metrics collection
class ConfigurationMetrics {
  private readonly registry: Registry;
  private readonly configLoadDuration: Histogram;
  private readonly configRequests: Counter;
  private readonly cacheHits: Counter;
  private readonly cacheMisses: Counter;
  private readonly errors: Counter;
  private readonly providerLatency: Histogram;

  constructor() {
    this.registry = new Registry();
    collectDefaultMetrics({ register: this.registry });

    this.configLoadDuration = new Histogram({
      name: 'config_load_duration_seconds',
      help: 'Duration of configuration loading operations',
      registers: [this.registry],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 5]
    });

    this.configRequests = new Counter({
      name: 'config_requests_total',
      help: 'Total number of configuration requests',
      registers: [this.registry],
      labelNames: ['environment', 'source', 'operation']
    });

    this.cacheHits = new Counter({
      name: 'config_cache_hits_total',
      help: 'Total number of cache hits',
      registers: [this.registry]
    });

    this.cacheMisses = new Counter({
      name: 'config_cache_misses_total',
      help: 'Total number of cache misses',
      registers: [this.registry]
    });

    this.errors = new Counter({
      name: 'config_errors_total',
      help: 'Total number of configuration errors',
      registers: [this.registry],
      labelNames: ['type', 'environment', 'provider']
    });

    this.providerLatency = new Histogram({
      name: 'config_provider_latency_seconds',
      help: 'Latency of configuration provider operations',
      registers: [this.registry],
      labelNames: ['provider', 'operation']
    });
  }

  recordLoadDuration(duration: number): void {
    this.configLoadDuration.observe(duration);
  }

  recordRequest(environment: string, source: string, operation: string): void {
    this.configRequests.inc({ environment, source, operation });
  }

  recordCacheHit(): void {
    this.cacheHits.inc();
  }

  recordCacheMiss(): void {
    this.cacheMisses.inc();
  }

  recordError(type: string, environment: string, provider?: string): void {
    const labels: any = { type, environment };
    if (provider) {
      labels.provider = provider;
    }
    this.errors.inc(labels);
  }

  recordProviderLatency(provider: string, operation: string, latency: number): void {
    this.providerLatency.observe({ provider, operation }, latency);
  }

  async getMetrics(): Promise<string> {
    return await this.registry.metrics();
  }

  getStats(): MetricStats {
    return {
      cacheHitRate: this.calculateCacheHitRate(),
      errorRate: this.calculateErrorRate(),
      averageLoadDuration: this.calculateAverageLoadDuration()
    };
  }

  private calculateCacheHitRate(): number {
    const hits = this.cacheHits.hashMap['']?.value || 0;
    const misses = this.cacheMisses.hashMap['']?.value || 0;
    const total = hits + misses;

    return total > 0 ? hits / total : 0;
  }

  private calculateErrorRate(): number {
    // This would need to track total requests to calculate error rate
    // Implementation depends on your specific metrics setup
    return 0;
  }

  private calculateAverageLoadDuration(): number {
    // This would require tracking individual load times
    // Implementation depends on your specific metrics setup
    return 0;
  }
}
```

### 2. Structured Logging

Implement structured logging for better observability:

```typescript
// ✅ Good: Structured logging with correlation IDs
class StructuredLogger {
  private readonly logger: winston.Logger;
  private correlationId: string;

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.json()
      ),
      defaultMeta: { service: 'config-management' },
      transports: [
        new transports.Console({
          format: format.combine(
            format.colorize(),
            format.simple()
          )
        }),
        new transports.File({
          filename: 'logs/config-management.log',
          maxsize: 10000000, // 10MB
          maxFiles: 5
        })
      ]
    });
  }

  setCorrelationId(id: string): void {
    this.correlationId = id;
  }

  log(level: string, message: string, meta?: LogMeta): void {
    const logMeta = {
      ...meta,
      correlationId: this.correlationId,
      timestamp: new Date().toISOString()
    };

    this.logger.log(level, message, logMeta);
  }

  error(message: string, error?: Error, meta?: LogMeta): void {
    const logMeta = {
      ...meta,
      correlationId: this.correlationId,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
    };

    this.logger.error(message, logMeta);
  }

  warn(message: string, meta?: LogMeta): void {
    this.logger.warn(message, {
      ...meta,
      correlationId: this.correlationId
    });
  }

  info(message: string, meta?: LogMeta): void {
    this.logger.info(message, {
      ...meta,
      correlationId: this.correlationId
    });
  }

  debug(message: string, meta?: LogMeta): void {
    this.logger.debug(message, {
      ...meta,
      correlationId: this.correlationId
    });
  }
}

interface LogMeta {
  [key: string]: any;
}
```

## Maintenance Best Practices

### 1. Regular Health Checks

Implement automated health checking:

```typescript
// ✅ Good: Automated health checking
class HealthChecker {
  constructor(
    private configManager: ConfigurationManager,
    private metrics: ConfigurationMetrics,
    private logger: StructuredLogger
  ) {}

  async performHealthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const checks: HealthCheck[] = [];

    try {
      // Configuration manager health
      checks.push(await this.checkConfigurationManager());

      // Provider health
      checks.push(await this.checkProviders());

      // Cache health
      checks.push(await this.checkCache());

      // Security services health
      checks.push(await this.checkSecurityServices());

      // Metrics health
      checks.push(await this.checkMetrics());

      const overallStatus = this.calculateOverallStatus(checks);
      const duration = Date.now() - startTime;

      return {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        checks,
        duration,
        truthScore: await this.calculateTruthScore()
      };

    } catch (error) {
      this.logger.error('Health check failed', error);

      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        checks: [{
          name: 'health-check',
          status: 'error',
          message: `Health check failed: ${error.message}`,
          details: {
            error: error.message,
            stack: error.stack
          }
        }],
        duration: Date.now() - startTime,
        truthScore: 0
      };
    }
  }

  private async checkConfigurationManager(): Promise<HealthCheck> {
    try {
      const status = this.configManager.getStatus();

      // Check for recent errors
      const hasRecentErrors = status.errorCount > 0;

      // Check if configuration is loaded
      const isLoaded = status.loaded;

      // Check cache health
      const cacheHealthy = status.cache.enabled &&
        (status.cache.hits + status.cache.misses) > 0;

      const isHealthy = isLoaded && !hasRecentErrors && cacheHealthy;

      return {
        name: 'configuration-manager',
        status: isHealthy ? 'healthy' : (isLoaded ? 'degraded' : 'unhealthy'),
        message: isHealthy
          ? 'Configuration manager is operational'
          : 'Configuration manager has issues',
        details: {
          loaded: status.loaded,
          lastLoad: status.lastLoad,
          errorCount: status.errorCount,
          cacheEnabled: status.cache.enabled,
          cacheSize: status.cache.size,
          cacheHits: status.cache.hits,
          cacheMisses: status.cache.misses
        }
      };
    } catch (error) {
      return {
        name: 'configuration-manager',
        status: 'unhealthy',
        message: `Configuration manager check failed: ${error.message}`,
        details: {
          error: error.message,
          stack: error.stack
        }
      };
    }
  }

  private calculateOverallStatus(checks: HealthCheck[]): 'healthy' | 'degraded' | 'unhealthy' {
    const hasUnhealthy = checks.some(check => check.status === 'unhealthy');
    const hasDegraded = checks.some(check => check.status === 'degraded');

    if (hasUnhealthy) return 'unhealthy';
    if (hasDegraded) return 'degraded';
    return 'healthy';
  }

  private async calculateTruthScore(): Promise<number> {
    // Calculate truth score based on health checks, metrics, and validation results
    const healthCheck = await this.performHealthCheck();

    // Base score on health status
    let score = 1.0;

    if (healthCheck.status === 'unhealthy') {
      score -= 0.3;
    } else if (healthCheck.status === 'degraded') {
      score -= 0.1;
    }

    // Factor in metrics
    const stats = this.metrics.getStats();
    if (stats.cacheHitRate < 0.8) {
      score -= 0.05; // Low cache hit rate penalty
    }

    if (stats.errorRate > 0.01) {
      score -= 0.1; // High error rate penalty
    }

    // Ensure score doesn't go below 0
    return Math.max(0, Math.min(1, score));
  }
}
```

### 2. Automated Maintenance

Implement automated maintenance procedures:

```bash
#!/bin/bash
# maintenance.sh - Automated maintenance script

# Configuration
LOG_FILE="/var/log/config-management/maintenance.log"
BACKUP_DIR="/backup/config-$(date +%Y%m%d)"
HEALTH_CHECK_URL="http://localhost:3001/health"

# Function to log messages
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Function to check system health
check_health() {
    if curl -f -s "$HEALTH_CHECK_URL" > /dev/null; then
        log "Health check: PASSED"
        return 0
    else
        log "Health check: FAILED"
        return 1
    fi
}

# Function to rotate logs
rotate_logs() {
    log "Rotating logs..."
    logrotate /etc/logrotate.d/config-management
    log "Log rotation completed"
}

# Function to backup configuration
backup_config() {
    log "Creating configuration backup..."

    mkdir -p "$BACKUP_DIR"

    # Backup configuration files
    cp -r /etc/bolt-diy/config "$BACKUP_DIR/" 2>/dev/null || true
    cp -r /app/config "$BACKUP_DIR/app-config" 2>/dev/null || true

    # Backup secure storage if it exists
    if [ -f "/var/lib/config/secure-storage.db" ]; then
        cp /var/lib/config/secure-storage.db "$BACKUP_DIR/"
        chown root:root "$BACKUP_DIR/secure-storage.db"
        chmod 600 "$BACKUP_DIR/secure-storage.db"
    fi

    # Create backup archive
    tar -czf "$BACKUP_DIR.tar.gz" -C /backup "$(basename $BACKUP_DIR)" 2>/dev/null || true

    # Clean up old backups (keep last 30 days)
    find /backup -name "config-*.tar.gz" -mtime +30 -delete 2>/dev/null || true

    log "Configuration backup completed"
}

# Function to check disk space
check_disk_space() {
    log "Checking disk space..."

    DISK_USAGE=$(df /var/lib/config | awk 'NR==2 {print $5}' | sed 's/%//')

    if [ "$DISK_USAGE" -gt 90 ]; then
        log "WARNING: Disk usage is ${DISK_USAGE}%"
        # Clean up old cache entries
        find /var/cache/config -mtime +7 -delete 2>/dev/null || true
    elif [ "$DISK_USAGE" -gt 80 ]; then
        log "INFO: Disk usage is ${DISK_USAGE}%"
    else
        log "INFO: Disk usage is ${DISK_USAGE}% - OK"
    fi
}

# Function to update dependencies
update_dependencies() {
    log "Checking for dependency updates..."

    # Check for security vulnerabilities
    npm audit --audit-level high 2>/dev/null || true

    # Update production dependencies only
    # npm update --only=production 2>/dev/null || true

    log "Dependency check completed"
}

# Function to restart service if needed
restart_if_needed() {
    if [ -f "/var/run/config-management-restart" ]; then
        log "Restarting configuration management service..."
        systemctl restart config-management
        rm /var/run/config-management-restart
        log "Service restarted"
    fi
}

# Main execution
main() {
    log "=== Configuration Management Maintenance Started ==="

    # Check health before maintenance
    if ! check_health; then
        log "ERROR: System is unhealthy, skipping maintenance"
        exit 1
    fi

    # Perform maintenance tasks
    rotate_logs
    backup_config
    check_disk_space
    update_dependencies
    restart_if_needed

    # Check health after maintenance
    if check_health; then
        log "=== Configuration Management Maintenance Completed Successfully ==="
        exit 0
    else
        log "=== Configuration Management Maintenance Completed with Issues ==="
        exit 1
    fi
}

# Run main function
main
```

These best practices ensure that the Environment Configuration Management system is robust, secure, performant, and maintainable while following industry standards and the project's specific requirements.