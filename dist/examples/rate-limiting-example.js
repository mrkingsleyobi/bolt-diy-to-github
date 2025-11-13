"use strict";
/**
 * Rate Limiting Service Example
 *
 * This example demonstrates how to use the RateLimitingService for cross-origin communication
 * in the Bolt.DIY to GitHub Chrome extension.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const RateLimitingService_1 = require("../security/RateLimitingService");
const MessageAuthenticationService_1 = require("../security/MessageAuthenticationService");
const PayloadEncryptionService_1 = require("../security/PayloadEncryptionService");
// Example 1: Basic Rate Limiting
async function basicRateLimitingExample() {
    console.log('=== Basic Rate Limiting Example ===');
    // Create a rate limiting service with 5 tokens and 1 token/second refill rate
    const rateLimiter = new RateLimitingService_1.RateLimitingService(5, 1, 'example-secret-key');
    // Simulate requests
    for (let i = 1; i <= 7; i++) {
        console.log(`\nRequest ${i}:`);
        // Check if we can proceed with the request
        if (rateLimiter.consume(1)) {
            console.log('✅ Request allowed');
            console.log(`Remaining tokens: ${rateLimiter.getAvailableTokens()}`);
        }
        else {
            console.log('❌ Rate limit exceeded');
            console.log(`Available tokens: ${rateLimiter.getAvailableTokens()}`);
        }
    }
    console.log('\n--- Waiting 3 seconds for token refill ---');
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log(`\nAfter refill, available tokens: ${rateLimiter.getAvailableTokens()}`);
    // Now we should be able to make more requests
    if (rateLimiter.consume(1)) {
        console.log('✅ Request allowed after refill');
    }
}
// Example 2: Authenticated Cross-Origin Communication
async function authenticatedCommunicationExample() {
    console.log('\n\n=== Authenticated Cross-Origin Communication Example ===');
    // Create services
    const rateLimiter = new RateLimitingService_1.RateLimitingService(10, 2, 'communication-secret');
    const authService = new MessageAuthenticationService_1.MessageAuthenticationService();
    const encryptionService = new PayloadEncryptionService_1.PayloadEncryptionService();
    // Set up authentication
    authService.setSecretKey('communication-secret');
    authService.setExpirationTime(5 * 60 * 1000); // 5 minutes
    // Client side: Prepare request
    const requestData = {
        action: 'export-project',
        projectId: 'bolt-project-123',
        userId: 'user-abc',
        timestamp: Date.now()
    };
    console.log('\n1. Client preparing request...');
    console.log('Request data:', requestData);
    // Check rate limit
    if (!rateLimiter.consume(1)) {
        console.log('❌ Rate limit exceeded, cannot proceed');
        return;
    }
    console.log('✅ Rate limit check passed');
    // Create authenticated rate limit token
    const token = rateLimiter.createRateLimitToken(requestData, 5);
    console.log('\n2. Created authenticated token');
    console.log('Token length:', token.length);
    // Server side: Validate token
    console.log('\n3. Server validating token...');
    const isTokenValid = rateLimiter.validateRateLimitToken(token);
    console.log('Token valid:', isTokenValid);
    if (!isTokenValid) {
        console.log('❌ Invalid token, rejecting request');
        return;
    }
    // Extract payload
    const signedMessage = JSON.parse(token);
    const payloadData = JSON.parse(signedMessage.payload);
    console.log('Extracted payload:', payloadData);
    // Server processes request and prepares response
    const responseData = {
        success: true,
        message: 'Project exported successfully',
        repoUrl: 'https://github.com/user/bolt-project-123',
        commitSha: 'a1b2c3d4e5f67890',
        timestamp: Date.now()
    };
    console.log('\n4. Server preparing response...');
    console.log('Response data:', responseData);
    // Encrypt response
    const encryptedResponse = await rateLimiter.encryptWithRateLimit(JSON.stringify(responseData), 'response-encryption-key');
    console.log('Encrypted response length:', encryptedResponse.length);
    // Client side: Decrypt response
    console.log('\n5. Client decrypting response...');
    const decryptedResponse = await rateLimiter.decryptWithRateLimit(encryptedResponse, 'response-encryption-key');
    const parsedResponse = JSON.parse(decryptedResponse);
    console.log('Decrypted response:', parsedResponse);
    console.log('✅ Communication completed successfully');
}
// Example 3: Configuration Management
function configurationManagementExample() {
    console.log('\n\n=== Configuration Management Example ===');
    // Create service with default configuration
    const rateLimiter = new RateLimitingService_1.RateLimitingService(10, 1, 'config-secret');
    console.log('Initial configuration:');
    console.log('- Bucket size:', rateLimiter.getBucketSize());
    console.log('- Refill rate:', rateLimiter.getRefillRate());
    console.log('- Available tokens:', rateLimiter.getAvailableTokens());
    // Update configuration for high-throughput scenario
    console.log('\nUpdating configuration for high-throughput scenario...');
    rateLimiter.updateConfiguration(50, 10); // 50 tokens, 10 tokens/second
    console.log('Updated configuration:');
    console.log('- Bucket size:', rateLimiter.getBucketSize());
    console.log('- Refill rate:', rateLimiter.getRefillRate());
    console.log('- Available tokens:', rateLimiter.getAvailableTokens());
    // Update configuration for strict rate limiting
    console.log('\nUpdating configuration for strict rate limiting...');
    rateLimiter.updateConfiguration(5, 0.5); // 5 tokens, 0.5 tokens/second
    console.log('Strict configuration:');
    console.log('- Bucket size:', rateLimiter.getBucketSize());
    console.log('- Refill rate:', rateLimiter.getRefillRate());
    console.log('- Available tokens:', rateLimiter.getAvailableTokens());
}
// Example 4: Error Handling
async function errorHandlingExample() {
    console.log('\n\n=== Error Handling Example ===');
    const rateLimiter = new RateLimitingService_1.RateLimitingService(5, 1, 'error-secret');
    try {
        // Try to create token without secret key
        rateLimiter.setSecretKey('');
        rateLimiter.createRateLimitToken({ test: 'data' });
    }
    catch (error) {
        console.log('✅ Caught expected error:', error.message);
    }
    // Reset secret key
    rateLimiter.setSecretKey('error-secret');
    try {
        // Try to update with invalid configuration
        rateLimiter.updateConfiguration(-1, 1);
    }
    catch (error) {
        console.log('✅ Caught expected error:', error.message);
    }
    try {
        // Try to set invalid secret key
        rateLimiter.setSecretKey('');
    }
    catch (error) {
        console.log('✅ Caught expected error:', error.message);
    }
    try {
        // Try to decrypt invalid data
        await rateLimiter.decryptWithRateLimit('invalid-data', 'secret');
    }
    catch (error) {
        console.log('✅ Caught expected error:', error.message);
    }
    console.log('✅ All error handling scenarios tested');
}
// Example 5: Chrome Extension Integration
async function chromeExtensionIntegrationExample() {
    console.log('\n\n=== Chrome Extension Integration Example ===');
    // Simulate background script initialization
    const rateLimiter = new RateLimitingService_1.RateLimitingService(20, 2, 'extension-secret');
    console.log('Chrome extension rate limiter initialized');
    console.log('- Bucket size:', rateLimiter.getBucketSize());
    console.log('- Refill rate:', rateLimiter.getRefillRate());
    // Simulate handling multiple export requests
    const handleExportRequest = async (projectId) => {
        console.log(`\nHandling export request for project: ${projectId}`);
        // Check rate limit
        if (!rateLimiter.consume(1)) {
            console.log('❌ Rate limit exceeded for export request');
            return { error: 'Rate limit exceeded' };
        }
        console.log('✅ Rate limit check passed');
        // Create authenticated token for cross-origin communication
        const tokenPayload = {
            action: 'export-project',
            projectId,
            timestamp: Date.now()
        };
        const token = rateLimiter.createRateLimitToken(tokenPayload, 5);
        console.log('Created authentication token for cross-origin request');
        // In a real implementation, this would communicate with GitHub API
        // with proper rate limiting and authentication
        console.log('Processing export (simulated)...');
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 100));
        return {
            success: true,
            message: `Project ${projectId} exported successfully`,
            rateLimitInfo: {
                availableTokens: rateLimiter.getAvailableTokens(),
                bucketSize: rateLimiter.getBucketSize(),
                refillRate: rateLimiter.getRefillRate()
            }
        };
    };
    // Process multiple requests
    const projects = ['project-1', 'project-2', 'project-3', 'project-4', 'project-5'];
    for (const project of projects) {
        const result = await handleExportRequest(project);
        console.log('Result:', result);
    }
    console.log('\nFinal rate limit status:');
    console.log('- Available tokens:', rateLimiter.getAvailableTokens());
    console.log('- Bucket size:', rateLimiter.getBucketSize());
    console.log('- Refill rate:', rateLimiter.getRefillRate());
}
// Run all examples
async function runExamples() {
    console.log('Rate Limiting Service Examples');
    console.log('==============================');
    await basicRateLimitingExample();
    await authenticatedCommunicationExample();
    configurationManagementExample();
    await errorHandlingExample();
    await chromeExtensionIntegrationExample();
    console.log('\n\n🎉 All examples completed successfully!');
}
// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runExamples };
}
// Run examples if this file is executed directly
if (require.main === module) {
    runExamples().catch(console.error);
}
//# sourceMappingURL=rate-limiting-example.js.map