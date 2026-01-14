import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle02Icon,
  ColorPickerIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ColorPanelProps {
  selectedColor: "black" | "white" | "custom";
  customColor: string | null;
  onColorSelect: (color: "black" | "white" | "custom") => void;
  onCustomColorChange: (color: string) => void;
  onBack: () => void;
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

  const itemClassName =
    "relative !flex !h-auto !min-w-0 flex-1 flex-col items-center gap-1.5 rounded-lg border p-3 transition-colors border-muted bg-background text-foreground hover:border-muted-foreground/50 aria-pressed:!border-primary aria-pressed:!bg-primary/5 disabled:cursor-not-allowed disabled:border-muted disabled:bg-muted/50 disabled:text-muted-foreground/50";

  return (
    <div className="p-4">
      <div className="mb-3">
        <span className="font-medium">Solid Color</span>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs">Background Color</Label>
          <ToggleGroup
            spacing={2}
            className="w-full"
            value={[selectedColor]}
            onValueChange={(newValue) => {
              const selected = newValue[newValue.length - 1] as typeof selectedColor;
              if (selected === "custom") {
                handleEyedropperClick();
              } else if (selected) {
                onColorSelect(selected);
              }
            }}
          >
            <ToggleGroupItem value="black" className={itemClassName}>
              <HugeiconsIcon
                icon={CheckmarkCircle02Icon}
                strokeWidth={1.5}
                className="absolute right-1.5 top-1.5 size-4 text-primary opacity-0 aria-pressed:opacity-100"
              />
              <div className="flex size-8 items-center justify-center rounded-md">
                <div className="size-6 rounded-md bg-black" />
              </div>
              <span className="text-xs font-medium">Black</span>
            </ToggleGroupItem>

            <ToggleGroupItem value="white" className={itemClassName}>
              <HugeiconsIcon
                icon={CheckmarkCircle02Icon}
                strokeWidth={1.5}
                className="absolute right-1.5 top-1.5 size-4 text-primary opacity-0 aria-pressed:opacity-100"
              />
              <div className="flex size-8 items-center justify-center rounded-md">
                <div className="size-6 rounded-md border bg-white" />
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
                <div className="flex size-8 items-center justify-center rounded-md">
                  {customColor ? (
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
                      <div className="flex size-8 items-center justify-center rounded-md">
                        <HugeiconsIcon
                          icon={ColorPickerIcon}
                          strokeWidth={1.5}
                          className="size-5 text-muted-foreground"
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

        <Button onClick={onBack} className="w-full">
          Back
        </Button>
      </div>
    </div>
  );
}
