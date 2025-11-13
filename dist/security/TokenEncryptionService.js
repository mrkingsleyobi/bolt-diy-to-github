"use strict";
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
exports.TokenEncryptionService = void 0;
const crypto = __importStar(require("crypto"));
/**
 * Service for encrypting and decrypting sensitive tokens
 * Uses AES-256-GCM for authenticated encryption
 */
class TokenEncryptionService {
    constructor() {
        this.algorithm = 'aes-256-gcm';
        this.keyLength = 32; // 256 bits
        this.ivLength = 12; // 96 bits for GCM
        this.authTagLength = 16;
        this.saltLength = 16;
    }
    /**
     * Generates a secure encryption key from a password
     * @param password The password to derive the key from
     * @returns A 32-byte encryption key
     */
    async deriveKey(password, salt) {
        return new Promise((resolve, reject) => {
            crypto.pbkdf2(password, salt, 100000, this.keyLength, 'sha256', (err, key) => {
                if (err)
                    reject(err);
                else
                    resolve(key);
            });
        });
    }
    /**
     * Encrypts a token using AES-256-GCM
     * @param token The token to encrypt
     * @param password The password to derive the encryption key from
     * @returns The encrypted token as a hex string
     */
    async encryptToken(token, password) {
        // Generate a random salt and IV
        const salt = crypto.randomBytes(this.saltLength);
        const iv = crypto.randomBytes(this.ivLength);
        // Derive the encryption key
        const key = await this.deriveKey(password, salt);
        // Create the cipher
        const cipher = crypto.createCipheriv(this.algorithm, key, iv);
        // Encrypt the token
        let encrypted = cipher.update(token, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        // Get the authentication tag
        const authTag = cipher.getAuthTag();
        // Combine salt, iv, authTag, and encrypted data
        return Buffer.concat([salt, iv, authTag, Buffer.from(encrypted, 'hex')]).toString('hex');
    }
    /**
     * Decrypts a token using AES-256-GCM
     * @param encryptedToken The encrypted token as a hex string
     * @param password The password to derive the decryption key from
     * @returns The decrypted token
     */
    async decryptToken(encryptedToken, password) {
        try {
            // Convert hex string back to buffer
            const buffer = Buffer.from(encryptedToken, 'hex');
            // Extract salt, iv, authTag, and encrypted data
            const salt = buffer.subarray(0, this.saltLength);
            const iv = buffer.subarray(this.saltLength, this.saltLength + this.ivLength);
            const authTag = buffer.subarray(this.saltLength + this.ivLength, this.saltLength + this.ivLength + this.authTagLength);
            const encryptedData = buffer.subarray(this.saltLength + this.ivLength + this.authTagLength);
            // Derive the decryption key
            const key = await this.deriveKey(password, salt);
            // Create the decipher
            const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
            decipher.setAuthTag(authTag);
            // Decrypt the token
            let decrypted = decipher.update(encryptedData);
            decrypted = Buffer.concat([decrypted, decipher.final()]);
            return decrypted.toString('utf8');
        }
        catch (error) {
            throw new Error('Failed to decrypt token: invalid password or corrupted data');
        }
    }
}
exports.TokenEncryptionService = TokenEncryptionService;
//# sourceMappingURL=TokenEncryptionService.js.map