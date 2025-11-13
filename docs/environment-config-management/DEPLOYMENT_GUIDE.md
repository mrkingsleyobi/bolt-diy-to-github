# Environment Configuration Management System - Deployment Guide

## Overview

This document provides a comprehensive deployment guide for the Environment Configuration Management system. It covers installation, configuration, environment-specific deployment procedures, monitoring, and maintenance practices to ensure successful deployment across all environments while maintaining security and performance standards.

## Prerequisites

### System Requirements

#### Production Environment
- **Operating System**: Linux (Ubuntu 20.04+, CentOS 8+, or equivalent)
- **Node.js**: Version 18.x or higher
- **Memory**: Minimum 2GB RAM (4GB recommended)
- **Storage**: Minimum 10GB available disk space
- **Network**: HTTPS access to remote configuration sources
- **Security**: SELinux/AppArmor configured for containerized deployment

#### Development Environment
- **Operating System**: macOS 12+, Windows 10+, or Linux
- **Node.js**: Version 16.x or higher
- **Memory**: Minimum 1GB RAM
- **Storage**: Minimum 5GB available disk space

#### Testing Environment
- **Operating System**: Linux (Ubuntu 18.04+ or equivalent)
- **Node.js**: Version 16.x or higher
- **Memory**: Minimum 1GB RAM
- **Storage**: Minimum 5GB available disk space

### Dependencies

The system requires the following dependencies to be installed:

```json
{
  "dependencies": {
    "typescript": "^4.9.0",
    "ts-node": "^10.9.0",
    "yaml": "^2.3.0",
    "fs-extra": "^11.1.0",
    "node-fetch": "^3.3.0",
    "@types/node": "^18.0.0"
  },
  "devDependencies": {
    "jest": "^29.0.0",
    "ts-jest": "^29.0.0",
    "@types/jest": "^29.0.0",
    "eslint": "^8.0.0",
    "prettier": "^2.8.0"
  },
  "peerDependencies": {
    "@bolt-diy/security": "^1.0.0"
  }
}
```

## Installation

### Package Installation

#### NPM Installation

```bash
# Install the configuration management system
npm install @bolt-diy/config-management

# Install peer dependencies
npm install @bolt-diy/security
```

#### Manual Installation

```bash
# Clone the repository
git clone https://github.com/bolt-diy/config-management.git
cd config-management

# Install dependencies
npm ci

# Build the project
npm run build

# Verify installation
npm run test
```

### Docker Deployment

```dockerfile
# Dockerfile for configuration management service
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY dist/ ./dist/
COPY config/ ./config/

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
USER nextjs

# Expose port (if running as service)
EXPOSE 3001

# Start the service
CMD ["node", "dist/index.js"]
```

```bash
# Build Docker image
docker build -t bolt-diy-config-management:latest .

# Run container
docker run -d \
  --name config-management \
  -p 3001:3001 \
  -v /host/config:/app/config \
  -e NODE_ENV=production \
  bolt-diy-config-management:latest
```

## Configuration

### Environment Variables

The system supports the following environment variables:

```bash
# Core configuration
NODE_ENV=production
CONFIG_ENV=production
CONFIG_CACHE_ENABLED=true
CONFIG_CACHE_TTL=60000
CONFIG_HOT_RELOAD=false

# File provider settings
CONFIG_FILE_PATH=/etc/bolt-diy/config.json
CONFIG_FILE_FORMAT=json

# Environment provider settings
CONFIG_ENV_PREFIX=APP_

# Remote provider settings
CONFIG_REMOTE_URL=https://config.example.com/api/v1/config
CONFIG_REMOTE_TIMEOUT=5000
CONFIG_REMOTE_HEADERS='{"Authorization": "Bearer ${CONFIG_API_TOKEN}"}'

# Security settings
CONFIG_ENCRYPTION_KEY=${ENCRYPTION_KEY}
CONFIG_AUTH_PRIVATE_KEY=${AUTH_PRIVATE_KEY}
CONFIG_AUTH_PUBLIC_KEY=${AUTH_PUBLIC_KEY}

# Monitoring settings
CONFIG_LOG_LEVEL=info
CONFIG_LOG_FORMAT=json
CONFIG_METRICS_ENABLED=true
CONFIG_METRICS_PORT=9090
```

