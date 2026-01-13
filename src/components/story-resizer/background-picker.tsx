import { useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  BlurIcon,
  CheckmarkCircle02Icon,
  ColorPickerIcon,
  SunglassesIcon,
} from "@hugeicons/core-free-icons";
import type {
  AmbientBaseType,
  BackgroundType,
  ProcessedImage,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MAX_BLUR_RADIUS, MIN_BLUR_RADIUS } from "@/lib/types";
import { Slider } from "@/components/ui/slider";
import { getColorFromImage } from "@/lib/canvas-utils";
import { cn } from "@/lib/utils";

interface BackgroundPickerProps {
  background: BackgroundType;
  customColor: string | null;
  ambientBase: AmbientBaseType;
  ambientCustomColor: string | null;
  blurRadius: number;
  onBackgroundChange: (background: BackgroundType) => void;
  onCustomColorChange: (color: string | null) => void;
  onAmbientBaseChange: (base: AmbientBaseType) => void;
  onAmbientCustomColorChange: (color: string | null) => void;
  onBlurRadiusChange: (radius: number) => void;
  images: Array<ProcessedImage>;
}

interface BackgroundOptionProps {
  label: string;
  selected: boolean;
  onClick: () => void;
  preview?: React.ReactNode;
  icon?: React.ReactNode;
  small?: boolean;
}

function BackgroundOption({
  label,
  selected,
  onClick,
  preview,
  icon,
  small,
}: BackgroundOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center gap-2 rounded-lg border-2 transition-colors",
        small ? "p-2" : "p-3",
        selected
          ? "border-primary bg-primary/5"
          : "border-muted hover:border-muted-foreground/50",
      )}
    >
      {selected && (
        <HugeiconsIcon
          icon={CheckmarkCircle02Icon}
          strokeWidth={2}
          className={cn(
            "absolute text-primary",
            small ? "right-1 top-1 size-3" : "right-1.5 top-1.5 size-4",
          )}
        />
      )}
      <div
        className={cn(
          "flex items-center justify-center rounded-md",
          small ? "size-6" : "size-10",
        )}
      >
        {preview || icon}
      </div>
      <span className={cn("font-medium", small ? "text-[10px]" : "text-xs")}>
        {label}
      </span>
    </button>
  );
}

