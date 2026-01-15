import type { ProcessedImage } from "@/lib/types";
import { DEFAULT_SCALE } from "@/lib/types";
import {
  fileToDataUrl,
  generateImageId,
  prepareImage,
} from "@/lib/image-utils";
import { saveImageImmediately } from "@/lib/image-storage";

/**
 * Prepare files into ProcessedImage objects ready for the carousel
 * Also saves each image to IndexedDB immediately to ensure zero-transfer
 * optimization works (worker reads from IndexedDB instead of receiving data URL)
 */
export async function prepareProcessedImages(
  files: Array<File>,
): Promise<Array<ProcessedImage>> {
  return Promise.all(
    files.map(async (file) => {
      const dataUrl = await fileToDataUrl(file);
      const preparedDataUrl = await prepareImage(dataUrl);
      const id = generateImageId();

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
        processedDataUrl: null,
        backgroundColor: "blur",
        customColor: null,
        scale: DEFAULT_SCALE,
        status: "pending",
      } satisfies ProcessedImage;
    }),
  );
}