### Configuration Files

#### Development Configuration

```json
// config/development.json
{
  "debug": true,
  "logging": {
    "level": "debug",
    "format": "pretty",
    "transports": ["console"]
  },
  "api": {
    "baseUrl": "http://localhost:3000",
    "timeout": 30000
  },
  "hotReload": true,
  "cache": {
    "enabled": true,
    "ttl": 30000
  }
}
```

#### Production Configuration

```yaml
# config/production.yaml
debug: false
logging:
  level: warn
  format: json
  transports:
    - console
    - file
api:
  baseUrl: https://api.production.example.com
  timeout: 10000
cache:
  enabled: true
  ttl: 60000
security:
  encryption:
    enabled: true
    algorithm: aes-256-gcm
  authentication:
    enabled: true
    algorithm: sha256
monitoring:
  metrics:
    enabled: true
    port: 9090
  health:
    enabled: true
    path: /health
```

## Deployment Procedures

### Development Environment Deployment

```bash
#!/bin/bash
# deploy-dev.sh

echo "Deploying Configuration Management System - Development Environment"

# Set environment variables
export NODE_ENV=development
export CONFIG_ENV=development
export CONFIG_CACHE_ENABLED=true
export CONFIG_HOT_RELOAD=true

# Install dependencies
echo "Installing dependencies..."
npm ci

# Run tests
echo "Running tests..."
npm run test

# Start development server
echo "Starting development server..."
npm run dev

echo "Development deployment complete"
```

### Staging Environment Deployment

```bash
#!/bin/bash
# deploy-staging.sh

echo "Deploying Configuration Management System - Staging Environment"

# Set environment variables
export NODE_ENV=production
export CONFIG_ENV=staging
export CONFIG_CACHE_ENABLED=true
export CONFIG_HOT_RELOAD=false

# Install production dependencies only
echo "Installing production dependencies..."
npm ci --only=production

# Run build
echo "Building application..."
npm run build

# Run staging tests
echo "Running staging tests..."
npm run test:staging

# Start staging server
echo "Starting staging server..."
npm run start:staging

echo "Staging deployment complete"
```

### Production Environment Deployment

```bash
#!/bin/bash
# deploy-production.sh

echo "Deploying Configuration Management System - Production Environment"

# Validate environment
if [ "$NODE_ENV" != "production" ]; then
  echo "Error: NODE_ENV must be set to production"
  exit 1
fi

# Set production environment variables
export CONFIG_ENV=production
export CONFIG_CACHE_ENABLED=true
export CONFIG_HOT_RELOAD=false
export CONFIG_LOG_LEVEL=warn

# Install production dependencies
echo "Installing production dependencies..."
npm ci --only=production --ignore-scripts

# Run production build
echo "Building for production..."
npm run build:prod

# Run production validation
echo "Validating production configuration..."
npm run validate:prod

# Start production server with PM2
echo "Starting production server..."
pm2 start dist/index.js --name config-management --max-memory-restart 1G

# Save PM2 configuration
pm2 save

echo "Production deployment complete"
```

## Environment-Specific Deployment

### Development Deployment

#### Local Development Setup

```bash
# 1. Clone repository
git clone https://github.com/bolt-diy/config-management.git
cd config-management

# 2. Install dependencies
npm install

# 3. Create development configuration
cat > config/development.json << EOF
{
  "debug": true,
  "hotReload": true,
  "api": {
    "baseUrl": "http://localhost:3000"
  }
}
EOF

# 4. Start development server
npm run dev
```

#### Development with Hot Reloading

