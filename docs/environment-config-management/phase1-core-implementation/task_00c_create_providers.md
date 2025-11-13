# Task 00c: Create Configuration Providers

## Overview

This task involves defining the interfaces and base classes for configuration providers in the Environment Configuration Management system. Configuration providers are responsible for loading configuration data from specific sources such as files, environment variables, secure storage, and remote services.

## Objectives

1. Define the ConfigurationProvider interface with all required methods
2. Create base implementations for all configuration source types
3. Establish provider-specific configuration patterns
4. Ensure providers follow TypeScript best practices
5. Provide extensibility for custom configuration providers

## Detailed Implementation

### ConfigurationProvider Interface

The ConfigurationProvider interface defines the contract for configuration sources.

```typescript
// src/config/ConfigurationProvider.ts

/**
 * Interface for configuration providers that load configuration from specific sources
 */
interface ConfigurationProvider {
  /**
   * Get provider name
   * @returns Provider name
   */
  getName(): string;

  /**
   * Load configuration from source
   * @returns Configuration object
   */
  load(): Promise<any>;

  /**
   * Save configuration to source
   * @param config - Configuration to save
   */
  save(config: any): Promise<void>;

  /**
   * Check if provider is available
   * @returns Whether provider is available
   */
  isAvailable(): Promise<boolean>;
}
```

### File Configuration Provider

```typescript
// src/config/providers/FileConfigurationProvider.ts

/**
 * Configuration provider for file-based configuration sources
 */
class FileConfigurationProvider implements ConfigurationProvider {
  private readonly name: string;
  private readonly filePath: string;
  private readonly format: 'json' | 'yaml';
  private readonly options: any;

  constructor(name: string, filePath: string, format: 'json' | 'yaml' = 'json', options: any = {}) {
    this.name = name;
    this.filePath = filePath;
    this.format = format;
    this.options = options;
  }

  /**
   * Get provider name
   * @returns Provider name
   */
  getName(): string {
    return this.name;
  }

  /**
   * Load configuration from file
   * @returns Configuration object
   */
  async load(): Promise<any> {
    try {
      // Check if file exists
      if (!await fs.promises.access(this.filePath).then(() => true).catch(() => false)) {
        return {};
      }

      // Read file content
      const content = await fs.promises.readFile(this.filePath, 'utf8');

      // Parse based on format
      if (this.format === 'json') {
        return JSON.parse(content);
      } else if (this.format === 'yaml') {
        return yaml.parse(content);
      }

      throw new Error(`Unsupported file format: ${this.format}`);
    } catch (error) {
      throw new ConfigurationError(`Failed to load configuration from ${this.filePath}: ${error.message}`);
    }
  }

  /**
   * Save configuration to file
   * @param config - Configuration to save
   */
  async save(config: any): Promise<void> {
    try {
      // Ensure directory exists
      const dir = path.dirname(this.filePath);
      await fs.promises.mkdir(dir, { recursive: true });

      // Serialize based on format
      let content: string;
      if (this.format === 'json') {
        content = JSON.stringify(config, null, 2);
      } else if (this.format === 'yaml') {
        content = yaml.stringify(config);
      } else {
        throw new Error(`Unsupported file format: ${this.format}`);
      }

      // Write to file
      await fs.promises.writeFile(this.filePath, content, 'utf8');
    } catch (error) {
      throw new ConfigurationError(`Failed to save configuration to ${this.filePath}: ${error.message}`);
    }
  }

  /**
   * Check if provider is available
   * @returns Whether provider is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      // Check if file exists and is readable
      await fs.promises.access(this.filePath, fs.constants.R_OK);
      return true;
    } catch {
      // File doesn't exist or isn't readable
      return false;
    }
  }
}
```

### Environment Configuration Provider

