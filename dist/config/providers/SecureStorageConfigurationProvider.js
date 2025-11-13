"use strict";
// SecureStorageConfigurationProvider.ts - Secure storage configuration provider implementation
// Phase 4: Environment Configuration Management - Task 10: Implement Secure Storage Configuration Provider
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
exports.SecureStorageConfigurationProvider = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
/**
 * Secure storage configuration provider
 */
class SecureStorageConfigurationProvider {
    constructor(name, namespace, encryptionService, authenticationService, storagePath) {
        this.inMemoryStorage = new Map();
        this.name = name;
        this.namespace = namespace;
        this.encryptionService = encryptionService;
        this.authenticationService = authenticationService;
        // Use provided storage path or default to system temp directory
        this.storagePath = storagePath || path.join(os.tmpdir(), 'secure-config-storage');
        // Ensure storage directory exists
        if (!fs.existsSync(this.storagePath)) {
            fs.mkdirSync(this.storagePath, { recursive: true });
        }
    }
    /**
     * Get provider name
     * @returns Provider name
     */
    getName() {
        return this.name;
    }
    /**
     * Load configuration from secure storage
     * @returns Configuration data
     */
    async load() {
        try {
            const key = `${this.namespace}:config`;
            let stored;
            // Try to load from persistent storage first
            try {
                const filePath = path.join(this.storagePath, `${this.namespace}-config.json`);
                if (fs.existsSync(filePath)) {
                    const fileContent = fs.readFileSync(filePath, 'utf8');
                    const fileData = JSON.parse(fileContent);
                    stored = fileData;
                }
            }
            catch (fileError) {
                // If file loading fails, try in-memory storage
                stored = this.inMemoryStorage.get(key);
            }
            // If nothing is stored, return empty object
            if (!stored) {
                return {};
            }
            // Verify integrity first
            const isValid = await this.authenticationService.verifyMessage({
                payload: stored.data,
                signature: stored.signature,
                timestamp: stored.timestamp
            });
            if (!isValid) {
                throw new Error('Configuration integrity verification failed');
            }
            // Decrypt the configuration
            const decrypted = await this.encryptionService.decryptPayload(JSON.parse(stored.data), 'config-secret' // This would need to be a proper secret in a real implementation
            );
            return JSON.parse(decrypted);
        }
        catch (error) {
            throw new Error(`Failed to load secure configuration: ${error.message}`);
        }
    }
    /**
     * Save configuration to secure storage
     * @param config - Configuration data
     */
    async save(config) {
        try {
            const key = `${this.namespace}:config`;
            const configString = JSON.stringify(config);
            // Encrypt the configuration
            const encryptedMessage = await this.encryptionService.encryptPayload(configString, 'config-secret');
            // Create authentication tag
            const signedMessage = this.authenticationService.signMessage(configString);
            const signature = signedMessage.signature;
            // Store in both persistent and in-memory storage
            const storageData = {
                data: JSON.stringify(encryptedMessage),
                timestamp: Date.now(),
                signature: signature
            };
            // Save to in-memory storage
            this.inMemoryStorage.set(key, storageData);
            // Save to persistent storage
            try {
                const filePath = path.join(this.storagePath, `${this.namespace}-config.json`);
                fs.writeFileSync(filePath, JSON.stringify(storageData, null, 2));
            }
            catch (fileError) {
                console.warn(`Failed to save to persistent storage: ${fileError.message}`);
                // We'll still have the in-memory storage as backup
            }
        }
        catch (error) {
            throw new Error(`Failed to save secure configuration: ${error.message}`);
        }
    }
    /**
     * Check if provider is available
     * @returns Availability status
     */
    async isAvailable() {
        // Check if encryption and authentication services are available
        try {
            // Test encryption service
            const testEncryption = await this.encryptionService.encryptPayload('test', 'test-secret');
            await this.encryptionService.decryptPayload(testEncryption, 'test-secret');
            // Test authentication service
            const testAuth = this.authenticationService.signMessage('test');
            const isValid = this.authenticationService.verifyMessage(testAuth);
            if (!isValid) {
                return false;
            }
            // Test file system access
            try {
                const testFilePath = path.join(this.storagePath, 'test-access.tmp');
                fs.writeFileSync(testFilePath, 'test');
                fs.unlinkSync(testFilePath);
            }
            catch (fsError) {
                console.warn(`File system access test failed: ${fsError.message}`);
                // File system access failed, but we can still use in-memory storage
            }
            return true;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Clear stored configuration
     */
    async clear() {
        const key = `${this.namespace}:config`;
        // Clear in-memory storage
        this.inMemoryStorage.delete(key);
        // Clear persistent storage
        try {
            const filePath = path.join(this.storagePath, `${this.namespace}-config.json`);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        catch (error) {
            console.warn(`Failed to clear persistent storage: ${error.message}`);
        }
    }
    /**
     * Get storage path
     * @returns Storage path
     */
    getStoragePath() {
        return this.storagePath;
    }
}
exports.SecureStorageConfigurationProvider = SecureStorageConfigurationProvider;
//# sourceMappingURL=SecureStorageConfigurationProvider.js.map