```typescript
// src/dev-server.ts
import { BasicConfigurationManager } from './config/BasicConfigurationManager';
import { DevelopmentEnvironmentAdapter } from './config/adapters/DevelopmentEnvironmentAdapter';

async function startDevServer() {
  const configManager = new BasicConfigurationManager(
    encryptionService,
    authenticationService
  );

  // Enable hot reloading for development
  await configManager.initialize({
    environment: 'development',
    enableCache: true,
    enableHotReload: true,
    hotReloadInterval: 3000 // Reload every 3 seconds
  });

  console.log('Development configuration server started');
  console.log('Hot reloading enabled - watching for configuration changes');

  // Watch for configuration file changes
  const watcher = chokidar.watch('./config/**/*.json');
  watcher.on('change', async (path) => {
    console.log(`Configuration file changed: ${path}`);
    await configManager.reload();
    console.log('Configuration reloaded');
  });
}
```

### Production Deployment

#### Kubernetes Deployment

```yaml
# k8s/config-management-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: config-management
  labels:
    app: config-management
spec:
  replicas: 3
  selector:
    matchLabels:
      app: config-management
  template:
    metadata:
      labels:
        app: config-management
    spec:
      containers:
      - name: config-management
        image: bolt-diy/config-management:latest
        ports:
        - containerPort: 3001
        env:
        - name: NODE_ENV
          value: "production"
        - name: CONFIG_ENV
          value: "production"
        - name: CONFIG_CACHE_ENABLED
          value: "true"
        - name: CONFIG_ENCRYPTION_KEY
          valueFrom:
            secretKeyRef:
              name: config-secrets
              key: encryption-key
        volumeMounts:
        - name: config-volume
          mountPath: /app/config
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3001
          initialDelaySeconds: 5
          periodSeconds: 5
      volumes:
      - name: config-volume
        configMap:
          name: config-files
---
apiVersion: v1
kind: Service
metadata:
  name: config-management-service
spec:
  selector:
    app: config-management
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3001
  type: ClusterIP
```

#### Production Security Configuration

```bash
# Create Kubernetes secrets for production
kubectl create secret generic config-secrets \
  --from-literal=encryption-key="$(openssl rand -base64 32)" \
  --from-literal=auth-private-key="$(openssl genrsa 2048)" \
  --from-literal=auth-public-key="$(openssl rsa -in auth-private-key -pubout)"

# Create ConfigMap for configuration files
kubectl create configmap config-files \
  --from-file=config/production.json \
  --from-file=config/production.yaml
```

### Cloud Provider Deployment

#### AWS Deployment with ECS

```json
// task-definition.json
{
  "family": "config-management",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::123456789012:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "config-management",
      "image": "bolt-diy/config-management:latest",
      "portMappings": [
        {
          "containerPort": 3001,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "CONFIG_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "CONFIG_ENCRYPTION_KEY",
          "valueFrom": "arn:aws:ssm:us-west-2:123456789012:parameter/config/encryption-key"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/config-management",
          "awslogs-region": "us-west-2",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

#### Google Cloud Deployment

```bash
# Deploy to Google Cloud Run
gcloud run deploy config-management \
  --image gcr.io/PROJECT_ID/config-management \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production,CONFIG_ENV=production \
  --set-secrets CONFIG_ENCRYPTION_KEY=config-encryption-key:latest
```

## Monitoring and Observability

### Health Checks

```typescript
// src/monitoring/health-check.ts
import { ConfigurationManager } from '../config/ConfigurationManager';

class HealthCheckService {
  constructor(private configManager: ConfigurationManager) {}

  async performHealthCheck(): Promise<HealthCheckResult> {
    const checks: HealthCheck[] = [];

    // Configuration manager health
    checks.push(await this.checkConfigurationManager());

    // Provider availability
    checks.push(await this.checkProviders());

    // Cache health
    checks.push(await this.checkCache());

    // Security services
    checks.push(await this.checkSecurityServices());

    const overallStatus = checks.every(check => check.status === 'healthy')
      ? 'healthy'
      : checks.some(check => check.status === 'degraded')
        ? 'degraded'
        : 'unhealthy';

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks
    };
  }

  private async checkConfigurationManager(): Promise<HealthCheck> {
    try {
      const status = this.configManager.getStatus();
      const isHealthy = status.loaded && status.errorCount === 0;

      return {
        name: 'configuration-manager',
        status: isHealthy ? 'healthy' : 'unhealthy',
        message: isHealthy ? 'Configuration manager is operational' : 'Configuration manager has errors',
        details: {
          loaded: status.loaded,
          errorCount: status.errorCount,
          cacheEnabled: status.cache.enabled
        }
      };
    } catch (error) {
      return {
        name: 'configuration-manager',
        status: 'unhealthy',
        message: `Configuration manager check failed: ${error.message}`,
        details: { error: error.message }
      };
    }
  }
}
```

### Metrics Collection

```typescript
// src/monitoring/metrics.ts
import { collectDefaultMetrics, Registry, Gauge, Counter, Histogram } from 'prom-client';

