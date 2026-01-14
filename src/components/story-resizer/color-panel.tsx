import { ColorToggleGroup, PanelLayout } from "./ui";

interface ColorPanelProps {
  selectedColor: "black" | "white" | "custom";
  customColor: string | null;
  onColorSelect: (color: "black" | "white" | "custom") => void;
  onCustomColorChange: (color: string) => void;
  onBack: () => void;
}

export function ColorPanel({
  selectedColor,
  customColor,
  onColorSelect,
  onCustomColorChange,
  onBack,
}: ColorPanelProps) {
  return (
    <PanelLayout title="Solid Color" onBack={onBack}>
      <ColorToggleGroup
        value={selectedColor}
        customColor={customColor}
        onValueChange={onColorSelect}
        onCustomColorPick={(color) => {
          onCustomColorChange(color);
          onColorSelect("custom");
        }}
        label="Background Color"
        previewSize="md"
      />
    </PanelLayout>
  );
}
