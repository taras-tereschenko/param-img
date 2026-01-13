import { HugeiconsIcon } from "@hugeicons/react";
import {
  BlurIcon,
  PaintBucketIcon,
  Resize01Icon,
  SunglassesIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

interface ActionBarProps {
  disabled: boolean;
  activeAction: "blur" | "ambient" | "color" | "resize" | null;
  onActionClick: (action: "blur" | "ambient" | "color" | "resize") => void;
}

interface ActionButtonProps {
  icon: typeof BlurIcon;
  label: string;
  disabled: boolean;
  active: boolean;
  onClick: () => void;
}

function ActionButton({
  icon,
  label,
  disabled,
  active,
  onClick,
}: ActionButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-1.5 rounded-xl p-3 transition-all",
        "border-2",
        disabled
          ? "cursor-not-allowed border-muted bg-muted/50 text-muted-foreground/50"
          : active
            ? "border-primary bg-primary/10 text-primary"
            : "border-border bg-background text-foreground hover:border-primary/50 hover:bg-muted",
      )}
    >
      <HugeiconsIcon icon={icon} strokeWidth={1.5} className="size-6" />
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}

export function ActionBar({
  disabled,
  activeAction,
  onActionClick,
}: ActionBarProps) {
  return (
    <div className="grid grid-cols-4 gap-2 p-4">
      <ActionButton
        icon={BlurIcon}
        label="Blur"
        disabled={disabled}
        active={activeAction === "blur"}
        onClick={() => onActionClick("blur")}
      />
      <ActionButton
        icon={SunglassesIcon}
        label="Ambient"
        disabled={disabled}
        active={activeAction === "ambient"}
        onClick={() => onActionClick("ambient")}
      />
      <ActionButton
        icon={PaintBucketIcon}
        label="Color"
        disabled={disabled}
        active={activeAction === "color"}
        onClick={() => onActionClick("color")}
      />
      <ActionButton
        icon={Resize01Icon}
        label="Resize"
        disabled={disabled}
        active={activeAction === "resize"}
        onClick={() => onActionClick("resize")}
      />
    </div>
  );
}
