/**
 * Secure storage for GitHub tokens with encryption
 * This service handles storing and retrieving encrypted tokens
 */
export declare class SecureTokenStorage {
    private readonly encryptionService;
    private readonly storageKey;
    constructor();
    /**
     * Stores an encrypted token in secure storage
     * @param token The token to store
     * @param password The password to encrypt the token with
     * @param key An optional key to associate with the token (e.g., username)
     * @returns Promise that resolves when the token is stored
     */
    storeToken(token: string, password: string, key?: string): Promise<void>;
    /**
     * Retrieves and decrypts a token from secure storage
     * @param password The password to decrypt the token with
     * @param key The key associated with the token to retrieve
     * @returns Promise that resolves to the decrypted token
     */
    retrieveToken(password: string, key?: string): Promise<string>;
    /**
     * Removes a token from storage
     * @param key The key associated with the token to remove
     */
    removeToken(key?: string): void;
    /**
     * Checks if a token exists for the given key
     * @param key The key to check
     * @returns boolean indicating if a token exists
     */
    hasToken(key?: string): boolean;
    /**
     * Gets all stored token keys
     * @returns Array of token keys
     */
    getTokenKeys(): string[];
    /**
     * Helper method to get stored tokens from localStorage
     * @returns Object containing stored tokens
     */
    private getStoredTokens;
}
//# sourceMappingURL=SecureTokenStorage.d.ts.map