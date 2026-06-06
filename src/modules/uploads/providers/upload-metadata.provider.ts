import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Upload } from '../upload.entity';
import { UploadFileDto } from '../dtos/upload-file.dto';
import { IUploadFile } from '../interfaces/upload-file.interface';

/**
 * Persists uploaded file metadata and maps persistence models to API DTOs.
 */
@Injectable()
export class UploadMetadataProvider {
  /**
   * Creates an instance of UploadMetadataProvider.
   * @param uploadRepository - TypeORM repository for upload records
   */
  constructor(
    @InjectRepository(Upload)
    private readonly uploadRepository: Repository<Upload>,
  ) {}

  /**
   * Saves upload metadata after blob upload succeeds.
   * @param file - Uploaded file data from Multer
   * @param blobName - Generated blob identifier in Azure Blob Storage
   * @param url - Final public URL for file access
   * @returns Upload response DTO
   */
  public async saveUploadMetadata(
    file: IUploadFile,
    blobName: string,
    url: string,
  ): Promise<UploadFileDto> {
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
  }
}
