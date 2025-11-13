"use strict";
// SecureConfigStore.ts - Secure configuration storage with encryption
// Phase 4: Environment Configuration Management - Task 11: Implement Environment Configuration Service (SecureConfigStore component)
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
exports.EncryptedConfigStore = void 0;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
/**
 * Secure configuration storage implementation
 */
class EncryptedConfigStore {
    constructor(storagePath, payloadEncryptionService, messageAuthenticationService, encryptionKey) {
        this.storagePath = storagePath;
        this.payloadEncryptionService = payloadEncryptionService;
        this.messageAuthenticationService = messageAuthenticationService;
        this.encryptionKey = encryptionKey;
        // Ensure storage directory exists
        this.ensureStorageDirectory();
    }
    /**
     * Ensure storage directory exists
     */
    async ensureStorageDirectory() {
        try {
            await fs.mkdir(this.storagePath, { recursive: true });
        }
        catch (error) {
            throw new Error(`Failed to create storage directory: ${error.message}`);
        }
    }
    /**
     * Load configuration from secure storage
     * @param key - Configuration key
     * @returns Encrypted configuration data
     */
    async load(key) {
        try {
            const filePath = this.getFilePath(key);
            const exists = await this.fileExists(filePath);
            if (!exists) {
                return null;
            }
            // Read encrypted configuration file
            const encryptedData = await fs.readFile(filePath, 'utf8');
            const parsedData = JSON.parse(encryptedData);
            // Verify integrity first
            const isValid = await this.messageAuthenticationService.verifyMessage({
                payload: parsedData.payload,
                signature: parsedData.signature,
                timestamp: parsedData.timestamp
            });
            if (!isValid) {
                throw new Error('Configuration integrity verification failed');
            }
            // Decrypt the configuration
            const decrypted = await this.payloadEncryptionService.decryptPayload(JSON.parse(parsedData.payload), this.encryptionKey);
            return JSON.parse(decrypted);
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                // File doesn't exist, return null
                return null;
            }
            throw new Error(`Failed to load secure configuration: ${error.message}`);
        }
    }
    /**
     * Save configuration to secure storage
     * @param key - Configuration key
     * @param config - Configuration data to save
     */
    async save(key, config) {
        try {
            const filePath = this.getFilePath(key);
            const configString = JSON.stringify(config);
            // Encrypt the configuration
            const encrypted = await this.payloadEncryptionService.encryptPayload(configString, this.encryptionKey);
            // Create authentication tag
            const payload = JSON.stringify(encrypted);
            const signedMessage = this.messageAuthenticationService.signMessage(payload);
            // Create storage object
            const storageObject = {
                payload: signedMessage.payload,
                signature: signedMessage.signature,
                timestamp: signedMessage.timestamp
            };
            // Ensure directory exists
            const dir = path.dirname(filePath);
            await fs.mkdir(dir, { recursive: true });
            // Write encrypted configuration to file
            await fs.writeFile(filePath, JSON.stringify(storageObject, null, 2), 'utf8');
        }
        catch (error) {
            throw new Error(`Failed to save secure configuration: ${error.message}`);
        }
    }
    /**
     * Delete configuration from secure storage
     * @param key - Configuration key
     */
    async delete(key) {
        try {
            const filePath = this.getFilePath(key);
            const exists = await this.fileExists(filePath);
            if (exists) {
                await fs.unlink(filePath);
            }
        }
        catch (error) {
            if (error.code !== 'ENOENT') {
                throw new Error(`Failed to delete configuration: ${error.message}`);
            }
        }
    }
    /**
     * List all configuration keys
     * @returns Array of configuration keys
     */
    async list() {
        try {
            const files = await fs.readdir(this.storagePath);
            return files
                .filter(file => file.endsWith('.conf'))
                .map(file => file.replace('.conf', ''));
        }
        catch (error) {
            throw new Error(`Failed to list configurations: ${error.message}`);
        }
    }
    /**
     * Get file path for configuration key
     * @param key - Configuration key
     * @returns File path
     */
    getFilePath(key) {
        // Sanitize key to prevent directory traversal
        const sanitizedKey = key.replace(/[^a-zA-Z0-9_-]/g, '_');
        return path.join(this.storagePath, `${sanitizedKey}.conf`);
    }
    /**
     * Check if file exists
     * @param filePath - File path to check
     * @returns True if file exists, false otherwise
     */
    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        }
        catch (error) {
            return false;
        }
    }
}
exports.EncryptedConfigStore = EncryptedConfigStore;
//# sourceMappingURL=EncryptedConfigStore.js.map