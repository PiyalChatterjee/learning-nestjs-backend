import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UploadToAzureProvider } from './upload-to-azure.provider';

describe('UploadToAzureProvider', () => {
  let provider: UploadToAzureProvider;
  const configServiceMock = {
    get: jest.fn((key: string, defaultValue?: string) => {
      if (key === 'appConfig.azureStorage.connectionString') {
        return 'UseDevelopmentStorage=true';
      }

      if (key === 'appConfig.azureStorage.containerName') {
        return defaultValue ?? 'uploads';
      }

      if (key === 'appConfig.azureStorage.cdnEndpoint') {
        return undefined;
      }

      return defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadToAzureProvider,
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
      ],
    }).compile();

    provider = module.get<UploadToAzureProvider>(UploadToAzureProvider);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
