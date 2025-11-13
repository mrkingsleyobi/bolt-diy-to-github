"use strict";
// RemoteConfigurationProvider.ts - Remote configuration provider implementation
// Phase 4: Environment Configuration Management - Task 11: Implement Remote Configuration Provider
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemoteConfigurationProvider = void 0;
const axios_1 = __importDefault(require("axios"));
/**
 * Remote configuration provider
 */
class RemoteConfigurationProvider {
    constructor(name, url, headers = {}, timeout = 10000, cacheTTL = 60000) {
        this.cache = null;
        this.lastFetch = 0;
        this.cacheTTL = 60000; // 1 minute default cache
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
    getName() {
        return this.name;
    }
    /**
     * Load configuration from remote source
     * @returns Configuration data
     */
    async load() {
        try {
            // Check cache first
            const now = Date.now();
            if (this.cache && (now - this.lastFetch) < this.cacheTTL) {
                return this.cache;
            }
            // Prepare request
            const config = {
                method: 'GET',
                url: this.url,
                headers: this.headers,
                timeout: this.timeout
            };
            // Make request
            const response = await (0, axios_1.default)(config);
            // Validate response
            if (response.status !== 200) {
                throw new Error(`Remote configuration service returned status ${response.status}`);
            }
            // Update cache
            this.cache = response.data;
            this.lastFetch = now;
            return response.data;
        }
        catch (error) {
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
    async save(config) {
        try {
            // Prepare request
            const requestConfig = {
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
            const response = await (0, axios_1.default)(requestConfig);
            // Validate response
            if (response.status !== 200 && response.status !== 201) {
                throw new Error(`Remote configuration service returned status ${response.status}`);
            }
            // Update cache
            this.cache = config;
            this.lastFetch = Date.now();
        }
        catch (error) {
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
    async isAvailable() {
        try {
            // Make a HEAD request to check availability
            const config = {
                method: 'HEAD',
                url: this.url,
                headers: this.headers,
                timeout: this.timeout
            };
            const response = await (0, axios_1.default)(config);
            return response.status === 200;
        }
        catch (error) {
            return false;
        }
    }
}
exports.RemoteConfigurationProvider = RemoteConfigurationProvider;
//# sourceMappingURL=RemoteConfigurationProvider.js.map