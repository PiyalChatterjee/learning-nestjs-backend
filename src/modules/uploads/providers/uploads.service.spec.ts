import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { UploadsService } from './uploads.service';
import { UploadToAzureProvider } from './upload-to-azure.provider';
import { UploadMetadataProvider } from './upload-metadata.provider';
import { IUploadFile } from '../interfaces/upload-file.interface';

describe('UploadsService', () => {
  let service: UploadsService;
  let uploadToAzureProvider: { uploadFile: jest.Mock };
  let uploadMetadataProvider: { saveUploadMetadata: jest.Mock };

  const mockFile: IUploadFile = {
    fieldname: 'file',
    originalname: 'test.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    destination: '/tmp',
    filename: 'test-123.jpg',
    path: '/tmp/test-123.jpg',
    size: 1024,
    buffer: Buffer.from('data'),
  };

  const mockUploadResult = { blobName: 'blob-1', url: 'https://storage.example.com/blob-1' };
  const mockUploadDto = {
    blobName: 'blob-1',
    url: 'https://storage.example.com/blob-1',
    size: 1024,
    mimeType: 'image/jpeg',
    uploadedAt: new Date(),
  };

  beforeEach(async () => {
    uploadToAzureProvider = { uploadFile: jest.fn() };
    uploadMetadataProvider = { saveUploadMetadata: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadsService,
        { provide: UploadToAzureProvider, useValue: uploadToAzureProvider },
        { provide: UploadMetadataProvider, useValue: uploadMetadataProvider },
      ],
    }).compile();

    service = module.get<UploadsService>(UploadsService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadFile', () => {
    it('should upload file and return metadata dto', async () => {
      uploadToAzureProvider.uploadFile.mockResolvedValue(mockUploadResult);
      uploadMetadataProvider.saveUploadMetadata.mockResolvedValue(mockUploadDto);

      const result = await service.uploadFile(mockFile);
      expect(result).toEqual(mockUploadDto);
      expect(uploadToAzureProvider.uploadFile).toHaveBeenCalledWith(mockFile);
      expect(uploadMetadataProvider.saveUploadMetadata).toHaveBeenCalledWith(
        mockFile,
        mockUploadResult.blobName,
        mockUploadResult.url,
      );
    });

    it('should throw BadRequestException when no file provided', async () => {
      await expect(service.uploadFile(null as any)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when upload fails', async () => {
      uploadToAzureProvider.uploadFile.mockRejectedValue(new Error('Azure error'));
      await expect(service.uploadFile(mockFile)).rejects.toThrow(BadRequestException);
    });
  });

  describe('uploadMultipleFiles', () => {
    it('should upload multiple files and return array of DTOs', async () => {
      uploadToAzureProvider.uploadFile.mockResolvedValue(mockUploadResult);
      uploadMetadataProvider.saveUploadMetadata.mockResolvedValue(mockUploadDto);

      const result = await service.uploadMultipleFiles([mockFile, mockFile]);
      expect(result).toHaveLength(2);
    });

    it('should throw BadRequestException when no files provided', async () => {
      await expect(service.uploadMultipleFiles([])).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when files is null', async () => {
      await expect(service.uploadMultipleFiles(null as any)).rejects.toThrow(BadRequestException);
    });
  });
});