class ConfigurationMetrics {
  private registry: Registry;
  private configLoadDuration: Histogram;
  private configRequests: Counter;
  private cacheHits: Counter;
  private cacheMisses: Counter;
  private errors: Counter;

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
      labelNames: ['environment', 'source']
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
      labelNames: ['type', 'environment']
    });
  }

  recordLoadDuration(duration: number): void {
    this.configLoadDuration.observe(duration);
  }

  recordRequest(environment: string, source: string): void {
    this.configRequests.inc({ environment, source });
  }

  recordCacheHit(): void {
    this.cacheHits.inc();
  }

  recordCacheMiss(): void {
    this.cacheMisses.inc();
  }

  recordError(type: string, environment: string): void {
    this.errors.inc({ type, environment });
  }

  async getMetrics(): Promise<string> {
    return await this.registry.metrics();
  }
}
```

### Logging Configuration

```typescript
// src/monitoring/logging.ts
import winston from 'winston';
import { format, transports } from 'winston';

class ConfigurationLogger {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.CONFIG_LOG_LEVEL || 'info',
      format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        process.env.CONFIG_LOG_FORMAT === 'json'
          ? format.json()
          : format.prettyPrint()
      ),
      defaultMeta: { service: 'config-management' },
      transports: [
        new transports.Console({
          level: process.env.CONFIG_LOG_LEVEL || 'info'
        }),
        new transports.File({
          filename: 'logs/config-error.log',
          level: 'error'
        }),
        new transports.File({
          filename: 'logs/config-combined.log'
        })
      ]
    });
  }

  log(level: string, message: string, meta?: any): void {
    this.logger.log(level, message, meta);
  }

  error(message: string, error?: Error, meta?: any): void {
    this.logger.error(message, { error, ...meta });
  }

  warn(message: string, meta?: any): void {
    this.logger.warn(message, meta);
  }

  info(message: string, meta?: any): void {
    this.logger.info(message, meta);
  }

  debug(message: string, meta?: any): void {
    this.logger.debug(message, meta);
  }
}
```

## Security Deployment

### Secure Configuration

#### Environment Variable Management

```bash
# Production environment variable setup
#!/bin/bash

# Load secrets from secure storage
export CONFIG_ENCRYPTION_KEY=$(aws ssm get-parameter --name "/config/encryption-key" --with-decryption --query "Parameter.Value" --output text)
export CONFIG_AUTH_PRIVATE_KEY=$(aws ssm get-parameter --name "/config/auth-private-key" --with-decryption --query "Parameter.Value" --output text)
export CONFIG_REMOTE_AUTH_TOKEN=$(aws secretsmanager get-secret-value --secret-id "config/remote-auth-token" --query "SecretString" --output text)

# Validate required secrets
if [ -z "$CONFIG_ENCRYPTION_KEY" ] || [ -z "$CONFIG_AUTH_PRIVATE_KEY" ]; then
  echo "Error: Required security secrets not found"
  exit 1
fi

echo "Security secrets loaded successfully"
```

#### Certificate Management

```bash
# Generate and manage TLS certificates
#!/bin/bash

# Generate self-signed certificate for internal services
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/CN=config-management/O=Bolt DIY/C=US"

# For production, use Let's Encrypt or corporate CA
# Install certbot for Let's Encrypt
sudo apt-get install certbot

# Obtain certificate
sudo certbot certonly --standalone -d config.production.example.com

