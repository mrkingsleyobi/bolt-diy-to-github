import { TokenEncryptionService } from '../../src/security/TokenEncryptionService';
describe('TokenEncryptionService', () => {
    let encryptionService;
    const testToken = 'ghp_validtoken12345678901234567890123456';
    const password = 'test-password-123';
    beforeEach(() => {
        encryptionService = new TokenEncryptionService();
    });
    describe('encryptToken', () => {
        it('should encrypt a token and return a hex string', async () => {
            const encryptedToken = await encryptionService.encryptToken(testToken, password);
            // Check that the result is a string
            expect(typeof encryptedToken).toBe('string');
            // Check that it's a hex string
            expect(encryptedToken).toMatch(/^[0-9a-f]+$/);
            // Check that it's not the same as the original token
            expect(encryptedToken).not.toBe(testToken);
        });
        it('should produce different encrypted tokens for the same input', async () => {
            const encryptedToken1 = await encryptionService.encryptToken(testToken, password);
            const encryptedToken2 = await encryptionService.encryptToken(testToken, password);
            // Due to random salt and IV, encrypted tokens should be different
            expect(encryptedToken1).not.toBe(encryptedToken2);
        });
        it('should throw an error for invalid inputs', async () => {
            await expect(encryptionService.encryptToken('', password))
                .rejects
                .toThrow();
        });
    });
    describe('decryptToken', () => {
        it('should decrypt an encrypted token correctly', async () => {
            const encryptedToken = await encryptionService.encryptToken(testToken, password);
            const decryptedToken = await encryptionService.decryptToken(encryptedToken, password);
            expect(decryptedToken).toBe(testToken);
        });
        it('should throw an error for incorrect password', async () => {
            const encryptedToken = await encryptionService.encryptToken(testToken, password);
            await expect(encryptionService.decryptToken(encryptedToken, 'wrong-password'))
                .rejects
                .toThrow('Failed to decrypt token');
        });
        it('should throw an error for corrupted data', async () => {
            await expect(encryptionService.decryptToken('invalid-hex-string', password))
                .rejects
                .toThrow('Failed to decrypt token');
        });
    });
    describe('round-trip encryption/decryption', () => {
        it('should maintain data integrity through encryption and decryption', async () => {
            const originalToken = 'github_pat_abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghij';
            const encryptedToken = await encryptionService.encryptToken(originalToken, password);
            const decryptedToken = await encryptionService.decryptToken(encryptedToken, password);
            expect(decryptedToken).toBe(originalToken);
        });
    });
});
