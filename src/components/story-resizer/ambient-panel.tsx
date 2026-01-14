import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle02Icon,
  ColorPickerIcon,
} from "@hugeicons/core-free-icons";
import type { AmbientBaseType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MAX_AMBIENT_BLUR_RADIUS, MIN_BLUR_RADIUS } from "@/lib/types";
import { cn } from "@/lib/utils";

interface AmbientPanelProps {
  ambientBase: AmbientBaseType;
  ambientCustomColor: string | null;
  blurRadius: number;
  onAmbientBaseChange: (base: AmbientBaseType) => void;
  onAmbientCustomColorChange: (color: string | null) => void;
  onBlurRadiusChange: (radius: number) => void;
  onBack: () => void;
}

interface BaseColorOptionProps {
  label: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
  disabledReason?: string;
  preview?: React.ReactNode;
  icon?: React.ReactNode;
}

function BaseColorOption({
  label,
  selected,
  onClick,
  disabled,
  disabledReason,
  preview,
  icon,
}: BaseColorOptionProps) {
  const button = (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative flex flex-1 flex-col items-center gap-1.5 rounded-lg border-2 p-3 transition-colors",
        disabled
          ? "cursor-not-allowed border-muted bg-muted/50 text-muted-foreground/50"
          : selected
            ? "border-primary bg-primary/5"
            : "border-muted hover:border-muted-foreground/50",
      )}
    >
      {selected && !disabled && (
        <HugeiconsIcon
          icon={CheckmarkCircle02Icon}
          strokeWidth={2}
          className="absolute right-1.5 top-1.5 size-4 text-primary"
        />
      )}
      <div className="flex size-6 items-center justify-center rounded">
        {preview || icon}
      </div>
      <span className="text-xs font-medium">{label}</span>
    </button>
  );

  if (disabled && disabledReason) {
    return (
      <Tooltip>
        <TooltipTrigger asChild className="flex-1">
          <span>{button}</span>
        </TooltipTrigger>
        <TooltipContent>{disabledReason}</TooltipContent>
      </Tooltip>
    );
  }

  return button;
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

  return (
    <div className="p-4">
      <div className="mb-3">
        <span className="font-medium">Ambient Mode</span>
      </div>

      <div className="space-y-4">
        {/* Base Color */}
        <div className="space-y-2">
          <Label className="text-xs">Base Color</Label>
          <div className="flex gap-2">
            <BaseColorOption
              label="Black"
              selected={ambientBase === "black"}
              onClick={() => onAmbientBaseChange("black")}
              preview={<div className="size-5 rounded bg-black" />}
            />
            <BaseColorOption
              label="White"
              selected={ambientBase === "white"}
              onClick={() => onAmbientBaseChange("white")}
              preview={<div className="size-5 rounded border bg-white" />}
            />
            <BaseColorOption
              label="Pick"
              selected={ambientBase === "custom"}
              onClick={handleEyedropperClick}
              disabled={!isEyeDropperSupported}
              disabledReason="Color picker not supported in this browser"
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
            />
          </div>
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
