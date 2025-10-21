import path from 'path';

// Get the absolute path for an asset based on its URL/path
export function getAssetPath(assetUrl: string): string {
  // If the URL is already absolute or a remote URL, return as is
  if (path.isAbsolute(assetUrl) || assetUrl.startsWith('http')) {
    return assetUrl;
  }

  // Otherwise, resolve relative to UPLOAD_DIR
  const uploadDir = process.env.UPLOAD_DIR || './uploads';
  return path.resolve(process.cwd(), uploadDir, assetUrl);
}

// Generate a unique filename for uploaded assets
export function generateAssetFilename(originalName: string): string {
  const ext = path.extname(originalName);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}${ext}`;
}

// Validate image file type
export function isValidImageType(mimeType: string): boolean {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  return validTypes.includes(mimeType);
}

// Calculate image dimensions using Sharp
export async function getImageDimensions(filePath: string) {
  try {
    const sharp = (await import('sharp')).default;
    const metadata = await sharp(filePath).metadata();
    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
    };
  } catch (error) {
    console.error('Error getting image dimensions:', error);
    throw error;
  }
}