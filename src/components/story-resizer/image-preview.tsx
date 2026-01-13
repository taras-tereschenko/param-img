import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete02Icon, Loading01Icon } from "@hugeicons/core-free-icons";
import type {
  AmbientBaseType,
  BackgroundType,
  ProcessedImage,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { processImageForStory } from "@/lib/canvas-utils";

interface ImagePreviewProps {
  image: ProcessedImage;
  background: BackgroundType;
  customColor: string | null;
  ambientBase: AmbientBaseType;
  ambientCustomColor: string | null;
  blurRadius: number;
  scale: number;
  onRemove: (id: string) => void;
}

export function ImagePreview({
  image,
  background,
  customColor,
  ambientBase,
  ambientCustomColor,
  blurRadius,
  scale,
  onRemove,
}: ImagePreviewProps) {
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function process() {
      setIsProcessing(true);
      try {
        const result = await processImageForStory(
          image.originalDataUrl,
          background,
          customColor,
          scale,
          ambientBase,
          ambientCustomColor,
          blurRadius,
        );
        if (!cancelled) {
          setProcessedUrl(result);
        }
      } catch (error) {
        console.error("Failed to process image:", error);
      } finally {
        if (!cancelled) {
          setIsProcessing(false);
        }
      }
    }

    process();

    return () => {
      cancelled = true;
    };
  }, [
    image.originalDataUrl,
    background,
    customColor,
    ambientBase,
    ambientCustomColor,
    blurRadius,
    scale,
  ]);

  return (
    <div className="group relative overflow-hidden rounded-lg border bg-muted">
      <div className="aspect-[9/16] relative">
        {isProcessing && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
            <HugeiconsIcon
              icon={Loading01Icon}
              strokeWidth={2}
              className="size-6 animate-spin text-muted-foreground"
            />
          </div>
        )}
        {processedUrl && (
          <img
            src={processedUrl}
            alt={`Preview of ${image.originalFile.name}`}
            className="absolute inset-0 h-full w-full object-contain"
          />
        )}
      </div>

      <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-black/60 to-transparent p-2 pt-8">
        <span className="flex-1 truncate text-xs text-white">
          {image.originalFile.name}
        </span>
        <Button
          size="icon-xs"
          variant="ghost"
          className="shrink-0 text-white hover:bg-white/20 hover:text-white"
          onClick={() => onRemove(image.id)}
        >
          <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
          <span className="sr-only">Remove image</span>
        </Button>
      </div>
    </div>
  );
}