```typescript
// src/config/providers/EnvironmentConfigurationProvider.ts

/**
 * Configuration provider for environment variable configuration sources
 */
class EnvironmentConfigurationProvider implements ConfigurationProvider {
  private readonly name: string;
  private readonly prefix: string;
  private readonly options: any;

  constructor(name: string, prefix: string = '', options: any = {}) {
    this.name = name;
    this.prefix = prefix;
    this.options = options;
  }

  /**
   * Get provider name
   * @returns Provider name
   */
  getName(): string {
    return this.name;
  }

  /**
   * Load configuration from environment variables
   * @returns Configuration object
   */
  async load(): Promise<any> {
    const config: any = {};

    // Process all environment variables
    for (const [key, value] of Object.entries(process.env)) {
      // Filter by prefix if specified
      if (this.prefix && !key.startsWith(this.prefix)) {
        continue;
      }

      // Remove prefix from key
      const configKey = this.prefix ? key.substring(this.prefix.length) : key;

      // Convert key to camelCase and process nested structure
      const processedKey = this.convertToCamelCase(configKey);
      this.setNestedValue(config, processedKey, value);
    }

    return config;
  }

  /**
   * Save configuration to environment variables
   * @param config - Configuration to save
   */
  async save(config: any): Promise<void> {
    // Environment variables are typically read-only in most environments
    // This method can be used to set process.env in testing environments
    this.setEnvironmentVariables(config, this.prefix);
  }

  /**
   * Check if provider is available
   * @returns Whether provider is available
   */
  async isAvailable(): Promise<boolean> {
    // Environment variables are always available in Node.js environments
    return true;
  }

  /**
   * Convert string to camelCase
   * @param str - String to convert
   * @returns CamelCase string
   */
  private convertToCamelCase(str: string): string {
    return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
  }

  /**
   * Set nested value in object
   * @param obj - Object to modify
   * @param key - Key path (dot notation)
   * @param value - Value to set
   */
  private setNestedValue(obj: any, key: string, value: string | undefined): void {
    const keys = key.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!(k in current)) {
        current[k] = {};
      }
      current = current[k];
    }

    // Convert value to appropriate type
    current[keys[keys.length - 1]] = this.convertValue(value);
  }

  /**
   * Convert string value to appropriate type
   * @param value - String value
   * @returns Converted value
   */
  private convertValue(value: string | undefined): any {
    if (value === undefined) {
      return undefined;
    }

    // Convert to boolean
    if (value.toLowerCase() === 'true') {
      return true;
    }
    if (value.toLowerCase() === 'false') {
      return false;
    }

    // Convert to number
    if (!isNaN(Number(value)) && value.trim() !== '') {
      return Number(value);
    }

    // Return as string
    return value;
  }

  /**
   * Set environment variables from config object
   * @param config - Configuration object
   * @param prefix - Prefix for environment variables
   */
  private setEnvironmentVariables(config: any, prefix: string): void {
    const flatConfig = this.flattenObject(config);
    for (const [key, value] of Object.entries(flatConfig)) {
      const envKey = prefix + key.toUpperCase().replace(/\./g, '_');
      process.env[envKey] = String(value);
    }
  }

  /**
   * Flatten nested object to dot notation
   * @param obj - Object to flatten
   * @param prefix - Prefix for keys
   * @returns Flattened object
   */
  private flattenObject(obj: any, prefix: string = ''): any {
    const flattened: any = {};

    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        Object.assign(flattened, this.flattenObject(value, newKey));
      } else {
        flattened[newKey] = value;
      }
    }

    return flattened;
  }
}
```

### Secure Storage Configuration Provider

