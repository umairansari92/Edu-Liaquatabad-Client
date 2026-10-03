/**
 * Client-Side Image Compression & Resizing Utility
 * Education Department Liaquatabad Town Centre (DMC)
 *
 * SPECIFICATION & POLICIES:
 * 1. Maximum dimension: 1600px (preserves aspect ratio).
 * 2. Compresses high-resolution phone camera images (5-10 MB) down to ~200-700 KB.
 * 3. Keeps whiteboard text, notebook exercises, and textbook diagrams crisp and readable.
 * 4. Outputs WebP (fallback to JPEG).
 * 5. Explicitly supports object URL cleanup to prevent browser memory leaks.
 */

const MAX_IMAGE_DIMENSION = 1600;
const DEFAULT_IMAGE_QUALITY = 0.78;

/**
 * Format bytes into human-readable string
 * @param {number} bytes
 * @returns {string}
 */
export const formatBytes = (bytes) => {
  if (!bytes || bytes <= 0) return '0 B';
  const sizeUnits = ['B', 'KB', 'MB', 'GB'];
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), sizeUnits.length - 1);
  const formattedSize = (bytes / Math.pow(1024, unitIndex)).toFixed(unitIndex === 0 ? 0 : 1);
  return `${formattedSize} ${sizeUnits[unitIndex]}`;
};

/**
 * Revokes a generated Object URL to prevent browser memory leaks
 * @param {string} objectUrl
 */
export const revokePreviewUrl = (objectUrl) => {
  if (objectUrl && typeof objectUrl === 'string' && objectUrl.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(objectUrl);
    } catch (cleanupError) {
      console.warn('[ImageCompressor] Failed to revoke object URL:', cleanupError);
    }
  }
};

/**
 * Compresses and resizes an image file in the browser canvas
 *
 * @param {File} rawImageFile - Selected camera or file upload
 * @param {Object} [options={}]
 * @param {number} [options.maxDimension=1600] - Maximum width or height
 * @param {number} [options.quality=0.78] - Compression quality (0.0 to 1.0)
 * @returns {Promise<{ file: File, previewUrl: string, originalSizeBytes: number, compressedSizeBytes: number, width: number, height: number, mimeType: string }>}
 */
export const compressImage = (rawImageFile, options = {}) => {
  return new Promise((resolve, reject) => {
    if (!rawImageFile || !(rawImageFile instanceof Blob)) {
      return reject(new Error('Invalid image file provided for compression.'));
    }

    // PDFs are passed through without canvas transformation
    if (rawImageFile.type === 'application/pdf') {
      const previewUrl = URL.createObjectURL(rawImageFile);
      return resolve({
        file: rawImageFile,
        previewUrl,
        originalSizeBytes: rawImageFile.size,
        compressedSizeBytes: rawImageFile.size,
        width: 0,
        height: 0,
        mimeType: 'application/pdf',
      });
    }

    const maxDimension = options.maxDimension || MAX_IMAGE_DIMENSION;
    const compressionQuality = options.quality || DEFAULT_IMAGE_QUALITY;

    const fileReader = new FileReader();
    fileReader.onerror = () => reject(new Error('Failed to read image file from storage.'));

    fileReader.onload = (loadEvent) => {
      const imageElement = new Image();
      imageElement.onerror = () => reject(new Error('Failed to decode image data in browser.'));

      imageElement.onload = () => {
        let originalWidth = imageElement.naturalWidth || imageElement.width;
        let originalHeight = imageElement.naturalHeight || imageElement.height;

        let targetWidth = originalWidth;
        let targetHeight = originalHeight;

        // Scale proportionally if either dimension exceeds maximum bound
        if (originalWidth > maxDimension || originalHeight > maxDimension) {
          if (originalWidth >= originalHeight) {
            targetWidth = maxDimension;
            targetHeight = Math.round((originalHeight * maxDimension) / originalWidth);
          } else {
            targetHeight = maxDimension;
            targetWidth = Math.round((originalWidth * maxDimension) / originalHeight);
          }
        }

        const canvasElement = document.createElement('canvas');
        canvasElement.width = targetWidth;
        canvasElement.height = targetHeight;

        const canvasContext = canvasElement.getContext('2d');
        if (!canvasContext) {
          return reject(new Error('Failed to acquire 2D rendering canvas context.'));
        }

        // Enable high-quality image bicubic smoothing
        canvasContext.imageSmoothingEnabled = true;
        canvasContext.imageSmoothingQuality = 'high';

        // Render resized image to canvas
        canvasContext.drawImage(imageElement, 0, 0, targetWidth, targetHeight);

        // Prefer WebP for high compression ratio with educational text clarity, fallback to JPEG
        const targetMimeType = 'image/webp';

        canvasElement.toBlob(
          (compressedBlob) => {
            if (!compressedBlob) {
              // Fallback to JPEG if browser does not support WebP canvas encoding
              canvasElement.toBlob(
                (fallbackBlob) => {
                  if (!fallbackBlob) {
                    return reject(new Error('Canvas image compression failed.'));
                  }
                  finalizeCompression(fallbackBlob, 'image/jpeg', '.jpg');
                },
                'image/jpeg',
                compressionQuality
              );
              return;
            }
            finalizeCompression(compressedBlob, 'image/webp', '.webp');
          },
          targetMimeType,
          compressionQuality
        );

        function finalizeCompression(blobResult, finalMimeType, extension) {
          const originalBaseName = (rawImageFile.name || 'homework_photo')
            .replace(/\.[^/.]+$/, '')
            .replace(/[^a-zA-Z0-9_\-]/g, '_');
          const finalFileName = `${originalBaseName}_compressed${extension}`;

          const optimizedFile = new File([blobResult], finalFileName, {
            type: finalMimeType,
            lastModified: Date.now(),
          });

          const previewUrl = URL.createObjectURL(blobResult);

          resolve({
            file: optimizedFile,
            previewUrl,
            originalSizeBytes: rawImageFile.size,
            compressedSizeBytes: optimizedFile.size,
            width: targetWidth,
            height: targetHeight,
            mimeType: finalMimeType,
          });
        }
      };

      imageElement.src = loadEvent.target.result;
    };

    fileReader.readAsDataURL(rawImageFile);
  });
};

export default {
  compressImage,
  formatBytes,
  revokePreviewUrl,
};
