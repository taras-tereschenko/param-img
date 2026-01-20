import { useEffect, useState } from "react";
import type { ProcessedImage } from "@/lib/types";
import type { StoredImage } from "@/lib/image-storage";
import { DEFAULT_SCALE } from "@/lib/types";
import { loadImages, saveImages } from "@/lib/image-storage";
import { hasSharedContent } from "@/lib/share-target";

/**
 * Load image dimensions from a data URL
 */
async function loadImageDimensions(
  dataUrl: string,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () =>
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = reject;
    img.src = dataUrl;
  });
}

interface UseImagePersistenceOptions {
  images: Array<ProcessedImage>;
  onImagesLoaded: (images: Array<ProcessedImage>) => void;
}

export function useImagePersistence({
  images,
  onImagesLoaded,
}: UseImagePersistenceOptions) {
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);

  // Load persisted images from IndexedDB on mount
  useEffect(() => {
    async function loadPersistedImages() {
      // Skip if we have shared content (those take priority)
      if (hasSharedContent()) {
        setIsInitialLoadComplete(true);
        return;
      }

      try {
        const storedImages = await loadImages();
        if (storedImages.length > 0) {
          const restoredImages = await Promise.all(
            storedImages.map(async (stored: StoredImage) => {
              const { width, height } = await loadImageDimensions(
                stored.originalDataUrl,
              );
              return {
                id: stored.id,
                originalFile: stored.originalFile,
                originalDataUrl: stored.originalDataUrl,
                processedDataUrl: null,
                backgroundColor: "blur",
                customColor: null,
                scale: DEFAULT_SCALE,
                status: "pending",
                naturalWidth: width,
                naturalHeight: height,
              } satisfies ProcessedImage;
            }),
          );
          onImagesLoaded(restoredImages);
        }
      } catch (error) {
        console.error("Error loading persisted images:", error);
      } finally {
        setIsInitialLoadComplete(true);
      }
    }

    loadPersistedImages();
  }, [onImagesLoaded]);

  // Save images to IndexedDB whenever they change (after initial load)
  useEffect(() => {
    if (!isInitialLoadComplete) return;

    const imagesToStore: Array<StoredImage> = images.map((img) => ({
      id: img.id,
      originalFile: img.originalFile,
      originalDataUrl: img.originalDataUrl,
    }));

    saveImages(imagesToStore);
  }, [images, isInitialLoadComplete]);

  return { isInitialLoadComplete };
}
