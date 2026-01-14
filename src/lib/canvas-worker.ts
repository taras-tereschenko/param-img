/**
 * Canvas Worker - Processes images for Instagram Story format using OffscreenCanvas
 *
 * This runs in a Web Worker to keep the main thread responsive during heavy
 * canvas operations like blur filters and JPEG encoding.
 */

import { DEFAULT_BLUR_RADIUS } from "./types";
import {
  calculateCanvasDimensions,
  drawAmbientBackground,
  drawBlurredBackground,
  drawRoundedRect,
  drawSolidBackground,
  getBorderRadiusPixels,
} from "./canvas-core";
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
      drawBlurredBackground(
        ctx,
        canvas,
        img,
        blurRadius ?? DEFAULT_BLUR_RADIUS,
      );
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
  const adjustedBlurRadius =
    sizeScale < 1 && blurRadius
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
    drawBackground(
      ctx,
      canvas,
      img,
      backgroundType,
      customColor,
      adjustedBlurRadius,
    );
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

  return canvas.convertToBlob({ type: "image/png" });
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
