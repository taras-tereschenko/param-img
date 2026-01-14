import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle02Icon,
  ColorPickerIcon,
} from "@hugeicons/core-free-icons";
import type { AmbientBaseType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MAX_AMBIENT_BLUR_RADIUS, MIN_BLUR_RADIUS } from "@/lib/types";

interface AmbientPanelProps {
  ambientBase: AmbientBaseType;
  ambientCustomColor: string | null;
  blurRadius: number;
  onAmbientBaseChange: (base: AmbientBaseType) => void;
  onAmbientCustomColorChange: (color: string | null) => void;
  onBlurRadiusChange: (radius: number) => void;
  onBack: () => void;
}

const isEyeDropperSupported =
  typeof window !== "undefined" && "EyeDropper" in window;

export function AmbientPanel({
  ambientBase,
  ambientCustomColor,
  blurRadius,
  onAmbientBaseChange,
  onAmbientCustomColorChange,
  onBlurRadiusChange,
  onBack,
}: AmbientPanelProps) {
  const handleEyedropperClick = async () => {
    if (!isEyeDropperSupported) return;

    try {
      const eyeDropper = new (window as any).EyeDropper();
      const result = await eyeDropper.open();
      onAmbientCustomColorChange(result.sRGBHex);
      onAmbientBaseChange("custom");
    } catch {
      // User cancelled - do nothing
    }
  };

  const itemClassName =
    "relative !flex !h-auto !min-w-0 flex-1 flex-col items-center gap-1.5 rounded-lg border p-3 transition-colors border-muted bg-background text-foreground hover:border-muted-foreground/50 aria-pressed:!border-primary aria-pressed:!bg-primary/5 disabled:cursor-not-allowed disabled:border-muted disabled:bg-muted/50 disabled:text-muted-foreground/50";

  return (
    <div className="p-4">
      <div className="mb-3">
        <span className="font-medium">Ambient Mode</span>
      </div>

      <div className="space-y-4">
        {/* Base Color */}
        <div className="space-y-2">
          <Label className="text-xs">Base Color</Label>
          <ToggleGroup
            spacing={2}
            className="w-full"
            value={[ambientBase]}
            onValueChange={(newValue) => {
              const selected = newValue[newValue.length - 1] as AmbientBaseType;
              if (selected === "custom") {
                handleEyedropperClick();
              } else if (selected) {
                onAmbientBaseChange(selected);
              }
            }}
          >
            <ToggleGroupItem value="black" className={itemClassName}>
              <HugeiconsIcon
                icon={CheckmarkCircle02Icon}
                strokeWidth={1.5}
                className="absolute right-1.5 top-1.5 size-4 text-primary opacity-0 aria-pressed:opacity-100"
              />
              <div className="flex size-6 items-center justify-center rounded">
                <div className="size-5 rounded bg-black" />
              </div>
              <span className="text-xs font-medium">Black</span>
            </ToggleGroupItem>

            <ToggleGroupItem value="white" className={itemClassName}>
              <HugeiconsIcon
                icon={CheckmarkCircle02Icon}
                strokeWidth={1.5}
                className="absolute right-1.5 top-1.5 size-4 text-primary opacity-0 aria-pressed:opacity-100"
              />
              <div className="flex size-6 items-center justify-center rounded">
                <div className="size-5 rounded border bg-white" />
              </div>
              <span className="text-xs font-medium">White</span>
            </ToggleGroupItem>

            {isEyeDropperSupported ? (
              <ToggleGroupItem value="custom" className={itemClassName}>
                <HugeiconsIcon
                  icon={CheckmarkCircle02Icon}
                  strokeWidth={1.5}
                  className="absolute right-1.5 top-1.5 size-4 text-primary opacity-0 aria-pressed:opacity-100"
                />
                <div className="flex size-6 items-center justify-center rounded">
                  {ambientCustomColor ? (
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
                  )}
                </div>
                <span className="text-xs font-medium">Pick</span>
              </ToggleGroupItem>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild className="flex-1">
                  <span>
                    <ToggleGroupItem
                      value="custom"
                      disabled
                      className={itemClassName}
                    >
                      <div className="flex size-6 items-center justify-center rounded">
                        <HugeiconsIcon
                          icon={ColorPickerIcon}
                          strokeWidth={1.5}
                          className="size-4 text-muted-foreground"
                        />
                      </div>
                      <span className="text-xs font-medium">Pick</span>
                    </ToggleGroupItem>
                  </span>
                </TooltipTrigger>
                <TooltipContent>Color picker not supported in this browser</TooltipContent>
              </Tooltip>
            )}
          </ToggleGroup>
        </div>

        {/* Blur Radius */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Blur Radius</Label>
            <span className="text-xs text-muted-foreground">
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
            max={MAX_AMBIENT_BLUR_RADIUS}
            step={10}
          />
        </div>

        <Button onClick={onBack} className="w-full">
          Back
        </Button>
      </div>
    </div>
  );
}
