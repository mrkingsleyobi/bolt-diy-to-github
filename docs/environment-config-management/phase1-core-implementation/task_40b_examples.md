# Task 40b: Create Comprehensive Examples for Environment Configuration Management System

## Overview
This task focuses on creating comprehensive examples that demonstrate the usage of the Environment Configuration Management system in various scenarios. These examples will serve as practical guides for developers to understand how to implement and use the system effectively.

## Task Details
- **Task ID**: task_40b_examples
- **Title**: Create Comprehensive Examples for Environment Configuration Management System
- **Phase**: 1 - Core Implementation
- **Priority**: High
- **Status**: Pending

## Objective
Create comprehensive examples that demonstrate:
1. Basic usage patterns for the configuration management system
2. Environment-specific configuration scenarios
3. Integration with different configuration providers
4. Advanced features like secure storage and remote configuration
5. Error handling and troubleshooting scenarios
6. Best practices for configuration management

## Implementation Plan

### 1. Basic Usage Examples
- Simple configuration manager initialization
- Basic configuration retrieval
- Configuration setting and updating
- Working with nested configuration values

### 2. Environment-Specific Examples
- Development environment setup
- Testing environment configuration
- Staging environment preparation
- Production environment deployment

### 3. Provider Integration Examples
- File-based configuration examples
- Environment variable integration
- Secure storage usage
- Remote configuration service integration

### 4. Advanced Feature Examples
- Configuration change notifications
- Custom validation rules
- Configuration caching strategies
- Performance optimization techniques

### 5. Error Handling Examples
- Handling missing configuration files
- Managing provider failures
- Graceful degradation strategies
- Recovery procedures

### 6. Best Practice Examples
- Configuration organization patterns
- Security implementation examples
- Testing configuration scenarios
- Deployment automation examples

## Example Categories

### 1. Basic Usage Examples

#### Example 1: Simple Configuration Manager
```typescript
// examples/basic-usage/simple-config.ts
import { ConfigurationManager } from '../../src/config/ConfigurationManager';
import { FileConfigurationProvider } from '../../src/config/providers/FileConfigurationProvider';

/**
 * Basic example showing how to initialize and use the configuration manager
 * with a simple JSON configuration file.
 */

async function basicConfigurationExample() {
  // Initialize configuration manager
  const config = new ConfigurationManager();

  // Create file provider and load configuration
  const fileProvider = new FileConfigurationProvider('./config/app.json');
  await config.load(fileProvider);

  // Retrieve configuration values
  const appName = config.get('app.name', 'DefaultApp');
  const version = config.get('app.version', '1.0.0');
  const databaseHost = config.get('database.host', 'localhost');
  const databasePort = config.get('database.port', 5432);

  console.log(`Application: ${appName} v${version}`);
  console.log(`Database: ${databaseHost}:${databasePort}`);

  // Set configuration values (runtime overrides)
  config.set('app.environment', 'development');
  const environment = config.get('app.environment');
  console.log(`Environment: ${environment}`);
}

// Sample configuration file (config/app.json)
/*
{
  "app": {
    "name": "MyApplication",
    "version": "2.1.0",
    "debug": true
  },
  "database": {
    "host": "localhost",
    "port": 5432,
    "name": "myapp_dev",
    "username": "dev_user"
  },
  "api": {
    "timeout": 5000,
    "retries": 3,
    "endpoints": {
      "users": "/api/v1/users",
      "orders": "/api/v1/orders"
    }
  }
}
*/

export { basicConfigurationExample };
```

#### Example 2: Nested Configuration Access
```typescript
// examples/basic-usage/nested-config.ts
import { ConfigurationManager } from '../../src/config/ConfigurationManager';
import { FileConfigurationProvider } from '../../src/config/providers/FileConfigurationProvider';

/**
 * Example showing how to work with nested configuration structures
 * and complex data types.
 */

async function nestedConfigurationExample() {
  const config = new ConfigurationManager();
  const fileProvider = new FileConfigurationProvider('./config/complex.json');
  await config.load(fileProvider);

  // Access nested objects
  const apiConfig = config.get('api');
  console.log('API Configuration:', apiConfig);

  // Access deeply nested values
  const userEndpoint = config.get('api.endpoints.users');
  const authEndpoint = config.get('api.endpoints.auth');

  // Work with arrays
  const features = config.get('features.enabled', []);
  console.log('Enabled Features:', features);

  // Work with boolean values
  const debugMode = config.get('debug', false);
  const loggingEnabled = config.get('logging.enabled', true);

  if (debugMode) {
    console.log('Debug mode is enabled');
  }

  // Work with numeric values
  const timeout = config.get('api.timeout', 5000);
  const maxRetries = config.get('api.retries', 3);

  console.log(`API Timeout: ${timeout}ms, Retries: ${maxRetries}`);
}

// Sample configuration file (config/complex.json)
/*
{
  "app": {
    "name": "ComplexApp",
    "version": "1.5.0"
  },
  "database": {
    "connections": [
      {
        "name": "primary",
        "host": "primary.db.example.com",
        "port": 5432,
        "pool": {
          "min": 5,
          "max": 20,
          "idleTimeout": 30000
        }
      },
      {
        "name": "replica",
        "host": "replica.db.example.com",
        "port": 5432
      }
    ]
  },
  "api": {
    "timeout": 10000,
    "retries": 5,
    "endpoints": {
      "users": "/api/v2/users",
      "orders": "/api/v2/orders",
      "auth": "/api/v2/auth",
      "payments": "/api/v2/payments"
    },
    "rateLimiting": {
      "enabled": true,
      "requestsPerSecond": 100,
      "burstLimit": 200
    }
  },
  "features": {
    "enabled": ["authentication", "authorization", "logging", "monitoring"],
    "disabled": ["experimental", "beta"]
  },
  "logging": {
    "enabled": true,
    "level": "info",
    "transports": ["console", "file"],
    "file": {
      "path": "/var/log/app.log",
      "maxSize": "100m",
      "maxFiles": 10
    }
  },
  "debug": false
}
*/

export { nestedConfigurationExample };
```

