"use strict";
// CloudEnvironmentAdapter.ts - Cloud environment adapter implementation
// Phase 4: Environment Configuration Management - Task X: Implement Cloud Environment Adapter
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudEnvironmentAdapter = void 0;
const EnvironmentAdapter_1 = require("../EnvironmentAdapter");
const ConfigurationManager_1 = require("../ConfigurationManager");
/**
 * Cloud environment adapter
 */
class CloudEnvironmentAdapter {
    constructor() {
        this.environment = EnvironmentAdapter_1.EnvironmentType.PRODUCTION; // Treat cloud as production-like
    }
    /**
     * Get current environment
     * @returns Current environment
     */
    getEnvironment() {
        return this.environment;
    }
    /**
     * Get environment-specific configuration sources
     * @returns Configuration sources
     */
    getConfigurationSources() {
        const sources = [];
        // Secure storage for cloud secrets
        sources.push({
            name: 'cloud-secure-storage',
            type: ConfigurationManager_1.ConfigurationSourceType.SECURE_STORAGE,
            options: {
                namespace: 'cloud-config'
            }
        });
        // Environment variable source with cloud prefix
        sources.push({
            name: 'cloud-environment-variables',
            type: ConfigurationManager_1.ConfigurationSourceType.ENVIRONMENT,
            options: {
                prefix: 'CLOUD_'
            }
        });
        // Remote configuration source for cloud
        sources.push({
            name: 'remote-cloud-config',
            type: ConfigurationManager_1.ConfigurationSourceType.REMOTE,
            options: {
                url: process.env.CLOUD_CONFIG_URL || 'https://config.example.com/cloud',
                headers: {
                    'Authorization': `Bearer ${process.env.CLOUD_CONFIG_TOKEN}`
                },
                timeout: 5000
            }
        });
        // Cloud metadata service (e.g., AWS EC2 metadata, GCP metadata, Azure instance metadata)
        sources.push({
            name: 'cloud-metadata-service',
            type: ConfigurationManager_1.ConfigurationSourceType.REMOTE,
            options: {
                url: this.getCloudMetadataServiceUrl(),
                timeout: 2000
            }
        });
        return sources;
    }
    /**
     * Transform configuration for environment
     * @param config - Configuration to transform
     * @returns Transformed configuration
     */
    transformConfiguration(config) {
        // In cloud environments, we want optimized production behavior
        config.debug = false;
        // Set cloud-specific logging level
        if (config.logging === undefined) {
            config.logging = {
                level: 'warn',
                format: 'json'
            };
        }
        // Disable hot reloading in cloud
        config.hotReload = false;
        // Set cloud-specific API endpoints
        if (config.api && config.api.baseUrl === undefined) {
            config.api.baseUrl = process.env.CLOUD_API_URL || 'https://api.example.com';
        }
        // Enable cloud monitoring
        if (config.monitoring === undefined) {
            config.monitoring = {
                enabled: true,
                level: 'production'
            };
        }
        // Set cloud security settings
        if (config.security === undefined) {
            config.security = {
                ssl: true,
                cors: {
                    enabled: true,
                    origins: this.getAllowedOrigins()
                }
            };
        }
        // Configure cloud-specific services
        if (config.cloud === undefined) {
            config.cloud = {
                provider: this.detectCloudProvider(),
                autoScaling: true,
                loadBalancing: true
            };
        }
        // Set resource limits appropriate for cloud
        if (config.limits === undefined) {
            config.limits = {
                maxFileSize: 104857600, // 100MB
                maxConnections: 1000,
                syncTimeout: 60000 // 60 seconds
            };
        }
        return config;
    }
    /**
     * Validate configuration for environment
     * @param config - Configuration to validate
     * @returns Validation result
     */
    validateConfiguration(config) {
        const errors = [];
        const warnings = [];
        // In cloud environments, we require strict configuration validation
        if (!config.api || !config.api.baseUrl) {
            errors.push('API base URL is required in cloud environment');
        }
        // Validate SSL configuration
        if (config.api && config.api.baseUrl && !config.api.baseUrl.startsWith('https://')) {
            errors.push('API base URL must use HTTPS in cloud environment');
        }
        // Validate security configuration
        if (config.security) {
            if (config.security.ssl !== true) {
                errors.push('SSL must be enabled in cloud environment');
            }
            if (config.security.cors && config.security.cors.enabled !== true) {
                warnings.push('CORS should be enabled in cloud environment');
            }
        }
        else {
            errors.push('Security configuration is required for cloud');
        }
        // Validate logging configuration
        if (config.logging) {
            if (!['warn', 'error'].includes(config.logging.level)) {
                warnings.push(`Logging level should be warn or error in cloud: ${config.logging.level}`);
            }
        }
        else {
            errors.push('Logging configuration is required for cloud');
        }
        // Validate monitoring configuration
        if (config.monitoring && config.monitoring.enabled !== true) {
            errors.push('Monitoring must be enabled in cloud environment');
        }
        // Validate cloud configuration
        if (config.cloud) {
            if (!config.cloud.provider) {
                errors.push('Cloud provider must be specified');
            }
            else if (!['aws', 'gcp', 'azure', 'other'].includes(config.cloud.provider)) {
                warnings.push(`Unknown cloud provider: ${config.cloud.provider}`);
            }
            if (config.cloud.autoScaling !== true) {
                warnings.push('Auto-scaling should be enabled in cloud environment');
            }
        }
        else {
            errors.push('Cloud configuration is required for cloud deployments');
        }
        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }
    /**
     * Detect cloud provider based on environment
     * @returns Cloud provider name
     */
    detectCloudProvider() {
        // Check for AWS
        if (process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION) {
            return 'aws';
        }
        // Check for GCP
        if (process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT) {
            return 'gcp';
        }
        // Check for Azure
        if (process.env.AZURE_SUBSCRIPTION_ID) {
            return 'azure';
        }
        // Check for common cloud environment variables
        if (process.env.KUBERNETES_SERVICE_HOST) {
            return 'kubernetes';
        }
        return 'other';
    }
    /**
     * Get cloud metadata service URL based on detected provider
     * @returns Metadata service URL
     */
    getCloudMetadataServiceUrl() {
        const provider = this.detectCloudProvider();
        switch (provider) {
            case 'aws':
                return 'http://169.254.169.254/latest/meta-data/';
            case 'gcp':
                return 'http://metadata.google.internal/computeMetadata/v1/';
            case 'azure':
                return 'http://169.254.169.254/metadata/instance?api-version=2020-06-01';
            default:
                return 'http://169.254.169.254/'; // Default metadata endpoint
        }
    }
    /**
     * Get allowed origins based on cloud provider
     * @returns Array of allowed origins
     */
    getAllowedOrigins() {
        const origins = [];
        // Add default origins
        origins.push('https://example.com');
        // Add cloud-specific origins if available
        if (process.env.CLOUD_ALLOWED_ORIGIN) {
            origins.push(process.env.CLOUD_ALLOWED_ORIGIN);
        }
        // Add multiple origins from comma-separated env var
        if (process.env.CLOUD_ALLOWED_ORIGINS) {
            const additionalOrigins = process.env.CLOUD_ALLOWED_ORIGINS.split(',').map(o => o.trim());
            origins.push(...additionalOrigins);
        }
        return origins;
    }
}
exports.CloudEnvironmentAdapter = CloudEnvironmentAdapter;
//# sourceMappingURL=CloudEnvironmentAdapter.js.map