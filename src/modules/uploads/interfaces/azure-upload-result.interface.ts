/**
 * Result returned after a successful upload to Azure Blob Storage.
 */
export interface IAzureUploadResult {
  blobName: string;
  url: string;
}