### 2. Environment-Specific Examples

#### Example 3: Development Environment Setup
```typescript
// examples/environments/development-setup.ts
import { ConfigurationManager } from '../../src/config/ConfigurationManager';
import { DevelopmentEnvironmentAdapter } from '../../src/config/adapters/DevelopmentEnvironmentAdapter';
import { FileConfigurationProvider } from '../../src/config/providers/FileConfigurationProvider';
import { EnvironmentConfigurationProvider } from '../../src/config/providers/EnvironmentConfigurationProvider';

/**
 * Example showing how to set up configuration for a development environment
 * with permissive validation and helpful defaults.
 */

async function developmentEnvironmentExample() {
  // Initialize configuration manager with development adapter
  const config = new ConfigurationManager();
  const devAdapter = new DevelopmentEnvironmentAdapter(config);

  // Register multiple providers for development
  const fileProvider = new FileConfigurationProvider('./config/development.json');
  const envProvider = new EnvironmentConfigurationProvider('DEV_');

  await config.registerProvider('file', fileProvider);
  await config.registerProvider('env', envProvider);

  // Development-specific configuration
  config.set('debug', true);
  config.set('logging.level', 'debug');
  config.set('database.host', 'localhost'); // Development default

  // Validate development configuration
  const isValid = devAdapter.validateConfiguration(config.getAll());
  console.log(`Development configuration valid: ${isValid}`);

  // Retrieve configuration values
  const dbHost = config.get('database.host');
  const debugMode = config.get('debug');
  const logLevel = config.get('logging.level');

  console.log(`Database Host: ${dbHost}`);
  console.log(`Debug Mode: ${debugMode}`);
  console.log(`Log Level: ${logLevel}`);

  // Development-specific features
  if (config.get('features.hotReload', false)) {
    console.log('Hot reload is enabled for development');
  }

  // Development logging
  devAdapter.logConfiguration(config.getAll());
}

// Sample development configuration (config/development.json)
/*
{
  "app": {
    "name": "DevApp",
    "environment": "development"
  },
  "database": {
    "host": "localhost",
    "port": 5432,
    "name": "dev_db",
    "username": "dev_user",
    "password": "dev_password"
  },
  "api": {
    "timeout": 30000,
    "retries": 1,
    "mockResponses": true
  },
  "features": {
    "hotReload": true,
    "devTools": true,
    "debugLogging": true
  },
  "logging": {
    "level": "debug",
    "transports": ["console"]
  }
}
*/

export { developmentEnvironmentExample };
```

