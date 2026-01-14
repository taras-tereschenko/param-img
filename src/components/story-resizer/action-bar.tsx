import { HugeiconsIcon } from "@hugeicons/react";
import {
  BlurIcon,
  PaintBucketIcon,
  Resize01Icon,
  SunglassesIcon,
} from "@hugeicons/core-free-icons";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface ActionBarProps {
  disabled: boolean;
  activeAction: "blur" | "ambient" | "color" | "resize" | null;
  onActionClick: (action: "blur" | "ambient" | "color" | "resize") => void;
}

const ACTION_OPTIONS = [
  { value: "blur" as const, label: "Blur", icon: BlurIcon },
  { value: "ambient" as const, label: "Ambient", icon: SunglassesIcon },
  { value: "color" as const, label: "Color", icon: PaintBucketIcon },
  { value: "resize" as const, label: "Resize", icon: Resize01Icon },
];

export function ActionBar({
  disabled,
  activeAction,
  onActionClick,
}: ActionBarProps) {
  return (
    <div className="p-4">
      <ToggleGroup
        spacing={2}
        className="w-full"
        disabled={disabled}
        value={activeAction ? [activeAction] : []}
      >
        {ACTION_OPTIONS.map((option) => (
          <ToggleGroupItem
            key={option.value}
            value={option.value}
            onClick={() => onActionClick(option.value)}
            className="!flex !h-auto !min-w-0 flex-1 flex-col items-center justify-center gap-1.5 rounded-xl border p-3 transition-colors border-border bg-background text-foreground hover:border-primary/50 hover:bg-muted aria-pressed:!border-primary aria-pressed:!bg-primary/10 aria-pressed:!text-primary disabled:cursor-not-allowed disabled:border-muted disabled:bg-muted/50 disabled:text-muted-foreground/50"
          >
            <HugeiconsIcon icon={option.icon} strokeWidth={1.5} className="size-6" />
            <span className="text-xs font-medium">{option.label}</span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