# Set up automatic renewal
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

### Network Security

#### Firewall Configuration

```bash
# UFW firewall configuration for production
sudo ufw enable
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH
sudo ufw allow ssh

# Allow HTTP/HTTPS for web interface
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow configuration service port
sudo ufw allow 3001/tcp

# Allow monitoring port (if exposed)
sudo ufw allow 9090/tcp

# Log all denied connections
sudo ufw logging on

echo "Firewall configured for configuration management service"
```

#### Service Mesh Integration

```yaml
# Istio service mesh configuration
apiVersion: networking.istio.io/v1alpha3
kind: DestinationRule
metadata:
  name: config-management
spec:
  host: config-management-service
  trafficPolicy:
    tls:
      mode: ISTIO_MUTUAL
    connectionPool:
      tcp:
        maxConnections: 100
      http:
        http1MaxPendingRequests: 1000
        maxRequestsPerConnection: 10
    outlierDetection:
      consecutiveErrors: 5
      interval: 30s
      baseEjectionTime: 30s
```

## Backup and Recovery

### Configuration Backup

```bash
#!/bin/bash
# backup-config.sh

BACKUP_DIR="/backup/config-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup configuration files
cp -r /etc/bolt-diy/config "$BACKUP_DIR/"
cp -r /app/config "$BACKUP_DIR/app-config"

# Backup encrypted configuration
if [ -f "/var/lib/config/secure-storage.db" ]; then
  cp /var/lib/config/secure-storage.db "$BACKUP_DIR/"
fi

# Backup environment variables
printenv | grep "^CONFIG_" > "$BACKUP_DIR/env-vars.txt"

# Create backup archive
tar -czf "$BACKUP_DIR.tar.gz" -C /backup "$(basename $BACKUP_DIR)"

# Upload to remote storage
aws s3 cp "$BACKUP_DIR.tar.gz" s3://config-backups/

echo "Configuration backup completed: $BACKUP_DIR.tar.gz"
```

### Disaster Recovery

```bash
#!/bin/bash
# restore-config.sh

BACKUP_FILE=$1
if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup-file.tar.gz>"
  exit 1
fi

# Stop configuration service
sudo systemctl stop config-management

# Extract backup
TEMP_DIR="/tmp/config-restore"
mkdir -p "$TEMP_DIR"
tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"

# Restore configuration files
cp -r "$TEMP_DIR/config" /etc/bolt-diy/
cp -r "$TEMP_DIR/app-config" /app/

# Restore secure storage
if [ -f "$TEMP_DIR/secure-storage.db" ]; then
  cp "$TEMP_DIR/secure-storage.db" /var/lib/config/
  chown config-user:config-group /var/lib/config/secure-storage.db
  chmod 600 /var/lib/config/secure-storage.db
fi

# Restore environment variables
while IFS= read -r line; do
  export "$line"
done < "$TEMP_DIR/env-vars.txt"

# Start configuration service
sudo systemctl start config-management

# Verify restoration
curl -f http://localhost:3001/health || echo "Warning: Service health check failed"

echo "Configuration restoration completed"
```

## Maintenance Procedures

### Regular Maintenance Tasks

```bash
# maintenance.sh
#!/bin/bash

echo "Running Configuration Management Maintenance"

# 1. Rotate logs
logrotate /etc/logrotate.d/config-management

# 2. Clean up temporary files
find /tmp -name "config-*" -mtime +7 -delete

# 3. Check disk space
DISK_USAGE=$(df /var/lib/config | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 80 ]; then
  echo "Warning: Disk usage is ${DISK_USAGE}%"
  # Clean up old cache entries
  find /var/cache/config -mtime +30 -delete
fi

# 4. Update dependencies
npm audit --audit-level high

# 5. Restart service if needed
if [ -f "/var/run/config-management-restart" ]; then
  sudo systemctl restart config-management
  rm /var/run/config-management-restart
  echo "Service restarted for maintenance"
fi

echo "Maintenance completed"
```

### Performance Optimization