#### Example 4: Production Environment Deployment
```typescript
// examples/environments/production-deployment.ts
import { ConfigurationManager } from '../../src/config/ConfigurationManager';
import { ProductionEnvironmentAdapter } from '../../src/config/adapters/ProductionEnvironmentAdapter';
import { FileConfigurationProvider } from '../../src/config/providers/FileConfigurationProvider';
import { EnvironmentConfigurationProvider } from '../../src/config/providers/EnvironmentConfigurationProvider';
import { SecureStorageConfigurationProvider } from '../../src/config/providers/SecureStorageConfigurationProvider';

/**
 * Example showing how to set up configuration for a production environment
 * with strict validation and security hardening.
 */

async function productionEnvironmentExample() {
  // Initialize configuration manager with production adapter
  const config = new ConfigurationManager();
  const prodAdapter = new ProductionEnvironmentAdapter(config);

  // Register providers in order of precedence (env > secure > file)
  const fileProvider = new FileConfigurationProvider('./config/production.json');
  const envProvider = new EnvironmentConfigurationProvider('PROD_');
  const secureProvider = new SecureStorageConfigurationProvider('./secrets/production.json');

  await config.registerProvider('file', fileProvider);
  await config.registerProvider('env', envProvider);
  await config.registerProvider('secure', secureProvider);

  // Validate production configuration
  const validationErrors = prodAdapter.validateConfiguration(config.getAll());
  if (validationErrors.length > 0) {
    console.error('Production configuration validation failed:');
    validationErrors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }

  console.log('Production configuration validation passed');

  // Retrieve and validate critical configuration values
  const dbHost = config.get('database.host');
  const dbPort = config.get('database.port', 5432);
  const apiTimeout = config.get('api.timeout', 5000);

  // Production-specific checks
  if (!dbHost || dbHost === 'localhost') {
    console.error('Invalid database host for production environment');
    process.exit(1);
  }

  if (apiTimeout < 1000) {
    console.warn('API timeout seems too low for production');
  }

  // Security checks
  const debugMode = config.get('debug', false);
  if (debugMode) {
    console.warn('Debug mode should be disabled in production');
  }

  // Retrieve sensitive configuration securely
  const dbPassword = config.get('database.password');
  const apiKey = config.get('api.key');

  if (!dbPassword) {
    console.error('Database password is required in production');
    process.exit(1);
  }

  if (!apiKey) {
    console.error('API key is required in production');
    process.exit(1);
  }

  console.log(`Production Database: ${dbHost}:${dbPort}`);
  console.log('Production configuration loaded successfully');
}

// Sample production configuration (config/production.json)
/*
{
  "app": {
    "name": "ProductionApp",
    "environment": "production",
    "version": "2.1.0"
  },
  "database": {
    "host": "prod-db.cluster.example.com",
    "port": 5432,
    "name": "production_db",
    "username": "prod_user",
    "ssl": true,
    "pool": {
      "min": 10,
      "max": 100,
      "idleTimeout": 30000
    }
  },
  "api": {
    "timeout": 10000,
    "retries": 3,
    "endpoints": {
      "users": "https://api.example.com/v2/users",
      "orders": "https://api.example.com/v2/orders"
    },
    "rateLimiting": {
      "enabled": true,
      "requestsPerSecond": 1000,
      "burstLimit": 2000
    }
  },
  "logging": {
    "level": "error",
    "transports": ["file", "remote"],
    "remote": {
      "endpoint": "https://logs.example.com/ingest",
      "apiKey": "LOG_SERVICE_API_KEY"
    }
  },
  "monitoring": {
    "enabled": true,
    "endpoint": "https://monitoring.example.com/metrics"
  },
  "debug": false,
  "features": {
    "hotReload": false,
    "devTools": false
  }
}
*/

export { productionEnvironmentExample };
```

### 3. Provider Integration Examples

#### Example 5: Multi-Provider Configuration
```typescript
// examples/providers/multi-provider-config.ts
import { ConfigurationManager } from '../../src/config/ConfigurationManager';
import { FileConfigurationProvider } from '../../src/config/providers/FileConfigurationProvider';
import { EnvironmentConfigurationProvider } from '../../src/config/providers/EnvironmentConfigurationProvider';
import { RemoteConfigurationProvider } from '../../src/config/providers/RemoteConfigurationProvider';

/**
 * Example showing how to use multiple configuration providers with
 * precedence rules and fallback mechanisms.
 */

async function multiProviderExample() {
  const config = new ConfigurationManager();

  // Register providers in order of precedence
  // Environment variables have highest precedence
  const envProvider = new EnvironmentConfigurationProvider('APP_');

  // Remote configuration as secondary source
  const remoteProvider = new RemoteConfigurationProvider('https://config.example.com/app.json');

  // File configuration as fallback
  const fileProvider = new FileConfigurationProvider('./config/default.json');

  // Register providers (order matters for precedence)
  await config.registerProvider('file', fileProvider);
  await config.registerProvider('remote', remoteProvider);
  await config.registerProvider('env', envProvider);

  // Load configuration from all providers
  console.log('Loading configuration from all providers...');

  try {
    await config.load(); // Loads from all registered providers
    console.log('Configuration loaded successfully');
  } catch (error) {
    console.error('Failed to load configuration:', error);
    return;
  }

  // Demonstrate precedence - environment variable should override others
  // Set APP_DATABASE_HOST=localhost in environment
  const dbHost = config.get('database.host', 'default-host');
  console.log(`Database Host: ${dbHost}`); // Should be 'localhost' if env var set

  // Show configuration sources
  console.log('Configuration sources:');
  console.log('- File:', await fileProvider.load().then(r => r.success ? 'Loaded' : 'Failed'));
  console.log('- Remote:', await remoteProvider.load().then(r => r.success ? 'Loaded' : 'Failed'));
  console.log('- Environment:', await envProvider.load().then(r => r.success ? 'Loaded' : 'Failed'));

  // Show merged configuration
  console.log('Merged configuration:');
  console.log(JSON.stringify(config.getAll(), null, 2));
}

// Sample default configuration (config/default.json)
/*
{
  "app": {
    "name": "MultiProviderApp",
    "version": "1.0.0"
  },
  "database": {
    "host": "default-db.example.com",
    "port": 5432,
    "name": "default_db"
  },
  "api": {
    "timeout": 5000,
    "retries": 3
  },
  "features": {
    "logging": true,
    "monitoring": false
  }
}
*/

export { multiProviderExample };
```

