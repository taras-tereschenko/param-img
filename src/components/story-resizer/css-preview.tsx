/**
 * CSS Preview Component
 *
 * GPU-accelerated preview using native CSS filters.
 * No WebGL/WebGPU complexity - just CSS blur() which is hardware-accelerated.
 * Settings changes update instantly - no worker round-trip.
 */

import { memo, useEffect, useRef, useState } from "react";
import type {
  AmbientBaseType,
  BackgroundType,
  BorderRadiusOption,
  ImageEnhancements,
} from "@/lib/types";
import { BORDER_RADIUS_OPTIONS, STORY_ASPECT_RATIO } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CSSPreviewProps {
  imageUrl: string;
  naturalWidth: number;
  naturalHeight: number;
  background: BackgroundType;
  customColor: string | null;
  ambientBase: AmbientBaseType;
  ambientCustomColor: string | null;
  blurPercent: number;
  scale: number;
  borderRadius: BorderRadiusOption;
  enhancements?: ImageEnhancements; // CSS filter fallback
  className?: string;
}

export const CSSPreview = memo(function CSSPreview({
  imageUrl,
  naturalWidth,
  naturalHeight,
  background,
  customColor,
  ambientBase,
  ambientCustomColor,
  blurPercent,
  scale,
  borderRadius,
  enhancements,
  className,
}: CSSPreviewProps) {
  // Apply CSS filters only if enhancements exist (fallback mode)
  const shouldApplyCssFilters = Boolean(enhancements);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(0);

  // Track container size for blur scaling
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      // ResizeObserver callback always receives at least one entry for observed elements
      const entry = entries[0];
      setContainerHeight(entry.contentRect.height);
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Calculate logical canvas dimensions (9:21 aspect ratio)
  const srcRatio = naturalWidth / naturalHeight;
  const canvasWidth =
    srcRatio > STORY_ASPECT_RATIO
      ? naturalWidth
      : Math.round(naturalHeight * STORY_ASPECT_RATIO);
  const canvasHeight =
    srcRatio > STORY_ASPECT_RATIO
      ? Math.round(naturalWidth / STORY_ASPECT_RATIO)
      : naturalHeight;

  // Calculate blur pixels based on shorter dimension of original image
  const blurPixels = Math.round(
    (blurPercent / 100) * Math.min(naturalWidth, naturalHeight),
  );

  // Calculate foreground dimensions and position (as percentages)
  const drawWidth = naturalWidth * scale;
  const drawHeight = naturalHeight * scale;
  const fgLeft = ((canvasWidth - drawWidth) / 2 / canvasWidth) * 100;
  const fgTop = ((canvasHeight - drawHeight) / 2 / canvasHeight) * 100;
  const fgWidthPct = (drawWidth / canvasWidth) * 100;
  const fgHeightPct = (drawHeight / canvasHeight) * 100;

  // Scale blur pixels to actual container size
  const scaledBlurPx =
    containerHeight > 0 ? blurPixels * (containerHeight / canvasHeight) : 0;

  // Border radius calculation in pixels (based on shorter dimension of foreground)
  const radiusOption = BORDER_RADIUS_OPTIONS.find(
    (opt) => opt.value === borderRadius,
  );
  const fgShorterSide = Math.min(drawWidth, drawHeight);
  const radiusLogicalPx = radiusOption
    ? (radiusOption.percent / 100) * fgShorterSide
    : 0;
  // Scale to actual screen pixels
  const radiusPx =
    containerHeight > 0
      ? radiusLogicalPx * (containerHeight / canvasHeight)
      : 0;

  // Get solid background color
  const getSolidColor = () => {
    if (background === "black") return "#000000";
    if (background === "white") return "#ffffff";
    if (background === "custom" && customColor) return customColor;
    return "#000000";
  };

  // Get ambient base color
  const getAmbientColor = () => {
    if (ambientBase === "black") return "#000000";
    if (ambientBase === "white") return "#ffffff";
    // ambientBase === "custom"
    return ambientCustomColor ?? "#000000";
  };

  // Clamp utility to prevent extreme values from AI
  const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max);

  // Calculate enhancement CSS filter with clamped values
  const getEnhancementFilter = () => {
    if (!enhancements) return "";

    const filters: Array<string> = [];

    // Exposure adjustment (brightness)
    // adjustment is typically in stops, convert to CSS brightness multiplier
    // +1 stop = 2x brightness, -1 stop = 0.5x brightness
    // Clamp to -2 to +2 stops (0.25x to 4x brightness)
    const clampedExposure = clamp(enhancements.exposure.adjustment, -2, 2);
    const brightnessMultiplier = Math.pow(2, clampedExposure);
    if (brightnessMultiplier !== 1) {
      filters.push(`brightness(${brightnessMultiplier.toFixed(2)})`);
    }

    // Color saturation (0-100 scale from AI, convert to CSS where 100 = normal)
    // saturation of 10 means +10%, so 1.1 multiplier
    // Clamp to -50 to +100 (0.5x to 2x saturation)
    const clampedSaturation = clamp(enhancements.color.saturation, -50, 100);
    const saturationMultiplier = 1 + clampedSaturation / 100;
    if (saturationMultiplier !== 1) {
      filters.push(`saturate(${saturationMultiplier.toFixed(2)})`);
    }

    // Clarity/contrast (sharpening approximated via contrast)
    // sharpening of 15 means +15% contrast
    // Clamp to -30 to +50 (0.7x to 1.5x contrast)
    const clampedSharpening = clamp(enhancements.clarity.sharpening, -30, 50);
    const contrastMultiplier = 1 + clampedSharpening / 100;
    if (contrastMultiplier !== 1) {
      filters.push(`contrast(${contrastMultiplier.toFixed(2)})`);
    }

    // Color temperature (warm/cool)
    // Approximated via sepia (warm) or hue-rotate (cool)
    // Clamp temperature to -100 to +100
    const clampedTemp = clamp(enhancements.color.temperature, -100, 100);
    if (clampedTemp > 0) {
      // Warm: add slight sepia (max 20%)
      const warmth = Math.min(clampedTemp / 100, 0.2);
      filters.push(`sepia(${warmth.toFixed(2)})`);
    } else if (clampedTemp < 0) {
      // Cool: slight hue rotation towards blue (max 10deg)
      const coolness = Math.min(Math.abs(clampedTemp) / 10, 10);
      filters.push(`hue-rotate(${coolness}deg)`);
    }

    return filters.join(" ");
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden", className)}
      style={{ aspectRatio: "9 / 21" }}
    >
      {/* Background Layer */}
      {background === "blur" && (
        <>
          {/* Blurred background image (cover mode) */}
          <img
            src={imageUrl}
            alt=""
            className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
            style={{
              filter: `blur(${scaledBlurPx}px)`,
            }}
          />
          {/* Darkening overlay */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.15)" }}
          />
        </>
      )}

      {background === "ambient" && (
        <>
          {/* Solid color base */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{ backgroundColor: getAmbientColor() }}
          />
          {/* Blurred image at foreground position */}
          <img
            src={imageUrl}
            alt=""
            className="pointer-events-none absolute select-none"
            style={{
              left: `${fgLeft}%`,
              top: `${fgTop}%`,
              width: `${fgWidthPct}%`,
              height: `${fgHeightPct}%`,
              filter: `blur(${scaledBlurPx}px)`,
              willChange: "filter",
            }}
          />
        </>
      )}

      {(background === "black" ||
        background === "white" ||
        background === "custom") && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{ backgroundColor: getSolidColor() }}
        />
      )}

      {/* Foreground Layer - sharp image (with optional enhancements) */}
      <img
        src={imageUrl}
        alt=""
        className="pointer-events-none absolute select-none"
        style={{
          left: `${fgLeft}%`,
          top: `${fgTop}%`,
          width: `${fgWidthPct}%`,
          height: `${fgHeightPct}%`,
          borderRadius: `${radiusPx}px`,
          filter: shouldApplyCssFilters ? getEnhancementFilter() : undefined,
        }}
      />
    </div>
  );
});
