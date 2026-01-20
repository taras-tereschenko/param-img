import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface BlurSliderProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  label?: string;
  minLabel?: string;
  maxLabel?: string;
}

export function BlurSlider({
  value,
  onChange,
  min,
  max,
  step = 1,
  label = "Blur",
  minLabel = "Sharp",
  maxLabel = "Blurry",
}: BlurSliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs">{label}</Label>
        <span className="text-xs text-muted-foreground">{value}%</span>
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

// Keep the old export name for backwards compatibility during refactor
export { BlurSlider as BlurRadiusSlider };