```typescript
// src/config/providers/SecureStorageConfigurationProvider.ts

/**
 * Configuration provider for secure storage configuration sources
 */
class SecureStorageConfigurationProvider implements ConfigurationProvider {
  private readonly name: string;
  private readonly namespace: string;
  private readonly encryptionRequired: boolean;
  private readonly options: any;
  private readonly encryptionService: PayloadEncryptionService;
  private readonly authenticationService: MessageAuthenticationService;

  constructor(
    name: string,
    namespace: string,
    encryptionRequired: boolean = true,
    options: any = {},
    encryptionService: PayloadEncryptionService,
    authenticationService: MessageAuthenticationService
  ) {
    this.name = name;
    this.namespace = namespace;
    this.encryptionRequired = encryptionRequired;
    this.options = options;
    this.encryptionService = encryptionService;
    this.authenticationService = authenticationService;
  }

  /**
   * Get provider name
   * @returns Provider name
   */
  getName(): string {
    return this.name;
  }

  /**
   * Load configuration from secure storage
   * @returns Configuration object
   */
  async load(): Promise<any> {
    try {
      // Load encrypted configuration
      const encryptedData = await this.loadFromSecureStorage(this.namespace);

      if (!encryptedData) {
        return {};
      }

      // Decrypt configuration
      const decryptedData = await this.encryptionService.decrypt(encryptedData);

      // Verify integrity
      const isValid = await this.authenticationService.verify(decryptedData, this.namespace);

      if (!isValid) {
        throw new ConfigurationError('Configuration integrity verification failed');
      }

      return JSON.parse(decryptedData);
    } catch (error) {
      throw new ConfigurationError(`Failed to load secure configuration: ${error.message}`);
    }
  }

  /**
   * Save configuration to secure storage
   * @param config - Configuration to save
   */
  async save(config: any): Promise<void> {
    try {
      // Serialize configuration
      const configString = JSON.stringify(config);

      // Create authentication tag
      const authTag = await this.authenticationService.generate(configString, this.namespace);

      // Encrypt configuration
      const encryptedData = await this.encryptionService.encrypt(configString);

      // Save to secure storage
      await this.saveToSecureStorage(this.namespace, encryptedData, authTag);
    } catch (error) {
      throw new ConfigurationError(`Failed to save secure configuration: ${error.message}`);
    }
  }

  /**
   * Check if provider is available
   * @returns Whether provider is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      // Check if secure storage is accessible
      await this.testSecureStorageAccess();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Load data from secure storage
   * @param key - Storage key
   * @returns Stored data
   */
  private async loadFromSecureStorage(key: string): Promise<string | null> {
    // Implementation depends on secure storage mechanism (e.g., encrypted file, secure key-value store)
    // This is a placeholder implementation
    const storagePath = path.join('/secure/config', `${key}.enc`);
    try {
      return await fs.promises.readFile(storagePath, 'utf8');
    } catch {
      return null;
    }
  }

  /**
   * Save data to secure storage
   * @param key - Storage key
   * @param data - Data to store
   * @param authTag - Authentication tag
   */
  private async saveToSecureStorage(key: string, data: string, authTag: string): Promise<void> {
    // Implementation depends on secure storage mechanism
    const storagePath = path.join('/secure/config', `${key}.enc`);
    const authPath = path.join('/secure/config', `${key}.auth`);

    await fs.promises.mkdir(path.dirname(storagePath), { recursive: true });
    await fs.promises.writeFile(storagePath, data, 'utf8');
    await fs.promises.writeFile(authPath, authTag, 'utf8');
  }

  /**
   * Test secure storage access
   */
  private async testSecureStorageAccess(): Promise<void> {
    // Test encryption service
    await this.encryptionService.encrypt('test');

    // Test authentication service
    await this.authenticationService.generate('test', 'test');
  }
}
```

### Remote Configuration Provider

```typescript
// src/config/providers/RemoteConfigurationProvider.ts

/**
 * Configuration provider for remote configuration sources
 */
class RemoteConfigurationProvider implements ConfigurationProvider {
  private readonly name: string;
  private readonly url: string;
  private readonly options: any;
  private readonly cache: Map<string, { data: any; timestamp: number }>;
  private readonly cacheTTL: number;

  constructor(name: string, url: string, options: any = {}) {
    this.name = name;
    this.url = url;
    this.options = {
      timeout: 5000,
      retries: 3,
      cacheTTL: 300000, // 5 minutes
      headers: {},
      ...options
    };
    this.cache = new Map();
    this.cacheTTL = this.options.cacheTTL;
  }

  /**
   * Get provider name
   * @returns Provider name
   */
  getName(): string {
    return this.name;
  }

  /**
   * Load configuration from remote source
   * @returns Configuration object
   */
  async load(): Promise<any> {
    try {
      // Check cache first
      const cached = this.cache.get(this.url);
      if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
        return cached.data;
      }

      // Load from remote source with retry logic
      const config = await this.loadWithRetry();

      // Cache the result
      this.cache.set(this.url, { data: config, timestamp: Date.now() });

      return config;
    } catch (error) {
      throw new ConfigurationError(`Failed to load remote configuration from ${this.url}: ${error.message}`);
    }
  }

  /**
   * Save configuration to remote source
   * @param config - Configuration to save
   */
  async save(config: any): Promise<void> {
    try {
      const response = await this.makeRequest('POST', config);

      if (response.status < 200 || response.status >= 300) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Clear cache after successful save
      this.cache.delete(this.url);
    } catch (error) {
      throw new ConfigurationError(`Failed to save remote configuration to ${this.url}: ${error.message}`);
    }
  }

  /**
   * Check if provider is available
   * @returns Whether provider is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await this.makeRequest('HEAD');
      return response.status >= 200 && response.status < 300;
    } catch {
      return false;
    }
  }

  /**
   * Load configuration with retry logic
   * @returns Configuration object
   */
  private async loadWithRetry(): Promise<any> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= this.options.retries; attempt++) {
      try {
        const response = await this.makeRequest('GET');

        if (response.status >= 200 && response.status < 300) {
          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            return await response.json();
          } else {
            const text = await response.text();
            return text;
          }
        } else if (response.status === 404) {
          // Configuration not found, return empty object
          return {};
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        lastError = error;
        if (attempt < this.options.retries) {
          // Wait before retry with exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    throw lastError || new Error('Unknown error during retry attempts');
  }

  /**
   * Make HTTP request to remote source
   * @param method - HTTP method
   * @param data - Data to send (for POST requests)
   * @returns Response object
   */
  private async makeRequest(method: string, data?: any): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.options.timeout);

    try {
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...this.options.headers
        },
        signal: controller.signal
      };

      if (data && method !== 'GET') {
        options.body = JSON.stringify(data);
      }

      return await fetch(this.url, options);
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
```

