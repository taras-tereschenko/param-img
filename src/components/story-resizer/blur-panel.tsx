import { BlurRadiusSlider, PanelLayout } from "./ui";
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
    <PanelLayout title="Blur Background" onBack={onBack}>
      <BlurRadiusSlider
        value={blurRadius}
        onChange={onBlurRadiusChange}
        min={MIN_BLUR_RADIUS}
        max={MAX_BLUR_RADIUS}
        minLabel="Sharp"
        maxLabel="Blurry"
      />
    </PanelLayout>
  );
}
