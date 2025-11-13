"use strict";
// StagingEnvironmentAdapter.ts - Staging environment adapter implementation
// Phase 4: Environment Configuration Management - Task 6: Implement Staging Environment Adapter
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.StagingEnvironmentAdapter = void 0;
const EnvironmentAdapter_1 = require("../EnvironmentAdapter");
const ConfigurationManager_1 = require("../ConfigurationManager");
const path = __importStar(require("path"));
/**
 * Staging environment adapter
 */
class StagingEnvironmentAdapter {
    constructor() {
        this.environment = EnvironmentAdapter_1.EnvironmentType.STAGING;
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
        // File-based configuration sources for staging
        sources.push({
            name: 'staging-config',
            type: ConfigurationManager_1.ConfigurationSourceType.FILE,
            options: {
                path: path.join(process.cwd(), 'config', 'staging.json'),
                format: 'json'
            }
        });
        // Environment variable source with staging prefix
        sources.push({
            name: 'staging-environment-variables',
            type: ConfigurationManager_1.ConfigurationSourceType.ENVIRONMENT,
            options: {
                prefix: 'STAGING_'
            }
        });
        // Remote configuration source for staging
        sources.push({
            name: 'remote-staging-config',
            type: ConfigurationManager_1.ConfigurationSourceType.REMOTE,
            options: {
                url: process.env.STAGING_CONFIG_URL || 'https://config.example.com/staging',
                headers: {
                    'Authorization': `Bearer ${process.env.STAGING_CONFIG_TOKEN}`
                }
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
        // In staging, we want production-like behavior but with some debugging features
        if (config.debug === undefined) {
            config.debug = false;
        }
        // Set staging-specific logging level
        if (config.logging === undefined) {
            config.logging = {
                level: 'info',
                format: 'json'
            };
        }
        // Disable hot reloading in staging
        config.hotReload = false;
        // Set staging-specific API endpoints
        if (config.api && config.api.baseUrl === undefined) {
            config.api.baseUrl = process.env.STAGING_API_URL || 'https://api-staging.example.com';
        }
        // Enable detailed monitoring in staging
        if (config.monitoring === undefined) {
            config.monitoring = {
                enabled: true,
                level: 'detailed'
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
        // In staging, we require production-like configuration
        if (!config.api || !config.api.baseUrl) {
            errors.push('API base URL is required in staging environment');
        }
        // Validate SSL configuration
        if (config.api && config.api.baseUrl && !config.api.baseUrl.startsWith('https://')) {
            warnings.push('API base URL should use HTTPS in staging environment');
        }
        // Validate logging configuration
        if (config.logging) {
            if (!['info', 'warn', 'error'].includes(config.logging.level)) {
                warnings.push(`Logging level should be info, warn, or error in staging: ${config.logging.level}`);
            }
        }
        else {
            errors.push('Logging configuration is required for staging');
        }
        // Validate monitoring configuration
        if (config.monitoring && config.monitoring.enabled !== true) {
            warnings.push('Monitoring should be enabled in staging environment');
        }
        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }
}
exports.StagingEnvironmentAdapter = StagingEnvironmentAdapter;
//# sourceMappingURL=StagingEnvironmentAdapter.js.map