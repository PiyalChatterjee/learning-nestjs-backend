/**
 * DTO for file upload response.
 * Contains metadata about the uploaded file.
 */
export class UploadFileDto {
  /**
   * The unique identifier for the uploaded file in blob storage.
   */
  blobName: string;

  /**
   * The full URL to access the uploaded file.
   */
  url: string;

  /**
   * The size of the uploaded file in bytes.
   */
  size: number;

  /**
   * The MIME type of the uploaded file (e.g., 'image/png', 'application/pdf').
   */
  mimeType: string;

  /**
   * The timestamp when the file was uploaded.
   */
  uploadedAt: Date;
}
