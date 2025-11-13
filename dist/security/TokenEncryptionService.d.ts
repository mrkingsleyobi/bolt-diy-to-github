/**
 * Service for encrypting and decrypting sensitive tokens
 * Uses AES-256-GCM for authenticated encryption
 */
export declare class TokenEncryptionService {
    private readonly algorithm;
    private readonly keyLength;
    private readonly ivLength;
    private readonly authTagLength;
    private readonly saltLength;
    /**
     * Generates a secure encryption key from a password
     * @param password The password to derive the key from
     * @returns A 32-byte encryption key
     */
    private deriveKey;
    /**
     * Encrypts a token using AES-256-GCM
     * @param token The token to encrypt
     * @param password The password to derive the encryption key from
     * @returns The encrypted token as a hex string
     */
    encryptToken(token: string, password: string): Promise<string>;
    /**
     * Decrypts a token using AES-256-GCM
     * @param encryptedToken The encrypted token as a hex string
     * @param password The password to derive the decryption key from
     * @returns The decrypted token
     */
    decryptToken(encryptedToken: string, password: string): Promise<string>;
}
//# sourceMappingURL=TokenEncryptionService.d.ts.map