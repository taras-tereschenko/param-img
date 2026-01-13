import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { MIN_SCALE, MAX_SCALE } from "@/lib/types";

interface ResizePanelProps {
  scale: number;
  onScaleChange: (scale: number) => void;
  onBack: () => void;
}

export function ResizePanel({ scale, onScaleChange, onBack }: ResizePanelProps) {
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

        <Button onClick={onBack} className="w-full">
          Back
        </Button>
      </div>
    </div>
  );
}
