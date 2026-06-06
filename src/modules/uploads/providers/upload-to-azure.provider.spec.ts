import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UploadToAzureProvider } from './upload-to-azure.provider';
import { IUploadFile } from '../interfaces/upload-file.interface';

// ─── Mock the Azure SDK module ────────────────────────────────────────────────
// BlobServiceClient is instantiated inside the provider constructor via the
// static factory BlobServiceClient.fromConnectionString(), so we replace the
// entire module with a manual factory mock.
//
// IMPORTANT: jest.mock() is hoisted to the top of the file by Babel/ts-jest,
// meaning the factory function runs before variable declarations in the module
// scope. To avoid "Cannot access before initialization" errors, all mock state
// must be defined INSIDE the factory (using jest.fn() directly) rather than
// referencing outer variables. We then retrieve those same mock functions back
// out via jest.mocked() or require() when we need to assert on them.

jest.mock('@azure/storage-blob', () => {
  const mockUploadData = jest.fn().mockResolvedValue({});
  const mockBlockBlobClient = {
    uploadData: mockUploadData,
    url: 'https://mystorage.blob.core.windows.net/uploads/test-blob.jpg',
  };
  const mockContainerClient = {
    getBlockBlobClient: jest.fn().mockReturnValue(mockBlockBlobClient),
  };
  const mockBlobServiceClientInstance = {
    getContainerClient: jest.fn().mockReturnValue(mockContainerClient),
  };
  return {
    // Expose the inner mock so tests can assert and reconfigure it
    // without traversing call-result chains (which break after clearAllMocks)
    __mockUploadData: mockUploadData,
    BlobServiceClient: {
      fromConnectionString: jest.fn().mockReturnValue(mockBlobServiceClientInstance),
    },
  };
});
// ─────────────────────────────────────────────────────────────────────────────

// Retrieve the mock so tests can assert on it and control its behaviour.
import { BlobServiceClient } from '@azure/storage-blob';
const mockedFromConnection = BlobServiceClient.fromConnectionString as jest.Mock;

// Access the inner uploadData mock directly via the exposed __mockUploadData key.
// This avoids traversing .mock.results[] which gets wiped by jest.clearAllMocks().
const azureMock = jest.requireMock('@azure/storage-blob') as { __mockUploadData: jest.Mock };
const mockUploadData = () => azureMock.__mockUploadData;

