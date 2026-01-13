import { type BackgroundType, type AmbientBaseType, STORY_ASPECT_RATIO, DEFAULT_BLUR_RADIUS } from "./types";
import { loadImage } from "./image-utils";

interface CanvasDimensions {
  width: number;
  height: number;
}

/**
 * Calculate canvas dimensions based on original image size
 * The canvas will have 9:16 aspect ratio, sized to fit the original image
 */
export function calculateCanvasDimensions(
  srcWidth: number,
  srcHeight: number
): CanvasDimensions {
  const srcRatio = srcWidth / srcHeight;

  let canvasWidth: number;
  let canvasHeight: number;

  if (srcRatio > STORY_ASPECT_RATIO) {
    // Original is wider than 9:16 - use original width
    canvasWidth = srcWidth;
    canvasHeight = Math.round(srcWidth / STORY_ASPECT_RATIO);
  } else {
    // Original is taller than 9:16 - use original height
    canvasHeight = srcHeight;
    canvasWidth = Math.round(srcHeight * STORY_ASPECT_RATIO);
  }

  return { width: canvasWidth, height: canvasHeight };
}

/**
 * Draw a blurred background using the original image
 */
function drawBlurredBackground(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  blurRadius: number = DEFAULT_BLUR_RADIUS
): void {
  // Calculate scale to cover the entire canvas
  const scale = Math.max(
    canvas.width / img.width,
    canvas.height / img.height
  );
  const scaledWidth = img.width * scale;
  const scaledHeight = img.height * scale;
  const x = (canvas.width - scaledWidth) / 2;
  const y = (canvas.height - scaledHeight) / 2;

  // Apply blur filter and draw
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
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  color: string
): void {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

/**
 * Draw ambient glow effect (YouTube-style ambient mode)
 * The blurred image is drawn at the same size/position as the sharp image.
 */
function drawAmbientBackground(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  baseColor: string,
  imageX: number,
  imageY: number,
  imageWidth: number,
  imageHeight: number,
  blurRadius: number = DEFAULT_BLUR_RADIUS
): void {
  // Fill base color first
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Single blur pass
  ctx.save();
  ctx.filter = `blur(${blurRadius}px)`;
  ctx.drawImage(img, imageX, imageY, imageWidth, imageHeight);
  ctx.restore();
}

/**
 * Draw the background based on the selected type
 */
async function drawBackground(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  backgroundType: BackgroundType,
  customColor?: string | null,
  blurRadius?: number
): Promise<void> {
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
 * Process an image for Instagram Story format
 */
export async function processImageForStory(
  imageDataUrl: string,
  backgroundType: BackgroundType,
  customColor: string | null,
  scale: number,
  ambientBase?: AmbientBaseType,
  ambientCustomColor?: string | null,
  blurRadius?: number
): Promise<string> {
  const img = await loadImage(imageDataUrl);

  // Calculate canvas dimensions based on original image
  const { width: canvasWidth, height: canvasHeight } = calculateCanvasDimensions(
    img.width,
    img.height
  );

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

  // Draw background
  if (backgroundType === "ambient") {
    // Determine ambient base color
    let baseColor = "#000000";
    if (ambientBase === "white") {
      baseColor = "#ffffff";
    } else if (ambientBase === "custom" && ambientCustomColor) {
      baseColor = ambientCustomColor;
    }
    drawAmbientBackground(ctx, canvas, img, baseColor, x, y, drawWidth, drawHeight, blurRadius ?? DEFAULT_BLUR_RADIUS);
  } else {
    await drawBackground(ctx, canvas, img, backgroundType, customColor, blurRadius);
  }

  // Draw the original image centered and scaled
  ctx.drawImage(img, x, y, drawWidth, drawHeight);

  return canvas.toDataURL("image/jpeg", 0.95);
}

/**
 * Get a color from a specific pixel in an image
 */
export async function getColorFromImage(
  imageDataUrl: string,
  x: number,
  y: number,
  imageWidth: number,
  imageHeight: number
): Promise<string> {
  const img = await loadImage(imageDataUrl);

  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  ctx.drawImage(img, 0, 0);

  // Scale click coordinates to actual image dimensions
  const actualX = Math.floor((x / imageWidth) * img.width);
  const actualY = Math.floor((y / imageHeight) * img.height);

  const pixel = ctx.getImageData(actualX, actualY, 1, 1).data;
  const hex = `#${[pixel[0], pixel[1], pixel[2]]
    .map((c) => c.toString(16).padStart(2, "0"))
    .join("")}`;

  return hex;
}