#### Example 6: Secure Storage Integration
```typescript
// examples/providers/secure-storage.ts
import { ConfigurationManager } from '../../src/config/ConfigurationManager';
import { SecureStorageConfigurationProvider } from '../../src/config/providers/SecureStorageConfigurationProvider';
import { FileConfigurationProvider } from '../../src/config/providers/FileConfigurationProvider';

/**
 * Example showing how to use secure storage for sensitive configuration
 * values with encryption and access controls.
 */

async function secureStorageExample() {
  const config = new ConfigurationManager();

  // Register secure storage provider for sensitive data
  const secureProvider = new SecureStorageConfigurationProvider('./secrets/app-secrets.json');

  // Register file provider for non-sensitive configuration
  const fileProvider = new FileConfigurationProvider('./config/app.json');

  await config.registerProvider('file', fileProvider);
  await config.registerProvider('secure', secureProvider);

  try {
    // Load configuration
    await config.load();
    console.log('Configuration loaded successfully');
  } catch (error) {
    console.error('Failed to load configuration:', error);
    return;
  }

  // Retrieve non-sensitive configuration normally
  const appName = config.get('app.name');
  const version = config.get('app.version');
  console.log(`Application: ${appName} v${version}`);

  // Retrieve sensitive configuration securely
  // These values are encrypted in storage and decrypted on retrieval
  const dbPassword = config.get('database.password');
  const apiKey = config.get('api.key');
  const jwtSecret = config.get('security.jwt.secret');

  // Verify sensitive values are retrieved correctly
  if (dbPassword) {
    console.log('Database password retrieved securely');
  } else {
    console.warn('Database password not found');
  }

  if (apiKey) {
    console.log('API key retrieved securely');
  } else {
    console.warn('API key not found');
  }

  if (jwtSecret) {
    console.log('JWT secret retrieved securely');
  } else {
    console.warn('JWT secret not found');
  }

  // Demonstrate setting sensitive values
  // These will be encrypted when saved to secure storage
  config.set('database.password', 'new-secure-password-123');
  config.set('api.newKey', 'new-api-key-456');

  console.log('Sensitive values updated successfully');

  // Show that sensitive values are not exposed in getAll()
  const allConfig = config.getAll();
  console.log('All configuration (sensitive values masked):');

  // Note: In a real implementation, getAll() would mask sensitive values
  // This is just for demonstration purposes
  Object.keys(allConfig).forEach(key => {
    if (key.includes('password') || key.includes('key') || key.includes('secret')) {
      console.log(`${key}: [SECURE]`);
    } else {
      console.log(`${key}: ${JSON.stringify(allConfig[key])}`);
    }
  });
}

// Sample application configuration (config/app.json)
/*
{
  "app": {
    "name": "SecureApp",
    "version": "1.2.0"
  },
  "database": {
    "host": "db.example.com",
    "port": 5432,
    "name": "secure_app_db",
    "username": "app_user"
  },
  "api": {
    "timeout": 10000,
    "endpoints": {
      "users": "/api/v1/users",
      "orders": "/api/v1/orders"
    }
  },
  "security": {
    "jwt": {
      "algorithm": "HS256",
      "expiresIn": "1h"
    }
  },
  "features": {
    "authentication": true,
    "authorization": true
  }
}
*/

// Sample secure storage file (secrets/app-secrets.json)
// Note: This would be encrypted in a real implementation
/*
{
  "database": {
    "password": "encrypted-database-password-here"
  },
  "api": {
    "key": "encrypted-api-key-here"
  },
  "security": {
    "jwt": {
      "secret": "encrypted-jwt-secret-here"
    }
  },
  "thirdParty": {
    "payment": {
      "apiKey": "encrypted-payment-api-key-here"
    },
    "email": {
      "apiKey": "encrypted-email-api-key-here"
    }
  }
}
*/

export { secureStorageExample };
```

### 4. Advanced Feature Examples

#### Example 7: Configuration Change Notifications
```typescript
// examples/advanced/change-notifications.ts
import { ConfigurationManager } from '../../src/config/ConfigurationManager';
import { FileConfigurationProvider } from '../../src/config/providers/FileConfigurationProvider';

/**
 * Example showing how to use configuration change notifications
 * to react to configuration updates.
 */

async function changeNotificationsExample() {
  const config = new ConfigurationManager();

  // Set up change notification listeners
  config.on('change', (key, newValue, oldValue) => {
    console.log(`Configuration changed: ${key} = ${newValue} (was: ${oldValue})`);

    // Handle specific configuration changes
    if (key === 'debug') {
      console.log(`Debug mode is now ${newValue ? 'enabled' : 'disabled'}`);
    } else if (key.startsWith('database.')) {
      console.log('Database configuration changed, reconnecting...');
      // In a real app, you would reconnect to the database here
    } else if (key.startsWith('api.')) {
      console.log('API configuration changed, updating clients...');
      // In a real app, you would update API clients here
    }
  });

  config.on('reload', (providerName) => {
    console.log(`Configuration reloaded from provider: ${providerName}`);

    // Handle full configuration reload
    const newConfig = config.getAll();
    console.log('New configuration:', JSON.stringify(newConfig, null, 2));
  });

  // Set up file provider with change detection
  const fileProvider = new FileConfigurationProvider('./config/dynamic.json');
  await config.registerProvider('file', fileProvider);

  try {
    await config.load();
    console.log('Initial configuration loaded');
  } catch (error) {
    console.error('Failed to load configuration:', error);
    return;
  }

  // Demonstrate configuration changes
  console.log('\n--- Demonstrating Configuration Changes ---');

  // Change a simple value
  config.set('debug', true);

  // Change a nested value
  config.set('database.host', 'new-host.example.com');

  // Change multiple values
  config.set('api.timeout', 15000);
  config.set('api.retries', 5);

  console.log('\n--- Current Configuration ---');
  console.log(JSON.stringify(config.getAll(), null, 2));

  // Simulate external configuration file update
  console.log('\n--- Simulating External File Update ---');
  // In a real application, this would happen when the file is modified
  // For this example, we'll manually trigger a reload
  await config.reloadProvider('file');
}

// Sample dynamic configuration (config/dynamic.json)
/*
{
  "app": {
    "name": "DynamicApp",
    "version": "1.3.0"
  },
  "database": {
    "host": "initial-db.example.com",
    "port": 5432,
    "name": "dynamic_db"
  },
  "api": {
    "timeout": 5000,
    "retries": 3
  },
  "debug": false,
  "features": {
    "autoReload": true
  }
}
*/

export { changeNotificationsExample };
```

