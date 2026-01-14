/**
 * Canvas Worker - Processes images for Instagram Story format using OffscreenCanvas
 *
 * This runs in a Web Worker to keep the main thread responsive during heavy
 * canvas operations like blur filters and JPEG encoding.
 */

import {
  BORDER_RADIUS_OPTIONS,
  DEFAULT_BLUR_RADIUS,
  STORY_ASPECT_RATIO,
} from "./types";
import type {
  AmbientBaseType,
  BackgroundType,
  BorderRadiusOption,
} from "./types";

export interface ProcessRequest {
  id: string;
  imageDataUrl: string;
  backgroundType: BackgroundType;
  customColor: string | null;
  scale: number;
  ambientBase?: AmbientBaseType;
  ambientCustomColor?: string | null;
  blurRadius?: number;
  borderRadius?: BorderRadiusOption;
  maxSize?: number | null; // null or undefined = full resolution
}

export interface ProcessResponse {
  id: string;
  blob: Blob;
}

export interface ProcessError {
  id: string;
  error: string;
}

interface CanvasDimensions {
  width: number;
  height: number;
}

/**
 * Calculate canvas dimensions based on original image size
 * The canvas will have 9:21 aspect ratio, sized to fit the original image
 */
function calculateCanvasDimensions(
  srcWidth: number,
  srcHeight: number,
): CanvasDimensions {
  const srcRatio = srcWidth / srcHeight;

  let canvasWidth: number;
  let canvasHeight: number;

  if (srcRatio > STORY_ASPECT_RATIO) {
    canvasWidth = srcWidth;
    canvasHeight = Math.round(srcWidth / STORY_ASPECT_RATIO);
  } else {
    canvasHeight = srcHeight;
    canvasWidth = Math.round(srcHeight * STORY_ASPECT_RATIO);
  }

  return { width: canvasWidth, height: canvasHeight };
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
 * Calculate actual border radius in pixels from option
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
 * Draw a blurred background using the original image
 */
function drawBlurredBackground(
  ctx: OffscreenCanvasRenderingContext2D,
  canvas: OffscreenCanvas,
  img: ImageBitmap,
  blurRadius: number = DEFAULT_BLUR_RADIUS,
): void {
  const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
  const scaledWidth = img.width * scale;
  const scaledHeight = img.height * scale;
  const x = (canvas.width - scaledWidth) / 2;
  const y = (canvas.height - scaledHeight) / 2;

  ctx.filter = `blur(${blurRadius}px)`;
  ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
  ctx.filter = "none";

  // Add slight darkening overlay for better contrast
  ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

/**
 * Draw a solid color background
 */
function drawSolidBackground(
  ctx: OffscreenCanvasRenderingContext2D,
  canvas: OffscreenCanvas,
  color: string,
): void {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

/**
 * Draw ambient glow effect (YouTube-style ambient mode)
 */
function drawAmbientBackground(
  ctx: OffscreenCanvasRenderingContext2D,
  canvas: OffscreenCanvas,
  img: ImageBitmap,
  baseColor: string,
  imageX: number,
  imageY: number,
  imageWidth: number,
  imageHeight: number,
  blurRadius: number = DEFAULT_BLUR_RADIUS,
): void {
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.filter = `blur(${blurRadius}px)`;
  ctx.drawImage(img, imageX, imageY, imageWidth, imageHeight);
  ctx.restore();
}

/**
 * Draw the background based on the selected type
 */
function drawBackground(
  ctx: OffscreenCanvasRenderingContext2D,
  canvas: OffscreenCanvas,
  img: ImageBitmap,
  backgroundType: BackgroundType,
  customColor?: string | null,
  blurRadius?: number,
): void {
  switch (backgroundType) {
    case "blur":
      drawBlurredBackground(ctx, canvas, img, blurRadius ?? DEFAULT_BLUR_RADIUS);
      break;
    case "black":
      drawSolidBackground(ctx, canvas, "#000000");
      break;
    case "white":
      drawSolidBackground(ctx, canvas, "#ffffff");
      break;
    case "custom":
      drawSolidBackground(ctx, canvas, customColor || "#000000");
      break;
  }
}

/**
 * Load an image from a data URL using createImageBitmap
 */
async function loadImageBitmap(dataUrl: string): Promise<ImageBitmap> {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return createImageBitmap(blob);
}

/**
 * Process an image for Instagram Story format
 */
async function processImageForStory(
  imageDataUrl: string,
  backgroundType: BackgroundType,
  customColor: string | null,
  scale: number,
  ambientBase?: AmbientBaseType,
  ambientCustomColor?: string | null,
  blurRadius?: number,
  borderRadius?: BorderRadiusOption,
  maxSize?: number | null,
): Promise<Blob> {
  const img = await loadImageBitmap(imageDataUrl);

  // Calculate scale factor based on maxSize
  let sizeScale = 1;
  if (maxSize != null) {
    const maxDim = Math.max(img.width, img.height);
    if (maxDim > maxSize) {
      sizeScale = maxSize / maxDim;
    }
  }

  // Apply size scaling to base dimensions
  const baseWidth = Math.round(img.width * sizeScale);
  const baseHeight = Math.round(img.height * sizeScale);

  const { width: canvasWidth, height: canvasHeight } =
    calculateCanvasDimensions(baseWidth, baseHeight);

  const canvas = new OffscreenCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  const drawWidth = baseWidth * scale;
  const drawHeight = baseHeight * scale;

  // Scale blur radius proportionally when downscaling
  const adjustedBlurRadius = sizeScale < 1 && blurRadius
    ? Math.round(blurRadius * sizeScale)
    : blurRadius;
  const x = (canvasWidth - drawWidth) / 2;
  const y = (canvasHeight - drawHeight) / 2;

  // Draw background
  if (backgroundType === "ambient") {
    let baseColor = "#000000";
    if (ambientBase === "white") {
      baseColor = "#ffffff";
    } else if (ambientBase === "custom" && ambientCustomColor) {
      baseColor = ambientCustomColor;
    }
    drawAmbientBackground(
      ctx,
      canvas,
      img,
      baseColor,
      x,
      y,
      drawWidth,
      drawHeight,
      adjustedBlurRadius ?? DEFAULT_BLUR_RADIUS,
    );
  } else {
    drawBackground(ctx, canvas, img, backgroundType, customColor, adjustedBlurRadius);
  }

  // Draw the original image centered and scaled with optional rounded corners
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

  // Close the ImageBitmap to free memory
  img.close();

  return canvas.convertToBlob({ type: "image/jpeg", quality: 0.95 });
}

// Worker message handler
self.onmessage = async (e: MessageEvent<ProcessRequest>) => {
  const {
    id,
    imageDataUrl,
    backgroundType,
    customColor,
    scale,
    ambientBase,
    ambientCustomColor,
    blurRadius,
    borderRadius,
    maxSize,
  } = e.data;

  try {
    const blob = await processImageForStory(
      imageDataUrl,
      backgroundType,
      customColor,
      scale,
      ambientBase,
      ambientCustomColor,
      blurRadius,
      borderRadius,
      maxSize,
    );

    // Transfer the blob back to main thread
    self.postMessage({ id, blob } as ProcessResponse);
  } catch (error) {
    self.postMessage({
      id,
      error: error instanceof Error ? error.message : "Unknown error",
    } as ProcessError);
  }
};
