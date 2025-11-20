/**
 * Get the full URL for an uploaded image
 * @param imagePath - The relative path from the upload service (e.g., "/uploads/images/file.jpg")
 * @returns The full URL to access the image
 */
export function getImageUrl(imagePath: string | null | undefined): string {
  if (!imagePath) {
    return '';
  }

  // If it's already a full URL (http:// or https://), return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // Get the base URL for images from environment variable
  const imagesBaseUrl = process.env.NEXT_PUBLIC_IMAGES_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  // Remove leading slash if present to avoid double slashes
  const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;

  // Combine base URL with image path
  return `${imagesBaseUrl}${cleanPath}`;
}

/**
 * Get multiple image URLs
 * @param imagePaths - Array of relative paths
 * @returns Array of full URLs
 */
export function getImageUrls(imagePaths: (string | null | undefined)[]): string[] {
  return imagePaths.map(getImageUrl).filter(Boolean);
}

