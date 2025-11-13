# Task 40b: Create Usage Examples

**Estimated Time: 15 minutes**

## Context
I'm creating comprehensive usage examples for the MessageAuthenticationService to help developers understand how to implement HMAC-SHA256 authentication in real-world scenarios.

## Current System State
- MessageAuthenticationService class fully implemented
- All tests passing
- API documentation created
- Type definitions available

## Your Task
Create comprehensive usage examples including:
1. Chrome extension implementation
2. bolt.diy platform implementation
3. Key generation and management
4. Error handling patterns
5. Integration with existing systems

## Test First (RED Phase)
No tests needed for documentation.

## Minimal Implementation (GREEN Phase)
Creating basic usage examples.

## Refactored Solution (REFACTOR Phase)
```typescript
// File: /src/security/MessageAuthenticationService.examples.ts
/**
 * # Usage Examples for MessageAuthenticationService
 *
 * This file contains practical examples of how to use the MessageAuthenticationService
 * in different scenarios for cross-origin communication between Chrome extension
 * and bolt.diy platform.
 */

/**
 * ## Example 1: Chrome Extension Message Signing
 *
 * This example shows how to sign messages in a Chrome extension before sending
 * them to the bolt.diy platform.
 *
 * @example
 * ```typescript
 * // content-script.ts (Chrome Extension)
 * import { MessageAuthenticationService } from '../security/MessageAuthenticationService';
 *
 * // Initialize authentication service
 * const authService = new MessageAuthenticationService();
 *
 * // Set secret key (should come from secure storage)
 * // In production, use chrome.storage.session or chrome.runtime.sendMessage
 * // to get the key from the background script
 * authService.setSecretKey('your-shared-secret-key');
 *
 * // Function to send authenticated message to background script
 * async function sendAuthenticatedMessage(action: string, data: any) {
 *   try {
 *     // Create message payload
 *     const message = JSON.stringify({ action, data });
 *
 *     // Sign the message
 *     const signedMessage = authService.signMessage(message);
 *
 *     // Send to background script
 *     const response = await chrome.runtime.sendMessage({
 *       type: 'AUTHENTICATED_MESSAGE',
 *       payload: signedMessage
 *     });
 *
 *     return response;
 *   } catch (error) {
 *     console.error('Failed to send authenticated message:', error);
 *     throw error;
 *   }
 * }
 *
 * // Example usage
 * async function requestProjectSync() {
 *   try {
 *     const response = await sendAuthenticatedMessage('SYNC_PROJECT', {
 *       projectId: 'project-123',
 *       branch: 'main'
 *     });
 *
 *     if (response.success) {
 *       console.log('Project sync initiated successfully');
 *     } else {
 *       console.error('Project sync failed:', response.error);
 *     }
 *   } catch (error) {
 *     console.error('Network error:', error);
 *   }
 * }
 *
 * // Event listener for messages from webpage
 * window.addEventListener('message', async (event) => {
 *   // Security check: only accept messages from our own page
 *   if (event.origin !== window.location.origin) {
 *     return;
 *   }
 *
 *   // Check if it's a message we should authenticate
 *   if (event.data && event.data.type === 'BOLT_SYNC_REQUEST') {
 *     const response = await sendAuthenticatedMessage(
 *       event.data.action,
 *       event.data.payload
 *     );
 *
 *     // Send response back to webpage
 *     window.postMessage({
 *       type: 'BOLT_SYNC_RESPONSE',
 *       requestId: event.data.requestId,
 *       response: response
 *     }, window.location.origin);
 *   }
 * });
 * ```
 */
export function chromeExtensionExample() {}

/**
 * ## Example 2: bolt.diy Platform Message Verification
 *
 * This example shows how to verify signed messages received from the Chrome extension
 * in the bolt.diy platform.
 *
 * @example
 * ```typescript
 * // api/middleware/auth-middleware.ts (bolt.diy Platform)
 * import { MessageAuthenticationService } from '../../security/MessageAuthenticationService';
 * import { SignedMessage } from '../../security/MessageAuthenticationService.types';
 *
 * // Initialize authentication service
 * const authService = new MessageAuthenticationService();
 *
 * // Set the same secret key as used in the extension
 * authService.setSecretKey(process.env.MESSAGE_AUTH_SECRET || 'fallback-key-for-dev');
 *
 * // Set custom expiration time (10 minutes for API requests)
 * authService.setExpirationTime(10 * 60 * 1000);
 *
 * // Express middleware for authenticating messages
 * export function authenticateMessage(req: any, res: any, next: () => void) {
 *   try {
 *     // Extract signed message from request body
 *     const signedMessage: SignedMessage = req.body.signedMessage;
 *
 *     if (!signedMessage) {
 *       return res.status(400).json({ error: 'Missing signed message' });
 *     }
 *
 *     // Verify the message
 *     const isValid = authService.verifyMessage(signedMessage);
 *
 *     if (!isValid) {
 *       return res.status(401).json({ error: 'Invalid or expired message' });
 *     }
 *
 *     // Parse the original message
 *     const payloadObj = JSON.parse(signedMessage.payload);
 *     req.originalMessage = payloadObj.message;
 *     req.messageTimestamp = payloadObj.timestamp;
 *
 *     // Parse the actual data if it's JSON
 *     try {
 *       req.messageData = JSON.parse(payloadObj.message);
 *     } catch (parseError) {
 *       // If not JSON, treat as plain text
 *       req.messageData = payloadObj.message;
 *     }
 *
 *     next();
 *   } catch (error) {
 *     console.error('Authentication error:', error);
 *     res.status(500).json({ error: 'Authentication processing failed' });
 *   }
 * }
 *
 * // Example API route using the middleware
 * // routes/project-sync.ts
 * import { Router } from 'express';
 * import { authenticateMessage } from '../api/middleware/auth-middleware';
 *
 * const router = Router();
 *
 * router.post('/sync', authenticateMessage, async (req, res) => {
 *   try {
 *     // At this point, the message is authenticated
 *     const { action, data } = req.messageData;
 *     const timestamp = req.messageTimestamp;
 *
 *     // Log the authenticated request
 *     console.log(`Authenticated request: ${action} at ${new Date(timestamp)}`);
 *
 *     // Process based on action
 *     switch (action) {
 *       case 'SYNC_PROJECT':
 *         // Handle project sync
 *         const result = await syncProject(data.projectId, data.branch);
 *         res.json({ success: true, result });
 *         break;
 *
 *       case 'GET_STATUS':
 *         // Handle status request
 *         const status = await getSyncStatus(data.projectId);
 *         res.json({ success: true, status });
 *         break;
 *
 *       default:
 *         res.status(400).json({ error: 'Unknown action' });
 *     }
 *   } catch (error) {
 *     console.error('Sync error:', error);
 *     res.status(500).json({ error: 'Sync operation failed' });
 *   }
 * });
 *
 * export default router;
 * ```
 */
export function platformVerificationExample() {}

/**
 * ## Example 3: Secure Key Management
 *
 * This example shows how to securely manage secret keys in both the Chrome extension
 * and bolt.diy platform.
 *
 * @example
 * ```typescript
 * // extension/background/key-manager.ts (Chrome Extension Background Script)
 * import { MessageAuthenticationService } from '../security/MessageAuthenticationService';
 *
 * class ExtensionKeyManager {
 *   private authService: MessageAuthenticationService;
 *   private key: string | null = null;
 *
 *   constructor() {
 *     this.authService = new MessageAuthenticationService();
 *   }
 *
 *   // Initialize key from secure storage
 *   async initializeKey() {
 *     try {
 *       // In production, get key from secure backend service
 *       // This is a simplified example
 *       const result = await chrome.storage.session.get(['authKey']);
 *       if (result.authKey) {
 *         this.key = result.authKey;
 *         this.authService.setSecretKey(this.key);
 *       } else {
 *         throw new Error('Authentication key not found');
 *       }
 *     } catch (error) {
 *       console.error('Failed to initialize authentication key:', error);
 *       throw error;
 *     }
 *   }
 *
 *   // Get authentication service for content scripts
 *   getAuthService(): MessageAuthenticationService {
 *     if (!this.key) {
 *       throw new Error('Key manager not initialized');
 *     }
 *     return this.authService;
 *   }
 *
 *   // Rotate key (called when platform sends new key)
 *   async rotateKey(newKey: string) {
 *     try {
 *       // Validate new key format
 *       if (typeof newKey !== 'string' || newKey.length < 16) {
 *         throw new Error('Invalid key format');
 *       }
 *
 *       // Store in secure session storage
 *       await chrome.storage.session.set({ authKey: newKey });
 *
 *       // Update authentication service
 *       this.key = newKey;
 *       this.authService.setSecretKey(newKey);
 *
 *       console.log('Authentication key rotated successfully');
 *     } catch (error) {
 *       console.error('Failed to rotate authentication key:', error);
 *       throw error;
 *     }
 *   }
 * }
 *
 * // platform/services/key-service.ts (bolt.diy Platform)
 * import { createHash } from 'crypto';
 * import { MessageAuthenticationService } from '../../security/MessageAuthenticationService';
 *
 * class PlatformKeyService {
 *   private static instance: PlatformKeyService;
 *   private authService: MessageAuthenticationService;
 *   private currentKey: string;
 *
 *   private constructor() {
 *     this.authService = new MessageAuthenticationService();
 *     this.currentKey = this.generateSecureKey();
 *     this.authService.setSecretKey(this.currentKey);
 *   }
 *
 *   static getInstance(): PlatformKeyService {
 *     if (!PlatformKeyService.instance) {
 *       PlatformKeyService.instance = new PlatformKeyService();
 *     }
 *     return PlatformKeyService.instance;
 *   }
 *
 *   private generateSecureKey(): string {
 *     // Generate cryptographically secure random key
 *     return require('crypto').randomBytes(32).toString('hex');
 *   }
 *
 *   getAuthService(): MessageAuthenticationService {
 *     return this.authService;
 *   }
 *
 *   getCurrentKey(): string {
 *     return this.currentKey;
 *   }
 *
 *   // Rotate key and notify connected extensions
 *   async rotateKey(): Promise<string> {
 *     const newKey = this.generateSecureKey();
 *     this.currentKey = newKey;
 *     this.authService.setSecretKey(newKey);
 *
 *     // In a real implementation, you would notify connected extensions
 *     // to update their keys
 *     console.log('Key rotated, notify connected clients');
 *
 *     return newKey;
 *   }
 *
 *   // Validate that a key matches current key (for key verification)
 *   validateKey(key: string): boolean {
 *     return key === this.currentKey;
 *   }
 * }
 *
 * // Usage in platform
 * const keyService = PlatformKeyService.getInstance();
 * const authService = keyService.getAuthService();
 *
 * // Usage in extension (simplified)
 * const keyManager = new ExtensionKeyManager();
 * keyManager.initializeKey().then(() => {
 *   const authService = keyManager.getAuthService();
 *   // Use authService for signing messages
 * });
 * ```
 */
export function keyManagementExample() {}

/**
 * ## Example 4: Error Handling Patterns
 *
 * This example shows proper error handling patterns when using the MessageAuthenticationService.
 *
 * @example
 * ```typescript
 * // utils/message-handler.ts
 * import { MessageAuthenticationService, SignedMessage } from '../security/MessageAuthenticationService';
 *
 * class SecureMessageHandler {
 *   private authService: MessageAuthenticationService;
 *
 *   constructor(secretKey: string) {
 *     this.authService = new MessageAuthenticationService();
 *     this.authService.setSecretKey(secretKey);
 *
 *     // Set appropriate expiration time
 *     this.authService.setExpirationTime(5 * 60 * 1000); // 5 minutes
 *   }
 *
 *   async processIncomingMessage(signedMessage: SignedMessage): Promise<any> {
 *     try {
 *       // Validate input
 *       if (!signedMessage || typeof signedMessage !== 'object') {
 *         throw new Error('Invalid message format');
 *       }
 *
 *       // Verify message authenticity
 *       const isAuthentic = this.authService.verifyMessage(signedMessage);
 *
 *       if (!isAuthentic) {
 *         // Log security event (don't expose details to client)
 *         console.warn('Message verification failed', {
 *           timestamp: new Date().toISOString(),
 *           payloadLength: signedMessage.payload?.length || 0,
 *           signatureLength: signedMessage.signature?.length || 0
 *         });
 *
 *         throw new Error('Message authentication failed');
 *       }
 *
 *       // Parse payload
 *       let payloadObj;
 *       try {
 *         payloadObj = JSON.parse(signedMessage.payload);
 *       } catch (parseError) {
 *         throw new Error('Invalid message payload format');
 *       }
 *
 *       // Validate payload structure
 *       if (!payloadObj.hasOwnProperty('message') || !payloadObj.hasOwnProperty('timestamp')) {
 *         throw new Error('Missing required payload fields');
 *       }
 *
 *       // Process the original message
 *       let messageData;
 *       try {
 *         messageData = JSON.parse(payloadObj.message);
 *       } catch (parseError) {
 *         // If not JSON, treat as plain text
 *         messageData = payloadObj.message;
 *       }
 *
 *       return {
 *         success: true,
 *         data: messageData,
 *         timestamp: payloadObj.timestamp
 *       };
 *
 *     } catch (error) {
 *       // Log error for debugging (server-side only)
 *       if (process.env.NODE_ENV === 'development') {
 *         console.error('Message processing error:', error);
 *       }
 *
 *       // Return generic error to client
 *       return {
 *         success: false,
 *         error: 'Message processing failed'
 *       };
 *     }
 *   }
 *
 *   createOutgoingMessage(data: any): SignedMessage {
 *     try {
 *       // Convert data to string
 *       const message = typeof data === 'string' ? data : JSON.stringify(data);
 *
 *       // Sign the message
 *       const signedMessage = this.authService.signMessage(message);
 *
 *       return signedMessage;
 *
 *     } catch (error) {
 *       console.error('Failed to create signed message:', error);
 *       throw new Error('Failed to sign message');
 *     }
 *   }
 *
 *   // Batch process multiple messages
 *   async processBatchMessages(messages: SignedMessage[]): Promise<any[]> {
 *     const results: any[] = [];
 *
 *     for (const message of messages) {
 *       try {
 *         const result = await this.processIncomingMessage(message);
 *         results.push(result);
 *       } catch (error) {
 *         // Continue processing other messages even if one fails
 *         results.push({
 *           success: false,
 *           error: 'Message processing failed'
 *         });
 *       }
 *     }
 *
 *     return results;
 *   }
 * }
 *
 * // Usage example
 * const messageHandler = new SecureMessageHandler('your-secret-key');
 *
 * // Process single message
 * async function handleSingleMessage(signedMessage: SignedMessage) {
 *   const result = await messageHandler.processIncomingMessage(signedMessage);
 *
 *   if (result.success) {
 *     console.log('Message processed successfully:', result.data);
 *   } else {
 *     console.error('Message processing failed:', result.error);
 *   }
 *
 *   return result;
 * }
 *
 * // Process batch of messages
 * async function handleBatchMessages(signedMessages: SignedMessage[]) {
 *   const results = await messageHandler.processBatchMessages(signedMessages);
 *
 *   const successful = results.filter(r => r.success).length;
 *   const failed = results.filter(r => !r.success).length;
 *
 *   console.log(`Processed ${successful} successful, ${failed} failed messages`);
 *
 *   return results;
 * }
 *
 * // Create and send message
 * function sendSecureMessage(data: any) {
 *   try {
 *     const signedMessage = messageHandler.createOutgoingMessage(data);
 *
 *     // Send via your preferred method (fetch, WebSocket, etc.)
 *     return fetch('/api/secure-endpoint', {
 *       method: 'POST',
 *       headers: {
 *         'Content-Type': 'application/json',
 *       },
 *       body: JSON.stringify({ signedMessage })
 *     });
 *   } catch (error) {
 *     console.error('Failed to send secure message:', error);
 *     throw error;
 *   }
 * }
 * ```
 */
export function errorHandlingExample() {}

/**
 * ## Example 5: Integration with Existing Systems
 *
 * This example shows how to integrate the MessageAuthenticationService with
 * existing authentication systems and APIs.
 *
 * @example
 * ```typescript
 * // integrations/legacy-auth-bridge.ts
 * import { MessageAuthenticationService } from '../security/MessageAuthenticationService';
 *
 * class AuthBridge {
 *   private authService: MessageAuthenticationService;
 *   private legacyAuthService: any; // Your existing auth system
 *
 *   constructor(legacyAuthService: any, secretKey: string) {
 *     this.legacyAuthService = legacyAuthService;
 *     this.authService = new MessageAuthenticationService();
 *     this.authService.setSecretKey(secretKey);
 *   }
 *
 *   // Convert legacy auth token to signed message
 *   convertLegacyToken(legacyToken: string, action: string, data: any): any {
 *     // Validate legacy token first
 *     if (!this.legacyAuthService.validateToken(legacyToken)) {
 *       throw new Error('Invalid legacy token');
 *     }
 *
 *     // Get user info from legacy system
 *     const userInfo = this.legacyAuthService.getUserInfo(legacyToken);
 *
 *     // Create message with user context
 *     const messageData = {
 *       action,
 *       data,
 *       user: {
 *         id: userInfo.id,
 *         role: userInfo.role,
 *         permissions: userInfo.permissions
 *       },
 *       context: 'legacy-bridge'
 *     };
 *
 *     // Sign the message
 *     const signedMessage = this.authService.signMessage(JSON.stringify(messageData));
 *
 *     return {
 *       signedMessage,
 *       userInfo
 *     };
 *   }
 *
 *   // Validate signed message and check legacy permissions
 *   async validateAndAuthorize(signedMessage: any, requiredPermission: string): Promise<boolean> {
 *     // First validate the signature
 *     const isValid = this.authService.verifyMessage(signedMessage);
 *     if (!isValid) {
 *       return false;
 *     }
 *
 *     // Parse the message
 *     const payloadObj = JSON.parse(signedMessage.payload);
 *     const messageData = JSON.parse(payloadObj.message);
 *
 *     // Check if this came through the legacy bridge
 *     if (messageData.context !== 'legacy-bridge') {
 *       return false;
 *     }
 *
 *     // Check user permissions in legacy system
 *     const hasPermission = await this.legacyAuthService.checkPermission(
 *       messageData.user.id,
 *       requiredPermission
 *     );
 *
 *     return hasPermission;
 *   }
 * }
 *
 * // api/controllers/bridged-controller.ts
 * import { AuthBridge } from '../integrations/legacy-auth-bridge';
 *
 * class BridgedAPIController {
 *   private authBridge: AuthBridge;
 *
 *   constructor(legacyAuthService: any, secretKey: string) {
 *     this.authBridge = new AuthBridge(legacyAuthService, secretKey);
 *   }
 *
 *   async handleBridgedRequest(req: any, res: any) {
 *     try {
 *       const { signedMessage, legacyToken } = req.body;
 *
 *       let processedMessage;
 *
 *       // If we have a legacy token, convert it
 *       if (legacyToken) {
 *         processedMessage = this.authBridge.convertLegacyToken(
 *           legacyToken,
 *           req.body.action,
 *           req.body.data
 *         );
 *       } else {
 *         // Otherwise validate the signed message directly
 *         const isValid = this.authBridge.validateAndAuthorize(
 *           signedMessage,
 *           'api-access'
 *         );
 *
 *         if (!isValid) {
 *           return res.status(401).json({ error: 'Unauthorized' });
 *         }
 *
 *         processedMessage = { signedMessage };
 *       }
 *
 *       // Process the request
 *       const result = await this.processRequest(processedMessage);
 *       res.json({ success: true, result });
 *
 *     } catch (error) {
 *       console.error('Bridged request error:', error);
 *       res.status(500).json({ error: 'Request processing failed' });
 *     }
 *   }
 *
 *   private async processRequest(processedMessage: any) {
 *     // Your business logic here
 *     // This is where you'd use the authenticated message
 *     return { message: 'Request processed successfully' };
 *   }
 * }
 * ```
 */
export function integrationExample() {}
```

## Verification Commands
```bash
# Check that TypeScript compiles without errors
npx tsc --noEmit src/security/MessageAuthenticationService.examples.ts

# Run documentation linting (if configured)
npm run lint:docs
```

## Success Criteria
- [ ] Chrome extension implementation example created
- [ ] bolt.diy platform verification example created
- [ ] Secure key management examples provided
- [ ] Error handling patterns documented
- [ ] Integration with existing systems shown
- [ ] All examples are realistic and practical
- [ ] TypeScript compiles without errors
- [ ] Examples follow best practices

## Dependencies Confirmed
- MessageAuthenticationService implementation
- TypeScript compiler
- Chrome extension APIs
- Express.js (for platform examples)

## Next Task
Implementation of the actual MessageAuthenticationService