export type BackgroundType = "blur" | "black" | "white" | "custom" | "ambient";

export type AmbientBaseType = "black" | "white" | "custom";

export type PanelType = "blur" | "ambient" | "color" | "resize";

/** Discriminated union for AI enhancement API responses */
export type EnhanceResponse =
  | { success: true; enhancedImageBase64: string; mimeType: string }
  | { success: false; error: string };

export type EnhancementStatus = "idle" | "loading" | "success" | "error";

export interface ImageEnhancements {
  exposure: { adjustment: number; shadows: number; highlights: number };
  color: { temperature: number; saturation: number; vibrance: number };
  clarity: { sharpening: number; noiseReduction: number };
  suggestions: Array<string>;
}

export interface ProcessedImage {
  id: string;
  originalFile: File;
  originalDataUrl: string;
  naturalWidth: number;
  naturalHeight: number;
  // AI Enhancement fields
  enhancementStatus: EnhancementStatus;
  enhancements?: ImageEnhancements; // CSS filter fallback (backward compatibility)
  // Enhanced image relationship
  isEnhancedResult?: boolean; // True if this IS an enhanced image
  sourceImageId?: string; // ID of the original image (for enhanced results)
}

// Instagram Story aspect ratio: 9:21 (width:height) - taller for modern phone displays
export const STORY_ASPECT_RATIO = 9 / 21;

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

// Blur percentage range (as percentage of shorter image dimension)
// This ensures consistent visual blur regardless of image resolution
export const DEFAULT_BLUR_PERCENT = 5;
export const MIN_BLUR_PERCENT = 0;
export const MAX_BLUR_PERCENT = 25;

// Ambient mode blur percentage (separate from blur mode)
export const DEFAULT_AMBIENT_BLUR_PERCENT = 20;
export const MAX_AMBIENT_BLUR_PERCENT = 50;

// Border radius options (as percentage of shorter image dimension)
export type BorderRadiusOption = 0 | 1 | 2 | 3;
export const BORDER_RADIUS_OPTIONS = [
  { value: 0 as const, label: "None", percent: 0 },
  { value: 1 as const, label: "S", percent: 2.5 },
  { value: 2 as const, label: "M", percent: 5 },
  { value: 3 as const, label: "L", percent: 10 },
] as const;
export const DEFAULT_BORDER_RADIUS: BorderRadiusOption = 0;
