import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle02Icon,
  ColorPickerIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ColorPanelProps {
  selectedColor: "black" | "white" | "custom";
  customColor: string | null;
  onColorSelect: (color: "black" | "white" | "custom") => void;
  onCustomColorChange: (color: string) => void;
  onBack: () => void;
}

interface ColorOptionProps {
  label: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
  disabledReason?: string;
  preview?: React.ReactNode;
  icon?: React.ReactNode;
}

function ColorOption({
  label,
  selected,
  onClick,
  disabled,
  disabledReason,
  preview,
  icon,
}: ColorOptionProps) {
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
      <div className="flex size-8 items-center justify-center rounded-md">
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

export function ColorPanel({
  selectedColor,
  customColor,
  onColorSelect,
  onCustomColorChange,
  onBack,
}: ColorPanelProps) {
  const handleEyedropperClick = async () => {
    if (!isEyeDropperSupported) return;

    try {
      const eyeDropper = new (window as any).EyeDropper();
      const result = await eyeDropper.open();
      onCustomColorChange(result.sRGBHex);
      onColorSelect("custom");
    } catch {
      // User cancelled - do nothing
    }
  };

  return (
    <div className="p-4">
      <div className="mb-3">
        <span className="font-medium">Solid Color</span>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs">Background Color</Label>
          <div className="flex gap-2">
            <ColorOption
              label="Black"
              selected={selectedColor === "black"}
              onClick={() => onColorSelect("black")}
              preview={<div className="size-6 rounded-md bg-black" />}
            />
            <ColorOption
              label="White"
              selected={selectedColor === "white"}
              onClick={() => onColorSelect("white")}
              preview={<div className="size-6 rounded-md border bg-white" />}
            />
            <ColorOption
              label="Pick"
              selected={selectedColor === "custom"}
              onClick={handleEyedropperClick}
              disabled={!isEyeDropperSupported}
              disabledReason="Color picker not supported in this browser"
              icon={
                customColor ? (
                  <div
                    className="size-6 rounded-md border"
                    style={{ backgroundColor: customColor }}
                  />
                ) : (
                  <HugeiconsIcon
                    icon={ColorPickerIcon}
                    strokeWidth={1.5}
                    className="size-5 text-muted-foreground"
                  />
                )
              }
            />
          </div>
        </div>

        <Button onClick={onBack} className="w-full">
          Back
        </Button>
      </div>
    </div>
  );
}
