/**
 * Cloudflare R2 Storage Utility
 * Uses the S3-compatible API via @aws-sdk/client-s3
 *
 * Install:  npm install @aws-sdk/client-s3
 */

const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const path = require('path');
const crypto = require('crypto');

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME || 'lumin-guide-assets';
const PUBLIC_URL = process.env.R2_PUBLIC_URL; // e.g. https://pub-xxxx.r2.dev

/**
 * Upload a file buffer to R2
 * @param {Buffer} buffer   - file contents
 * @param {string} filename - original filename (used for extension)
 * @param {string} folder   - optional subfolder, e.g. "icons", "avatars"
 * @returns {{ key: string, url: string }}
 */
async function uploadFile(buffer, filename, folder = '') {
  const ext = path.extname(filename);
  const key = folder
    ? `${folder}/${crypto.randomUUID()}${ext}`
    : `${crypto.randomUUID()}${ext}`;

  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: getMimeType(ext),
  }));

  return {
    key,
    url: PUBLIC_URL ? `${PUBLIC_URL}/${key}` : key,
  };
}

/**
 * Delete a file from R2
 * @param {string} key - the object key returned from uploadFile
 */
async function deleteFile(key) {
  await s3.send(new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: key,
  }));
}

/**
 * Basic MIME-type lookup
 */
function getMimeType(ext) {
  const map = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.json': 'application/json',
  };
  return map[ext.toLowerCase()] || 'application/octet-stream';
}

module.exports = { uploadFile, deleteFile, s3, BUCKET };
