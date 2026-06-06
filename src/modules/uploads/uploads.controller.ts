import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './providers/uploads.service';
import { UploadFileDto } from './dtos/upload-file.dto';
import { IUploadFile } from './interfaces/upload-file.interface';
import { ApiHeaders, ApiOperation } from '@nestjs/swagger';

/**
 * Controller for handling file uploads.
 * Provides endpoints for single and multiple file uploads to Azure Blob Storage.
 */
@Controller('uploads')
export class UploadsController {
  /**
   * Initializes the controller with the uploads service.
   * @param uploadsService - Service for handling file uploads
   */
  constructor(private uploadsService: UploadsService) {}

  /**
   * Uploads a single file to Azure Blob Storage.
   * @param file - The file from the multipart form-data request
   * @throws BadRequestException if file is missing
   * @returns Upload metadata including blob name and access URL
   *
   * @example
   * POST /uploads/file
   * Content-Type: multipart/form-data
   * file: <binary file data>
   */
  @Post('file')
  @UseInterceptors(FileInterceptor('file'))
  @ApiHeaders([
    {
      name: 'Content-Type',
      description: 'Must be multipart/form-data for file uploads',
    },
    {
      name: 'Authorization',
      description: 'Bearer access token for authentication',
    },
  ])
  @ApiOperation({ summary: 'Upload a single file' })
  public async uploadFile(
    @UploadedFile() file: IUploadFile,
  ): Promise<UploadFileDto> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    return this.uploadsService.uploadFile(file);
  }

  /**
   * Uploads multiple files to Azure Blob Storage.
   * @param files - Array of files from the multipart form-data request
   * @throws BadRequestException if no files provided
   * @returns Array of upload metadata for each file
   *
   * @example
   * POST /uploads/files
   * Content-Type: multipart/form-data
   * files: <binary file data>, <binary file data>, ...
   */
  @Post('files')
  @UseInterceptors(FilesInterceptor('files'))
  @ApiHeaders([
    {
      name: 'Content-Type',
      description: 'Must be multipart/form-data for file uploads',
    },
    {
      name: 'Authorization',
      description: 'Bearer access token for authentication',
    },
  ])
  @ApiOperation({ summary: 'Upload multiple files' })
  public async uploadFiles(
    @UploadedFiles() files: IUploadFile[],
  ): Promise<UploadFileDto[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }
    return this.uploadsService.uploadMultipleFiles(files);
  }
}