#### Example 8: Custom Validation Rules
```typescript
// examples/advanced/custom-validation.ts
import { ConfigurationManager } from '../../src/config/ConfigurationManager';
import { DevelopmentEnvironmentAdapter } from '../../src/config/adapters/DevelopmentEnvironmentAdapter';

/**
 * Example showing how to implement custom validation rules
 * for specific configuration requirements.
 */

class CustomValidationAdapter extends DevelopmentEnvironmentAdapter {
  validateConfiguration(config: any): string[] {
    const errors: string[] = [];

    // Call parent validation
    const parentErrors = super.validateConfiguration(config);
    errors.push(...parentErrors);

    // Custom validation rules
    this.validateDatabaseConfig(config, errors);
    this.validateApiConfig(config, errors);
    this.validateFeatureFlags(config, errors);

    return errors;
  }

  private validateDatabaseConfig(config: any, errors: string[]): void {
    const dbHost = config.database?.host;
    const dbPort = config.database?.port;

    if (dbHost && dbHost.length > 253) {
      errors.push('Database host must be less than 253 characters');
    }

    if (dbPort && (dbPort < 1 || dbPort > 65535)) {
      errors.push('Database port must be between 1 and 65535');
    }

    // Custom rule: Production-like hostnames should use FQDN
    if (dbHost && !dbHost.includes('.') && dbHost !== 'localhost') {
      errors.push('Database host should be a fully qualified domain name');
    }
  }

  private validateApiConfig(config: any, errors: string[]): void {
    const apiTimeout = config.api?.timeout;
    const apiRetries = config.api?.retries;

    if (apiTimeout !== undefined && apiTimeout < 1) {
      errors.push('API timeout must be positive');
    }

    if (apiRetries !== undefined && apiRetries < 0) {
      errors.push('API retries cannot be negative');
    }

    // Custom rule: Rate limiting should be configured for production
    const rateLimiting = config.api?.rateLimiting;
    if (rateLimiting && rateLimiting.enabled) {
      if (!rateLimiting.requestsPerSecond || rateLimiting.requestsPerSecond < 1) {
        errors.push('Rate limiting requests per second must be at least 1');
      }
    }
  }

  private validateFeatureFlags(config: any, errors: string[]): void {
    const features = config.features;
    if (!features) return;

    // Custom rule: Feature flags should not have conflicting settings
    const enabledFeatures = features.enabled || [];
    const disabledFeatures = features.disabled || [];

    const conflicts = enabledFeatures.filter((feature: string) =>
      disabledFeatures.includes(feature)
    );

    if (conflicts.length > 0) {
      errors.push(`Feature flags have conflicts: ${conflicts.join(', ')}`);
    }

    // Custom rule: Required features should be enabled
    const requiredFeatures = ['logging', 'monitoring'];
    const missingRequired = requiredFeatures.filter(feature =>
      !enabledFeatures.includes(feature)
    );

    if (missingRequired.length > 0) {
      errors.push(`Required features missing: ${missingRequired.join(', ')}`);
    }
  }
}

async function customValidationExample() {
  const config = new ConfigurationManager();
  const customAdapter = new CustomValidationAdapter(config);

  // Set up some configuration that will trigger validation errors
  config.set('database.host', 'very-long-hostname-that-exceeds-the-maximum-allowed-length-for-hostnames-which-is-253-characters.example.com');
  config.set('database.port', 99999); // Invalid port
  config.set('api.timeout', -1); // Negative timeout
  config.set('api.retries', -5); // Negative retries
  config.set('features', {
    enabled: ['logging', 'monitoring', 'conflicting'],
    disabled: ['experimental', 'conflicting'] // Conflict with enabled
  });

  // Validate configuration
  const errors = customAdapter.validateConfiguration(config.getAll());

  if (errors.length > 0) {
    console.log('Configuration validation failed:');
    errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  } else {
    console.log('Configuration validation passed');
  }

  // Fix the configuration and validate again
  console.log('\n--- Fixing Configuration ---');
  config.set('database.host', 'fixed-db.example.com');
  config.set('database.port', 5432);
  config.set('api.timeout', 5000);
  config.set('api.retries', 3);
  config.set('features', {
    enabled: ['logging', 'monitoring', 'authentication'],
    disabled: ['experimental', 'beta']
  });

  const fixedErrors = customAdapter.validateConfiguration(config.getAll());
  if (fixedErrors.length === 0) {
    console.log('Configuration validation now passes');
  } else {
    console.log('Still have validation errors:');
    fixedErrors.forEach(error => console.log(`- ${error}`));
  }
}

export { customValidationExample, CustomValidationAdapter };
```

