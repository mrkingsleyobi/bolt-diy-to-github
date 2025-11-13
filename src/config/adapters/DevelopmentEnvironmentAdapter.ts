// DevelopmentEnvironmentAdapter.ts - Development environment adapter implementation
// Phase 4: Environment Configuration Management - Task 4: Implement Development Environment Adapter

import { EnvironmentAdapter, EnvironmentType } from '../EnvironmentAdapter';
import { ConfigurationSource, ConfigurationSourceType, ValidationResult } from '../ConfigurationManager';
import * as path from 'path';

/**
 * Development environment adapter
 */
export class DevelopmentEnvironmentAdapter implements EnvironmentAdapter {
  private environment: EnvironmentType = EnvironmentType.DEVELOPMENT;

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

    // File-based configuration sources
    sources.push({
      name: 'local-config',
      type: ConfigurationSourceType.FILE,
      options: {
        path: path.join(process.cwd(), 'config', 'development.json'),
        format: 'json'
      }
    });

    sources.push({
      name: 'local-config-yaml',
      type: ConfigurationSourceType.FILE,
      options: {
        path: path.join(process.cwd(), 'config', 'development.yaml'),
        format: 'yaml'
      }
    });

    // Environment variable source
    sources.push({
      name: 'environment-variables',
      type: ConfigurationSourceType.ENVIRONMENT,
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
  transformConfiguration(config: any): any {
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
  validateConfiguration(config: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

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