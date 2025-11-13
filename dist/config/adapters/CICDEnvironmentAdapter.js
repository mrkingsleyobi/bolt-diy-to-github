"use strict";
// CICDEnvironmentAdapter.ts - CI/CD environment adapter implementation
// Phase 4: Environment Configuration Management - Task X: Implement CI/CD Environment Adapter
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
exports.CICDEnvironmentAdapter = void 0;
const EnvironmentAdapter_1 = require("../EnvironmentAdapter");
const ConfigurationManager_1 = require("../ConfigurationManager");
const path = __importStar(require("path"));
/**
 * CI/CD environment adapter
 */
class CICDEnvironmentAdapter {
    constructor() {
        this.environment = EnvironmentAdapter_1.EnvironmentType.TESTING; // Treat CI/CD as testing-like
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
        // Environment variable source with CI/CD prefix
        sources.push({
            name: 'cicd-environment-variables',
            type: ConfigurationManager_1.ConfigurationSourceType.ENVIRONMENT,
            options: {
                prefix: 'CI_'
            }
        });
        // File-based configuration sources for CI/CD
        sources.push({
            name: 'cicd-config',
            type: ConfigurationManager_1.ConfigurationSourceType.FILE,
            options: {
                path: path.join(process.cwd(), 'config', 'cicd.json'),
                format: 'json'
            }
        });
        // In-memory configuration for temporary CI/CD values
        sources.push({
            name: 'in-memory-cicd-config',
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
        // In CI/CD environments, we want consistent behavior
        config.debug = false;
        // Set CI/CD-specific logging level
        if (config.logging === undefined) {
            config.logging = {
                level: 'info',
                format: 'json'
            };
        }
        // Disable hot reloading in CI/CD
        config.hotReload = false;
        // Set CI/CD-specific API endpoints
        if (config.api && config.api.baseUrl === undefined) {
            config.api.baseUrl = 'http://localhost:3001';
        }
        // Enable CI/CD mode
        config.cicdMode = true;
        // Use in-memory databases for CI/CD
        if (config.database === undefined) {
            config.database = {
                type: 'sqlite',
                filename: ':memory:'
            };
        }
        // Configure CI/CD specific settings
        if (config.cicd === undefined) {
            config.cicd = {
                pipeline: this.detectCIPipeline(),
                parallel: true,
                artifacts: true,
                reports: true
            };
        }
        // Set timeouts appropriate for CI/CD
        if (config.timeouts === undefined) {
            config.timeouts = {
                test: 300000, // 5 minutes
                build: 1800000, // 30 minutes
                deploy: 900000 // 15 minutes
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
        // In CI/CD environments, we require certain configuration values
        if (!config.cicdMode) {
            errors.push('CI/CD mode must be enabled in CI/CD environment');
        }
        // Validate database configuration for CI/CD
        if (config.database) {
            if (config.database.filename !== ':memory:') {
                warnings.push('Database should use in-memory storage for CI/CD');
            }
        }
        else {
            errors.push('Database configuration is required for CI/CD');
        }
        // Validate logging configuration
        if (config.logging) {
            if (!['debug', 'info', 'warn', 'error'].includes(config.logging.level)) {
                errors.push(`Invalid logging level: ${config.logging.level}`);
            }
        }
        else {
            errors.push('Logging configuration is required for CI/CD');
        }
        // Validate CI/CD configuration
        if (config.cicd) {
            if (!config.cicd.pipeline) {
                warnings.push('CI/CD pipeline should be specified');
            }
            if (config.cicd.parallel !== true) {
                warnings.push('Parallel execution should be enabled for CI/CD');
            }
        }
        else {
            warnings.push('CI/CD configuration is recommended for CI/CD environments');
        }
        // Validate timeouts configuration
        if (config.timeouts) {
            if (typeof config.timeouts.test !== 'number' || config.timeouts.test <= 0) {
                errors.push('Test timeout must be a positive number');
            }
            if (typeof config.timeouts.build !== 'number' || config.timeouts.build <= 0) {
                errors.push('Build timeout must be a positive number');
            }
            if (typeof config.timeouts.deploy !== 'number' || config.timeouts.deploy <= 0) {
                errors.push('Deploy timeout must be a positive number');
            }
        }
        else {
            errors.push('Timeouts configuration is required for CI/CD');
        }
        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }
    /**
     * Detect CI pipeline based on environment variables
     * @returns CI pipeline name
     */
    detectCIPipeline() {
        // Check for GitHub Actions
        if (process.env.GITHUB_ACTIONS) {
            return 'github-actions';
        }
        // Check for GitLab CI
        if (process.env.GITLAB_CI) {
            return 'gitlab-ci';
        }
        // Check for Jenkins
        if (process.env.JENKINS_URL) {
            return 'jenkins';
        }
        // Check for CircleCI
        if (process.env.CIRCLECI) {
            return 'circleci';
        }
        // Check for Travis CI
        if (process.env.TRAVIS) {
            return 'travis';
        }
        // Check for Azure Pipelines
        if (process.env.TF_BUILD) {
            return 'azure-pipelines';
        }
        // Check for AWS CodeBuild
        if (process.env.CODEBUILD_BUILD_ID) {
            return 'codebuild';
        }
        // Check for general CI
        if (process.env.CI) {
            return 'generic-ci';
        }
        return 'unknown';
    }
}
exports.CICDEnvironmentAdapter = CICDEnvironmentAdapter;
//# sourceMappingURL=CICDEnvironmentAdapter.js.map