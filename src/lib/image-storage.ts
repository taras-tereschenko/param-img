/**
 * Image Storage utilities for persisting images between page reloads
 */

import { toast } from "sonner";
import { openDatabase } from "./indexed-db";
import { isQuotaExceededError } from "./type-guards";

export const IMAGE_DB_CONFIG = {
  name: "param-img-storage",
  version: 1,
  storeName: "images",
  keyPath: "id",
} as const;

export interface StoredImage {
  id: string;
  originalFile: File;
  originalDataUrl: string;
  isEnhancedResult?: boolean;
  sourceImageId?: string;
}

/**
 * Save images to IndexedDB
 */
export async function saveImages(images: Array<StoredImage>): Promise<void> {
  if (typeof indexedDB === "undefined") return;

  try {
    const db = await openDatabase(IMAGE_DB_CONFIG);
    const tx = db.transaction(IMAGE_DB_CONFIG.storeName, "readwrite");
    const store = tx.objectStore(IMAGE_DB_CONFIG.storeName);

    // Clear existing and add new
    store.clear();
    for (const image of images) {
      store.put(image);
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => {
        reject(tx.error ?? new Error("IndexedDB transaction failed"));
      };
    });
  } catch (error: unknown) {
    console.error("Error saving images:", error);
    if (isQuotaExceededError(error)) {
      toast.error("Storage quota exceeded", {
        description: "Try removing some images or clearing browser data",
      });
    }
  }
}

/**
 * Load images from IndexedDB
 */
export async function loadImages(): Promise<Array<StoredImage>> {
  if (typeof indexedDB === "undefined") return [];

  try {
    const db = await openDatabase(IMAGE_DB_CONFIG);
    const tx = db.transaction(IMAGE_DB_CONFIG.storeName, "readonly");
    const store = tx.objectStore(IMAGE_DB_CONFIG.storeName);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onerror = () => {
        reject(request.error ?? new Error("IndexedDB request failed"));
      };
      request.onsuccess = () => resolve(request.result);
    });
  } catch (error: unknown) {
    console.error("Error loading images:", error);
    return [];
  }
}

/**
 * Save a single image to IndexedDB immediately (for zero-transfer optimization)
 * This ensures the image is in IndexedDB before the worker tries to read it.
 */
export async function saveImageImmediately(image: StoredImage): Promise<void> {
  if (typeof indexedDB === "undefined") return;

  try {
    const db = await openDatabase(IMAGE_DB_CONFIG);
    const tx = db.transaction(IMAGE_DB_CONFIG.storeName, "readwrite");
    const store = tx.objectStore(IMAGE_DB_CONFIG.storeName);
    store.put(image);

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => {
        reject(tx.error ?? new Error("IndexedDB transaction failed"));
      };
    });
  } catch (error: unknown) {
    console.error("Error saving image immediately:", error);
    if (isQuotaExceededError(error)) {
      toast.error("Storage quota exceeded", {
        description: "Try removing some images or clearing browser data",
      });
    }
  }
}
