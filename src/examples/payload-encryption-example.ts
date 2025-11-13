import { PayloadEncryptionService } from '../security';

/**
 * Example demonstrating how to use the PayloadEncryptionService for
 * securing sensitive data in cross-origin communication between
 * Chrome extension and bolt.diy platform.
 */

async function demonstratePayloadEncryption() {
  console.log('=== Payload Encryption Service Example ===\n');

  // Create an instance of the service
  const encryptionService = new PayloadEncryptionService();

  // Set expiration time for encrypted messages (optional)
  // Default is 5 minutes, set to 0 for no expiration
  encryptionService.setExpirationTime(10 * 60 * 1000); // 10 minutes

  // Example: Sensitive data to be transmitted
  const sensitiveData = {
    userId: 'user123',
    githubToken: 'gho_secret_token_xyz',
    action: 'sync-project',
    projectId: 'project-abc',
    timestamp: Date.now()
  };

  const secretKey = 'super-secret-key-shared-between-extension-and-platform';

  try {
    // 1. Encrypt the payload before sending
    console.log('1. Encrypting sensitive payload...');
    const encryptedMessage = await encryptionService.encryptPayload(
      JSON.stringify(sensitiveData),
      secretKey
    );

    console.log('Encrypted message structure:');
    console.log(`  - Encrypted Payload: ${encryptedMessage.encryptedPayload.substring(0, 50)}...`);
    console.log(`  - IV: ${encryptedMessage.iv.substring(0, 20)}...`);
    console.log(`  - Auth Tag: ${encryptedMessage.authTag.substring(0, 20)}...`);
    console.log(`  - Salt: ${encryptedMessage.salt.substring(0, 20)}...`);
    console.log(`  - Timestamp: ${new Date(encryptedMessage.timestamp).toISOString()}\n`);

    // 2. Simulate transmission (serialize for sending over message channel)
    console.log('2. Simulating transmission over cross-origin channel...');
    const serializedMessage = JSON.stringify(encryptedMessage);
    console.log(`Serialized message length: ${serializedMessage.length} characters\n`);

    // 3. Simulate receiving and deserializing
    console.log('3. Receiving and deserializing message...');
    const receivedMessage = JSON.parse(serializedMessage);
    console.log('Message received successfully\n');

    // 4. Decrypt the payload
    console.log('4. Decrypting received payload...');
    const decryptedPayload = await encryptionService.decryptPayload(
      receivedMessage,
      secretKey
    );

    const decryptedData = JSON.parse(decryptedPayload);
    console.log('Decrypted data:');
    console.log(`  - User ID: ${decryptedData.userId}`);
    console.log(`  - Action: ${decryptedData.action}`);
    console.log(`  - Project ID: ${decryptedData.projectId}`);
    console.log(`  - Timestamp: ${new Date(decryptedData.timestamp).toISOString()}\n`);

    // 5. Verify data integrity
    console.log('5. Verifying data integrity...');
    if (decryptedData.userId === sensitiveData.userId &&
        decryptedData.action === sensitiveData.action) {
      console.log('✓ Data integrity verified - payload is authentic and unmodified\n');
    } else {
      console.log('✗ Data integrity check failed\n');
    }

    // 6. Demonstrate expiration
    console.log('6. Demonstrating expiration handling...');
    encryptionService.setExpirationTime(100); // 100ms for demo

    const expiredMessage = await encryptionService.encryptPayload(
      'This message will expire quickly',
      secretKey
    );

    // Wait for expiration
    await new Promise(resolve => setTimeout(resolve, 200));

    try {
      await encryptionService.decryptPayload(expiredMessage, secretKey);
      console.log('✗ Expected expiration error did not occur');
    } catch (error) {
      console.log('✓ Expiration handled correctly:', (error as Error).message);
    }

    console.log('\n=== Example completed successfully ===');

  } catch (error) {
    console.error('Error in encryption/decryption process:', error);
  }
}

// Example for cross-origin communication in Chrome extension
async function crossOriginCommunicationExample() {
  console.log('\n=== Cross-Origin Communication Example ===\n');

  const service = new PayloadEncryptionService();
  const secret = 'shared-secret-between-extension-and-platform';

  // In content script (sending message to background script)
  const outgoingMessage = {
    type: 'SECURE_DATA_TRANSFER',
    data: {
      action: 'github-sync',
      repository: 'my-awesome-project',
      branch: 'main'
    }
  };

  // Encrypt before sending
  const encryptedOutgoing = await service.encryptPayload(
    JSON.stringify(outgoingMessage),
    secret
  );

  // Simulate sending via chrome.runtime.sendMessage
  console.log('Sending encrypted message from content script to background script...');
  console.log(`Encrypted payload length: ${encryptedOutgoing.encryptedPayload.length} characters\n`);

  // In background script (receiving and processing)
  console.log('Receiving and decrypting message in background script...');
  try {
    const decryptedIncoming = await service.decryptPayload(encryptedOutgoing, secret);
    const parsedMessage = JSON.parse(decryptedIncoming);

    console.log('Decrypted message:');
    console.log(`  - Type: ${parsedMessage.type}`);
    console.log(`  - Action: ${parsedMessage.data.action}`);
    console.log(`  - Repository: ${parsedMessage.data.repository}`);
    console.log(`  - Branch: ${parsedMessage.data.branch}`);

    console.log('\n✓ Cross-origin communication example completed successfully');
  } catch (error) {
    console.error('Failed to decrypt cross-origin message:', error);
  }
}

// Run the examples
if (require.main === module) {
  demonstratePayloadEncryption()
    .then(() => crossOriginCommunicationExample())
    .catch(console.error);
}

export { demonstratePayloadEncryption, crossOriginCommunicationExample };