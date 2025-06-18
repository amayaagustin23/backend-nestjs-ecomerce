import * as bcrypt from 'bcrypt';
import { comparePassword, hashPassword } from '.';

jest.mock('bcrypt');

describe('Password Helpers', () => {
  const plainText = 'securePassword123';
  const hashedText = 'hashedValue';

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.HASH_SALT = '10';
  });

  it('should hash the password using bcrypt', async () => {
    (bcrypt.hash as jest.Mock).mockResolvedValue(hashedText);

    const result = await hashPassword(plainText);

    expect(bcrypt.hash).toHaveBeenCalledWith(plainText, 10);
    expect(result).toBe(hashedText);
  });

  it('should compare the password and return true if they match', async () => {
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const result = await comparePassword(plainText, hashedText);

    expect(bcrypt.compare).toHaveBeenCalledWith(plainText, hashedText);
    expect(result).toBe(true);
  });

  it('should compare the password and return false if they do not match', async () => {
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    const result = await comparePassword(plainText, hashedText);

    expect(result).toBe(false);
  });
});
