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
exports.MessageAuthenticationService = void 0;
const crypto = __importStar(require("crypto"));
/**
 * Service for message authentication using HMAC-SHA256
 * Provides signing and verification capabilities for cross-origin communication
 */
class MessageAuthenticationService {
    constructor() {
        this.secretKey = null;
        this.expirationTimeMs = 5 * 60 * 1000; // 5 minutes default
    }
    /**
     * Signs a message with HMAC-SHA256
     * @param message - The message to sign
     * @returns SignedMessage containing payload, signature, and timestamp
     * @throws Error if secret key is not set
     */
    signMessage(message) {
        if (!this.secretKey) {
            throw new Error('Secret key not set');
        }
        // Create timestamped payload
        const timestamp = Date.now();
        const payloadObj = { message, timestamp };
        const payload = JSON.stringify(payloadObj);
        // Generate HMAC-SHA256 signature
        const signature = crypto.createHmac('sha256', this.secretKey)
            .update(payload)
            .digest('hex');
        return { payload, signature, timestamp };
    }
    /**
     * Verifies a signed message
     * @param signedMessage - The signed message to verify
     * @returns boolean indicating if the signature is valid and not expired
     * @throws Error if secret key is not set
     */
    verifyMessage(signedMessage) {
        if (!this.secretKey) {
            throw new Error('Secret key not set');
        }
        try {
            // Parse the payload
            const payloadObj = JSON.parse(signedMessage.payload);
            // Validate timestamp format
            if (typeof payloadObj.timestamp !== 'number' || isNaN(payloadObj.timestamp)) {
                return false;
            }
            // Check expiration using enhanced validation
            if (!this.isTimestampValid(payloadObj.timestamp)) {
                return false;
            }
            // Generate expected signature
            const expectedSignature = crypto.createHmac('sha256', this.secretKey)
                .update(signedMessage.payload)
                .digest('hex');
            // Use constant-time comparison to prevent timing attacks
            return this.constantTimeCompare(expectedSignature, signedMessage.signature);
        }
        catch (error) {
            // Any parsing error or other exception means invalid message
            return false;
        }
    }
    /**
     * Sets the secret key used for signing and verification
     * @param key - The secret key
     * @throws Error if key is invalid
     */
    setSecretKey(key) {
        // Validate input
        if (typeof key !== 'string') {
            throw new Error('Secret key must be a string');
        }
        if (key.length === 0) {
            throw new Error('Secret key cannot be empty');
        }
        // Store the key
        this.secretKey = key;
    }
    /**
     * Sets the expiration time for signed messages
     * @param milliseconds - Expiration time in milliseconds
     * @throws Error if milliseconds is not positive
     */
    setExpirationTime(milliseconds) {
        if (milliseconds <= 0) {
            throw new Error('Expiration time must be positive');
        }
        this.expirationTimeMs = milliseconds;
    }
    /**
     * Gets the current expiration time
     * @returns Expiration time in milliseconds
     */
    getExpirationTime() {
        return this.expirationTimeMs;
    }
    /**
     * Validates that a timestamp is within the allowed time window
     * @param timestamp - The timestamp to validate
     * @returns boolean indicating if timestamp is valid
     */
    isTimestampValid(timestamp) {
        // Validate timestamp is a number
        if (typeof timestamp !== 'number' || isNaN(timestamp)) {
            return false;
        }
        // Check that timestamp is not in the future (with small tolerance)
        const now = Date.now();
        if (timestamp > now + 60 * 1000) { // 1 minute tolerance for clock skew
            return false;
        }
        // Check that timestamp is not too old
        return (now - timestamp) <= this.expirationTimeMs;
    }
    /**
     * Compares two strings in constant time to prevent timing attacks
     * @param a - First string
     * @param b - Second string
     * @returns boolean indicating if strings are equal
     */
    constantTimeCompare(a, b) {
        if (a.length !== b.length) {
            return false;
        }
        let result = 0;
        for (let i = 0; i < a.length; i++) {
            result |= a.charCodeAt(i) ^ b.charCodeAt(i);
        }
        return result === 0;
    }
}
exports.MessageAuthenticationService = MessageAuthenticationService;
//# sourceMappingURL=MessageAuthenticationService.js.map