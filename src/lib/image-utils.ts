import { MAX_SOURCE_DIMENSION } from "./types";

/**
 * Convert a File to a data URL string
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
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
