"use strict";
// FileConfigurationProvider.ts - File-based configuration provider implementation
// Phase 4: Environment Configuration Management - Task 8: Implement File Configuration Provider
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
exports.FileConfigurationProvider = void 0;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const yaml = __importStar(require("js-yaml"));
/**
 * File configuration provider
 */
class FileConfigurationProvider {
    constructor(name, filePath, format = 'json') {
        this.cache = null;
        this.lastModified = 0;
        this.name = name;
        this.filePath = filePath;
        this.format = format;
    }
    /**
     * Get provider name
     * @returns Provider name
     */
    getName() {
        return this.name;
    }
    /**
     * Load configuration from file
     * @returns Configuration data
     */
    async load() {
        try {
            // Check if file has been modified
            const stats = await fs.stat(this.filePath);
            if (stats.mtime.getTime() <= this.lastModified && this.cache) {
                return this.cache;
            }
            // Read file content
            const content = await fs.readFile(this.filePath, 'utf8');
            // Parse based on format
            let config;
            if (this.format === 'json') {
                config = JSON.parse(content);
            }
            else if (this.format === 'yaml' || this.format === 'yml') {
                config = yaml.load(content);
            }
            else {
                throw new Error(`Unsupported configuration format: ${this.format}`);
            }
            // Update cache and last modified time
            this.cache = config;
            this.lastModified = stats.mtime.getTime();
            return config;
        }
        catch (error) {
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
    async save(config) {
        try {
            let content;
            if (this.format === 'json') {
                content = JSON.stringify(config, null, 2);
            }
            else if (this.format === 'yaml' || this.format === 'yml') {
                content = yaml.dump(config);
            }
            else {
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
        }
        catch (error) {
            throw new Error(`Failed to save configuration to ${this.filePath}: ${error.message}`);
        }
    }
    /**
     * Check if provider is available
     * @returns Availability status
     */
    async isAvailable() {
        try {
            await fs.access(this.filePath);
            return true;
        }
        catch (error) {
            return false;
        }
    }
}
exports.FileConfigurationProvider = FileConfigurationProvider;
//# sourceMappingURL=FileConfigurationProvider.js.map