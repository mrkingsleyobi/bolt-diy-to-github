import * as crypto from 'crypto';

/**
 * Service for encrypting and decrypting sensitive tokens
 * Uses AES-256-GCM for authenticated encryption
 */
export class TokenEncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 12;  // 96 bits for GCM
  private readonly authTagLength = 16;
  private readonly saltLength = 16;

  /**
   * Generates a secure encryption key from a password
   * @param password The password to derive the key from
   * @returns A 32-byte encryption key
   */
  private async deriveKey(password: string, salt: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(password, salt, 100000, this.keyLength, 'sha256', (err, key) => {
        if (err) reject(err);
        else resolve(key);
      });
    });
  }

  /**
   * Encrypts a token using AES-256-GCM
   * @param token The token to encrypt
   * @param password The password to derive the encryption key from
   * @returns The encrypted token as a hex string
   */
  async encryptToken(token: string, password: string): Promise<string> {
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
  async decryptToken(encryptedToken: string, password: string): Promise<string> {
    try {
      // Convert hex string back to buffer
      const buffer = Buffer.from(encryptedToken, 'hex');

      // Extract salt, iv, authTag, and encrypted data
      const salt = buffer.subarray(0, this.saltLength);
      const iv = buffer.subarray(this.saltLength, this.saltLength + this.ivLength);
      const authTag = buffer.subarray(
        this.saltLength + this.ivLength,
        this.saltLength + this.ivLength + this.authTagLength
      );
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
    } catch (error) {
      throw new Error('Failed to decrypt token: invalid password or corrupted data');
    }
  }
}