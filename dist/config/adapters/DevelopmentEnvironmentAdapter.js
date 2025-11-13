"use strict";
// DevelopmentEnvironmentAdapter.ts - Development environment adapter implementation
// Phase 4: Environment Configuration Management - Task 4: Implement Development Environment Adapter
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
exports.DevelopmentEnvironmentAdapter = void 0;
const EnvironmentAdapter_1 = require("../EnvironmentAdapter");
const ConfigurationManager_1 = require("../ConfigurationManager");
const path = __importStar(require("path"));
/**
 * Development environment adapter
 */
class DevelopmentEnvironmentAdapter {
    constructor() {
        this.environment = EnvironmentAdapter_1.EnvironmentType.DEVELOPMENT;
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
        // File-based configuration sources
        sources.push({
            name: 'local-config',
            type: ConfigurationManager_1.ConfigurationSourceType.FILE,
            options: {
                path: path.join(process.cwd(), 'config', 'development.json'),
                format: 'json'
            }
        });
        sources.push({
            name: 'local-config-yaml',
            type: ConfigurationManager_1.ConfigurationSourceType.FILE,
            options: {
                path: path.join(process.cwd(), 'config', 'development.yaml'),
                format: 'yaml'
            }
        });
        // Environment variable source
        sources.push({
            name: 'environment-variables',
            type: ConfigurationManager_1.ConfigurationSourceType.ENVIRONMENT,
            options: {
                prefix: 'APP_'
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
        // In development, we might want to enable additional debugging features
        if (config.debug === undefined) {
            config.debug = true;
        }
        // Set default logging level for development
        if (config.logging === undefined) {
            config.logging = {
                level: 'debug',
                format: 'pretty'
            };
        }
        // Enable hot reloading in development
        if (config.hotReload === undefined) {
            config.hotReload = true;
        }
        // Set development-specific API endpoints
        if (config.api && config.api.baseUrl === undefined) {
            config.api.baseUrl = 'http://localhost:3000';
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
        // Check for required configuration values
        if (!config.api || !config.api.baseUrl) {
            warnings.push('API base URL not configured, using default development URL');
        }
        // Validate logging configuration
        if (config.logging) {
            if (!['debug', 'info', 'warn', 'error'].includes(config.logging.level)) {
                warnings.push(`Invalid logging level: ${config.logging.level}`);
            }
        }
        // In development, we're more permissive with validation
        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }
}
exports.DevelopmentEnvironmentAdapter = DevelopmentEnvironmentAdapter;
//# sourceMappingURL=DevelopmentEnvironmentAdapter.js.map