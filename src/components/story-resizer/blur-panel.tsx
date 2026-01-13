import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { MAX_BLUR_RADIUS, MIN_BLUR_RADIUS } from "@/lib/types";

interface BlurPanelProps {
  blurRadius: number;
  onBlurRadiusChange: (radius: number) => void;
  onBack: () => void;
}

export function BlurPanel({
  blurRadius,
  onBlurRadiusChange,
  onBack,
}: BlurPanelProps) {
  return (
    <div className="p-4">
      <div className="mb-3">
        <span className="font-medium">Blur Background</span>
      </div>

      <div className="space-y-4">
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
            max={MAX_BLUR_RADIUS}
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
