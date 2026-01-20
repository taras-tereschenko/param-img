import { BlurSlider, ColorToggleGroup, PanelLayout } from "./ui";
import type { AmbientBaseType } from "@/lib/types";
import { MAX_AMBIENT_BLUR_PERCENT, MIN_BLUR_PERCENT } from "@/lib/types";

interface AmbientPanelProps {
  ambientBase: AmbientBaseType;
  ambientCustomColor: string | null;
  blurPercent: number;
  onAmbientBaseChange: (base: AmbientBaseType) => void;
  onAmbientCustomColorChange: (color: string | null) => void;
  onBlurPercentChange: (percent: number) => void;
  onBack: () => void;
}

export function AmbientPanel({
  ambientBase,
  ambientCustomColor,
  blurPercent,
  onAmbientBaseChange,
  onAmbientCustomColorChange,
  onBlurPercentChange,
  onBack,
}: AmbientPanelProps) {
  return (
    <PanelLayout title="Ambient Mode" onBack={onBack}>
      <ColorToggleGroup
        value={ambientBase}
        customColor={ambientCustomColor}
        onValueChange={onAmbientBaseChange}
        onCustomColorPick={(color) => {
          onAmbientCustomColorChange(color);
          onAmbientBaseChange("custom");
        }}
        label="Base Color"
        previewSize="sm"
      />

      <BlurSlider
        value={blurPercent}
        onChange={onBlurPercentChange}
        min={MIN_BLUR_PERCENT}
        max={MAX_AMBIENT_BLUR_PERCENT}
        label="Glow Spread"
        minLabel="Subtle"
        maxLabel="Diffused"
      />
    </PanelLayout>
  );
}
