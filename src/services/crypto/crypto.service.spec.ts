import { CryptoService } from './crypto.service';

describe('CryptoService', () => {
  let service: CryptoService;

  beforeEach(() => {
    service = new CryptoService();
  });

  it('should encrypt and decrypt a value correctly', () => {
    const originalText = 'texto-secreto';
    const encrypted = service.encrypt(originalText);
    const decrypted = service.decrypt(encrypted);

    expect(decrypted).toBe(originalText);
    expect(encrypted).not.toBe(originalText);
  });

  it('should return empty string if decrypting invalid data', () => {
    const result = service.decrypt('texto-no-encriptado');
    expect(result).toBe('');
  });
});
