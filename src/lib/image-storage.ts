/**
 * Image Storage utilities for persisting images between page reloads
 */

const DB_NAME = "param-img-storage";
const STORE_NAME = "images";
const DB_VERSION = 1;

export interface StoredImage {
  id: string;
  originalFile: File;
  originalDataUrl: string;
}

async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
}

/**
 * Save images to IndexedDB
 */
export async function saveImages(images: StoredImage[]): Promise<void> {
  if (typeof indexedDB === "undefined") return;

  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

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
export async function loadImages(): Promise<StoredImage[]> {
  if (typeof indexedDB === "undefined") return [];

  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  } catch (error) {
    console.error("Error loading images:", error);
    return [];
  }
}

/**
 * Clear all stored images
 */
export async function clearImages(): Promise<void> {
  if (typeof indexedDB === "undefined") return;

  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.clear();

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (error) {
    console.error("Error clearing images:", error);
  }
}
