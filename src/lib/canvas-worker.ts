/**
 * Canvas Worker - Processes images for Instagram Story format using Canvas 2D API
 *
 * Uses native CSS filter: blur() equivalent on OffscreenCanvas.
 * Runs in a Web Worker to keep main thread responsive during export.
 */

import {
  BORDER_RADIUS_OPTIONS,
  DEFAULT_BLUR_PERCENT,
  STORY_ASPECT_RATIO,
} from "./types";
import type {
  AmbientBaseType,
  BackgroundType,
  BorderRadiusOption,
} from "./types";

export interface ProcessRequest {
  id: string;
  imageId?: string;
  imageDataUrl?: string;
  backgroundType: BackgroundType;
  customColor: string | null;
  scale: number;
  ambientBase?: AmbientBaseType;
  ambientCustomColor?: string | null;
  blurPercent?: number;
  borderRadius?: BorderRadiusOption;
  maxSize?: number | null;
}

export interface ClearCacheRequest {
  type: "clearCache";
  imageId: string;
}

export type WorkerRequest = ProcessRequest | ClearCacheRequest;

export interface ProcessResponse {
  id: string;
  blob: Blob;
}

export interface ProcessError {
  id: string;
  error: string;
}

// Cache for decoded ImageBitmaps
const imageBitmapCache = new Map<string, ImageBitmap>();

// IndexedDB config - must match image-storage.ts
const IMAGE_DB_CONFIG = {
  name: "param-img-storage",
  version: 1,
  storeName: "images",
};

/**
 * Read image data URL from IndexedDB by id
 */
async function getImageDataUrlFromDB(
  imageId: string,
): Promise<string | undefined> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(
      IMAGE_DB_CONFIG.name,
      IMAGE_DB_CONFIG.version,
    );

    request.onerror = () => reject(request.error);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IMAGE_DB_CONFIG.storeName)) {
        db.createObjectStore(IMAGE_DB_CONFIG.storeName, { keyPath: "id" });
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction(IMAGE_DB_CONFIG.storeName, "readonly");
      const store = tx.objectStore(IMAGE_DB_CONFIG.storeName);
      const getRequest = store.get(imageId);

      getRequest.onerror = () => reject(getRequest.error);
      getRequest.onsuccess = () => {
        const result = getRequest.result;
        resolve(result?.originalDataUrl);
      };
    };
  });
}

/**
 * Load an image from a data URL using createImageBitmap
 */
async function loadImageBitmap(
  dataUrl: string | undefined,
  imageId?: string,
): Promise<ImageBitmap> {
  if (imageId) {
    const cached = imageBitmapCache.get(imageId);
    if (cached) {
      return cached;
    }
  }

  let resolvedDataUrl = dataUrl;
  if (!resolvedDataUrl && imageId) {
    resolvedDataUrl = await getImageDataUrlFromDB(imageId);
  }

  if (!resolvedDataUrl) {
    throw new Error(
      `No data URL and no IndexedDB entry for imageId: ${imageId}`,
    );
  }

  const response = await fetch(resolvedDataUrl);
  const blob = await response.blob();
  const bitmap = await createImageBitmap(blob);

  if (imageId) {
    imageBitmapCache.set(imageId, bitmap);
  }

  return bitmap;
}

/**
 * Calculate canvas dimensions for 9:21 aspect ratio
 */
function calculateCanvasDimensions(
  srcWidth: number,
  srcHeight: number,
): { width: number; height: number } {
  const srcRatio = srcWidth / srcHeight;

  if (srcRatio > STORY_ASPECT_RATIO) {
    return {
      width: srcWidth,
      height: Math.round(srcWidth / STORY_ASPECT_RATIO),
    };
  } else {
    return {
      width: Math.round(srcHeight * STORY_ASPECT_RATIO),
      height: srcHeight,
    };
  }
}

/**
 * Calculate border radius in pixels
 */
function getBorderRadiusPixels(
  option: BorderRadiusOption,
  imageWidth: number,
  imageHeight: number,
): number {
  const radiusOption = BORDER_RADIUS_OPTIONS.find(
    (opt) => opt.value === option,
  );
  if (!radiusOption || radiusOption.percent === 0) return 0;

  const shorterSide = Math.min(imageWidth, imageHeight);
  return Math.round(shorterSide * (radiusOption.percent / 100));
}

/**
 * Calculate blur radius in pixels from percentage
 * Uses the shorter dimension of the image for consistent visual blur
 */
function getBlurPixels(
  blurPercent: number,
  imageWidth: number,
  imageHeight: number,
): number {
  const shorterSide = Math.min(imageWidth, imageHeight);
  return Math.round((blurPercent / 100) * shorterSide);
}

/**
 * Draw a rounded rectangle path
 */
