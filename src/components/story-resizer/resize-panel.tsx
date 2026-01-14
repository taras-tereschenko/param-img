import type { BorderRadiusOption } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { BORDER_RADIUS_OPTIONS, MAX_SCALE, MIN_SCALE } from "@/lib/types";

interface ResizePanelProps {
  scale: number;
  onScaleChange: (scale: number) => void;
  borderRadius: BorderRadiusOption;
  onBorderRadiusChange: (borderRadius: BorderRadiusOption) => void;
  onBack: () => void;
}

export function ResizePanel({
  scale,
  onScaleChange,
  borderRadius,
  onBorderRadiusChange,
  onBack,
}: ResizePanelProps) {
  return (
    <div className="p-4">
      <div className="mb-3">
        <span className="font-medium">Image Size</span>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Scale</Label>
            <span className="text-sm font-medium text-muted-foreground">
              {Math.round(scale * 100)}%
            </span>
          </div>
          <Slider
            value={[scale * 100]}
            onValueChange={(value) => {
              const v = Array.isArray(value) ? value[0] : value;
              onScaleChange(v / 100);
            }}
            min={MIN_SCALE * 100}
            max={MAX_SCALE * 100}
            step={5}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Smaller</span>
            <span>Larger</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Corner Radius</Label>
          <ToggleGroup
            type="single"
            value={borderRadius}
            onValueChange={(value) => {
              if (value) onBorderRadiusChange(value as BorderRadiusOption);
            }}
            className="w-full"
            variant="outline"
          >
            {BORDER_RADIUS_OPTIONS.map((option) => (
              <ToggleGroupItem
                key={option.value}
                value={option.value}
                className="h-10 flex-1"
              >
                {option.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <Button onClick={onBack} className="w-full">
          Back
        </Button>
      </div>
    </div>
  );
}
