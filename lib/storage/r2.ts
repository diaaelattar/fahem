import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
})

export const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'istabaq-egypt-media'
export const R2_PUBLIC_DOMAIN = process.env.R2_PUBLIC_DOMAIN || 'https://pub-bd51d2e8c9fa4e87a78eb052d4b0a160.r2.dev'

/**
 * توليد رابط رفع مؤقت (Presigned Upload URL)
 * يسمح للمتصفح برفع الملف مباشرة إلى R2 دون إرهاق السيرفر
 */
export async function getR2UploadUrl(
  fileName: string,
  contentType: string,
  folder: string = 'general',
  expiresInSeconds: number = 300
) {
  const cleanFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
  const key = `${folder}/${Date.now()}-${cleanFileName}`

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  })

  const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: expiresInSeconds })
  const publicUrl = `${R2_PUBLIC_DOMAIN}/${key}`

  return {
    uploadUrl,
    key,
    publicUrl,
  }
}

/**
 * حذف ملف من R2 عبر الـ Key
 */
export async function deleteFromR2(key: string) {
  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  })
  return await r2Client.send(command)
}
