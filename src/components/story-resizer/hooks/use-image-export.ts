import { useCallback, useState } from "react";
import { toast } from "sonner";
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
  activeBlurPercent: number;
  borderRadius: BorderRadiusOption;
}

// File System Access API types (not yet in lib.dom.d.ts)
interface FilePickerAcceptType {
  description?: string;
  accept: Record<string, Array<string>>;
}

interface SaveFilePickerOptions {
  suggestedName?: string;
  types?: Array<FilePickerAcceptType>;
}

// Augment Window with File System Access API
declare global {
  interface Window {
    showSaveFilePicker?: (
      options?: SaveFilePickerOptions,
    ) => Promise<FileSystemFileHandle>;
  }
}

// Helper to check if File System Access API is available
// Exclude mobile even if API exists (unreliable on mobile)
function supportsFileSystemAccess(): boolean {
  return (
    typeof window.showSaveFilePicker === "function" &&
    !("ontouchstart" in window)
  );
}

// Download using File System Access API (true completion detection)
async function downloadWithFileSystem(
  blob: Blob,
  filename: string,
): Promise<void> {
  const handle = await window.showSaveFilePicker!({
    suggestedName: filename,
    types: [{ description: "PNG Image", accept: { "image/png": [".png"] } }],
  });
  const writable = await handle.createWritable();
  await writable.write(blob);
  await writable.close();
}

// Fallback download with Blob URL (better than data URLs on mobile)
function downloadWithBlobUrl(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
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
        params.activeBlurPercent,
        params.borderRadius,
      );
    },
    [params],
  );

  const handleDownload = useCallback(async () => {
    if (images.length === 0) return;

    setIsDownloading(true);
    setDownloadProgress(0);

    const useFileSystemAPI = supportsFileSystemAccess();

    try {
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const processedUrl = await processImage(image);

        // Convert data URL to blob
        const response = await fetch(processedUrl);
        const blob = await response.blob();
        const filename = createStoryFilename(image.originalFile.name);

        if (useFileSystemAPI) {
          // True completion detection - no delay needed
          await downloadWithFileSystem(blob, filename);
        } else {
          // Fallback: Blob URL + generous delay for mobile
          downloadWithBlobUrl(blob, filename);
          if (i < images.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }

        setDownloadProgress(((i + 1) / images.length) * 100);
      }
    } catch (error) {
      // User cancelled file picker or other error
      if (error instanceof Error && error.name !== "AbortError") {
        console.error("Failed to download images:", error);
        toast.error("Failed to download images", {
          description: "An error occurred while saving files",
        });
      }
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  }, [images, processImage]);

  const handleDownloadImage = useCallback(
    async (image: ProcessedImage) => {
      try {
        const processedUrl = await processImage(image);
        const response = await fetch(processedUrl);
        const blob = await response.blob();
        const filename = createStoryFilename(image.originalFile.name);

        if (supportsFileSystemAccess()) {
          await downloadWithFileSystem(blob, filename);
        } else {
          downloadWithBlobUrl(blob, filename);
        }
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("Failed to download image:", error);
          toast.error("Failed to download image", {
            description: "An error occurred while saving the file",
          });
        }
      }
    },
    [processImage],
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
        const file = new File([blob], filename, { type: "image/png" });
        files.push(file);
      }

      const canShareFiles =
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files });
      if (canShareFiles) {
        await navigator.share({ files });
      } else {
        console.warn("File sharing not supported");
        toast.error("Sharing not supported", {
          description: "Your browser doesn't support sharing files",
        });
      }
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        console.error("Failed to share images:", error);
        toast.error("Failed to share images", {
          description: "An error occurred while sharing",
        });
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
