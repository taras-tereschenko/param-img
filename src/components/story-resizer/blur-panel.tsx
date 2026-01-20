import { BlurSlider, PanelLayout } from "./ui";
import { MAX_BLUR_PERCENT, MIN_BLUR_PERCENT } from "@/lib/types";

interface BlurPanelProps {
  blurPercent: number;
  onBlurPercentChange: (percent: number) => void;
  onBack: () => void;
}

export function BlurPanel({
  blurPercent,
  onBlurPercentChange,
  onBack,
}: BlurPanelProps) {
  return (
    <PanelLayout title="Blur Background" onBack={onBack}>
      <BlurSlider
        value={blurPercent}
        onChange={onBlurPercentChange}
        min={MIN_BLUR_PERCENT}
        max={MAX_BLUR_PERCENT}
        minLabel="Sharp"
        maxLabel="Blurry"
      />
    </PanelLayout>
  );
}