```bash
# optimize.sh
#!/bin/bash

echo "Optimizing Configuration Management Performance"

# 1. Analyze cache performance
CACHE_HIT_RATE=$(curl -s http://localhost:9090/metrics | grep "config_cache_hit" | awk '{print $2}')
if (( $(echo "$CACHE_HIT_RATE < 0.8" | bc -l) )); then
  echo "Warning: Cache hit rate is low: ${CACHE_HIT_RATE}"
  # Consider increasing cache size or adjusting TTL
fi

# 2. Monitor memory usage
MEMORY_USAGE=$(ps -o rss= -p $(cat /var/run/config-management.pid))
if [ "$MEMORY_USAGE" -gt 500000 ]; then
  echo "Warning: High memory usage: ${MEMORY_USAGE}KB"
  # Consider restarting service to free memory
fi

# 3. Optimize database (if using persistent storage)
if [ -f "/var/lib/config/secure-storage.db" ]; then
  sqlite3 /var/lib/config/secure-storage.db "VACUUM;"
  sqlite3 /var/lib/config/secure-storage.db "ANALYZE;"
fi

echo "Performance optimization completed"
```

## Troubleshooting

### Common Deployment Issues

#### Configuration Loading Failures

```bash
# Check configuration service logs
journalctl -u config-management -f

# Verify configuration files
ls -la /etc/bolt-diy/config/
cat /etc/bolt-diy/config/production.json

# Test configuration loading
node -e "
const { BasicConfigurationManager } = require('./dist/config/BasicConfigurationManager');
const cm = new BasicConfigurationManager();
cm.initialize({ environment: 'production' }).then(() => {
  console.log('Configuration loaded successfully');
  console.log(cm.getStatus());
}).catch(err => {
  console.error('Configuration loading failed:', err);
});
"
```

#### Security-Related Issues

```bash
# Verify encryption keys
echo $CONFIG_ENCRYPTION_KEY | wc -c

# Test encryption service
node -e "
const { PayloadEncryptionService } = require('@bolt-diy/security');
const service = new PayloadEncryptionService();
service.encrypt('test').then(encrypted => {
  console.log('Encryption working');
  return service.decrypt(encrypted);
}).then(decrypted => {
  console.log('Decryption working');
}).catch(err => {
  console.error('Encryption/decryption failed:', err);
});
"
```

#### Performance Issues

```bash
# Monitor system resources
top -p $(cat /var/run/config-management.pid)

# Check for memory leaks
watch -n 5 'ps -o pid,rss,vsz,comm -p $(cat /var/run/config-management.pid)'

# Analyze configuration access patterns
curl -s http://localhost:9090/metrics | grep "config_requests"
```

### Rollback Procedures

```bash
#!/bin/bash
# rollback.sh

PREVIOUS_VERSION=$1
if [ -z "$PREVIOUS_VERSION" ]; then
  echo "Usage: $0 <previous-version>"
  exit 1
fi

echo "Rolling back to version: $PREVIOUS_VERSION"

# 1. Stop current service
sudo systemctl stop config-management

# 2. Restore previous deployment
if [ -d "/opt/config-management-$PREVIOUS_VERSION" ]; then
  # Remove current symlink
  rm /opt/config-management-current

  # Create new symlink to previous version
  ln -s "/opt/config-management-$PREVIOUS_VERSION" /opt/config-management-current

  # Restore previous configuration if needed
  if [ -f "/backup/config-$PREVIOUS_VERSION.tar.gz" ]; then
    /opt/config-management-current/scripts/restore-config.sh "/backup/config-$PREVIOUS_VERSION.tar.gz"
  fi
else
  echo "Error: Previous version $PREVIOUS_VERSION not found"
  exit 1
fi

# 3. Start service with previous version
sudo systemctl start config-management

# 4. Verify rollback
sleep 10
curl -f http://localhost:3001/health || echo "Warning: Health check failed after rollback"

echo "Rollback to version $PREVIOUS_VERSION completed"
```

This deployment guide provides comprehensive instructions for deploying the Environment Configuration Management system across different environments while ensuring security, performance, and maintainability standards are met.