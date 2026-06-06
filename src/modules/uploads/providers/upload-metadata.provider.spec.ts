import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UploadMetadataProvider } from './upload-metadata.provider';
import { Upload } from '../upload.entity';
import { UploadFileDto } from '../dtos/upload-file.dto';
import { IUploadFile } from '../interfaces/upload-file.interface';

describe('UploadMetadataProvider', () => {
  let provider: UploadMetadataProvider;
  let uploadRepository;

  const mockFile: IUploadFile = {
    fieldname: 'file',
    originalname: 'test-file.txt',
    encoding: '7bit',
    mimetype: 'text/plain',
    destination: '/uploads',
    filename: 'test-file-1234.txt',
    path: '/uploads/test-file-1234.txt',
    size: 1024,
    buffer: Buffer.from('test content'),
  };

  const mockBlobName = 'blob-123456';
  const mockUrl = 'https://storage.azure.com/container/blob-123456';

  beforeEach(async () => {
    uploadRepository = {
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadMetadataProvider,
        {
          provide: getRepositoryToken(Upload),
          useValue: uploadRepository,
        },
      ],
    }).compile();

    provider = module.get<UploadMetadataProvider>(UploadMetadataProvider);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('saveUploadMetadata', () => {
    it('should be defined', () => {
      expect(provider).toBeDefined();
    });

    it('should successfully save upload metadata and return UploadFileDto', async () => {
      const uploadedAt = new Date();
      const mockUploadRecord = {
        id: 1,
        blobName: mockBlobName,
        url: mockUrl,
        size: mockFile.size,
        mimeType: mockFile.mimetype,
        originalFileName: mockFile.originalname,
        uploadedAt,
      };

      const expectedDto: UploadFileDto = {
        blobName: mockBlobName,
        url: mockUrl,
        size: mockFile.size,
        mimeType: mockFile.mimetype,
        uploadedAt,
      };

      uploadRepository.create.mockReturnValue(mockUploadRecord);
      uploadRepository.save.mockResolvedValue(mockUploadRecord);

      const result = await provider.saveUploadMetadata(
        mockFile,
        mockBlobName,
        mockUrl,
      );

      expect(result).toEqual(expectedDto);
      expect(uploadRepository.create).toHaveBeenCalledWith({
        blobName: mockBlobName,
        url: mockUrl,
        size: mockFile.size,
        mimeType: mockFile.mimetype,
        originalFileName: mockFile.originalname,
      });
      expect(uploadRepository.save).toHaveBeenCalledWith(mockUploadRecord);
    });

    it('should handle files with various MIME types', async () => {
      const mimeTypes = [
        'text/plain',
        'application/pdf',
        'image/png',
        'image/jpeg',
        'video/mp4',
        'application/json',
      ];

      for (const mimeType of mimeTypes) {
        const file: IUploadFile = {
          ...mockFile,
          mimetype: mimeType,
        };

        const mockUploadRecord = {
          id: 1,
          blobName: mockBlobName,
          url: mockUrl,
          size: file.size,
          mimeType: file.mimetype,
          originalFileName: file.originalname,
          uploadedAt: new Date(),
        };

        uploadRepository.create.mockReturnValue(mockUploadRecord);
        uploadRepository.save.mockResolvedValue(mockUploadRecord);

        const result = await provider.saveUploadMetadata(
          file,
          mockBlobName,
          mockUrl,
        );

        expect(result.mimeType).toBe(mimeType);
      }
    });

    it('should preserve file size information', async () => {
      const sizes = [0, 1024, 1024 * 1024, 100 * 1024 * 1024];

      for (const size of sizes) {
        const file: IUploadFile = {
          ...mockFile,
          size,
        };

        const mockUploadRecord = {
          id: 1,
          blobName: mockBlobName,
          url: mockUrl,
          size,
          mimeType: file.mimetype,
          originalFileName: file.originalname,
          uploadedAt: new Date(),
        };

        uploadRepository.create.mockReturnValue(mockUploadRecord);
        uploadRepository.save.mockResolvedValue(mockUploadRecord);

        const result = await provider.saveUploadMetadata(
          file,
          mockBlobName,
          mockUrl,
        );

        expect(result.size).toBe(size);
      }
    });

    it('should preserve original filename', async () => {
      const filenames = [
        'document.pdf',
        'image-2024.png',
        'my file with spaces.txt',
        'file-with-special-chars-@#$.zip',
      ];

      for (const originalname of filenames) {
        const file: IUploadFile = {
          ...mockFile,
          originalname,
        };

        const mockUploadRecord = {
          id: 1,
          blobName: mockBlobName,
          url: mockUrl,
          size: file.size,
          mimeType: file.mimetype,
          originalFileName: originalname,
          uploadedAt: new Date(),
        };

        uploadRepository.create.mockReturnValue(mockUploadRecord);
        uploadRepository.save.mockResolvedValue(mockUploadRecord);

        const result = await provider.saveUploadMetadata(
          file,
          mockBlobName,
          mockUrl,
        );

        expect(uploadRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            originalFileName: originalname,
          }),
        );
      }
    });

    it('should map all required fields from file to upload record', async () => {
      const uploadedAt = new Date();
      const mockUploadRecord = {
        id: 1,
        blobName: mockBlobName,
        url: mockUrl,
        size: mockFile.size,
        mimeType: mockFile.mimetype,
        originalFileName: mockFile.originalname,
        uploadedAt,
      };

      uploadRepository.create.mockReturnValue(mockUploadRecord);
      uploadRepository.save.mockResolvedValue(mockUploadRecord);

      await provider.saveUploadMetadata(mockFile, mockBlobName, mockUrl);

      expect(uploadRepository.create).toHaveBeenCalledWith({
        blobName: mockBlobName,
        url: mockUrl,
        size: mockFile.size,
        mimeType: mockFile.mimetype,
        originalFileName: mockFile.originalname,
      });
    });

    it('should persist upload record to database', async () => {
      const mockUploadRecord = {
        id: 1,
        blobName: mockBlobName,
        url: mockUrl,
        size: mockFile.size,
        mimeType: mockFile.mimetype,
        originalFileName: mockFile.originalname,
        uploadedAt: new Date(),
      };

      uploadRepository.create.mockReturnValue(mockUploadRecord);
      uploadRepository.save.mockResolvedValue(mockUploadRecord);

      await provider.saveUploadMetadata(mockFile, mockBlobName, mockUrl);

      expect(uploadRepository.save).toHaveBeenCalledWith(mockUploadRecord);
    });

    it('should return DTO with correct structure', async () => {
      const uploadedAt = new Date();
      const mockUploadRecord = {
        id: 1,
        blobName: mockBlobName,
        url: mockUrl,
        size: mockFile.size,
        mimeType: mockFile.mimetype,
        originalFileName: mockFile.originalname,
        uploadedAt,
      };

      uploadRepository.create.mockReturnValue(mockUploadRecord);
      uploadRepository.save.mockResolvedValue(mockUploadRecord);

      const result = await provider.saveUploadMetadata(
        mockFile,
        mockBlobName,
        mockUrl,
      );

      // Verify DTO has all required fields
      expect(result).toHaveProperty('blobName');
      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('size');
      expect(result).toHaveProperty('mimeType');
      expect(result).toHaveProperty('uploadedAt');

      // Verify DTO does NOT have internal fields
      expect(result).not.toHaveProperty('id');
      expect(result).not.toHaveProperty('originalFileName');
    });

    it('should handle empty blob name', async () => {
      const mockUploadRecord = {
        id: 1,
        blobName: '',
        url: mockUrl,
        size: mockFile.size,
        mimeType: mockFile.mimetype,
        originalFileName: mockFile.originalname,
        uploadedAt: new Date(),
      };

      uploadRepository.create.mockReturnValue(mockUploadRecord);
      uploadRepository.save.mockResolvedValue(mockUploadRecord);

      const result = await provider.saveUploadMetadata(mockFile, '', mockUrl);

      expect(result.blobName).toBe('');
    });

    it('should throw error if repository save fails', async () => {
      const error = new Error('Database connection error');
      uploadRepository.create.mockReturnValue({
        blobName: mockBlobName,
        url: mockUrl,
      });
      uploadRepository.save.mockRejectedValue(error);

      await expect(
        provider.saveUploadMetadata(mockFile, mockBlobName, mockUrl),
      ).rejects.toThrow('Database connection error');
    });
  });
});
