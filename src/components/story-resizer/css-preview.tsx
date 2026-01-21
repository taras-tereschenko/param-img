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
  className,
}: CSSPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(0);

  // Track container size for blur scaling
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
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

      {/* Foreground Layer - sharp image */}
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
        }}
      />
    </div>
  );
});