### 5. Error Handling Examples

#### Example 9: Provider Failure Handling
```typescript
// examples/error-handling/provider-failures.ts
import { ConfigurationManager } from '../../src/config/ConfigurationManager';
import { FileConfigurationProvider } from '../../src/config/providers/FileConfigurationProvider';
import { EnvironmentConfigurationProvider } from '../../src/config/providers/EnvironmentConfigurationProvider';

/**
 * Example showing how to handle provider failures gracefully
 * with fallback mechanisms and error reporting.
 */

async function providerFailureExample() {
  const config = new ConfigurationManager();

  // Set up error handling
  config.on('providerError', (providerName, error) => {
    console.error(`Provider ${providerName} failed:`, error.message);

    // Log error details for debugging
    console.error('Error details:', {
      provider: providerName,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  });

  // Register providers that might fail
  const fileProvider = new FileConfigurationProvider('./config/nonexistent.json');
  const envProvider = new EnvironmentConfigurationProvider('APP_');

  await config.registerProvider('file', fileProvider);
  await config.registerProvider('env', envProvider);

  try {
    // Attempt to load configuration - file provider will fail
    await config.load();
    console.log('Configuration loaded with some providers failing');
  } catch (error) {
    console.error('Critical configuration loading failure:', error);
    // In a real application, you might want to exit or use defaults
  }

  // Demonstrate graceful degradation
  console.log('\n--- Configuration Status ---');
  console.log('File provider status:', fileProvider.isLoaded() ? 'Loaded' : 'Failed');
  console.log('Environment provider status:', envProvider.isLoaded() ? 'Loaded' : 'Failed');

  // Still able to retrieve configuration with fallbacks
  const appName = config.get('app.name', 'DefaultApp');
  const dbHost = config.get('database.host', 'localhost');
  const apiTimeout = config.get('api.timeout', 5000);

  console.log(`\nApplication: ${appName}`);
  console.log(`Database: ${dbHost}`);
  console.log(`API Timeout: ${apiTimeout}ms`);

  // Demonstrate recovery mechanism
  console.log('\n--- Attempting Recovery ---');

  // Create a valid configuration file
  const validConfig = {
    app: { name: 'RecoveredApp', version: '1.0.0' },
    database: { host: 'recovered-db.example.com', port: 5432 }
  };

  // In a real scenario, you might recreate the file or fix the issue
  // For this example, we'll simulate recovery by using a different approach
  config.set('recovery.mode', 'manual');
  config.set('app.name', 'ManuallyConfiguredApp');
  config.set('database.host', 'manual-db.example.com');

  console.log('Manual recovery applied');
  console.log('New app name:', config.get('app.name'));
  console.log('New database host:', config.get('database.host'));
}

export { providerFailureExample };
```

