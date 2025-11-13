# Environment Configuration Management Usage Guide

This guide provides practical examples and implementation scenarios for using the Environment Configuration Management system effectively.

## Table of Contents
1. [Getting Started](#getting-started)
2. [Basic Configuration Operations](#basic-configuration-operations)
3. [Environment-Specific Configurations](#environment-specific-configurations)
4. [Security Implementation](#security-implementation)
5. [Token Management](#token-management)
6. [Advanced Features](#advanced-features)
7. [Monitoring and Validation](#monitoring-and-validation)
8. [Integration Examples](#integration-examples)
9. [Best Practices](#best-practices)

## Getting Started

### Installation and Setup

To use the Environment Configuration Management system, ensure you have the required dependencies installed:

```bash
npm install your-project-name
```

### Basic Initialization

```typescript
import { EnvironmentConfigurationService } from './config/EnvironmentConfigurationService';
import { PayloadEncryptionService } from './security/PayloadEncryptionService';
import { MessageAuthenticationService } from './security/MessageAuthenticationService';
import { TokenEncryptionService } from './security/TokenEncryptionService';
import { GitHubPATAuthService } from './services/GitHubPATAuthService';
import { GitHubAppAuthService } from './services/GitHubAppAuthService';

// Initialize security services
const payloadEncryptionService = new PayloadEncryptionService();
const messageAuthenticationService = new MessageAuthenticationService();
const tokenEncryptionService = new TokenEncryptionService();

// Initialize GitHub authentication services
const githubPatAuthService = new GitHubPATAuthService();
const githubAppAuthService = new GitHubAppAuthService();

// Create environment configuration service
const configService = new EnvironmentConfigurationService(
  payloadEncryptionService,
  messageAuthenticationService,
  tokenEncryptionService,
  process.env.ENCRYPTION_PASSWORD || 'default-password',
  githubPatAuthService,
  githubAppAuthService
);

// Initialize with default options
await configService.initialize({
  environment: process.env.NODE_ENV || 'development',
  enableCache: true,
  cacheTTL: 60000, // 1 minute
  enableHotReload: process.env.NODE_ENV === 'development'
});
```

## Basic Configuration Operations

### Retrieving Configuration Values

```typescript
// Get configuration for current environment
const config = await configService.getEnvironmentConfig('production');

// Access specific configuration values
const githubRepo = config.github.repository;
const apiUrl = config.apiUrl;
const logLevel = config.logLevel;

console.log(`Repository: ${githubRepo}`);
console.log(`API URL: ${apiUrl}`);
console.log(`Log Level: ${logLevel}`);
```

### Setting Configuration Values

```typescript
// Define configuration for an environment
const stagingConfig = {
  github: {
    repository: 'my-org/staging-repo',
    owner: 'my-org'
  },
  deployment: {
    target: 'aws',
    region: 'us-west-2'
  },
  apiUrl: 'https://staging-api.example.com',
  syncInterval: 15000, // 15 seconds for staging
  logLevel: 'debug',
  features: {
    enableNewFeature: true,
    enableBetaFeature: false
  },
  limits: {
    maxFileSize: 5242880, // 5MB for staging
    maxConnections: 5,
    syncTimeout: 15000
  },
  security: {
    encryptionEnabled: true,
    authTimeout: 150000, // 2.5 minutes
    rateLimit: 50
  }
};

// Save the configuration
await configService.saveEnvironmentConfig('staging', stagingConfig);
```

## Environment-Specific Configurations

### Development Environment

```typescript
// Development environment configuration
const devConfig = {
  github: {
    repository: 'my-org/dev-repo',
    owner: 'my-org'
  },
  deployment: {
    target: 'local',
    region: 'localhost'
  },
  apiUrl: 'http://localhost:3000',
  syncInterval: 5000, // 5 seconds for development
  logLevel: 'debug',
  features: {
    enableNewFeature: true,
    enableExperimentalFeature: true
  },
  limits: {
    maxFileSize: 10485760, // 10MB for development
    maxConnections: 100, // Higher for development
    syncTimeout: 30000
  },
  security: {
    encryptionEnabled: false, // Disabled for development
    authTimeout: 300000,
    rateLimit: 1000 // Higher for development
  }
};

await configService.saveEnvironmentConfig('development', devConfig);
```

### Production Environment

```typescript
// Production environment configuration
const prodConfig = {
  github: {
    repository: 'my-org/production-repo',
    owner: 'my-org'
  },
  deployment: {
    target: 'aws',
    region: 'us-east-1'
  },
  apiUrl: 'https://api.example.com',
  syncInterval: 60000, // 1 minute for production
  logLevel: 'warn',
  features: {
    enableNewFeature: true,
    enableExperimentalFeature: false // Disabled in production
  },
  limits: {
    maxFileSize: 104857600, // 100MB for production
    maxConnections: 1000,
    syncTimeout: 60000
  },
  security: {
    encryptionEnabled: true, // Always enabled in production
    authTimeout: 300000,
    rateLimit: 100
  }
};

await configService.saveEnvironmentConfig('production', prodConfig);
```

## Security Implementation

### Secure Token Handling

```typescript
// Encrypt a GitHub token before saving
const githubToken = process.env.GITHUB_TOKEN;
if (githubToken) {
  // The service automatically encrypts tokens when saving
  const configWithToken = {
    ...prodConfig,
    github: {
      ...prodConfig.github,
      token: githubToken // Will be encrypted automatically
    }
  };

  await configService.saveEnvironmentConfig('production', configWithToken);
}
```

### Validating Encrypted Tokens

```typescript
// Validate tokens stored in configuration
async function validateEnvironmentTokens(environment: string) {
  // Get the configuration (tokens are decrypted automatically for validation)
  const config = await configService.getEnvironmentConfig(environment);

  // Prepare tokens for validation
  const tokensToValidate: Record<string, { token: string; type: string }> = {};

  if (config.github?.token) {
    tokensToValidate['github'] = {
      token: config.github.token,
      type: 'github-pat'
    };
  }

  // Validate tokens
  const validationResults = await configService.validateTokens(tokensToValidate);

  // Process results
  for (const [name, result] of Object.entries(validationResults)) {
    if (result.valid) {
      console.log(`✅ Token ${name} is valid`);
      if (result.needsRefresh) {
        console.warn(`⚠️  Token ${name} needs refresh`);
      }
    } else {
      console.error(`❌ Token ${name} validation failed: ${result.error}`);
    }
  }

  return validationResults;
}

// Validate production tokens
await validateEnvironmentTokens('production');
```

## Token Management

### Refreshing Tokens

```typescript
// Refresh tokens when needed
async function refreshEnvironmentTokens(environment: string) {
  // Get current configuration
  const config = await configService.getEnvironmentConfig(environment);

  // Prepare refresh tokens (assuming you have refresh tokens stored)
  const tokensToRefresh: Record<string, { refreshToken: string; type: string }> = {};

  if (config.github?.refreshToken) {
    tokensToRefresh['github'] = {
      refreshToken: config.github.refreshToken,
      type: 'github-oauth'
    };
  }

  // Refresh tokens
  const refreshResults = await configService.refreshTokens(tokensToRefresh);

  // Process results
  for (const [name, result] of Object.entries(refreshResults)) {
    if (result.success) {
      console.log(`✅ Token ${name} refreshed successfully`);

      // Update configuration with new token
      const updatedConfig = {
        ...config,
        github: {
          ...config.github,
          token: result.newToken
        }
      };

      await configService.saveEnvironmentConfig(environment, updatedConfig);
    } else {
      console.error(`❌ Failed to refresh token ${name}: ${result.error}`);
    }
  }

  return refreshResults;
}

// Refresh production tokens
await refreshEnvironmentTokens('production');
```

## Advanced Features

### Configuration Caching

```typescript
// Check configuration status including cache information
const status = configService.getStatus();
console.log('Configuration Status:', status);

// Example status output:
// {
//   loaded: true,
//   lastLoad: 1640995200000,
//   sources: ['local-config', 'environment-variables', 'secure-storage'],
//   cache: {
//     enabled: true,
//     size: 25,
//     hits: 150,
//     misses: 25
//   },
//   errorCount: 0
// }

// Force reload configuration (bypasses cache)
await configService.reload();
```

### Hot Reloading

```typescript
// Hot reloading is automatically enabled in development
// Configuration changes are detected and applied automatically

// Subscribe to configuration changes
configService.onChange((change) => {
  console.log(`Configuration changed at ${new Date(change.timestamp)}`);
  console.log(`Changed keys: ${change.keys.join(', ')}`);
  console.log(`Source: ${change.source}`);

  // Perform actions based on configuration changes
  if (change.keys.includes('logLevel')) {
    // Update logging level
    updateLogLevel(configService.getEnvironmentConfig(process.env.NODE_ENV || 'development'));
  }
});
```

### Custom Environment Adapters

```typescript
// Create a custom environment adapter
import { EnvironmentAdapter, EnvironmentType } from './config/EnvironmentAdapter';
import { ConfigurationSource, ConfigurationSourceType, ValidationResult } from './config/ConfigurationManager';

class CustomEnvironmentAdapter implements EnvironmentAdapter {
  private environment: EnvironmentType;

  constructor(environment: string) {
    this.environment = environment as EnvironmentType;
  }

  getEnvironment(): EnvironmentType {
    return this.environment;
  }

  getConfigurationSources(): ConfigurationSource[] {
    const sources: ConfigurationSource[] = [];

    // Add custom configuration sources
    sources.push({
      name: 'custom-config',
      type: ConfigurationSourceType.FILE,
      options: {
        path: `/etc/myapp/${this.environment}.json`,
        format: 'json'
      }
    });

    // Add environment variables with custom prefix
    sources.push({
      name: 'custom-env-vars',
      type: ConfigurationSourceType.ENVIRONMENT,
      options: {
        prefix: 'MYAPP_'
      }
    });

    return sources;
  }

  transformConfiguration(config: any): any {
    // Apply custom transformations
    if (this.environment === EnvironmentType.PRODUCTION) {
      // Override certain values for production
      config.debug = false;
      config.logLevel = config.logLevel || 'warn';
    }

    return config;
  }

  validateConfiguration(config: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Custom validation rules
    if (!config.customRequiredField) {
      errors.push('customRequiredField is required');
    }

    if (config.someValue && config.someValue > 100) {
      warnings.push('someValue is higher than recommended');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}

// Use the custom adapter
const customAdapter = new CustomEnvironmentAdapter('production');
```

## Monitoring and Validation

### Truth Verification

```typescript
// Check truth score of configuration operations
async function performConfigurationOperationWithVerification() {
  try {
    // Perform configuration operation
    const config = await configService.getEnvironmentConfig('production');

    // In a real implementation, the service would automatically calculate
    // a truth score based on:
    // - Operation accuracy
    // - Result consistency
    // - Performance efficiency
    // - Error handling quality

    // Example of checking configuration status
    const status = configService.getStatus();

    // If truth score is below threshold, system would automatically rollback
    if (status.truthScore < 0.95) {
      console.warn(`⚠️  Truth score below threshold: ${status.truthScore}`);
      // Automatic rollback would occur in real implementation
    } else {
      console.log(`✅ Configuration operation successful with truth score: ${status.truthScore}`);
    }

    return config;
  } catch (error) {
    console.error('Configuration operation failed:', error);
    throw error;
  }
}
```

### Configuration Validation

```typescript
// Validate configuration with detailed reporting
async function validateConfigurationWithDetails(environment: string) {
  // Get configuration manager status
  const status = configService.getStatus();

  // Validate current configuration
  // Note: This would typically be done internally by the service
  // but shown here for demonstration

  console.log(`Configuration loaded: ${status.loaded}`);
  console.log(`Last load time: ${new Date(status.lastLoad)}`);
  console.log(`Configuration sources: ${status.sources.join(', ')}`);

  if (status.cache.enabled) {
    console.log(`Cache hit ratio: ${(status.cache.hits / (status.cache.hits + status.cache.misses) * 100).toFixed(2)}%`);
  }

  console.log(`Errors encountered: ${status.errorCount}`);

  // Get and validate specific configuration
  const config = await configService.getEnvironmentConfig(environment);

  // Validate GitHub configuration
  if (config.github) {
    if (!config.github.repository) {
      console.warn('⚠️  GitHub repository not configured');
    }
    if (!config.github.owner) {
      console.warn('⚠️  GitHub owner not configured');
    }
  }

  // Validate deployment configuration
  if (config.deployment) {
    if (!config.deployment.target) {
      console.warn('⚠️  Deployment target not configured');
    }
  }

  return config;
}
```

## Integration Examples

### Express.js Integration

```typescript
// Express.js middleware for configuration
import express from 'express';

const app = express();

// Configuration middleware
app.use(async (req, res, next) => {
  try {
    // Get environment from request or default
    const environment = req.headers['x-environment'] || process.env.NODE_ENV || 'development';

    // Get configuration for environment
    const config = await configService.getEnvironmentConfig(environment);

    // Attach configuration to request
    req.config = config;

    next();
  } catch (error) {
    console.error('Configuration loading failed:', error);
    res.status(500).json({ error: 'Configuration loading failed' });
  }
});

// Route using configuration
app.get('/api/status', (req, res) => {
  const config = req.config;

  res.json({
    environment: config.environment,
    apiUrl: config.apiUrl,
    logLevel: config.logLevel,
    features: config.features,
    truthScore: config.truthScore,
    valid: config.valid
  });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

### GitHub Integration

```typescript
// GitHub operations with configuration
import { Octokit } from '@octokit/rest';

class GitHubService {
  private configService: EnvironmentConfigurationService;

  constructor(configService: EnvironmentConfigurationService) {
    this.configService = configService;
  }

  async getOctokit(environment: string) {
    // Get configuration for environment
    const config = await this.configService.getEnvironmentConfig(environment);

    // Validate GitHub token
    if (!config.github?.token) {
      throw new Error('GitHub token not configured');
    }

    // Create Octokit instance
    return new Octokit({
      auth: config.github.token,
      baseUrl: config.github.apiUrl || 'https://api.github.com'
    });
  }

  async listRepositoryFiles(owner: string, repo: string, environment: string = 'production') {
    const octokit = await this.getOctokit(environment);

    try {
      const { data } = await octokit.repos.getContent({
        owner,
        repo,
        path: ''
      });

      return data;
    } catch (error) {
      console.error('Failed to list repository files:', error);
      throw error;
    }
  }

  async createFile(owner: string, repo: string, path: string, content: string, message: string, environment: string = 'production') {
    const octokit = await this.getOctokit(environment);

    try {
      const { data } = await octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message,
        content: Buffer.from(content).toString('base64')
      });

      return data;
    } catch (error) {
      console.error('Failed to create file:', error);
      throw error;
    }
  }
}

// Usage
const githubService = new GitHubService(configService);

// List files in repository
const files = await githubService.listRepositoryFiles('my-org', 'my-repo', 'production');
console.log('Repository files:', files);

// Create a file
const result = await githubService.createFile(
  'my-org',
  'my-repo',
  'config/new-file.txt',
  'Hello, World!',
  'Create new configuration file',
  'staging'
);
console.log('File created:', result);
```

## Best Practices

### 1. Secure Configuration Management

```typescript
// ✅ DO: Encrypt sensitive data automatically
const config = {
  github: {
    repository: 'my-org/my-repo',
    owner: 'my-org',
    token: process.env.GITHUB_TOKEN // Will be encrypted automatically
  }
};

// ❌ DON'T: Store unencrypted sensitive data
const insecureConfig = {
  github: {
    token: 'ghp_1234567890abcdef' // Plain text token - NEVER do this
  }
};
```

### 2. Environment-Specific Configuration

```typescript
// ✅ DO: Use environment-specific configurations
const getConfigForEnvironment = (environment: string) => {
  const baseConfig = {
    // Common configuration
    logFormat: 'json',
    enableMetrics: true
  };

  switch (environment) {
    case 'development':
      return {
        ...baseConfig,
        logLevel: 'debug',
        enableDebugFeatures: true,
        syncInterval: 5000
      };
    case 'production':
      return {
        ...baseConfig,
        logLevel: 'warn',
        enableDebugFeatures: false,
        syncInterval: 60000
      };
    default:
      return baseConfig;
  }
};

// ❌ DON'T: Use the same configuration for all environments
const badConfig = {
  logLevel: 'debug', // Too verbose for production
  enableDebugFeatures: true, // Security risk in production
  syncInterval: 1000 // Too frequent for production
};
```

### 3. Configuration Validation

```typescript
// ✅ DO: Validate configurations with detailed feedback
async function validateAndSaveConfig(environment: string, config: any) {
  try {
    // Save configuration (validation happens automatically)
    await configService.saveEnvironmentConfig(environment, config);

    // Validate tokens separately if needed
    await validateEnvironmentTokens(environment);

    console.log(`✅ Configuration saved for ${environment}`);
  } catch (error) {
    console.error(`❌ Failed to save configuration for ${environment}:`, error);
    throw error;
  }
}

// ❌ DON'T: Skip validation
async function saveConfigWithoutValidation(environment: string, config: any) {
  // This bypasses validation and could lead to issues
  // await configService.saveEnvironmentConfig(environment, config);
}
```

### 4. Error Handling

```typescript
// ✅ DO: Implement comprehensive error handling
async function robustConfigurationOperation(environment: string) {
  try {
    const config = await configService.getEnvironmentConfig(environment);
    return config;
  } catch (error: any) {
    // Log error with context
    console.error(`Configuration operation failed for environment ${environment}:`, {
      error: error.message,
      stack: error.stack,
      environment,
      timestamp: new Date().toISOString()
    });

    // Implement fallback behavior
    if (error.code === 'CONFIG_NOT_FOUND') {
      console.warn(`Using default configuration for ${environment}`);
      return getDefaultConfig(environment);
    }

    // Re-throw error for upstream handling
    throw error;
  }
}

// ❌ DON'T: Ignore errors
async function poorErrorHandling(environment: string) {
  const config = await configService.getEnvironmentConfig(environment);
  // No error handling - could crash the application
  return config;
}
```

### 5. Monitoring and Observability

```typescript
// ✅ DO: Implement comprehensive monitoring
class ConfigurationMonitor {
  private configService: EnvironmentConfigurationService;

  constructor(configService: EnvironmentConfigurationService) {
    this.configService = configService;
    this.setupMonitoring();
  }

  private setupMonitoring() {
    // Monitor configuration changes
    this.configService.onChange((change) => {
      console.log('Configuration changed:', change);

      // Send metrics to monitoring system
      this.sendMetric('config.change', {
        keys: change.keys.length,
        source: change.source,
        timestamp: change.timestamp
      });
    });
  }

  public getStatusReport() {
    const status = this.configService.getStatus();

    return {
      health: status.errorCount === 0 ? 'healthy' : 'degraded',
      cacheHitRatio: status.cache.enabled ?
        (status.cache.hits / (status.cache.hits + status.cache.misses) * 100).toFixed(2) + '%' :
        'N/A',
      lastLoad: new Date(status.lastLoad).toISOString(),
      sources: status.sources,
      errors: status.errorCount
    };
  }

  private sendMetric(name: string, value: any) {
    // Implementation would send metrics to your monitoring system
    console.log(`Metric ${name}:`, value);
  }
}

// ❌ DON'T: Skip monitoring
// Not implementing any monitoring makes it difficult to detect issues
```

This usage guide provides comprehensive examples for implementing the Environment Configuration Management system in various scenarios while following security best practices and ensuring robust error handling.