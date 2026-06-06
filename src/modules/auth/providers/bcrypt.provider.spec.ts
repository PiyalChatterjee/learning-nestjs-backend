import { Test, TestingModule } from '@nestjs/testing';
import { BcryptProvider } from './bcrypt.provider';

describe('BcryptProvider', () => {
  let provider: BcryptProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BcryptProvider],
    }).compile();

    provider = module.get<BcryptProvider>(BcryptProvider);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  describe('hashPassword', () => {
    it('should hash a password and return a string', async () => {
      const hash = await provider.hashPassword('Password123!');
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash).not.toBe('Password123!');
    });

    it('should produce different hashes for the same input', async () => {
      const hash1 = await provider.hashPassword('Password123!');
      const hash2 = await provider.hashPassword('Password123!');
      expect(hash1).not.toBe(hash2);
    });

    it('should accept a Buffer as input', async () => {
      const hash = await provider.hashPassword(Buffer.from('Password123!'));
      expect(hash).toBeDefined();
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching password and hash', async () => {
      const hash = await provider.hashPassword('Password123!');
      const result = await provider.comparePassword('Password123!', hash);
      expect(result).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      const hash = await provider.hashPassword('Password123!');
      const result = await provider.comparePassword('WrongPassword!', hash);
      expect(result).toBe(false);
    });

    it('should accept a Buffer as input', async () => {
      const hash = await provider.hashPassword('Password123!');
      const result = await provider.comparePassword(Buffer.from('Password123!'), hash);
      expect(result).toBe(true);
    });
  });
});

