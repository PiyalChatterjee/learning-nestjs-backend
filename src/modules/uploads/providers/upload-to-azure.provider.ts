import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BlobServiceClient } from '@azure/storage-blob';
import { randomUUID } from 'crypto';
import { IUploadFile } from '../interfaces/upload-file.interface';
import { IAzureUploadResult } from '../interfaces/azure-upload-result.interface';

/**
 * Provider responsible for all Azure Blob Storage interactions.
 * Handles blob naming, upload execution, and public URL generation.
 */
@Injectable()
export class UploadToAzureProvider {
  private readonly blobServiceClient: BlobServiceClient;
  private readonly containerName: string;
  private readonly cdnEndpoint: string | undefined;

  /**
   * Initializes Azure storage client and upload settings.
   * @param configService - Application configuration provider
   */
  constructor(private readonly configService: ConfigService) {
    const connectionString = this.configService.get<string>(
      'appConfig.azureStorage.connectionString',
    );

    if (!connectionString) {
      throw new BadRequestException(
        'Azure Storage connection string is not configured',
      );
    }

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
   * Uploads a single file buffer to Azure Blob Storage.
   * @param file - Uploaded file from Multer
   * @returns Uploaded blob identifier and public URL
   */
  public async uploadFile(file: IUploadFile): Promise<IAzureUploadResult> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    try {
      const containerClient = this.blobServiceClient.getContainerClient(
        this.containerName,
      );

      const blobName = this.generateFileName(file);

      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.uploadData(file.buffer, {
        blobHTTPHeaders: {
          blobContentType: file.mimetype,
        },
        metadata: {
          originalName: file.originalname,
          size: file.size.toString(),
          mimeType: file.mimetype,
        },
      });

      return {
        blobName,
        url: this.buildPublicUrl(blobName, blockBlobClient.url),
      };
    } catch (error) {
      throw new BadRequestException(
        `File upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Extracts extension from a filename.
   * @param filename - Original filename
   * @returns File extension including dot
   */
  private getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot === -1 ? '' : filename.substring(lastDot);
  }

  /**
   * Validates and normalizes CDN endpoint.
   * @param endpoint - Raw endpoint from configuration
   * @returns Normalized endpoint or undefined when invalid
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
   * Builds the public URL for a blob using CDN fallback behavior.
   * @param blobName - Blob identifier
   * @param fallbackUrl - Direct Azure Blob URL
   * @returns CDN URL if configured, otherwise direct blob URL
   */
  private buildPublicUrl(blobName: string, fallbackUrl: string): string {
    if (!this.cdnEndpoint) {
      return fallbackUrl;
    }

    return `${this.cdnEndpoint}/${this.containerName}/${blobName}`;
  }

  private generateFileName(file: IUploadFile): string {
    const fileExtension = this.getFileExtension(file.originalname);
    const name = file.originalname
      .substring(0, file.originalname.length - fileExtension.length)
      .replace(/\s+/g, '_');
    return `${name}-${randomUUID()}-${Date.now()}${fileExtension}`;
  }
}
