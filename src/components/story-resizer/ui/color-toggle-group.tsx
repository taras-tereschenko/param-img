import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle02Icon,
  ColorPickerIcon,
} from "@hugeicons/core-free-icons";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// EyeDropper API type declaration (not yet in standard TypeScript lib)
declare global {
  interface EyeDropper {
    open: () => Promise<{ sRGBHex: string }>;
  }
  interface EyeDropperConstructor {
    new (): EyeDropper;
  }
  interface Window {
    EyeDropper?: EyeDropperConstructor;
  }
}

type ColorValue = "black" | "white" | "custom";

const COLOR_VALUES: ReadonlySet<string> = new Set<ColorValue>([
  "black",
  "white",
  "custom",
]);

function isColorValue(value: string): value is ColorValue {
  return COLOR_VALUES.has(value);
}

interface ColorToggleGroupProps {
  value: ColorValue;
  customColor: string | null;
  onValueChange: (value: ColorValue) => void;
  onCustomColorPick: (color: string) => void;
  label: string;
  previewSize?: "sm" | "md";
}

const isEyeDropperSupported =
  typeof window !== "undefined" && "EyeDropper" in window;

export function ColorToggleGroup({
  value,
  customColor,
  onValueChange,
  onCustomColorPick,
  label,
  previewSize = "md",
}: ColorToggleGroupProps) {
  const handleEyedropperClick = async () => {
    if (!isEyeDropperSupported || !window.EyeDropper) return;

    try {
      const eyeDropper = new window.EyeDropper();
      const result = await eyeDropper.open();
      onCustomColorPick(result.sRGBHex);
      onValueChange("custom");
    } catch {
      // User cancelled - do nothing
    }
  };

  const handleToggleChange = (newValue: Array<string>) => {
    const lastValue = newValue[newValue.length - 1];
    if (!lastValue) return;

    if (lastValue === "custom") {
      handleEyedropperClick();
    } else if (isColorValue(lastValue)) {
      onValueChange(lastValue);
    }
  };

  const itemClassName =
    "relative !flex !h-auto !min-w-0 flex-1 flex-col items-center gap-1.5 rounded-lg border p-3 transition-colors border-muted bg-background text-foreground hover:border-muted-foreground/50 aria-pressed:!border-primary aria-pressed:!bg-primary/5 disabled:cursor-not-allowed disabled:border-muted disabled:bg-muted/50 disabled:text-muted-foreground/50";

  const sizeClasses = previewSize === "sm" ? "size-5" : "size-6";
  const containerClasses =
    previewSize === "sm"
      ? "flex size-6 items-center justify-center rounded"
      : "flex size-8 items-center justify-center rounded-md";
  const iconClasses =
    previewSize === "sm"
      ? "size-4 text-muted-foreground"
      : "size-5 text-muted-foreground";

  return (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>
      <ToggleGroup
        spacing={2}
        className="w-full"
        value={[value]}
        onValueChange={handleToggleChange}
      >
        <ToggleGroupItem value="black" className={itemClassName}>
          <HugeiconsIcon
            icon={CheckmarkCircle02Icon}
            strokeWidth={1.5}
            className="absolute right-1.5 top-1.5 size-4 text-primary opacity-0 aria-pressed:opacity-100"
          />
          <div className={containerClasses}>
            <div className={`${sizeClasses} rounded bg-black`} />
          </div>
          <span className="text-xs font-medium">Black</span>
        </ToggleGroupItem>

        <ToggleGroupItem value="white" className={itemClassName}>
          <HugeiconsIcon
            icon={CheckmarkCircle02Icon}
            strokeWidth={1.5}
            className="absolute right-1.5 top-1.5 size-4 text-primary opacity-0 aria-pressed:opacity-100"
          />
          <div className={containerClasses}>
            <div className={`${sizeClasses} rounded border bg-white`} />
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
            <div className={containerClasses}>
              {customColor ? (
                <div
                  className={`${sizeClasses} rounded border`}
                  style={{ backgroundColor: customColor }}
                />
              ) : (
                <HugeiconsIcon
                  icon={ColorPickerIcon}
                  strokeWidth={1.5}
                  className={iconClasses}
                />
              )}
            </div>
            <span className="text-xs font-medium">Pick</span>
          </ToggleGroupItem>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex flex-1">
                <ToggleGroupItem
                  value="custom"
                  disabled
                  className={cn(itemClassName, "w-full")}
                >
                  <div className={containerClasses}>
                    <HugeiconsIcon
                      icon={ColorPickerIcon}
                      strokeWidth={1.5}
                      className={iconClasses}
                    />
                  </div>
                  <span className="text-xs font-medium">Pick</span>
                </ToggleGroupItem>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              Color picker not supported in this browser
            </TooltipContent>
          </Tooltip>
        )}
      </ToggleGroup>
    </div>
  );
}