#### Example 10: Configuration Schema Validation
```typescript
// examples/error-handling/schema-validation.ts
import { ConfigurationManager } from '../../src/config/ConfigurationManager';
import { FileConfigurationProvider } from '../../src/config/providers/FileConfigurationProvider';

/**
 * Example showing how to implement and use schema validation
 * for configuration data to prevent invalid configurations.
 */

interface ConfigurationSchema {
  type: 'object';
  properties: {
    [key: string]: {
      type: string;
      required?: boolean;
      minLength?: number;
      maxLength?: number;
      minimum?: number;
      maximum?: number;
      format?: string;
      properties?: any;
    };
  };
  required?: string[];
}

class SchemaValidator {
  static validate(data: any, schema: ConfigurationSchema): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate required properties
    if (schema.required) {
      for (const requiredProp of schema.required) {
        if (data[requiredProp] === undefined) {
          errors.push(`Missing required property: ${requiredProp}`);
        }
      }
    }

    // Validate property types and constraints
    for (const [key, propSchema] of Object.entries(schema.properties)) {
      const value = data[key];

      if (value === undefined) continue;

      // Type validation
      if (propSchema.type === 'string' && typeof value !== 'string') {
        errors.push(`Property ${key} must be a string`);
      } else if (propSchema.type === 'number' && typeof value !== 'number') {
        errors.push(`Property ${key} must be a number`);
      } else if (propSchema.type === 'boolean' && typeof value !== 'boolean') {
        errors.push(`Property ${key} must be a boolean`);
      } else if (propSchema.type === 'object' && typeof value !== 'object') {
        errors.push(`Property ${key} must be an object`);
      }

      // String constraints
      if (typeof value === 'string') {
        if (propSchema.minLength && value.length < propSchema.minLength) {
          errors.push(`Property ${key} must be at least ${propSchema.minLength} characters`);
        }
        if (propSchema.maxLength && value.length > propSchema.maxLength) {
          errors.push(`Property ${key} must be at most ${propSchema.maxLength} characters`);
        }
        if (propSchema.format === 'email' && !this.isValidEmail(value)) {
          errors.push(`Property ${key} must be a valid email address`);
        }
        if (propSchema.format === 'hostname' && !this.isValidHostname(value)) {
          errors.push(`Property ${key} must be a valid hostname`);
        }
      }

      // Number constraints
      if (typeof value === 'number') {
        if (propSchema.minimum !== undefined && value < propSchema.minimum) {
          errors.push(`Property ${key} must be at least ${propSchema.minimum}`);
        }
        if (propSchema.maximum !== undefined && value > propSchema.maximum) {
          errors.push(`Property ${key} must be at most ${propSchema.maximum}`);
        }
      }

      // Nested object validation
      if (propSchema.type === 'object' && propSchema.properties && typeof value === 'object') {
        const nestedResult = this.validate(value, {
          type: 'object',
          properties: propSchema.properties,
          required: propSchema.required
        });
        errors.push(...nestedResult.errors.map(error => `${key}.${error}`));
      }
    }

    return { valid: errors.length === 0, errors };
  }

  private static isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private static isValidHostname(hostname: string): boolean {
    return /^([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])(\.([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]{0,61}[a-zA-Z0-9]))*$/.test(hostname);
  }
}

async function schemaValidationExample() {
  const config = new ConfigurationManager();

  // Define configuration schema
  const configSchema: ConfigurationSchema = {
    type: 'object',
    properties: {
      app: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 50 },
          version: { type: 'string', format: 'version' },
          environment: { type: 'string', enum: ['development', 'testing', 'staging', 'production'] }
        },
        required: ['name', 'version']
      },
      database: {
        type: 'object',
        properties: {
          host: { type: 'string', format: 'hostname' },
          port: { type: 'number', minimum: 1, maximum: 65535 },
          name: { type: 'string', minLength: 1 },
          username: { type: 'string', minLength: 1 }
        },
        required: ['host', 'port', 'name', 'username']
      },
      api: {
        type: 'object',
        properties: {
          timeout: { type: 'number', minimum: 1, maximum: 60000 },
          retries: { type: 'number', minimum: 0, maximum: 10 }
        }
      }
    },
    required: ['app', 'database']
  };

  // Load invalid configuration
  const invalidConfig = {
    app: {
      name: '', // Invalid: empty string
      version: 'not-a-version' // No format validation for this example
    },
    database: {
      host: 'invalid..hostname', // Invalid hostname
      port: 99999, // Invalid port
      name: 'valid-name'
      // Missing username
    },
    api: {
      timeout: -1, // Invalid: negative
      retries: 15 // Invalid: too high
    }
  };

  console.log('--- Testing Invalid Configuration ---');
  const invalidResult = SchemaValidator.validate(invalidConfig, configSchema);
  console.log('Validation result:', invalidResult);

  if (!invalidResult.valid) {
    console.log('Validation errors found:');
    invalidResult.errors.forEach(error => console.log(`- ${error}`));
  }

  // Load valid configuration
  const validConfig = {
    app: {
      name: 'ValidApp',
      version: '1.0.0',
      environment: 'development'
    },
    database: {
      host: 'valid-db.example.com',
      port: 5432,
      name: 'valid_db',
      username: 'valid_user'
    },
    api: {
      timeout: 5000,
      retries: 3
    }
  };

  console.log('\n--- Testing Valid Configuration ---');
  const validResult = SchemaValidator.validate(validConfig, configSchema);
  console.log('Validation result:', validResult);

  if (validResult.valid) {
    console.log('Configuration is valid');

    // Apply valid configuration
    Object.keys(validConfig).forEach(key => {
      config.set(key, validConfig[key as keyof typeof validConfig]);
    });

    console.log('Configuration applied successfully');
    console.log('App name:', config.get('app.name'));
    console.log('Database host:', config.get('database.host'));
  }
}

export { schemaValidationExample, SchemaValidator, ConfigurationSchema };
```

## Acceptance Criteria

### Example Quality
- [ ] Examples are clear, practical, and well-documented
- [ ] All examples include comprehensive comments
- [ ] Examples demonstrate real-world usage scenarios
- [ ] Code follows best practices and conventions
- [ ] Examples are tested and functional

### Completeness
- [ ] Examples cover all major system features
- [ ] Environment-specific examples are provided
- [ ] Provider integration examples are included
- [ ] Advanced features are demonstrated
- [ ] Error handling scenarios are covered

### Accuracy
- [ ] Examples match actual system implementation
- [ ] Code examples are syntactically correct
- [ ] Configuration examples are valid
- [ ] Output examples are accurate
- [ ] Dependencies are correctly specified

