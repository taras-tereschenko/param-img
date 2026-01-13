export type BackgroundType = "blur" | "black" | "white" | "custom" | "ambient";

export type AmbientBaseType = "black" | "white" | "custom";

export interface ProcessedImage {
  id: string;
  originalFile: File;
  originalDataUrl: string;
  processedDataUrl: string | null;
  backgroundColor: BackgroundType;
  customColor: string | null;
  scale: number;
  status: "pending" | "processing" | "ready" | "error";
  error?: string;
}

export interface ImageDimensions {
  width: number;
  height: number;
}

// Instagram Story aspect ratio: 9:16 (width:height)
export const STORY_ASPECT_RATIO = 9 / 16;

// Accepted image types for upload
export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

// Maximum source dimension to prevent memory issues with very large images
export const MAX_SOURCE_DIMENSION = 4096;

// Default scale (100%)
export const DEFAULT_SCALE = 1;

// Scale range
export const MIN_SCALE = 0.5;
export const MAX_SCALE = 1;

// Blur radius range (in pixels)
export const DEFAULT_BLUR_RADIUS = 100;
export const MIN_BLUR_RADIUS = 0;
export const MAX_BLUR_RADIUS = 500;

// Ambient mode blur radius (separate from blur mode)
export const DEFAULT_AMBIENT_BLUR_RADIUS = 400;
export const MAX_AMBIENT_BLUR_RADIUS = 1000;
