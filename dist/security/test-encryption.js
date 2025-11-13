"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const PayloadEncryptionService_1 = require("../security/PayloadEncryptionService");
async function testPayloadEncryption() {
    console.log('Testing PayloadEncryptionService...\n');
    const service = new PayloadEncryptionService_1.PayloadEncryptionService();
    const secret = 'test-secret-key';
    const payload = 'This is a test payload with sensitive data';
    try {
        // Test encryption
        console.log('1. Encrypting payload...');
        const encrypted = await service.encryptPayload(payload, secret);
        console.log('✓ Encryption successful');
        console.log(`   Encrypted payload length: ${encrypted.encryptedPayload.length}`);
        console.log(`   IV length: ${encrypted.iv.length}`);
        console.log(`   Auth tag length: ${encrypted.authTag.length}`);
        console.log(`   Salt length: ${encrypted.salt.length}`);
        console.log(`   Timestamp: ${encrypted.timestamp}\n`);
        // Test decryption
        console.log('2. Decrypting payload...');
        const decrypted = await service.decryptPayload(encrypted, secret);
        console.log('✓ Decryption successful');
        console.log(`   Decrypted payload: ${decrypted}`);
        console.log(`   Payloads match: ${decrypted === payload}\n`);
        // Test with different secret (should fail)
        console.log('3. Testing with wrong secret...');
        try {
            await service.decryptPayload(encrypted, 'wrong-secret');
            console.log('✗ Decryption should have failed');
        }
        catch (error) {
            console.log('✓ Decryption correctly failed with wrong secret');
            console.log(`   Error: ${error.message}\n`);
        }
        // Test empty payload
        console.log('4. Testing with empty payload...');
        const emptyEncrypted = await service.encryptPayload('', secret);
        const emptyDecrypted = await service.decryptPayload(emptyEncrypted, secret);
        console.log('✓ Empty payload encryption/decryption successful');
        console.log(`   Empty payload result: "${emptyDecrypted}"\n`);
        console.log('=== All tests passed! ===');
    }
    catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
}
testPayloadEncryption().catch(console.error);
//# sourceMappingURL=test-encryption.js.map