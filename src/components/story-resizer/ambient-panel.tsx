import { BlurRadiusSlider, ColorToggleGroup, PanelLayout } from "./ui";
import type { AmbientBaseType } from "@/lib/types";
import { MAX_AMBIENT_BLUR_RADIUS, MIN_BLUR_RADIUS } from "@/lib/types";

interface AmbientPanelProps {
  ambientBase: AmbientBaseType;
  ambientCustomColor: string | null;
  blurRadius: number;
  onAmbientBaseChange: (base: AmbientBaseType) => void;
  onAmbientCustomColorChange: (color: string | null) => void;
  onBlurRadiusChange: (radius: number) => void;
  onBack: () => void;
}

export function AmbientPanel({
  ambientBase,
  ambientCustomColor,
  blurRadius,
  onAmbientBaseChange,
  onAmbientCustomColorChange,
  onBlurRadiusChange,
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

      <BlurRadiusSlider
        value={blurRadius}
        onChange={onBlurRadiusChange}
        min={MIN_BLUR_RADIUS}
        max={MAX_AMBIENT_BLUR_RADIUS}
        label="Glow Spread"
        minLabel="Subtle"
        maxLabel="Diffused"
      />
    </PanelLayout>
  );
}
