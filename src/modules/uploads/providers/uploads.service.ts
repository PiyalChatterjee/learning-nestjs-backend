import { Injectable, BadRequestException } from '@nestjs/common';
import { UploadFileDto } from '../dtos/upload-file.dto';
import { IUploadFile } from '../interfaces/upload-file.interface';
import { UploadToAzureProvider } from './upload-to-azure.provider';
import { UploadMetadataProvider } from './upload-metadata.provider';

/**
 * Service orchestrating upload flow across storage and metadata layers.
 * Delegates storage to UploadToAzureProvider and persistence to UploadMetadataProvider.
 */
@Injectable()
export class UploadsService {
  /**
   * Initializes the uploads service.
   * @param uploadToAzureProvider - Provider for Azure blob upload operations
   * @param uploadMetadataProvider - Provider for upload metadata persistence
   */
  constructor(
    private readonly uploadToAzureProvider: UploadToAzureProvider,
    private readonly uploadMetadataProvider: UploadMetadataProvider,
  ) {}

  /**
   * Uploads a file to Azure Blob Storage and saves metadata to database.
   * @param file - The uploaded file object from multer
   * @throws BadRequestException if file is missing or upload fails
   * @returns Upload metadata including blob name and access URL
   */
  public async uploadFile(file: IUploadFile): Promise<UploadFileDto> {
    try {
      if (!file) {
        throw new BadRequestException('No file provided');
      }

      const { blobName, url } =
        await this.uploadToAzureProvider.uploadFile(file);

      return this.uploadMetadataProvider.saveUploadMetadata(
        file,
        blobName,
        url,
      );
    } catch (error: Error | any) {
      throw new BadRequestException(`File upload failed: ${error.message}`);
    }
  }

  /**
   * Uploads multiple files to Azure Blob Storage.
   * @param files - Array of uploaded file objects
   * @throws BadRequestException if no files provided or upload fails
   * @returns Array of upload metadata for each file
   */
  public async uploadMultipleFiles(
    files: IUploadFile[],
  ): Promise<UploadFileDto[]> {
    try {
      if (!files || files.length === 0) {
        throw new BadRequestException('No files provided');
      }

      const uploadPromises = files.map((file) => this.uploadFile(file));
      return Promise.all(uploadPromises);
    } catch (error: Error | any) {
      throw new BadRequestException(
        `Multiple file upload failed: ${error.message}`,
      );
    }
  }
}
