import { PanelLayout } from "./ui";
import type { BorderRadiusOption } from "@/lib/types";
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
    <PanelLayout title="Image Size" onBack={onBack}>
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
          value={String(borderRadius)}
          onValueChange={(value) => {
            const option = BORDER_RADIUS_OPTIONS.find(
              (opt) => String(opt.value) === value,
            );
            if (option) {
              onBorderRadiusChange(option.value);
            }
          }}
          className="w-full"
          variant="outline"
        >
          {BORDER_RADIUS_OPTIONS.map((option) => (
            <ToggleGroupItem
              key={option.value}
              value={String(option.value)}
              className="h-10 flex-1"
            >
              {option.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
    </PanelLayout>
  );
}
