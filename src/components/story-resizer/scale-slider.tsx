import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { MAX_SCALE, MIN_SCALE } from "@/lib/types";

interface ScaleSliderProps {
  scale: number;
  onScaleChange: (scale: number) => void;
}

export function ScaleSlider({ scale, onScaleChange }: ScaleSliderProps) {
  const percentage = Math.round(scale * 100);

  const handleValueChange = (value: number | ReadonlyArray<number>) => {
    const values = Array.isArray(value) ? value : [value];
    onScaleChange(values[0] / 100);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Image Scale</Label>
        <span className="text-sm font-medium text-muted-foreground">
          {percentage}%
        </span>
      </div>

      <Slider
        value={[percentage]}
        onValueChange={handleValueChange}
        min={MIN_SCALE * 100}
        max={MAX_SCALE * 100}
        step={1}
      />

      <p className="text-xs text-muted-foreground">
        Adjust how much of the frame the image fills
      </p>
    </div>
  );
}
