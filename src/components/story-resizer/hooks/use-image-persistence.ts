import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { ProcessedImage } from "@/lib/types";
import type { StoredImage } from "@/lib/image-storage";
import { loadImages, saveImages } from "@/lib/image-storage";
import { loadImageDimensions } from "@/lib/image-utils";
import { hasSharedContent } from "@/lib/share-target";

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
                naturalWidth: width,
                naturalHeight: height,
              } satisfies ProcessedImage;
            }),
          );
          onImagesLoaded(restoredImages);
        }
      } catch (error) {
        console.error("Error loading persisted images:", error);
        toast.error("Failed to restore images", {
          description: "Could not load previously saved images",
        });
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
