import { useCallback, useState } from "react";
import type {
  AmbientBaseType,
  BackgroundType,
  BorderRadiusOption,
  ProcessedImage,
} from "@/lib/types";
import { processImageForStory } from "@/lib/canvas-utils";
import { createStoryFilename } from "@/lib/image-utils";

interface ProcessingParams {
  background: BackgroundType;
  customColor: string | null;
  scale: number;
  ambientBase: AmbientBaseType;
  ambientCustomColor: string | null;
  activeBlurRadius: number;
  borderRadius: BorderRadiusOption;
}

function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function useImageExport(
  images: Array<ProcessedImage>,
  params: ProcessingParams,
) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isSharing, setIsSharing] = useState(false);

  const canShare = typeof navigator !== "undefined" && !!navigator.share;

  const processImage = useCallback(
    async (image: ProcessedImage) => {
      return processImageForStory(
        image.originalDataUrl,
        params.background,
        params.customColor,
        params.scale,
        params.ambientBase,
        params.ambientCustomColor,
        params.activeBlurRadius,
        params.borderRadius,
      );
    },
    [params],
  );

  const handleDownload = useCallback(async () => {
    if (images.length === 0) return;

    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const processedUrl = await processImage(image);
        const filename = createStoryFilename(image.originalFile.name);
        downloadDataUrl(processedUrl, filename);

        setDownloadProgress(((i + 1) / images.length) * 100);

        if (i < images.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      }
    } catch (error) {
      console.error("Failed to download images:", error);
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  }, [images, processImage]);

  const handleDownloadImage = useCallback(
    (processedUrl: string, originalFilename: string) => {
      const filename = createStoryFilename(originalFilename);
      downloadDataUrl(processedUrl, filename);
    },
    [],
  );

  const handleShare = useCallback(async () => {
    if (images.length === 0 || !canShare) return;

    setIsSharing(true);

    try {
      const files: Array<File> = [];
      for (const image of images) {
        const processedUrl = await processImage(image);
        const response = await fetch(processedUrl);
        const blob = await response.blob();
        const filename = createStoryFilename(image.originalFile.name);
        const file = new File([blob], filename, { type: "image/jpeg" });
        files.push(file);
      }

      const canShareFiles =
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files });
      if (canShareFiles) {
        await navigator.share({ files });
      } else {
        console.warn("File sharing not supported");
      }
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        console.error("Failed to share images:", error);
      }
    } finally {
      setIsSharing(false);
    }
  }, [images, canShare, processImage]);

  return {
    isDownloading,
    downloadProgress,
    isSharing,
    canShare,
    handleDownload,
    handleDownloadImage,
    handleShare,
  };
}
