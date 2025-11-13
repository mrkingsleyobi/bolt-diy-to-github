import { MessageAuthenticationService } from '../MessageAuthenticationService';

describe('MessageAuthenticationService', () => {
  let service: MessageAuthenticationService;
  const testSecret = 'test-secret-key-for-hmac';

  beforeEach(() => {
    jest.useFakeTimers();
    service = new MessageAuthenticationService();
    service.setSecretKey(testSecret);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should have required methods', () => {
    expect(typeof service.signMessage).toBe('function');
    expect(typeof service.verifyMessage).toBe('function');
    expect(typeof service.setSecretKey).toBe('function');
    expect(typeof service.setExpirationTime).toBe('function');
    expect(typeof service.getExpirationTime).toBe('function');
  });

  it('should sign and verify a message successfully', () => {
    const message = 'Hello, secure world!';
    const signedMessage = service.signMessage(message);
    const isValid = service.verifyMessage(signedMessage);

    expect(isValid).toBe(true);
  });

  it('should reject a message with invalid signature', () => {
    const message = 'Hello, secure world!';
    const signedMessage = service.signMessage(message);
    signedMessage.signature = 'invalid-signature';
    const isValid = service.verifyMessage(signedMessage);

    expect(isValid).toBe(false);
  });

  it('should reject an expired message', () => {
    // Set short expiration for testing
    service.setExpirationTime(100); // 100ms

    const message = 'Hello, secure world!';
    const signedMessage = service.signMessage(message);

    // Advance time beyond expiration
    jest.advanceTimersByTime(200);

    const isValid = service.verifyMessage(signedMessage);
    expect(isValid).toBe(false);
  });

  it('should throw error when signing without secret key', () => {
    const serviceWithoutKey = new MessageAuthenticationService();
    expect(() => {
      serviceWithoutKey.signMessage('test');
    }).toThrow('Secret key not set');
  });

  it('should throw error when verifying without secret key', () => {
    const serviceWithoutKey = new MessageAuthenticationService();
    const signedMessage = service.signMessage('test');
    expect(() => {
      serviceWithoutKey.verifyMessage(signedMessage);
    }).toThrow('Secret key not set');
  });
});