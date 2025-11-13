"use strict";
// ProductionEnvironmentAdapter.ts - Production environment adapter implementation
// Phase 4: Environment Configuration Management - Task 7: Implement Production Environment Adapter
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductionEnvironmentAdapter = void 0;
const EnvironmentAdapter_1 = require("../EnvironmentAdapter");
const ConfigurationManager_1 = require("../ConfigurationManager");
/**
 * Production environment adapter
 */
class ProductionEnvironmentAdapter {
    constructor() {
        this.environment = EnvironmentAdapter_1.EnvironmentType.PRODUCTION;
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
        // Secure storage for production secrets
        sources.push({
            name: 'secure-storage',
            type: ConfigurationManager_1.ConfigurationSourceType.SECURE_STORAGE,
            options: {
                namespace: 'production-config'
            }
        });
        // Environment variable source with production prefix
        sources.push({
            name: 'production-environment-variables',
            type: ConfigurationManager_1.ConfigurationSourceType.ENVIRONMENT,
            options: {
                prefix: 'PROD_'
            }
        });
        // Remote configuration source for production
        sources.push({
            name: 'remote-production-config',
            type: ConfigurationManager_1.ConfigurationSourceType.REMOTE,
            options: {
                url: process.env.PROD_CONFIG_URL || 'https://config.example.com/production',
                headers: {
                    'Authorization': `Bearer ${process.env.PROD_CONFIG_TOKEN}`
                },
                timeout: 5000
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
        // In production, we want optimized behavior
        config.debug = false;
        // Set production-specific logging level
        if (config.logging === undefined) {
            config.logging = {
                level: 'warn',
                format: 'json'
            };
        }
        // Disable hot reloading in production
        config.hotReload = false;
        // Set production-specific API endpoints
        if (config.api && config.api.baseUrl === undefined) {
            config.api.baseUrl = process.env.PROD_API_URL || 'https://api.example.com';
        }
        // Enable production monitoring
        if (config.monitoring === undefined) {
            config.monitoring = {
                enabled: true,
                level: 'production'
            };
        }
        // Set production security settings
        if (config.security === undefined) {
            config.security = {
                ssl: true,
                cors: {
                    enabled: true,
                    origins: ['https://example.com']
                }
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
        // In production, we require strict configuration validation
        if (!config.api || !config.api.baseUrl) {
            errors.push('API base URL is required in production environment');
        }
        // Validate SSL configuration
        if (config.api && config.api.baseUrl && !config.api.baseUrl.startsWith('https://')) {
            errors.push('API base URL must use HTTPS in production environment');
        }
        // Validate security configuration
        if (config.security) {
            if (config.security.ssl !== true) {
                errors.push('SSL must be enabled in production environment');
            }
            if (config.security.cors && config.security.cors.enabled !== true) {
                warnings.push('CORS should be enabled in production environment');
            }
        }
        else {
            errors.push('Security configuration is required for production');
        }
        // Validate logging configuration
        if (config.logging) {
            if (!['warn', 'error'].includes(config.logging.level)) {
                warnings.push(`Logging level should be warn or error in production: ${config.logging.level}`);
            }
        }
        else {
            errors.push('Logging configuration is required for production');
        }
        // Validate monitoring configuration
        if (config.monitoring && config.monitoring.enabled !== true) {
            errors.push('Monitoring must be enabled in production environment');
        }
        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }
}
exports.ProductionEnvironmentAdapter = ProductionEnvironmentAdapter;
//# sourceMappingURL=ProductionEnvironmentAdapter.js.map