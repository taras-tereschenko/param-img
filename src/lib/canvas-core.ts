/**
 * Shared canvas drawing functions that work with both CanvasRenderingContext2D
 * and OffscreenCanvasRenderingContext2D
 */

import {
  BORDER_RADIUS_OPTIONS,
  DEFAULT_BLUR_RADIUS,
  STORY_ASPECT_RATIO,
} from "./types";
import type { BorderRadiusOption } from "./types";

// Common canvas type that works with both contexts
type Canvas = HTMLCanvasElement | OffscreenCanvas;
type CanvasContext =
  | CanvasRenderingContext2D
  | OffscreenCanvasRenderingContext2D;
type ImageSource = HTMLImageElement | ImageBitmap;

export interface CanvasDimensions {
  width: number;
  height: number;
}

/**
 * Calculate canvas dimensions based on original image size
 * The canvas will have 9:21 aspect ratio, sized to fit the original image
 */
export function calculateCanvasDimensions(
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
export function drawRoundedRect(
  ctx: CanvasContext,
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
export function getBorderRadiusPixels(
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
export function drawBlurredBackground(
  ctx: CanvasContext,
  canvas: Canvas,
  img: ImageSource,
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
export function drawSolidBackground(
  ctx: CanvasContext,
  canvas: Canvas,
  color: string,
): void {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

/**
 * Draw ambient glow effect (YouTube-style ambient mode)
 */
export function drawAmbientBackground(
  ctx: CanvasContext,
  canvas: Canvas,
  img: ImageSource,
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
