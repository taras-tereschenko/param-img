import { toast } from "sonner";
import type { ProcessedImage } from "@/lib/types";
import {
  fileToDataUrl,
  generateImageId,
  loadImageDimensions,
  prepareImage,
} from "@/lib/image-utils";
import { saveImageImmediately } from "@/lib/image-storage";

/**
 * Prepare files into ProcessedImage objects ready for the carousel
 * Also saves each image to IndexedDB immediately to ensure zero-transfer
 * optimization works (worker reads from IndexedDB instead of receiving data URL)
 * Uses Promise.allSettled for partial success - if some files fail, others still process
 */
export async function prepareProcessedImages(
  files: Array<File>,
): Promise<Array<ProcessedImage>> {
  const results = await Promise.allSettled(
    files.map(async (file) => {
      const dataUrl = await fileToDataUrl(file);
      const preparedDataUrl = await prepareImage(dataUrl);
      const id = generateImageId();

      // Load image dimensions
      const { width, height } = await loadImageDimensions(preparedDataUrl);

      // Save to IndexedDB BEFORE returning, so worker can read it
      await saveImageImmediately({
        id,
        originalFile: file,
        originalDataUrl: preparedDataUrl,
      });

      return {
        id,
        originalFile: file,
        originalDataUrl: preparedDataUrl,
        naturalWidth: width,
        naturalHeight: height,
      } satisfies ProcessedImage;
    }),
  );

  // Filter successful results
  const successful = results
    .filter(
      (r): r is PromiseFulfilledResult<ProcessedImage> =>
        r.status === "fulfilled",
    )
    .map((r) => r.value);

  // Report failures to user
  const failed = results.filter((r) => r.status === "rejected");
  if (failed.length > 0) {
    console.warn(`${failed.length} image(s) failed to process`);
    toast.error(`${failed.length} image(s) failed to load`, {
      description: "Some files could not be processed",
    });
  }

  return successful;
}
