import { MAX_SOURCE_DIMENSION } from "./types";

/**
 * Load image dimensions from a data URL with timeout
 * Returns { width, height } of the loaded image
 */
export async function loadImageDimensions(
  dataUrl: string,
  timeoutMs = 10000,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const timer = setTimeout(() => {
      reject(new Error(`Image load timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    img.onload = () => {
      clearTimeout(timer);
      if (img.naturalWidth <= 0 || img.naturalHeight <= 0) {
        reject(new Error("Invalid image dimensions"));
      } else {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      }
    };
    img.onerror = () => {
      clearTimeout(timer);
      reject(new Error("Failed to load image dimensions"));
    };
    img.src = dataUrl;
  });
}

/**
 * Convert a File to a data URL string
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        resolve(result);
      } else {
        reject(new Error("FileReader did not return a string"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Load an image from a source URL
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

/**
 * Generate a unique ID for an image
 */
export function generateImageId(): string {
  return `img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Downscale an image if it exceeds the maximum dimension
 * Returns the original data URL if no scaling is needed
 */
export async function prepareImage(dataUrl: string): Promise<string> {
  const img = await loadImage(dataUrl);

  if (img.width <= MAX_SOURCE_DIMENSION && img.height <= MAX_SOURCE_DIMENSION) {
    return dataUrl;
  }

  const scale = MAX_SOURCE_DIMENSION / Math.max(img.width, img.height);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.9);
}

/**
 * Create a download filename for a processed story image
 */
export function createStoryFilename(originalFilename: string): string {
  const nameWithoutExt = originalFilename.replace(/\.[^/.]+$/, "");
  return `story_${nameWithoutExt}.png`;
}
