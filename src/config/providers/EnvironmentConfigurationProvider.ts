// EnvironmentConfigurationProvider.ts - Environment variable configuration provider implementation
// Phase 4: Environment Configuration Management - Task 9: Implement Environment Configuration Provider

import { ConfigurationProvider } from '../ConfigurationProvider';

/**
 * Environment configuration provider
 */
export class EnvironmentConfigurationProvider implements ConfigurationProvider {
  private name: string;
  private prefix: string;

  constructor(name: string, prefix: string = '') {
    this.name = name;
    this.prefix = prefix;
  }

  /**
   * Get provider name
   * @returns Provider name
   */
  getName(): string {
    return this.name;
  }

  /**
   * Load configuration from environment variables
   * @returns Configuration data
   */
  async load(): Promise<any> {
    const config: any = {};

    // Iterate through all environment variables
    for (const [key, value] of Object.entries(process.env)) {
      // Check if key matches prefix
      if (this.prefix && !key.startsWith(this.prefix)) {
        continue;
      }

      // Remove prefix from key
      const configKey = this.prefix ? key.substring(this.prefix.length) : key;

      // Convert to lowercase and replace underscores with dots for nested structure
      const normalizedKey = configKey.toLowerCase().replace(/_/g, '.');

      // Set value in config object, handling nested keys
      this.setNestedValue(config, normalizedKey, value);
    }

    return config;
  }

  /**
   * Save configuration to environment variables
   * @param config - Configuration data
   */
  async save(config: any): Promise<void> {
    // Saving to environment variables is not supported
    throw new Error('Saving to environment variables is not supported');
  }

  /**
   * Check if provider is available
   * @returns Availability status
   */
  async isAvailable(): Promise<boolean> {
    // Environment variables are always available
    return true;
  }

  /**
   * Set nested value in config object
   * @param obj - Configuration object
   * @param key - Key with dot notation
   * @param value - Value to set
   */
  private setNestedValue(obj: any, key: string, value: string | undefined): void {
    if (value === undefined) {
      return;
    }

    const keys = key.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!(k in current)) {
        current[k] = {};
      }
      current = current[k];
    }

    // Try to parse value as JSON, otherwise use as string
    try {
      current[keys[keys.length - 1]] = JSON.parse(value);
    } catch (error) {
      // If parsing fails, treat as string
      // Handle boolean values
      if (value.toLowerCase() === 'true') {
        current[keys[keys.length - 1]] = true;
      } else if (value.toLowerCase() === 'false') {
        current[keys[keys.length - 1]] = false;
      } else {
        // Handle numbers
        const numValue = Number(value);
        if (!isNaN(numValue)) {
          current[keys[keys.length - 1]] = numValue;
        } else {
          current[keys[keys.length - 1]] = value;
        }
      }
    }
  }
}