export function BackgroundPicker({
  background,
  customColor,
  ambientBase,
  ambientCustomColor,
  blurRadius,
  onBackgroundChange,
  onCustomColorChange,
  onAmbientBaseChange,
  onAmbientCustomColorChange,
  onBlurRadiusChange,
  images,
}: BackgroundPickerProps) {
  const [isPickingColor, setIsPickingColor] = useState(false);
  const [pickerImageUrl, setPickerImageUrl] = useState<string | null>(null);
  const [pickerTarget, setPickerTarget] = useState<"custom" | "ambient">(
    "custom",
  );
  const imageRef = useRef<HTMLImageElement>(null);

  const handleEyedropperClick = async (target: "custom" | "ambient") => {
    // Try native EyeDropper API first (Chrome, Edge)
    if ("EyeDropper" in window) {
      try {
        const eyeDropper = new (window as any).EyeDropper();
        const result = await eyeDropper.open();
        if (target === "custom") {
          onCustomColorChange(result.sRGBHex);
          onBackgroundChange("custom");
        } else {
          onAmbientCustomColorChange(result.sRGBHex);
          onAmbientBaseChange("custom");
        }
        return;
      } catch {
        // User cancelled or API failed, fall back to image picker
      }
    }

    // Fallback: show image picker modal
    if (images.length > 0) {
      setPickerTarget(target);
      setPickerImageUrl(images[0].originalDataUrl);
      setIsPickingColor(true);
    }
  };

  const handleImageClick = async (e: React.MouseEvent<HTMLImageElement>) => {
    if (!pickerImageUrl || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    try {
      const color = await getColorFromImage(
        pickerImageUrl,
        x,
        y,
        rect.width,
        rect.height,
      );
      if (pickerTarget === "custom") {
        onCustomColorChange(color);
        onBackgroundChange("custom");
      } else {
        onAmbientCustomColorChange(color);
        onAmbientBaseChange("custom");
      }
      setIsPickingColor(false);
      setPickerImageUrl(null);
    } catch (error) {
      console.error("Failed to pick color:", error);
    }
  };

  const handleCancelPicker = () => {
    setIsPickingColor(false);
    setPickerImageUrl(null);
  };

  return (
    <div className="space-y-3">
      <Label>Background</Label>

      <div className="grid grid-cols-5 gap-2">
        <BackgroundOption
          label="Blur"
          selected={background === "blur"}
          onClick={() => onBackgroundChange("blur")}
          icon={
            <HugeiconsIcon
              icon={BlurIcon}
              strokeWidth={1.5}
              className="size-6 text-muted-foreground"
            />
          }
        />
        <BackgroundOption
          label="Ambient"
          selected={background === "ambient"}
          onClick={() => onBackgroundChange("ambient")}
          icon={
            <HugeiconsIcon
              icon={SunglassesIcon}
              strokeWidth={1.5}
              className="size-6 text-muted-foreground"
            />
          }
        />
        <BackgroundOption
          label="Black"
          selected={background === "black"}
          onClick={() => onBackgroundChange("black")}
          preview={<div className="size-8 rounded-md bg-black" />}
        />
        <BackgroundOption
          label="White"
          selected={background === "white"}
          onClick={() => onBackgroundChange("white")}
          preview={<div className="size-8 rounded-md border bg-white" />}
        />
        <BackgroundOption
          label="Pick"
          selected={background === "custom"}
          onClick={() => handleEyedropperClick("custom")}
          icon={
            customColor ? (
              <div
                className="size-8 rounded-md border"
                style={{ backgroundColor: customColor }}
              />
            ) : (
              <HugeiconsIcon
                icon={ColorPickerIcon}
                strokeWidth={1.5}
                className="size-6 text-muted-foreground"
              />
            )
          }
        />
      </div>

      {/* Ambient sub-options */}
      {background === "ambient" && (
        <div className="space-y-4 rounded-lg border bg-muted/30 p-3">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              Ambient Base Color
            </Label>
            <div className="grid grid-cols-3 gap-2">
              <BackgroundOption
                label="Black"
                selected={ambientBase === "black"}
                onClick={() => onAmbientBaseChange("black")}
                preview={<div className="size-5 rounded bg-black" />}
                small
              />
              <BackgroundOption
                label="White"
                selected={ambientBase === "white"}
                onClick={() => onAmbientBaseChange("white")}
                preview={<div className="size-5 rounded border bg-white" />}
                small
              />
              <BackgroundOption
                label="Pick"
                selected={ambientBase === "custom"}
                onClick={() => handleEyedropperClick("ambient")}
                icon={
                  ambientCustomColor ? (
                    <div
                      className="size-5 rounded border"
                      style={{ backgroundColor: ambientCustomColor }}
                    />
                  ) : (
                    <HugeiconsIcon
                      icon={ColorPickerIcon}
                      strokeWidth={1.5}
                      className="size-4 text-muted-foreground"
                    />
                  )
                }
                small
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">
                Blur Radius
              </Label>
              <span className="text-xs font-medium text-muted-foreground">
                {blurRadius}px
              </span>
            </div>
            <Slider
              value={[blurRadius]}
              onValueChange={(value) => {
                const v = Array.isArray(value) ? value[0] : value;
                onBlurRadiusChange(v);
              }}
              min={MIN_BLUR_RADIUS}
              max={MAX_BLUR_RADIUS}
              step={10}
            />
          </div>
        </div>
      )}

      {/* Color picker fallback modal */}
      {isPickingColor && pickerImageUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 max-h-[80vh] max-w-lg overflow-hidden rounded-xl bg-background p-4 shadow-xl">
            <div className="mb-3 space-y-1">
              <p className="font-medium">Pick a color</p>
              <p className="text-sm text-muted-foreground">
                Click anywhere on the image to select a color
              </p>
            </div>
            <img
              ref={imageRef}
              src={pickerImageUrl}
              alt="Pick color from this image"
              onClick={handleImageClick}
              className="max-h-[60vh] w-full cursor-crosshair rounded-lg object-contain"
            />
            <div className="mt-3 flex justify-end">
              <Button variant="outline" onClick={handleCancelPicker}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
