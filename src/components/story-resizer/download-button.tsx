import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DownloadIcon,
  Delete02Icon,
  Loading01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { type ProcessedImage, type BackgroundType, type AmbientBaseType } from "@/lib/types";
import { processImageForStory } from "@/lib/canvas-utils";
import { createStoryFilename } from "@/lib/image-utils";

interface DownloadButtonProps {
  images: ProcessedImage[];
  background: BackgroundType;
  customColor: string | null;
  ambientBase: AmbientBaseType;
  ambientCustomColor: string | null;
  blurRadius: number;
  scale: number;
  onClearAll: () => void;
}

function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function DownloadButton({
  images,
  background,
  customColor,
  ambientBase,
  ambientCustomColor,
  blurRadius,
  scale,
  onClearAll,
}: DownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleDownloadAll = async () => {
    if (images.length === 0) return;

    setIsDownloading(true);
    setProgress(0);

    try {
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const processedUrl = await processImageForStory(
          image.originalDataUrl,
          background,
          customColor,
          scale,
          ambientBase,
          ambientCustomColor,
          blurRadius
        );

        const filename = createStoryFilename(image.originalFile.name);
        downloadDataUrl(processedUrl, filename);

        setProgress(((i + 1) / images.length) * 100);

        // Small delay between downloads to prevent browser blocking
        if (i < images.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      }
    } catch (error) {
      console.error("Failed to download images:", error);
    } finally {
      setIsDownloading(false);
      setProgress(0);
    }
  };

  const imageCount = images.length;
  const buttonText = isDownloading
    ? `Downloading... ${Math.round(progress)}%`
    : imageCount === 1
      ? "Download Image"
      : `Download All (${imageCount})`;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        onClick={handleDownloadAll}
        disabled={isDownloading || images.length === 0}
        className="flex-1 sm:flex-none"
      >
        <HugeiconsIcon
          icon={isDownloading ? Loading01Icon : DownloadIcon}
          strokeWidth={2}
          data-icon="inline-start"
          className={isDownloading ? "animate-spin" : undefined}
        />
        {buttonText}
      </Button>

      <Button
        variant="outline"
        onClick={onClearAll}
        disabled={isDownloading || images.length === 0}
      >
        <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} data-icon="inline-start" />
        Clear All
      </Button>
    </div>
  );
}