function drawRoundedRect(
  ctx: OffscreenCanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Process an image using Canvas 2D API
 */
async function processImageForStory(
  imageDataUrl: string | undefined,
  backgroundType: BackgroundType,
  customColor: string | null,
  scale: number,
  ambientBase?: AmbientBaseType,
  ambientCustomColor?: string | null,
  blurPercent?: number,
  borderRadius?: BorderRadiusOption,
  maxSize?: number | null,
  imageId?: string,
): Promise<Blob> {
  const img = await loadImageBitmap(imageDataUrl, imageId);
  const isCached = imageId && imageBitmapCache.has(imageId);

  // Calculate scale factor based on maxSize
  let sizeScale = 1;
  if (maxSize != null) {
    const maxDim = Math.max(img.width, img.height);
    if (maxDim > maxSize) {
      sizeScale = maxSize / maxDim;
    }
  }

  // Apply size scaling to base dimensions
  const imageWidth = Math.round(img.width * sizeScale);
  const imageHeight = Math.round(img.height * sizeScale);

  const { width: canvasWidth, height: canvasHeight } =
    calculateCanvasDimensions(imageWidth, imageHeight);

  // Calculate blur pixels from percentage based on image dimensions
  const effectiveBlurPercent = blurPercent ?? DEFAULT_BLUR_PERCENT;
  const blurPixels = getBlurPixels(effectiveBlurPercent, imageWidth, imageHeight);

  // Create OffscreenCanvas with 2D context
  const canvas = new OffscreenCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get 2D context");

  // Calculate foreground dimensions
  const drawWidth = imageWidth * scale;
  const drawHeight = imageHeight * scale;
  const x = (canvasWidth - drawWidth) / 2;
  const y = (canvasHeight - drawHeight) / 2;

  // Draw background based on type
  if (backgroundType === "blur") {
    // Calculate background cover dimensions
    const bgScale = Math.max(
      canvasWidth / imageWidth,
      canvasHeight / imageHeight,
    );
    const bgWidth = imageWidth * bgScale;
    const bgHeight = imageHeight * bgScale;
    const bgX = (canvasWidth - bgWidth) / 2;
    const bgY = (canvasHeight - bgHeight) / 2;

    // Draw blurred background
    ctx.filter = `blur(${blurPixels}px)`;
    ctx.drawImage(img, bgX, bgY, bgWidth, bgHeight);
    ctx.filter = "none";

    // Darkening overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  } else if (backgroundType === "ambient") {
    // Draw base color
    let baseColor = "#000000";
    if (ambientBase === "white") {
      baseColor = "#ffffff";
    } else if (ambientBase === "custom" && ambientCustomColor) {
      baseColor = ambientCustomColor;
    }

    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Draw blurred image at foreground position
    ctx.filter = `blur(${blurPixels}px)`;
    ctx.drawImage(img, x, y, drawWidth, drawHeight);
    ctx.filter = "none";
  } else {
    // Solid color backgrounds
    let bgColor = "#000000";
    if (backgroundType === "white") {
      bgColor = "#ffffff";
    } else if (backgroundType === "custom" && customColor) {
      bgColor = customColor;
    }

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  }

  // Draw foreground with border radius
  const radiusPixels = getBorderRadiusPixels(
    borderRadius ?? 0,
    drawWidth,
    drawHeight,
  );

  if (radiusPixels > 0) {
    ctx.save();
    drawRoundedRect(ctx, x, y, drawWidth, drawHeight, radiusPixels);
    ctx.clip();
    ctx.drawImage(img, x, y, drawWidth, drawHeight);
    ctx.restore();
  } else {
    ctx.drawImage(img, x, y, drawWidth, drawHeight);
  }

  // Convert to blob
  const blob = await canvas.convertToBlob({ type: "image/png" });

  if (!isCached) {
    img.close();
  }

  return blob;
}

// Worker message handler
self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const data = e.data;

  // Handle cache clear request
  if ("type" in data) {
    const cached = imageBitmapCache.get(data.imageId);
    if (cached) {
      cached.close();
      imageBitmapCache.delete(data.imageId);
    }
    return;
  }

  // Handle process request
  const {
    id,
    imageId,
    imageDataUrl,
    backgroundType,
    customColor,
    scale,
    ambientBase,
    ambientCustomColor,
    blurPercent,
    borderRadius,
    maxSize,
  } = data;

  try {
    const blob = await processImageForStory(
      imageDataUrl,
      backgroundType,
      customColor,
      scale,
      ambientBase,
      ambientCustomColor,
      blurPercent,
      borderRadius,
      maxSize,
      imageId,
    );

    self.postMessage({ id, blob } as ProcessResponse);
  } catch (error) {
    self.postMessage({
      id,
      error: error instanceof Error ? error.message : "Unknown error",
    } as ProcessError);
  }
};
