import type { ProcessedImage } from "@/lib/types";
import { DEFAULT_SCALE } from "@/lib/types";
import {
  fileToDataUrl,
  generateImageId,
  prepareImage,
} from "@/lib/image-utils";

/**
 * Prepare files into ProcessedImage objects ready for the carousel
 */
export async function prepareProcessedImages(
  files: Array<File>,
): Promise<Array<ProcessedImage>> {
  return Promise.all(
    files.map(async (file) => {
      const dataUrl = await fileToDataUrl(file);
      const preparedDataUrl = await prepareImage(dataUrl);

      return {
        id: generateImageId(),
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