### Usability
- [ ] Examples are easy to understand and follow
- [ ] Setup and execution instructions are clear
- [ ] Examples can be run independently
- [ ] Error messages are informative
- [ ] Examples include troubleshooting guidance

## Dependencies
- Task 01: Implement Basic Configuration Manager
- Task 02-05: Implement Environment Adapters
- Task 06-09: Implement Configuration Providers
- Task 10a: Test Core Interfaces
- Task 20a: Integration Tests
- Task 30a-30c: Error Handling, Validation, and Security Tests
- Task 40a: Documentation

## Implementation Steps

1. **Create examples directory structure**
   - Set up examples directory with appropriate subdirectories
   - Create package.json for examples
   - Establish example templates and standards

2. **Develop basic usage examples**
   - Create simple configuration manager examples
   - Develop nested configuration access examples
   - Write configuration setting and updating examples

3. **Create environment-specific examples**
   - Develop development environment setup examples
   - Create testing environment configuration examples
   - Write staging environment preparation examples
   - Develop production environment deployment examples

4. **Implement provider integration examples**
   - Create file-based configuration examples
   - Develop environment variable integration examples
   - Write secure storage usage examples
   - Create remote configuration service integration examples

5. **Develop advanced feature examples**
   - Create configuration change notification examples
   - Develop custom validation rules examples
   - Write configuration caching strategies examples
   - Create performance optimization technique examples

6. **Create error handling examples**
   - Develop missing configuration file handling examples
   - Create provider failure management examples
   - Write graceful degradation strategy examples
   - Develop recovery procedure examples

7. **Create best practice examples**
   - Develop configuration organization pattern examples
   - Create security implementation examples
   - Write testing configuration scenario examples
   - Develop deployment automation examples

8. **Review and finalize examples**
   - Conduct technical review of all examples
   - Perform accuracy verification
   - Test all examples for functionality
   - Finalize documentation and comments

## Example Standards

### Code Quality
- Use TypeScript with proper typing
- Follow consistent naming conventions
- Include comprehensive error handling
- Use modern JavaScript/TypeScript features
- Maintain clean, readable code structure

### Documentation
- Include detailed comments explaining code
- Provide context and purpose for each example
- Document assumptions and prerequisites
- Include expected output and behavior
- Provide troubleshooting guidance

### Testing
- Ensure all examples are functional
- Include setup and teardown procedures
- Provide clear execution instructions
- Document dependencies and requirements
- Include validation and verification steps

### Organization
- Group examples by category and complexity
- Provide progressive learning path
- Include both simple and complex examples
- Cross-reference related examples
- Maintain consistent structure across examples

## Expected Outcomes

### Example Deliverables
1. **Basic Usage Examples** - Simple configuration manager usage
2. **Environment-Specific Examples** - Setup for different environments
3. **Provider Integration Examples** - Working with different providers
4. **Advanced Feature Examples** - Complex system capabilities
5. **Error Handling Examples** - Graceful failure scenarios
6. **Best Practice Examples** - Recommended usage patterns

### Quality Metrics
- Example accuracy: 100% functional examples
- Code quality: Following best practices
- Documentation completeness: >95% coverage
- User success rate: >90% successful execution
- Learning effectiveness: Clear progression of complexity

## Risk Assessment

### High Risk Items
1. **Example accuracy** - Examples might not match implementation
2. **Incomplete coverage** - Some features might lack examples
3. **Poor usability** - Examples might be difficult to run
4. **Outdated information** - Examples might become stale

### Mitigation Strategies
1. Implement example review process with developers
2. Create example checklist for completeness
3. Establish example update procedures
4. Conduct usability testing with target audience

## Validation Criteria

### Technical Review
- [ ] Examples reviewed by development team
- [ ] Code verified against actual implementation
- [ ] Examples tested for functionality
- [ ] Cross-references validated

### User Acceptance
- [ ] Examples tested by sample users
- [ ] Feedback incorporated
- [ ] Execution instructions validated
- [ ] Learning effectiveness assessed

### Quality Assurance
- [ ] Code quality standards met
- [ ] Documentation completeness verified
- [ ] Error handling implemented
- [ ] Best practices followed

## Next Steps
After completing this task:
1. Conduct final project review and validation
2. Prepare for Phase 2 implementation
3. Create project completion documentation

## References
- [Configuration Manager Implementation](./task_01_implement_basic_manager.md)
- [Environment Adapters Implementation](./task_02_development_adapter.md)
- [Configuration Providers Implementation](./task_06_file_provider.md)
- [Integration Tests](./task_20a_integration_tests.md)
- [Documentation](./task_40a_documentation.md)
- [SPARC Methodology](../../../SPARC_METHODOLOGY.md)

## Running Examples

To run these examples:

```bash
# Navigate to the examples directory
cd examples

# Install dependencies
npm install

# Run specific examples
npm run example:basic
npm run example:development
npm run example:production
npm run example:multi-provider
npm run example:secure-storage
npm run example:change-notifications
npm run example:custom-validation
npm run example:provider-failures
npm run example:schema-validation
```

Each example can be run independently and demonstrates specific aspects of the configuration management system.