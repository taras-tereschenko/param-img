import { DEFAULT_BLUR_PERCENT } from "./types";
import { loadImage } from "./image-utils";
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

// Re-export for use in components
export { calculateCanvasDimensions };

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
 * Draw the background based on the selected type
 */
function drawBackground(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  backgroundType: BackgroundType,
  customColor?: string | null,
  blurPixels?: number,
): void {
  switch (backgroundType) {
    case "blur":
      drawBlurredBackground(ctx, canvas, img, blurPixels ?? 0);
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
 * Process an image for Instagram Story format
 */
export async function processImageForStory(
  imageDataUrl: string,
  backgroundType: BackgroundType,
  customColor: string | null,
  scale: number,
  ambientBase?: AmbientBaseType,
  ambientCustomColor?: string | null,
  blurPercent?: number,
  borderRadius?: BorderRadiusOption,
): Promise<string> {
  const img = await loadImage(imageDataUrl);

  // Calculate canvas dimensions based on original image
  const { width: canvasWidth, height: canvasHeight } =
    calculateCanvasDimensions(img.width, img.height);

  // Create canvas
  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  // Calculate scaled image dimensions
  const drawWidth = img.width * scale;
  const drawHeight = img.height * scale;

  // Center the scaled image
  const x = (canvasWidth - drawWidth) / 2;
  const y = (canvasHeight - drawHeight) / 2;

  // Calculate blur pixels from percentage
  const effectiveBlurPercent = blurPercent ?? DEFAULT_BLUR_PERCENT;
  const blurPixels = getBlurPixels(effectiveBlurPercent, img.width, img.height);

  // Draw background
  if (backgroundType === "ambient") {
    // Determine ambient base color
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
      blurPixels,
    );
  } else {
    drawBackground(ctx, canvas, img, backgroundType, customColor, blurPixels);
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

  return canvas.toDataURL("image/png");
}
