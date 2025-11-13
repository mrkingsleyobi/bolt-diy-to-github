// StagingEnvironmentAdapter.ts - Staging environment adapter implementation
// Phase 4: Environment Configuration Management - Task 6: Implement Staging Environment Adapter

import { EnvironmentAdapter, EnvironmentType } from '../EnvironmentAdapter';
import { ConfigurationSource, ConfigurationSourceType, ValidationResult } from '../ConfigurationManager';
import * as path from 'path';

/**
 * Staging environment adapter
 */
export class StagingEnvironmentAdapter implements EnvironmentAdapter {
  private environment: EnvironmentType = EnvironmentType.STAGING;

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

    // File-based configuration sources for staging
    sources.push({
      name: 'staging-config',
      type: ConfigurationSourceType.FILE,
      options: {
        path: path.join(process.cwd(), 'config', 'staging.json'),
        format: 'json'
      }
    });

    // Environment variable source with staging prefix
    sources.push({
      name: 'staging-environment-variables',
      type: ConfigurationSourceType.ENVIRONMENT,
      options: {
        prefix: 'STAGING_'
      }
    });

    // Remote configuration source for staging
    sources.push({
      name: 'remote-staging-config',
      type: ConfigurationSourceType.REMOTE,
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
  transformConfiguration(config: any): any {
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
  validateConfiguration(config: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

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
    } else {
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