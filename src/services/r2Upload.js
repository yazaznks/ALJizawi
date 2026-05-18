import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Cloudflare R2 Configuration
const R2_ACCOUNT_ID = '7d47e2c57dee25b3b263930012fa113a';
const R2_ACCESS_KEY = 'e1a1ae5c422cf23a49fa0c81583daf31';
const R2_SECRET_KEY = '20d48abd01f678b7b7040cfc88828c899f4028618567b8c799dc616dcba92a8f';
const R2_BUCKET = 'products';
const R2_ENDPOINT = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
// Your actual public bucket URL (from the R2 dashboard)
const R2_PUBLIC_URL = 'https://pub-7b004f3f2d9449029d678e96957d0929.r2.dev';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY,
    secretAccessKey: R2_SECRET_KEY,
  },
});

/**
 * Upload a file to Cloudflare R2
 * @param {File} file - The file to upload
 * @returns {Promise<{url: string, filename: string, type: string}>}
 */
export const uploadFile = async (file) => {
  // Generate unique filename to prevent collisions
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const key = `${timestamp}-${randomStr}-${safeName}`;

  // Convert file to ArrayBuffer for upload
  const arrayBuffer = await file.arrayBuffer();

  const uploadParams = {
    Bucket: R2_BUCKET,
    Key: key,
    Body: arrayBuffer,
    ContentType: file.type,
  };

  try {
    await s3Client.send(new PutObjectCommand(uploadParams));
    
    // Construct the public URL using your actual public bucket URL
    const publicUrl = `${R2_PUBLIC_URL}/${key}`;

    return {
      url: publicUrl,
      filename: file.name,
      type: file.type,
    };
  } catch (error) {
    console.error('Error uploading to R2:', error);
    throw new Error(`فشل رفع الملف: ${error.message}`);
  }
};

/**
 * Upload multiple files to Cloudflare R2
 * @param {File[]} files - Array of files to upload
 * @returns {Promise<Array<{url: string, filename: string, type: string}>>}
 */
export const uploadMultipleFiles = async (files) => {
  const uploadPromises = files.map(file => uploadFile(file));
  return Promise.all(uploadPromises);
};

export default { uploadFile, uploadMultipleFiles };