import { useEffect } from "react";
import { prepareProcessedImages } from "./use-image-setup";
import type { ProcessedImage } from "@/lib/types";
import {
  clearSharedParam,
  getSharedFiles,
  hasSharedContent,
} from "@/lib/share-target";

interface UseSharedFilesOptions {
  onFilesReceived: (images: Array<ProcessedImage>) => void;
  onShowInstallPrompt?: () => void;
}

export function useSharedFiles({
  onFilesReceived,
  onShowInstallPrompt,
}: UseSharedFilesOptions) {
  useEffect(() => {
    async function loadSharedFiles() {
      if (!hasSharedContent()) return;

      try {
        const files = await getSharedFiles();
        if (files.length > 0) {
          const newImages = await prepareProcessedImages(files);
          onFilesReceived(newImages);
          onShowInstallPrompt?.();
        }
      } catch (error) {
        console.error("Error loading shared files:", error);
      } finally {
        clearSharedParam();
      }
    }

    loadSharedFiles();
  }, [onFilesReceived, onShowInstallPrompt]);
}
