// RemoteConfigurationProvider.ts - Remote configuration provider implementation
// Phase 4: Environment Configuration Management - Task 11: Implement Remote Configuration Provider

import { ConfigurationProvider } from '../ConfigurationProvider';
import axios, { AxiosRequestConfig } from 'axios';

/**
 * Remote configuration provider
 */
export class RemoteConfigurationProvider implements ConfigurationProvider {
  private name: string;
  private url: string;
  private headers: Record<string, string>;
  private timeout: number;
  private cache: any = null;
  private lastFetch: number = 0;
  private cacheTTL: number = 60000; // 1 minute default cache

  constructor(
    name: string,
    url: string,
    headers: Record<string, string> = {},
    timeout: number = 10000,
    cacheTTL: number = 60000
  ) {
    this.name = name;
    this.url = url;
    this.headers = headers;
    this.timeout = timeout;
    this.cacheTTL = cacheTTL;
  }

  /**
   * Get provider name
   * @returns Provider name
   */
  getName(): string {
    return this.name;
  }

  /**
   * Load configuration from remote source
   * @returns Configuration data
   */
  async load(): Promise<any> {
    try {
      // Check cache first
      const now = Date.now();
      if (this.cache && (now - this.lastFetch) < this.cacheTTL) {
        return this.cache;
      }

      // Prepare request
      const config: AxiosRequestConfig = {
        method: 'GET',
        url: this.url,
        headers: this.headers,
        timeout: this.timeout
      };

      // Make request
      const response = await axios(config);

      // Validate response
      if (response.status !== 200) {
        throw new Error(`Remote configuration service returned status ${response.status}`);
      }

      // Update cache
      this.cache = response.data;
      this.lastFetch = now;

      return response.data;
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        throw new Error(`Remote configuration request timed out after ${this.timeout}ms`);
      }
      if (error.response) {
        throw new Error(`Remote configuration service error: ${error.response.status} ${error.response.statusText}`);
      }
      throw new Error(`Failed to load remote configuration: ${error.message}`);
    }
  }

  /**
   * Save configuration to remote source
   * @param config - Configuration data
   */
  async save(config: any): Promise<void> {
    try {
      // Prepare request
      const requestConfig: AxiosRequestConfig = {
        method: 'POST',
        url: this.url,
        headers: {
          'Content-Type': 'application/json',
          ...this.headers
        },
        data: config,
        timeout: this.timeout
      };

      // Make request
      const response = await axios(requestConfig);

      // Validate response
      if (response.status !== 200 && response.status !== 201) {
        throw new Error(`Remote configuration service returned status ${response.status}`);
      }

      // Update cache
      this.cache = config;
      this.lastFetch = Date.now();
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        throw new Error(`Remote configuration request timed out after ${this.timeout}ms`);
      }
      if (error.response) {
        throw new Error(`Remote configuration service error: ${error.response.status} ${error.response.statusText}`);
      }
      throw new Error(`Failed to save remote configuration: ${error.message}`);
    }
  }

  /**
   * Check if provider is available
   * @returns Availability status
   */
  async isAvailable(): Promise<boolean> {
    try {
      // Make a HEAD request to check availability
      const config: AxiosRequestConfig = {
        method: 'HEAD',
        url: this.url,
        headers: this.headers,
        timeout: this.timeout
      };

      const response = await axios(config);
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}