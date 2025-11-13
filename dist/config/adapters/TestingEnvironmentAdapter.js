"use strict";
// TestingEnvironmentAdapter.ts - Testing environment adapter implementation
// Phase 4: Environment Configuration Management - Task 5: Implement Testing Environment Adapter
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
exports.TestingEnvironmentAdapter = void 0;
const EnvironmentAdapter_1 = require("../EnvironmentAdapter");
const ConfigurationManager_1 = require("../ConfigurationManager");
const path = __importStar(require("path"));
/**
 * Testing environment adapter
 */
class TestingEnvironmentAdapter {
    constructor() {
        this.environment = EnvironmentAdapter_1.EnvironmentType.TESTING;
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
        // File-based configuration sources for testing
        sources.push({
            name: 'test-config',
            type: ConfigurationManager_1.ConfigurationSourceType.FILE,
            options: {
                path: path.join(process.cwd(), 'config', 'test.json'),
                format: 'json'
            }
        });
        // Environment variable source with test prefix
        sources.push({
            name: 'test-environment-variables',
            type: ConfigurationManager_1.ConfigurationSourceType.ENVIRONMENT,
            options: {
                prefix: 'TEST_'
            }
        });
        // In-memory configuration for testing
        sources.push({
            name: 'in-memory-config',
            type: ConfigurationManager_1.ConfigurationSourceType.FILE,
            options: {
                path: ':memory:',
                format: 'json'
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
        // In testing, we want to ensure consistent behavior
        config.debug = false;
        // Set test-specific logging level
        if (config.logging === undefined) {
            config.logging = {
                level: 'error',
                format: 'json'
            };
        }
        // Disable hot reloading in testing
        config.hotReload = false;
        // Set test-specific API endpoints
        if (config.api && config.api.baseUrl === undefined) {
            config.api.baseUrl = 'http://localhost:3001';
        }
        // Enable test mode
        config.testMode = true;
        // Use in-memory databases for testing
        if (config.database === undefined) {
            config.database = {
                type: 'sqlite',
                filename: ':memory:'
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
        // In testing, we require certain configuration values
        if (!config.testMode) {
            errors.push('Test mode must be enabled in testing environment');
        }
        // Validate database configuration for testing
        if (config.database) {
            if (config.database.filename !== ':memory:') {
                warnings.push('Database should use in-memory storage for testing');
            }
        }
        else {
            errors.push('Database configuration is required for testing');
        }
        // Validate logging configuration
        if (config.logging) {
            if (!['debug', 'info', 'warn', 'error'].includes(config.logging.level)) {
                errors.push(`Invalid logging level: ${config.logging.level}`);
            }
        }
        else {
            errors.push('Logging configuration is required for testing');
        }
        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }
}
exports.TestingEnvironmentAdapter = TestingEnvironmentAdapter;
//# sourceMappingURL=TestingEnvironmentAdapter.js.map