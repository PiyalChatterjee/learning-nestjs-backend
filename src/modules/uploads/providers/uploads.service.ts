import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlobServiceClient } from '@azure/storage-blob';
import { randomUUID } from 'crypto';
import { Upload } from '../upload.entity';
import { UploadFileDto } from '../dtos/upload-file.dto';

/**
 * Interface representing an uploaded file from Multer.
 */
interface IUploadFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

/**
 * Service for handling file uploads to Azure Blob Storage.
 * Manages file storage, metadata persistence, and URL generation.
 */
@Injectable()
export class UploadsService {
  private blobServiceClient: BlobServiceClient;
  private containerName: string;
  private cdnEndpoint: string | undefined;

  /**
   * Initializes the uploads service with Azure Blob Storage client.
   * @param configService - NestJS ConfigService for accessing environment variables
   * @param uploadRepository - TypeORM repository for upload records
   */
  constructor(
    private configService: ConfigService,
    @InjectRepository(Upload)
    private uploadRepository: Repository<Upload>,
  ) {
    const connectionString = this.configService.get<string>(
      'appConfig.azureStorage.connectionString',
    );
    this.containerName = this.configService.get<string>(
      'appConfig.azureStorage.containerName',
      'uploads',
    );
    this.cdnEndpoint = this.normalizeCdnEndpoint(
      this.configService.get<string>('appConfig.azureStorage.cdnEndpoint'),
    );

    this.blobServiceClient =
      BlobServiceClient.fromConnectionString(connectionString);
  }

  /**
   * Uploads a file to Azure Blob Storage and saves metadata to database.
   * @param file - The uploaded file object from multer
   * @throws BadRequestException if file is missing or upload fails
   * @returns Upload metadata including blob name and access URL
   */
  public async uploadFile(file: IUploadFile): Promise<UploadFileDto> {
    // Validate file exists
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    try {
      const containerClient = this.blobServiceClient.getContainerClient(
        this.containerName,
      );

      // Generate unique blob name to avoid conflicts
      const fileExtension = this.getFileExtension(file.originalname);
      const blobName = `${randomUUID()}-${Date.now()}${fileExtension}`;

      // Get blob client and upload file
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.uploadData(file.buffer, {
        blobHTTPHeaders: {
          blobContentType: file.mimetype,
        },
      });

      const url = this.buildPublicUrl(blobName, blockBlobClient.url);

      // Save upload metadata to database
      const uploadRecord = this.uploadRepository.create({
        blobName,
        url,
        size: file.size,
        mimeType: file.mimetype,
        originalFileName: file.originalname,
      });

      await this.uploadRepository.save(uploadRecord);

      return {
        blobName,
        url,
        size: file.size,
        mimeType: file.mimetype,
        uploadedAt: uploadRecord.uploadedAt,
      };
    } catch (error) {
      throw new BadRequestException(
        `File upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Uploads multiple files to Azure Blob Storage.
   * @param files - Array of Express file objects from multer
   * @throws BadRequestException if no files provided or upload fails
   * @returns Array of upload metadata for each file
   */
  public async uploadMultipleFiles(files: IUploadFile[]): Promise<UploadFileDto[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    const uploadPromises = files.map((file) => this.uploadFile(file));
    return Promise.all(uploadPromises);
  }

  /**
   * Retrieves a file extension from a filename.
   * @param filename - The original filename
   * @returns The file extension including the dot (e.g., '.pdf')
   */
  private getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot === -1 ? '' : filename.substring(lastDot);
  }

  /**
   * Normalizes CDN endpoint and ignores invalid values.
   * @param endpoint - Raw CDN endpoint from configuration
   * @returns Normalized CDN origin without trailing slash, or undefined if invalid
   */
  private normalizeCdnEndpoint(endpoint?: string): string | undefined {
    if (!endpoint) {
      return undefined;
    }

    const trimmedEndpoint = endpoint.trim().replace(/\/+$/, '');

    try {
      const parsedUrl = new URL(trimmedEndpoint);
      const isHttpProtocol =
        parsedUrl.protocol === 'https:' || parsedUrl.protocol === 'http:';

      if (!isHttpProtocol) {
        return undefined;
      }

      return trimmedEndpoint;
    } catch {
      return undefined;
    }
  }

  /**
   * Builds the public URL for an uploaded blob.
   * @param blobName - Blob identifier stored in Azure Blob Storage
   * @param fallbackUrl - Direct Azure Blob Storage URL
   * @returns CDN URL when configured correctly, otherwise direct blob URL
   */
  private buildPublicUrl(blobName: string, fallbackUrl: string): string {
    if (!this.cdnEndpoint) {
      return fallbackUrl;
    }

    return `${this.cdnEndpoint}/${this.containerName}/${blobName}`;
  }
}
