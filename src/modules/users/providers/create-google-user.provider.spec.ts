import { Test, TestingModule } from '@nestjs/testing';
import { CreateGoogleUserProvider } from './create-google-user.provider';

describe('CreateGoogleUserProvider', () => {
  let provider: CreateGoogleUserProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CreateGoogleUserProvider],
    }).compile();

    provider = module.get<CreateGoogleUserProvider>(CreateGoogleUserProvider);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
