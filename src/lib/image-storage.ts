/**
 * Image Storage utilities for persisting images between page reloads
 */

import { openDatabase } from "./indexed-db";

export const IMAGE_DB_CONFIG = {
  name: "param-img-storage",
  version: 1,
  storeName: "images",
  keyPath: "id",
};

export interface StoredImage {
  id: string;
  originalFile: File;
  originalDataUrl: string;
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
      tx.onerror = () => reject(tx.error);
    });
  } catch (error) {
    console.error("Error saving images:", error);
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
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  } catch (error) {
    console.error("Error loading images:", error);
    return [];
  }
}

/**
 * Get a single image by ID from IndexedDB
 */
export async function getImageById(
  id: string,
): Promise<StoredImage | undefined> {
  if (typeof indexedDB === "undefined") return undefined;

  try {
    const db = await openDatabase(IMAGE_DB_CONFIG);
    const tx = db.transaction(IMAGE_DB_CONFIG.storeName, "readonly");
    const store = tx.objectStore(IMAGE_DB_CONFIG.storeName);
    const request = store.get(id);

    return new Promise((resolve, reject) => {
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  } catch (error) {
    console.error("Error getting image:", error);
    return undefined;
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
      tx.onerror = () => reject(tx.error);
    });
  } catch (error) {
    console.error("Error saving image immediately:", error);
  }
}