## Implementation Plan

### Phase 1: Interface Definition (1 hour)

1. Create ConfigurationProvider.ts with core interface
2. Define supporting type definitions
3. Review and refine interface definitions

### Phase 2: Base Implementation (2 hours)

1. Create providers directory structure
2. Implement FileConfigurationProvider base class
3. Implement EnvironmentConfigurationProvider base class
4. Implement SecureStorageConfigurationProvider base class
5. Implement RemoteConfigurationProvider base class

### Phase 3: Documentation (0.5 hours)

1. Add comprehensive JSDoc comments to all providers
2. Include usage examples in documentation
3. Document provider-specific behaviors
4. Review documentation for clarity and completeness

### Phase 4: Review and Refinement (0.5 hours)

1. Peer review of provider implementations
2. Refinement based on feedback
3. Ensure consistency across all providers
4. Final approval of provider design

## Acceptance Criteria

- [ ] ConfigurationProvider interface properly defined with clear method signatures
- [ ] All four configuration providers implemented with appropriate behavior
- [ ] Provider-specific configuration sources correctly defined
- [ ] Error handling implemented for all providers
- [ ] Comprehensive JSDoc documentation for all providers and methods
- [ ] Consistent naming conventions following TypeScript best practices
- [ ] All providers reviewed and approved by team members
- [ ] No circular dependencies between provider files
- [ ] Providers follow SOLID principles, particularly Single Responsibility

## Dependencies

- Task 00a: Create Core Interfaces (for ConfigurationProvider interface)

## Risks and Mitigations

### Risk 1: Provider Implementation Complexity
**Risk**: Different configuration sources may require complex, divergent logic
**Mitigation**: Design providers with clear separation of concerns and common base functionality

### Risk 2: Security Configuration Issues
**Risk**: Secure storage provider may have security vulnerabilities
**Mitigation**: Implement strict validation and integrate with existing security services

### Risk 3: Network Reliability
**Risk**: Remote provider may have connectivity issues
**Mitigation**: Implement robust error handling, retry logic, and caching

## Testing Approach

Each configuration provider should be thoroughly tested:

1. **Unit Testing**: Test each provider's methods in isolation
2. **Integration Testing**: Test providers with ConfigurationManager
3. **Provider-Specific Testing**: Validate provider-specific behavior
4. **Error Handling Testing**: Ensure proper error handling
5. **Performance Testing**: Measure loading performance

## Code Quality Standards

### TypeScript Best Practices
- Use strict typing with no implicit any
- Leverage TypeScript generics for flexible type safety
- Follow consistent naming conventions
- Use proper access modifiers
- Include comprehensive documentation

### Provider Design Principles
- Keep providers focused on single responsibility
- Follow the Strategy pattern for configuration source behavior
- Design for extensibility and customization
- Maintain backward compatibility
- Use descriptive method and parameter names

## Deliverables

1. **ConfigurationProvider.ts**: Configuration provider interface
2. **FileConfigurationProvider.ts**: File-based configuration provider
3. **EnvironmentConfigurationProvider.ts**: Environment variable configuration provider
4. **SecureStorageConfigurationProvider.ts**: Secure storage configuration provider
5. **RemoteConfigurationProvider.ts**: Remote configuration provider
6. **Documentation**: Comprehensive JSDoc comments
7. **Supporting Types**: All provider-specific type definitions

## Timeline

**Estimated Duration**: 4 hours
**Start Date**: [To be determined]
**End Date**: [To be determined]

## Resources Required

- TypeScript development environment
- Code editor with TypeScript support
- Access to project repository
- Peer review participants

## Success Metrics

- Providers completed within estimated time
- 100% code review approval
- No design flaws identified in peer review
- Clear and comprehensive documentation
- Ready for implementation in subsequent tasks
- Provider-specific behavior correctly implemented

This task establishes the configuration source behavior for the system by creating well-defined providers for each supported configuration source type.