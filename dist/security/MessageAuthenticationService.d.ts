import { SignedMessage, MessageAuthenticationService as IMessageAuthenticationService } from './MessageAuthenticationService.types';
/**
 * Service for message authentication using HMAC-SHA256
 * Provides signing and verification capabilities for cross-origin communication
 */
export declare class MessageAuthenticationService implements IMessageAuthenticationService {
    private secretKey;
    private expirationTimeMs;
    /**
     * Signs a message with HMAC-SHA256
     * @param message - The message to sign
     * @returns SignedMessage containing payload, signature, and timestamp
     * @throws Error if secret key is not set
     */
    signMessage(message: string): SignedMessage;
    /**
     * Verifies a signed message
     * @param signedMessage - The signed message to verify
     * @returns boolean indicating if the signature is valid and not expired
     * @throws Error if secret key is not set
     */
    verifyMessage(signedMessage: SignedMessage): boolean;
    /**
     * Sets the secret key used for signing and verification
     * @param key - The secret key
     * @throws Error if key is invalid
     */
    setSecretKey(key: string): void;
    /**
     * Sets the expiration time for signed messages
     * @param milliseconds - Expiration time in milliseconds
     * @throws Error if milliseconds is not positive
     */
    setExpirationTime(milliseconds: number): void;
    /**
     * Gets the current expiration time
     * @returns Expiration time in milliseconds
     */
    getExpirationTime(): number;
    /**
     * Validates that a timestamp is within the allowed time window
     * @param timestamp - The timestamp to validate
     * @returns boolean indicating if timestamp is valid
     */
    private isTimestampValid;
    /**
     * Compares two strings in constant time to prevent timing attacks
     * @param a - First string
     * @param b - Second string
     * @returns boolean indicating if strings are equal
     */
    private constantTimeCompare;
}
//# sourceMappingURL=MessageAuthenticationService.d.ts.map