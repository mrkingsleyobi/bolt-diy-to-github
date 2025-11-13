// CICDEnvironmentAdapter.ts - CI/CD environment adapter implementation
// Phase 4: Environment Configuration Management - Task X: Implement CI/CD Environment Adapter

import { EnvironmentAdapter, EnvironmentType } from '../EnvironmentAdapter';
import { ConfigurationSource, ConfigurationSourceType, ValidationResult } from '../ConfigurationManager';
import * as path from 'path';

/**
 * CI/CD environment adapter
 */
export class CICDEnvironmentAdapter implements EnvironmentAdapter {
  private environment: EnvironmentType = EnvironmentType.TESTING; // Treat CI/CD as testing-like

  /**
   * Get current environment
   * @returns Current environment
   */
  getEnvironment(): EnvironmentType {
    return this.environment;
  }

  /**
   * Get environment-specific configuration sources
   * @returns Configuration sources
   */
  getConfigurationSources(): ConfigurationSource[] {
    const sources: ConfigurationSource[] = [];

    // Environment variable source with CI/CD prefix
    sources.push({
      name: 'cicd-environment-variables',
      type: ConfigurationSourceType.ENVIRONMENT,
      options: {
        prefix: 'CI_'
      }
    });

    // File-based configuration sources for CI/CD
    sources.push({
      name: 'cicd-config',
      type: ConfigurationSourceType.FILE,
      options: {
        path: path.join(process.cwd(), 'config', 'cicd.json'),
        format: 'json'
      }
    });

    // In-memory configuration for temporary CI/CD values
    sources.push({
      name: 'in-memory-cicd-config',
      type: ConfigurationSourceType.FILE,
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
  transformConfiguration(config: any): any {
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
  validateConfiguration(config: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // In CI/CD environments, we require certain configuration values
    if (!config.cicdMode) {
      errors.push('CI/CD mode must be enabled in CI/CD environment');
    }

    // Validate database configuration for CI/CD
    if (config.database) {
      if (config.database.filename !== ':memory:') {
        warnings.push('Database should use in-memory storage for CI/CD');
      }
    } else {
      errors.push('Database configuration is required for CI/CD');
    }

    // Validate logging configuration
    if (config.logging) {
      if (!['debug', 'info', 'warn', 'error'].includes(config.logging.level)) {
        errors.push(`Invalid logging level: ${config.logging.level}`);
      }
    } else {
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
    } else {
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
    } else {
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
  private detectCIPipeline(): string {
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