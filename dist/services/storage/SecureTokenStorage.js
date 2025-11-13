"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecureTokenStorage = void 0;
const TokenEncryptionService_1 = require("../../security/TokenEncryptionService");
/**
 * Secure storage for GitHub tokens with encryption
 * This service handles storing and retrieving encrypted tokens
 */
class SecureTokenStorage {
    constructor() {
        this.storageKey = 'github_tokens';
        this.encryptionService = new TokenEncryptionService_1.TokenEncryptionService();
    }
    /**
     * Stores an encrypted token in secure storage
     * @param token The token to store
     * @param password The password to encrypt the token with
     * @param key An optional key to associate with the token (e.g., username)
     * @returns Promise that resolves when the token is stored
     */
    async storeToken(token, password, key = 'default') {
        try {
            // Encrypt the token
            const encryptedToken = await this.encryptionService.encryptToken(token, password);
            // Get existing tokens
            const storedTokens = this.getStoredTokens();
            // Store the encrypted token
            storedTokens[key] = encryptedToken;
            // Save to localStorage
            localStorage.setItem(this.storageKey, JSON.stringify(storedTokens));
        }
        catch (error) {
            throw new Error(`Failed to store token: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Retrieves and decrypts a token from secure storage
     * @param password The password to decrypt the token with
     * @param key The key associated with the token to retrieve
     * @returns Promise that resolves to the decrypted token
     */
    async retrieveToken(password, key = 'default') {
        try {
            // Get stored tokens
            const storedTokens = this.getStoredTokens();
            // Check if token exists
            const encryptedToken = storedTokens[key];
            if (!encryptedToken) {
                throw new Error(`No token found for key: ${key}`);
            }
            // Decrypt the token
            return await this.encryptionService.decryptToken(encryptedToken, password);
        }
        catch (error) {
            throw new Error(`Failed to retrieve token: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Removes a token from storage
     * @param key The key associated with the token to remove
     */
    removeToken(key = 'default') {
        const storedTokens = this.getStoredTokens();
        delete storedTokens[key];
        localStorage.setItem(this.storageKey, JSON.stringify(storedTokens));
    }
    /**
     * Checks if a token exists for the given key
     * @param key The key to check
     * @returns boolean indicating if a token exists
     */
    hasToken(key = 'default') {
        const storedTokens = this.getStoredTokens();
        return key in storedTokens;
    }
    /**
     * Gets all stored token keys
     * @returns Array of token keys
     */
    getTokenKeys() {
        const storedTokens = this.getStoredTokens();
        return Object.keys(storedTokens);
    }
    /**
     * Helper method to get stored tokens from localStorage
     * @returns Object containing stored tokens
     */
    getStoredTokens() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : {};
        }
        catch (error) {
            // If parsing fails, return empty object
            return {};
        }
    }
}
exports.SecureTokenStorage = SecureTokenStorage;
//# sourceMappingURL=SecureTokenStorage.js.map