# Environment Configuration Management Integration Guide

This guide provides detailed instructions for integrating the Environment Configuration Management system with various frameworks, services, and platforms.

## Table of Contents
1. [Framework Integration](#framework-integration)
2. [Cloud Platform Integration](#cloud-platform-integration)
3. [CI/CD Pipeline Integration](#cicd-pipeline-integration)
4. [Monitoring and Logging Integration](#monitoring-and-logging-integration)
5. [Service Mesh Integration](#service-mesh-integration)
6. [Authentication Provider Integration](#authentication-provider-integration)
7. [Database Integration](#database-integration)
8. [Message Queue Integration](#message-queue-integration)
9. [API Gateway Integration](#api-gateway-integration)
10. [Custom Integration Patterns](#custom-integration-patterns)

## Framework Integration

### Express.js Integration

```typescript
// Express.js middleware for configuration management
import express from 'express';
import { EnvironmentConfigurationService } from './config/EnvironmentConfigurationService';

const app = express();

// Initialize configuration service
const configService = new EnvironmentConfigurationService(/* dependencies */);

// Configuration middleware
const configurationMiddleware = async (req: any, res: any, next: any) => {
  try {
    // Determine environment from request or default
    const environment = req.headers['x-environment'] ||
                       process.env.NODE_ENV ||
                       'development';

    // Get configuration for environment
    const config = await configService.getEnvironmentConfig(environment);

    // Attach configuration to request
    req.appConfig = config;

    // Validate configuration before proceeding
    const status = configService.getStatus();
    if (status.errorCount > 0) {
      console.warn(`Configuration errors detected: ${status.errorCount}`);
    }

    next();
  } catch (error) {
    console.error('Configuration loading failed:', error);
    res.status(500).json({
      error: 'Configuration loading failed',
      timestamp: new Date().toISOString()
    });
  }
};

// Apply middleware globally
app.use(configurationMiddleware);

// Route using configuration
app.get('/api/config', (req: any, res: any) => {
  const config = req.appConfig;

  // Return sanitized configuration to client
  res.json({
    environment: config.environment,
    apiUrl: config.apiUrl,
    features: config.features,
    limits: config.limits,
    truthScore: config.truthScore,
    valid: config.valid
  });
});

// Route that uses configuration for business logic
app.post('/api/process', async (req: any, res: any) => {
  try {
    const config = req.appConfig;

    // Use configuration values
    const maxFileSize = config.limits?.maxFileSize || 10485760;
    const timeout = config.limits?.syncTimeout || 30000;

    // Process with configuration constraints
    const result = await processWithConfig(req.body, { maxFileSize, timeout });

    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log('Server running with environment configuration management');
});
```

### NestJS Integration

```typescript
// NestJS module for configuration management
import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Custom configuration service
@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [() => {
        // Load configuration from environment configuration service
        return loadEnvironmentConfig();
      }]
    })
  ],
  providers: [
    {
      provide: 'EnvironmentConfigurationService',
      useFactory: async () => {
        return await initializeEnvironmentConfigService();
      }
    }
  ],
  exports: ['EnvironmentConfigurationService']
})
export class EnvironmentConfigModule {}

// Configuration service wrapper
import { Injectable, Inject } from '@nestjs/common';
import { EnvironmentConfigurationService } from './config/EnvironmentConfigurationService';

@Injectable()
export class NestConfigService {
  constructor(
    @Inject('EnvironmentConfigurationService')
    private readonly envConfigService: EnvironmentConfigurationService
  ) {}

  async get(environment: string, key: string, defaultValue?: any) {
    try {
      const config = await this.envConfigService.getEnvironmentConfig(environment);

      // Navigate nested configuration
      const keys = key.split('.');
      let value = config;

      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k];
        } else {
          return defaultValue;
        }
      }

      return value;
    } catch (error) {
      console.error(`Failed to get configuration ${key} for ${environment}:`, error);
      return defaultValue;
    }
  }

  async set(environment: string, key: string, value: any) {
    try {
      const config = await this.envConfigService.getEnvironmentConfig(environment);

      // Update nested configuration
      const keys = key.split('.');
      let current = config;

      for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i];
        if (!(k in current)) {
          current[k] = {};
        }
        current = current[k];
      }

      current[keys[keys.length - 1]] = value;

      // Save updated configuration
      await this.envConfigService.saveEnvironmentConfig(environment, config);

      return true;
    } catch (error) {
      console.error(`Failed to set configuration ${key} for ${environment}:`, error);
      return false;
    }
  }
}

// Usage in a controller
import { Controller, Get, Param } from '@nestjs/common';

@Controller('config')
export class ConfigController {
  constructor(private readonly configService: NestConfigService) {}

  @Get(':environment/:key')
  async getConfigValue(
    @Param('environment') environment: string,
    @Param('key') key: string
  ) {
    const value = await this.configService.get(environment, key);
    return { key, value };
  }

  @Get(':environment')
  async getEnvironmentConfig(@Param('environment') environment: string) {
    // This would need to be implemented in the NestConfigService
    // to expose the full configuration
    return { environment, message: 'Configuration retrieval available through service' };
  }
}
```

### Fastify Integration

```typescript
// Fastify plugin for environment configuration
import fastify from 'fastify';
import { EnvironmentConfigurationService } from './config/EnvironmentConfigurationService';

// Fastify plugin
async function fastifyEnvironmentConfig(instance: any, options: any) {
  // Initialize configuration service
  const configService = new EnvironmentConfigurationService(/* dependencies */);

  // Decorate fastify instance with configuration service
  instance.decorate('configService', configService);

  // Hook to load configuration for each request
  instance.addHook('onRequest', async (request: any, reply: any) => {
    try {
      const environment = request.headers['x-environment'] ||
                         process.env.NODE_ENV ||
                         'development';

      const config = await configService.getEnvironmentConfig(environment);
      request.configuration = config;
    } catch (error) {
      console.error('Configuration loading failed:', error);
      reply.code(500).send({ error: 'Configuration loading failed' });
    }
  });

  // Decorate reply with configuration helper
  instance.decorateReply('sendConfig', function(configKey?: string) {
    if (configKey) {
      // Return specific configuration value
      const keys = configKey.split('.');
      let value = this.request.configuration;

      for (const key of keys) {
        if (value && typeof value === 'object' && key in value) {
          value = value[key];
        } else {
          return this.send({ error: `Configuration key ${configKey} not found` });
        }
      }

      return this.send({ [configKey]: value });
    } else {
      // Return full configuration (sanitized)
      const sanitizedConfig = {
        ...this.request.configuration,
        github: this.request.configuration.github ? {
          repository: this.request.configuration.github.repository,
          owner: this.request.configuration.github.owner
        } : undefined
      };

      return this.send(sanitizedConfig);
    }
  });
}

// Usage
const server = fastify();

server.register(fastifyEnvironmentConfig);

server.get('/config', (request: any, reply: any) => {
  reply.sendConfig(); // Send full configuration
});

server.get('/config/:key', (request: any, reply: any) => {
  reply.sendConfig(request.params.key); // Send specific configuration value
});

server.listen(3000, (err: any, address: any) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});
```

## Cloud Platform Integration

### AWS Integration

```typescript
// AWS Parameter Store integration
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { EnvironmentConfigurationService } from './config/EnvironmentConfigurationService';

class AWSConfigIntegration {
  private ssmClient: SSMClient;
  private configService: EnvironmentConfigurationService;

  constructor(configService: EnvironmentConfigurationService) {
    this.ssmClient = new SSMClient({ region: process.env.AWS_REGION });
    this.configService = configService;
  }

  async syncWithParameterStore(environment: string, prefix: string = '/app/') {
    try {
      // Get configuration from environment service
      const localConfig = await this.configService.getEnvironmentConfig(environment);

      // Sync to AWS Parameter Store
      await this.syncToParameterStore(localConfig, prefix + environment);

      console.log(`✅ Configuration synced to AWS Parameter Store for ${environment}`);
    } catch (error) {
      console.error('Failed to sync with AWS Parameter Store:', error);
      throw error;
    }
  }

  private async syncToParameterStore(config: any, pathPrefix: string) {
    const putParameter = async (key: string, value: any) => {
      const command = new PutParameterCommand({
        Name: `${pathPrefix}/${key}`,
        Value: typeof value === 'object' ? JSON.stringify(value) : String(value),
        Type: 'SecureString', // Encrypt sensitive parameters
        Overwrite: true
      });

      await this.ssmClient.send(command);
    };

    // Recursively sync configuration
    const syncObject = async (obj: any, prefix: string = '') => {
      for (const [key, value] of Object.entries(obj)) {
        const fullPath = prefix ? `${prefix}.${key}` : key;

        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          await syncObject(value as any, fullPath);
        } else {
          await putParameter(fullPath, value);
        }
      }
    };

    await syncObject(config);
  }

  async loadFromParameterStore(environment: string, prefix: string = '/app/') {
    try {
      // Load configuration from AWS Parameter Store
      const remoteConfig = await this.loadFromParameterStorePath(prefix + environment);

      // Save to local configuration service
      await this.configService.saveEnvironmentConfig(environment, remoteConfig);

      console.log(`✅ Configuration loaded from AWS Parameter Store for ${environment}`);
    } catch (error) {
      console.error('Failed to load from AWS Parameter Store:', error);
      throw error;
    }
  }

  private async loadFromParameterStorePath(pathPrefix: string): Promise<any> {
    // Implementation would retrieve parameters from AWS SSM
    // This is a simplified example
    const config: any = {};

    // In a real implementation, you would:
    // 1. List parameters under the path prefix
    // 2. Get each parameter value
    // 3. Parse and reconstruct the configuration object

    return config;
  }
}
```

### Azure Integration

```typescript
// Azure Key Vault integration
import { SecretClient } from '@azure/keyvault-secrets';
import { EnvironmentConfigurationService } from './config/EnvironmentConfigurationService';

class AzureConfigIntegration {
  private secretClient: SecretClient;
  private configService: EnvironmentConfigurationService;

  constructor(
    configService: EnvironmentConfigurationService,
    keyVaultUrl: string,
    credential: any
  ) {
    this.secretClient = new SecretClient(keyVaultUrl, credential);
    this.configService = configService;
  }

  async syncWithKeyVault(environment: string, prefix: string = 'app-') {
    try {
      // Get configuration from environment service
      const localConfig = await this.configService.getEnvironmentConfig(environment);

      // Sync to Azure Key Vault
      await this.syncToKeyVault(localConfig, prefix + environment);

      console.log(`✅ Configuration synced to Azure Key Vault for ${environment}`);
    } catch (error) {
      console.error('Failed to sync with Azure Key Vault:', error);
      throw error;
    }
  }

  private async syncToKeyVault(config: any, namePrefix: string) {
    const setSecret = async (key: string, value: any) => {
      const secretName = `${namePrefix}-${key.replace(/\./g, '-')}`;
      const secretValue = typeof value === 'object' ? JSON.stringify(value) : String(value);

      await this.secretClient.setSecret(secretName, secretValue);
    };

    // Recursively sync configuration
    const syncObject = async (obj: any, prefix: string = '') => {
      for (const [key, value] of Object.entries(obj)) {
        const fullPath = prefix ? `${prefix}.${key}` : key;

        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          await syncObject(value as any, fullPath);
        } else {
          await setSecret(fullPath, value);
        }
      }
    };

    await syncObject(config);
  }

  async loadFromKeyVault(environment: string, prefix: string = 'app-') {
    try {
      // Load secrets from Azure Key Vault
      const secrets = await this.loadSecretsFromKeyVault(prefix + environment);

      // Convert secrets to configuration format
      const config = this.convertSecretsToConfig(secrets);

      // Save to local configuration service
      await this.configService.saveEnvironmentConfig(environment, config);

      console.log(`✅ Configuration loaded from Azure Key Vault for ${environment}`);
    } catch (error) {
      console.error('Failed to load from Azure Key Vault:', error);
      throw error;
    }
  }

  private async loadSecretsFromKeyVault(prefix: string): Promise<Map<string, string>> {
    const secrets = new Map<string, string>();

    // In a real implementation, you would:
    // 1. List secrets with the specified prefix
    // 2. Get each secret value
    // 3. Store in the map

    for await (const secretProperties of this.secretClient.listPropertiesOfSecrets()) {
      if (secretProperties.name.startsWith(prefix)) {
        const secret = await this.secretClient.getSecret(secretProperties.name);
        secrets.set(secret.name, secret.value);
      }
    }

    return secrets;
  }

  private convertSecretsToConfig(secrets: Map<string, string>): any {
    const config: any = {};

    for (const [name, value] of secrets) {
      // Convert secret name to configuration path
      const path = name.replace(/-/g, '.');
      const keys = path.split('.');

      let current = config;
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!(key in current)) {
          current[key] = {};
        }
        current = current[key];
      }

      // Parse JSON values
      try {
        current[keys[keys.length - 1]] = JSON.parse(value);
      } catch {
        current[keys[keys.length - 1]] = value;
      }
    }

    return config;
  }
}
```

### Google Cloud Integration

```typescript
// Google Secret Manager integration
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { EnvironmentConfigurationService } from './config/EnvironmentConfigurationService';

class GCPConfigIntegration {
  private secretManager: SecretManagerServiceClient;
  private configService: EnvironmentConfigurationService;

  constructor(configService: EnvironmentConfigurationService) {
    this.secretManager = new SecretManagerServiceClient();
    this.configService = configService;
  }

  async syncWithSecretManager(environment: string, projectId: string) {
    try {
      // Get configuration from environment service
      const localConfig = await this.configService.getEnvironmentConfig(environment);

      // Sync to Google Secret Manager
      await this.syncToSecretManager(localConfig, projectId, environment);

      console.log(`✅ Configuration synced to Google Secret Manager for ${environment}`);
    } catch (error) {
      console.error('Failed to sync with Google Secret Manager:', error);
      throw error;
    }
  }

  private async syncToSecretManager(config: any, projectId: string, environment: string) {
    const parent = `projects/${projectId}`;

    const createOrUpdateSecret = async (key: string, value: any) => {
      const secretId = `app-${environment}-${key.replace(/\./g, '-')}`;
      const secretName = `${parent}/secrets/${secretId}`;
      const secretValue = typeof value === 'object' ? JSON.stringify(value) : String(value);

      try {
        // Try to update existing secret
        await this.secretManager.addSecretVersion({
          parent: secretName,
          payload: {
            data: Buffer.from(secretValue, 'utf8')
          }
        });
      } catch (error) {
        // If secret doesn't exist, create it
        if (error.code === 5) { // NOT_FOUND
          await this.secretManager.createSecret({
            parent,
            secretId,
            secret: {
              replication: {
                automatic: {}
              }
            }
          });

          // Add first version
          await this.secretManager.addSecretVersion({
            parent: secretName,
            payload: {
              data: Buffer.from(secretValue, 'utf8')
            }
          });
        } else {
          throw error;
        }
      }
    };

    // Recursively sync configuration
    const syncObject = async (obj: any, prefix: string = '') => {
      for (const [key, value] of Object.entries(obj)) {
        const fullPath = prefix ? `${prefix}.${key}` : key;

        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          await syncObject(value as any, fullPath);
        } else {
          await createOrUpdateSecret(fullPath, value);
        }
      }
    };

    await syncObject(config);
  }
}
```

## CI/CD Pipeline Integration

### GitHub Actions Integration

```yaml
# .github/workflows/config-deployment.yml
name: Environment Configuration Deployment

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  deploy-config:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Build project
      run: npm run build

    - name: Validate configuration
      run: |
        node scripts/validate-config.js
      env:
        NODE_ENV: ${{ github.ref == 'refs/heads/main' && 'production' || 'staging' }}
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

    - name: Deploy configuration
      if: github.ref == 'refs/heads/main'
      run: |
        node scripts/deploy-config.js
      env:
        NODE_ENV: production
        CONFIG_ENCRYPTION_PASSWORD: ${{ secrets.CONFIG_ENCRYPTION_PASSWORD }}
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
        AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

```typescript
// scripts/validate-config.js - Configuration validation script
import { EnvironmentConfigurationService } from '../src/config/EnvironmentConfigurationService';
import { PayloadEncryptionService } from '../src/security/PayloadEncryptionService';
import { MessageAuthenticationService } from '../src/security/MessageAuthenticationService';
import { TokenEncryptionService } from '../src/security/TokenEncryptionService';
import { GitHubPATAuthService } from '../src/services/GitHubPATAuthService';

async function validateConfiguration() {
  try {
    // Initialize services
    const payloadEncryptionService = new PayloadEncryptionService();
    const messageAuthenticationService = new MessageAuthenticationService();
    const tokenEncryptionService = new TokenEncryptionService();
    const githubPatAuthService = new GitHubPATAuthService();

    // Create configuration service
    const configService = new EnvironmentConfigurationService(
      payloadEncryptionService,
      messageAuthenticationService,
      tokenEncryptionService,
      process.env.CONFIG_ENCRYPTION_PASSWORD || 'default-password',
      githubPatAuthService
    );

    // Initialize service
    await configService.initialize({
      environment: process.env.NODE_ENV || 'development',
      enableCache: true,
      cacheTTL: 60000,
      enableHotReload: false
    });

    // Get configuration for validation
    const environment = process.env.NODE_ENV || 'development';
    const config = await configService.getEnvironmentConfig(environment);

    // Validate configuration structure
    const requiredFields = ['github', 'deployment', 'apiUrl'];
    for (const field of requiredFields) {
      if (!config[field]) {
        throw new Error(`Required configuration field missing: ${field}`);
      }
    }

    // Validate GitHub configuration
    if (config.github) {
      if (!config.github.repository) {
        throw new Error('GitHub repository not configured');
      }
      if (!config.github.owner) {
        throw new Error('GitHub owner not configured');
      }
    }

    // Validate deployment configuration
    if (config.deployment) {
      if (!config.deployment.target) {
        throw new Error('Deployment target not configured');
      }
    }

    // Validate tokens if present
    if (config.github?.token) {
      const validationResults = await configService.validateTokens({
        github: {
          token: config.github.token,
          type: 'github-pat'
        }
      });

      if (!validationResults.github.valid) {
        throw new Error(`GitHub token validation failed: ${validationResults.github.error}`);
      }
    }

    console.log(`✅ Configuration validation passed for ${environment} environment`);

    // Output configuration status
    const status = configService.getStatus();
    console.log('Configuration status:', JSON.stringify(status, null, 2));

  } catch (error) {
    console.error('❌ Configuration validation failed:', error);
    process.exit(1);
  }
}

validateConfiguration();
```

```typescript
// scripts/deploy-config.js - Configuration deployment script
import { EnvironmentConfigurationService } from '../src/config/EnvironmentConfigurationService';
import { SSMClient, PutParameterCommand } from '@aws-sdk/client-ssm';

async function deployConfiguration() {
  try {
    // Initialize configuration service (same as validation script)
    // ... initialization code ...

    // Get configuration for deployment
    const environment = process.env.NODE_ENV || 'production';
    const config = await configService.getEnvironmentConfig(environment);

    // Deploy to AWS Parameter Store
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      await deployToAWSParameterStore(config, environment);
    }

    // Deploy to other platforms as needed
    // ... additional deployment code ...

    console.log(`✅ Configuration deployed for ${environment} environment`);
  } catch (error) {
    console.error('❌ Configuration deployment failed:', error);
    process.exit(1);
  }
}

async function deployToAWSParameterStore(config: any, environment: string) {
  const ssmClient = new SSMClient({ region: process.env.AWS_REGION || 'us-east-1' });

  const putParameter = async (key: string, value: any) => {
    const command = new PutParameterCommand({
      Name: `/app/${environment}/${key}`,
      Value: typeof value === 'object' ? JSON.stringify(value) : String(value),
      Type: 'SecureString',
      Overwrite: true
    });

    await ssmClient.send(command);
  };

  // Recursively deploy configuration
  const deployObject = async (obj: any, prefix: string = '') => {
    for (const [key, value] of Object.entries(obj)) {
      const fullPath = prefix ? `${prefix}.${key}` : key;

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        await deployObject(value as any, fullPath);
      } else {
        await putParameter(fullPath, value);
      }
    }
  };

  await deployObject(config);
  console.log(`✅ Configuration deployed to AWS Parameter Store for ${environment}`);
}

deployConfiguration();
```

## Monitoring and Logging Integration

### Prometheus Integration

```typescript
// Prometheus metrics exporter for configuration service
import client from 'prom-client';

class ConfigMetricsExporter {
  private configService: EnvironmentConfigurationService;

  // Metrics
  private configLoadDuration: client.Histogram;
  private configErrorCount: client.Counter;
  private configCacheHitRatio: client.Gauge;
  private tokenValidationSuccess: client.Counter;
  private tokenValidationError: client.Counter;

  constructor(configService: EnvironmentConfigurationService) {
    this.configService = configService;

    // Initialize metrics
    this.configLoadDuration = new client.Histogram({
      name: 'config_load_duration_seconds',
      help: 'Duration of configuration loading operations',
      labelNames: ['environment', 'source']
    });

    this.configErrorCount = new client.Counter({
      name: 'config_errors_total',
      help: 'Total configuration errors',
      labelNames: ['environment', 'type']
    });

    this.configCacheHitRatio = new client.Gauge({
      name: 'config_cache_hit_ratio',
      help: 'Configuration cache hit ratio',
      labelNames: ['environment']
    });

    this.tokenValidationSuccess = new client.Counter({
      name: 'token_validation_success_total',
      help: 'Total successful token validations',
      labelNames: ['service']
    });

    this.tokenValidationError = new client.Counter({
      name: 'token_validation_errors_total',
      help: 'Total token validation errors',
      labelNames: ['service', 'error_type']
    });

    // Start collecting default metrics
    client.collectDefaultMetrics();
  }

  async collectMetrics() {
    try {
      // Collect configuration status metrics
      const status = this.configService.getStatus();

      if (status.lastLoad > 0) {
        // Record load duration (time since last load)
        const duration = (Date.now() - status.lastLoad) / 1000;
        this.configLoadDuration.observe(duration);
      }

      // Record error count
      this.configErrorCount.inc(status.errorCount);

      // Record cache hit ratio
      if (status.cache.enabled && (status.cache.hits + status.cache.misses) > 0) {
        const hitRatio = status.cache.hits / (status.cache.hits + status.cache.misses);
        this.configCacheHitRatio.set(hitRatio);
      }

      console.log('✅ Configuration metrics collected');
    } catch (error) {
      console.error('❌ Failed to collect configuration metrics:', error);
    }
  }

  // Middleware for Express.js to expose metrics endpoint
  metricsMiddleware() {
    return async (req: any, res: any) => {
      try {
        // Collect current metrics
        await this.collectMetrics();

        // Return Prometheus metrics
        res.set('Content-Type', client.register.contentType);
        res.end(await client.register.metrics());
      } catch (error) {
        res.status(500).send('Error collecting metrics');
      }
    };
  }
}

// Usage with Express.js
import express from 'express';

const app = express();
const configService = new EnvironmentConfigurationService(/* dependencies */);
const metricsExporter = new ConfigMetricsExporter(configService);

// Metrics endpoint
app.get('/metrics', metricsExporter.metricsMiddleware());

app.listen(9090, () => {
  console.log('Metrics server running on port 9090');
});
```

### Logging Integration

```typescript
// Structured logging with configuration context
import winston from 'winston';
import { EnvironmentConfigurationService } from './config/EnvironmentConfigurationService';

class ConfigAwareLogger {
  private logger: winston.Logger;
  private configService: EnvironmentConfigurationService;

  constructor(configService: EnvironmentConfigurationService) {
    this.configService = configService;

    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { service: 'environment-config-service' },
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'config-service-error.log', level: 'error' }),
        new winston.transports.File({ filename: 'config-service-combined.log' })
      ]
    });
  }

  async logWithConfigContext(
    level: string,
    message: string,
    meta: any = {}
  ) {
    try {
      // Get current environment configuration context
      const environment = process.env.NODE_ENV || 'development';
      const config = await this.configService.getEnvironmentConfig(environment);

      // Add configuration context to log entry
      const logEntry = {
        ...meta,
        environment,
        configContext: {
          github: config.github ? {
            repository: config.github.repository,
            owner: config.github.owner
          } : undefined,
          deployment: config.deployment,
          apiUrl: config.apiUrl,
          truthScore: config.truthScore,
          valid: config.valid
        },
        timestamp: new Date().toISOString()
      };

      // Log with context
      this.logger.log(level, message, logEntry);
    } catch (error) {
      // Log without configuration context if unavailable
      this.logger.log(level, message, { ...meta, configContextError: error.message });
    }
  }

  // Convenience methods
  async info(message: string, meta: any = {}) {
    await this.logWithConfigContext('info', message, meta);
  }

  async warn(message: string, meta: any = {}) {
    await this.logWithConfigContext('warn', message, meta);
  }

  async error(message: string, meta: any = {}) {
    await this.logWithConfigContext('error', message, meta);
  }

  async debug(message: string, meta: any = {}) {
    await this.logWithConfigContext('debug', message, meta);
  }
}

// Usage
const configService = new EnvironmentConfigurationService(/* dependencies */);
const logger = new ConfigAwareLogger(configService);

// Example usage
logger.info('Configuration service initialized', {
  startupTime: Date.now()
});

logger.error('Configuration validation failed', {
  error: 'Invalid GitHub token',
  retryCount: 3
});
```

## Service Mesh Integration

### Istio Integration

```typescript
// Service mesh configuration integration
class ServiceMeshConfigIntegration {
  private configService: EnvironmentConfigurationService;

  constructor(configService: EnvironmentConfigurationService) {
    this.configService = configService;
  }

  async generateIstioConfig(environment: string) {
    try {
      const config = await this.configService.getEnvironmentConfig(environment);

      // Generate Istio configuration based on environment config
      const istioConfig = {
        apiVersion: 'networking.istio.io/v1alpha3',
        kind: 'VirtualService',
        metadata: {
          name: `app-${environment}-virtual-service`
        },
        spec: {
          hosts: [this.getHostName(config)],
          gateways: [this.getGatewayName(environment)],
          http: [
            {
              match: [
                {
                  uri: {
                    prefix: '/api/'
                  }
                }
              ],
              route: [
                {
                  destination: {
                    host: this.getServiceHost(config),
                    port: {
                      number: this.getServicePort(config)
                    }
                  },
                  weight: 100
                }
              ],
              retries: {
                attempts: config.limits?.maxRetries || 3,
                perTryTimeout: `${config.limits?.retryTimeout || 2}s`
              },
              timeout: `${config.limits?.requestTimeout || 15}s`
            }
          ]
        }
      };

      // Save Istio configuration
      await this.saveIstioConfig(istioConfig, environment);

      console.log(`✅ Istio configuration generated for ${environment}`);
      return istioConfig;
    } catch (error) {
      console.error('Failed to generate Istio configuration:', error);
      throw error;
    }
  }

  private getHostName(config: any): string {
    return config.deployment?.hostName || 'app.example.com';
  }

  private getGatewayName(environment: string): string {
    return `app-${environment}-gateway`;
  }

  private getServiceHost(config: any): string {
    return config.deployment?.serviceHost || 'app-service';
  }

  private getServicePort(config: any): number {
    return config.deployment?.servicePort || 8080;
  }

  private async saveIstioConfig(config: any, environment: string) {
    // Save to file or Kubernetes API
    const fileName = `istio-config-${environment}.yaml`;

    // Implementation would save the configuration
    console.log(`Saving Istio config to ${fileName}`);
  }

  async applyServiceMeshPolicies(environment: string) {
    try {
      const config = await this.configService.getEnvironmentConfig(environment);

      // Generate rate limiting policies
      const rateLimitPolicy = this.generateRateLimitPolicy(config, environment);

      // Generate security policies
      const securityPolicy = this.generateSecurityPolicy(config, environment);

      // Generate traffic management policies
      const trafficPolicy = this.generateTrafficPolicy(config, environment);

      // Apply policies to service mesh
      await this.applyToServiceMesh([
        rateLimitPolicy,
        securityPolicy,
        trafficPolicy
      ], environment);

      console.log(`✅ Service mesh policies applied for ${environment}`);
    } catch (error) {
      console.error('Failed to apply service mesh policies:', error);
      throw error;
    }
  }

  private generateRateLimitPolicy(config: any, environment: string): any {
    return {
      apiVersion: 'config.istio.io/v1alpha2',
      kind: 'QuotaSpec',
      metadata: {
        name: `app-${environment}-rate-limit`
      },
      spec: {
        rules: [
          {
            quotas: [
              {
                quota: 'RequestCount',
                charge: 1
              }
            ]
          }
        ]
      }
    };
  }

  private generateSecurityPolicy(config: any, environment: string): any {
    return {
      apiVersion: 'security.istio.io/v1beta1',
      kind: 'AuthorizationPolicy',
      metadata: {
        name: `app-${environment}-authz`
      },
      spec: {
        action: 'ALLOW',
        rules: [
          {
            from: [
              {
                source: {
                  principals: config.security?.allowedPrincipals || ['cluster.local/ns/default/sa/app']
                }
              }
            ]
          }
        ]
      }
    };
  }

  private generateTrafficPolicy(config: any, environment: string): any {
    return {
      apiVersion: 'networking.istio.io/v1alpha3',
      kind: 'DestinationRule',
      metadata: {
        name: `app-${environment}-destination-rule`
      },
      spec: {
        host: this.getServiceHost(config),
        trafficPolicy: {
          connectionPool: {
            tcp: {
              maxConnections: config.limits?.maxConnections || 100
            },
            http: {
              http1MaxPendingRequests: config.limits?.maxPendingRequests || 1000,
              maxRequestsPerConnection: config.limits?.maxRequestsPerConnection || 10
            }
          },
          outlierDetection: {
            consecutive5xxErrors: config.limits?.consecutiveErrors || 5,
            interval: '10s',
            baseEjectionTime: '30s'
          }
        }
      }
    };
  }

  private async applyToServiceMesh(policies: any[], environment: string) {
    // Implementation would apply policies to service mesh
    // This could involve kubectl apply or direct API calls
    for (const policy of policies) {
      console.log(`Applying policy: ${policy.kind}/${policy.metadata.name}`);
    }
  }
}
```

This integration guide provides comprehensive examples for integrating the Environment Configuration Management system with various frameworks, platforms, and services. Each integration pattern demonstrates best practices for security, monitoring, and operational excellence.