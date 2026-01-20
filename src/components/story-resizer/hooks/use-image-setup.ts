import type { ProcessedImage } from "@/lib/types";
import { DEFAULT_SCALE } from "@/lib/types";
import {
  fileToDataUrl,
  generateImageId,
  prepareImage,
} from "@/lib/image-utils";
import { saveImageImmediately } from "@/lib/image-storage";

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
}
