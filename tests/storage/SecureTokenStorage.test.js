import { SecureTokenStorage } from '../../src/services/storage/SecureTokenStorage';
import { TokenEncryptionService } from '../../src/security/TokenEncryptionService';
// Mock localStorage
const mockLocalStorage = {
    store: {},
    getItem(key) {
        return this.store[key] || null;
    },
    setItem(key, value) {
        this.store[key] = value;
    },
    removeItem(key) {
        delete this.store[key];
    },
    clear() {
        this.store = {};
    }
};
// Mock crypto for consistent testing
const mockCryptoKey = 'mock-encryption-key-32-bytes-long!!';
const mockEncryptedData = 'mock-encrypted-data';
// Mock the TokenEncryptionService
jest.mock('../../src/security/TokenEncryptionService');
describe('SecureTokenStorage', () => {
    let tokenStorage;
    const testToken = 'ghp_validtoken12345678901234567890123456';
    const password = 'test-password-123';
    const key = 'test-user';
    beforeEach(() => {
        // Reset mock localStorage
        mockLocalStorage.clear();
        // Mock global localStorage
        Object.defineProperty(global, 'localStorage', {
            value: mockLocalStorage,
            writable: true
        });
        tokenStorage = new SecureTokenStorage();
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('storeToken', () => {
        it('should store an encrypted token', async () => {
            // Mock the encryption service to return predictable data
            TokenEncryptionService.mockImplementation(() => {
                return {
                    encryptToken: jest.fn().mockResolvedValue(mockEncryptedData),
                    decryptToken: jest.fn().mockResolvedValue(testToken)
                };
            });
            await tokenStorage.storeToken(testToken, password, key);
            // Check that the token was stored
            const storedData = mockLocalStorage.getItem('github_tokens');
            expect(storedData).not.toBeNull();
            const parsedData = JSON.parse(storedData);
            expect(parsedData[key]).toBe(mockEncryptedData);
        });
        it('should throw an error if encryption fails', async () => {
            // Mock the encryption service to throw an error
            TokenEncryptionService.mockImplementation(() => {
                return {
                    encryptToken: jest.fn().mockRejectedValue(new Error('Encryption failed')),
                    decryptToken: jest.fn()
                };
            });
            await expect(tokenStorage.storeToken(testToken, password, key))
                .rejects
                .toThrow('Failed to store token: Encryption failed');
        });
    });
    describe('retrieveToken', () => {
        beforeEach(async () => {
            // Set up mock encryption service
            TokenEncryptionService.mockImplementation(() => {
                return {
                    encryptToken: jest.fn().mockResolvedValue(mockEncryptedData),
                    decryptToken: jest.fn().mockResolvedValue(testToken)
                };
            });
            // Store a token first
            await tokenStorage.storeToken(testToken, password, key);
        });
        it('should retrieve and decrypt a stored token', async () => {
            const retrievedToken = await tokenStorage.retrieveToken(password, key);
            expect(retrievedToken).toBe(testToken);
        });
        it('should throw an error for non-existent token', async () => {
            await expect(tokenStorage.retrieveToken(password, 'non-existent-key'))
                .rejects
                .toThrow('No token found for key: non-existent-key');
        });
        it('should throw an error for incorrect password', async () => {
            TokenEncryptionService.mockImplementation(() => {
                return {
                    encryptToken: jest.fn().mockResolvedValue(mockEncryptedData),
                    decryptToken: jest.fn().mockRejectedValue(new Error('Failed to decrypt token: invalid password or corrupted data'))
                };
            });
            await expect(tokenStorage.retrieveToken('wrong-password', key))
                .rejects
                .toThrow('Failed to retrieve token: Failed to decrypt token: invalid password or corrupted data');
        });
    });
    describe('removeToken', () => {
        beforeEach(async () => {
            // Set up mock encryption service
            TokenEncryptionService.mockImplementation(() => {
                return {
                    encryptToken: jest.fn().mockResolvedValue(mockEncryptedData),
                    decryptToken: jest.fn().mockResolvedValue(testToken)
                };
            });
            // Store a token first
            await tokenStorage.storeToken(testToken, password, key);
        });
        it('should remove a stored token', () => {
            expect(tokenStorage.hasToken(key)).toBe(true);
            tokenStorage.removeToken(key);
            expect(tokenStorage.hasToken(key)).toBe(false);
        });
    });
    describe('hasToken', () => {
        it('should return false for non-existent token', () => {
            expect(tokenStorage.hasToken(key)).toBe(false);
        });
        it('should return true for existing token', async () => {
            // Set up mock encryption service
            TokenEncryptionService.mockImplementation(() => {
                return {
                    encryptToken: jest.fn().mockResolvedValue(mockEncryptedData),
                    decryptToken: jest.fn().mockResolvedValue(testToken)
                };
            });
            await tokenStorage.storeToken(testToken, password, key);
            expect(tokenStorage.hasToken(key)).toBe(true);
        });
    });
    describe('getTokenKeys', () => {
        it('should return an empty array when no tokens are stored', () => {
            expect(tokenStorage.getTokenKeys()).toEqual([]);
        });
        it('should return stored token keys', async () => {
            // Set up mock encryption service
            TokenEncryptionService.mockImplementation(() => {
                return {
                    encryptToken: jest.fn().mockResolvedValue(mockEncryptedData),
                    decryptToken: jest.fn().mockResolvedValue(testToken)
                };
            });
            await tokenStorage.storeToken(testToken, password, 'key1');
            await tokenStorage.storeToken(testToken, password, 'key2');
            expect(tokenStorage.getTokenKeys()).toEqual(['key1', 'key2']);
        });
    });
});
