/**
 * Represents a signed message with its signature and metadata
 */
export interface SignedMessage {
  /**
   * The JSON stringified payload containing the original message and timestamp
   */
  payload: string;

  /**
   * The HMAC-SHA256 signature of the payload
   */
  signature: string;

  /**
   * Unix timestamp when the message was signed (milliseconds)
   */
  timestamp: number;
}

/**
 * Service interface for message authentication using HMAC-SHA256
 */
export interface MessageAuthenticationService {
  /**
   * Signs a message with HMAC-SHA256
   * @param message - The message to sign
   * @returns SignedMessage containing payload, signature, and timestamp
   */
  signMessage(message: string): SignedMessage;

  /**
   * Verifies a signed message
   * @param signedMessage - The signed message to verify
   * @returns boolean indicating if the signature is valid and not expired
   */
  verifyMessage(signedMessage: SignedMessage): boolean;

  /**
   * Sets the secret key used for signing and verification
   * @param key - The secret key
   */
  setSecretKey(key: string): void;

  /**
   * Sets the expiration time for signed messages
   * @param milliseconds - Expiration time in milliseconds
   */
  setExpirationTime(milliseconds: number): void;

  /**
   * Gets the current expiration time
   * @returns Expiration time in milliseconds
   */
  getExpirationTime(): number;
}