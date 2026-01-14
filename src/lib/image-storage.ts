/**
 * Image Storage utilities for persisting images between page reloads
 */

import { openDatabase } from "./indexed-db";

const DB_CONFIG = {
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
    const db = await openDatabase(DB_CONFIG);
    const tx = db.transaction(DB_CONFIG.storeName, "readwrite");
    const store = tx.objectStore(DB_CONFIG.storeName);

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
    const db = await openDatabase(DB_CONFIG);
    const tx = db.transaction(DB_CONFIG.storeName, "readonly");
    const store = tx.objectStore(DB_CONFIG.storeName);
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