describe('UploadToAzureProvider', () => {
  let provider: UploadToAzureProvider;

  const makeConfigService = (overrides: Record<string, string | undefined> = {}) => ({
    get: jest.fn((key: string, defaultValue?: string) => {
      const values: Record<string, string | undefined> = {
        'appConfig.azureStorage.connectionString':
          'DefaultEndpointsProtocol=https;AccountName=test;AccountKey=abc123==;EndpointSuffix=core.windows.net',
        'appConfig.azureStorage.containerName': 'uploads',
        'appConfig.azureStorage.cdnEndpoint': undefined,
        ...overrides,
      };
      return key in values ? values[key] : defaultValue;
    }),
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    mockUploadData().mockResolvedValue({});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadToAzureProvider,
        { provide: ConfigService, useValue: makeConfigService() },
      ],
    }).compile();

    provider = module.get<UploadToAzureProvider>(UploadToAzureProvider);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  it('should call BlobServiceClient.fromConnectionString with the configured connection string', () => {
    expect(mockedFromConnection).toHaveBeenCalledWith(
      'DefaultEndpointsProtocol=https;AccountName=test;AccountKey=abc123==;EndpointSuffix=core.windows.net',
    );
  });

  it('should throw BadRequestException when connection string is missing', async () => {
    await expect(
      Test.createTestingModule({
        providers: [
          UploadToAzureProvider,
          {
            provide: ConfigService,
            useValue: makeConfigService({ 'appConfig.azureStorage.connectionString': undefined }),
          },
        ],
      }).compile(),
    ).rejects.toThrow(BadRequestException);
  });

  describe('uploadFile', () => {
    const mockFile: IUploadFile = {
      originalname: 'photo.jpg',
      mimetype: 'image/jpeg',
      size: 2048,
      buffer: Buffer.from('fake image data'),
    };

    it('should upload file and return blobName and direct URL when no CDN configured', async () => {
      const result = await provider.uploadFile(mockFile);

      expect(result).toHaveProperty('blobName');
      expect(result).toHaveProperty('url');
      expect(result.url).toBe('https://mystorage.blob.core.windows.net/uploads/test-blob.jpg');
      expect(mockUploadData()).toHaveBeenCalledWith(
        mockFile.buffer,
        expect.objectContaining({
          blobHTTPHeaders: { blobContentType: mockFile.mimetype },
          metadata: expect.objectContaining({
            originalName: mockFile.originalname,
            mimeType: mockFile.mimetype,
          }),
        }),
      );
    });

    it('should generate a unique blob name preserving file extension', async () => {
      const result1 = await provider.uploadFile(mockFile);
      const result2 = await provider.uploadFile(mockFile);
      expect(result1.blobName).toMatch(/photo.*\.jpg$/);
      expect(result1.blobName).not.toBe(result2.blobName);
    });

    it('should throw BadRequestException when no file provided', async () => {
      await expect(provider.uploadFile(null as any)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when Azure SDK upload throws', async () => {
      mockUploadData().mockRejectedValue(new Error('Network error'));
      await expect(provider.uploadFile(mockFile)).rejects.toThrow(BadRequestException);
    });

    it('should replace spaces in filename with underscores', async () => {
      const fileWithSpaces: IUploadFile = { ...mockFile, originalname: 'my photo file.jpg' };
      const result = await provider.uploadFile(fileWithSpaces);
      expect(result.blobName).toMatch(/my_photo_file/);
    });

    it('should handle files without an extension', async () => {
      const fileNoExt: IUploadFile = { ...mockFile, originalname: 'filenoext' };
      const result = await provider.uploadFile(fileNoExt);
      expect(result.blobName).toMatch(/filenoext/);
      expect(result.blobName).not.toContain('.');
    });
  });

  describe('CDN URL generation', () => {
    const makeFile = (name = 'img.jpg'): IUploadFile => ({
      originalname: name,
      mimetype: 'image/jpeg',
      size: 1,
      buffer: Buffer.from('x'),
    });

    const buildProvider = async (cdnEndpoint: string | undefined) => {
      jest.clearAllMocks();
      mockUploadData().mockResolvedValue({});
      const module = await Test.createTestingModule({
        providers: [
          UploadToAzureProvider,
          { provide: ConfigService, useValue: makeConfigService({ 'appConfig.azureStorage.cdnEndpoint': cdnEndpoint }) },
        ],
      }).compile();
      return module.get<UploadToAzureProvider>(UploadToAzureProvider);
    };

    it('should return CDN URL when a valid https cdnEndpoint is configured', async () => {
      const p = await buildProvider('https://mycdn.azureedge.net');
      const result = await p.uploadFile(makeFile());
      expect(result.url).toMatch(/^https:\/\/mycdn\.azureedge\.net\/uploads\//);
    });

    it('should strip trailing slashes from CDN endpoint', async () => {
      const p = await buildProvider('https://mycdn.azureedge.net///');
      const result = await p.uploadFile(makeFile());
      expect(result.url).not.toContain('///');
    });

    it('should fall back to blob URL when CDN endpoint is not a valid URL', async () => {
      const p = await buildProvider('not-a-valid-url');
      const result = await p.uploadFile(makeFile());
      expect(result.url).toBe('https://mystorage.blob.core.windows.net/uploads/test-blob.jpg');
    });

    it('should fall back to blob URL when CDN endpoint uses non-http protocol', async () => {
      const p = await buildProvider('ftp://mycdn.example.com');
      const result = await p.uploadFile(makeFile());
      expect(result.url).toBe('https://mystorage.blob.core.windows.net/uploads/test-blob.jpg');
    });
  });
});

