import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface BlurRadiusSliderProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  label?: string;
  minLabel?: string;
  maxLabel?: string;
}

export function BlurRadiusSlider({
  value,
  onChange,
  min,
  max,
  step = 10,
  label = "Blur Radius",
  minLabel = "Sharp",
  maxLabel = "Blurry",
}: BlurRadiusSliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs">{label}</Label>
        <span className="text-xs text-muted-foreground">{value}px</span>
      </div>
      <Slider
        value={[value]}
        onValueChange={(val) => {
          const v = Array.isArray(val) ? val[0] : val;
          onChange(v);
        }}
        min={min}
        max={max}
        step={step}
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
}
