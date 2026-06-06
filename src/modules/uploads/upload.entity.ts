import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

/**
 * Upload entity that stores metadata about uploaded files.
 * Tracks file information for auditing and retrieval purposes.
 */
@Entity('uploads')
export class Upload {
  /**
   * Unique identifier for the upload record.
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * The blob name (key) in Azure Blob Storage.
   */
  @Column({
    type: 'varchar',
    length: 255,
  })
  blobName: string;

  /**
   * The full URL to access the file via Azure Blob Storage.
   */
  @Column({
    type: 'varchar',
    length: 500,
  })
  url: string;

  /**
   * The size of the file in bytes.
   */
  @Column({
    type: 'bigint',
  })
  size: number;

  /**
   * The MIME type of the uploaded file (e.g., 'image/png').
   */
  @Column({
    type: 'varchar',
    length: 100,
  })
  mimeType: string;

  /**
   * The original filename provided by the client.
   */
  @Column({
    type: 'varchar',
    length: 255,
  })
  originalFileName: string;

  /**
   * Timestamp when the file was uploaded.
   */
  @CreateDateColumn()
  uploadedAt: Date;
}
