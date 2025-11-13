// FileConfigurationProvider.ts - File-based configuration provider implementation
// Phase 4: Environment Configuration Management - Task 8: Implement File Configuration Provider

import { ConfigurationProvider } from '../ConfigurationProvider';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'js-yaml';

/**
 * File configuration provider
 */
export class FileConfigurationProvider implements ConfigurationProvider {
  private name: string;
  private filePath: string;
  private format: 'json' | 'yaml' | 'yml';
  private cache: any = null;
  private lastModified: number = 0;

  constructor(name: string, filePath: string, format: 'json' | 'yaml' | 'yml' = 'json') {
    this.name = name;
    this.filePath = filePath;
    this.format = format;
  }

  /**
   * Get provider name
   * @returns Provider name
   */
  getName(): string {
    return this.name;
  }

  /**
   * Load configuration from file
   * @returns Configuration data
   */
  async load(): Promise<any> {
    try {
      // Check if file has been modified
      const stats = await fs.stat(this.filePath);
      if (stats.mtime.getTime() <= this.lastModified && this.cache) {
        return this.cache;
      }

      // Read file content
      const content = await fs.readFile(this.filePath, 'utf8');

      // Parse based on format
      let config: any;
      if (this.format === 'json') {
        config = JSON.parse(content);
      } else if (this.format === 'yaml' || this.format === 'yml') {
        config = yaml.load(content);
      } else {
        throw new Error(`Unsupported configuration format: ${this.format}`);
      }

      // Update cache and last modified time
      this.cache = config;
      this.lastModified = stats.mtime.getTime();

      return config;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, return empty config
        return {};
      }
      throw new Error(`Failed to load configuration from ${this.filePath}: ${error.message}`);
    }
  }

  /**
   * Save configuration to file
   * @param config - Configuration data
   */
  async save(config: any): Promise<void> {
    try {
      let content: string;
      if (this.format === 'json') {
        content = JSON.stringify(config, null, 2);
      } else if (this.format === 'yaml' || this.format === 'yml') {
        content = yaml.dump(config);
      } else {
        throw new Error(`Unsupported configuration format: ${this.format}`);
      }

      // Ensure directory exists
      const dir = path.dirname(this.filePath);
      await fs.mkdir(dir, { recursive: true });

      // Write file
      await fs.writeFile(this.filePath, content, 'utf8');

      // Update cache and last modified time
      this.cache = config;
      const stats = await fs.stat(this.filePath);
      this.lastModified = stats.mtime.getTime();
    } catch (error: any) {
      throw new Error(`Failed to save configuration to ${this.filePath}: ${error.message}`);
    }
  }

  /**
   * Check if provider is available
   * @returns Availability status
   */
  async isAvailable(): Promise<boolean> {
    try {
      await fs.access(this.filePath);
      return true;
    } catch (error: any) {
      return false;
    }
  }
}