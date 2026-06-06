/**
 * Interface representing an uploaded file from Multer in buffer mode.
 * Provides raw file data and metadata from multipart form-data requests.
 */
export interface IUploadFile {
  /** Raw file contents as a Buffer. */
  buffer: Buffer;
  /** Original filename provided by the client. */
  originalname: string;
  /** MIME type of the file (e.g., 'image/png', 'application/pdf'). */
  mimetype: string;
  /** File size in bytes. */
  size: number;
}
