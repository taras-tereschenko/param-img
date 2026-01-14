/**
 * Share Target utilities for retrieving files shared from other apps
 */

import { openDatabase } from "./indexed-db";

const DB_CONFIG = {
  name: "param-img-share",
  version: 1,
  storeName: "shared-files",
};

/**
 * Retrieve and clear shared files from IndexedDB
 * Returns empty array if no files or if IndexedDB is not available
 */
export async function getSharedFiles(): Promise<Array<File>> {
  if (typeof indexedDB === "undefined") {
    return [];
  }

  try {
    const db = await openDatabase(DB_CONFIG);
    const tx = db.transaction(DB_CONFIG.storeName, "readwrite");
    const store = tx.objectStore(DB_CONFIG.storeName);

    // Get all files
    const files: Array<File> = [];
    const request = store.openCursor();

    await new Promise<void>((resolve, reject) => {
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          if (cursor.value instanceof File) {
            files.push(cursor.value);
          }
          cursor.continue();
        } else {
          resolve();
        }
      };
    });

    // Clear the store after retrieving
    store.clear();

    return files;
  } catch (error) {
    console.error("Error retrieving shared files:", error);
    return [];
  }
}

/**
 * Check if the current URL indicates shared content
 */
export function hasSharedContent(): boolean {
  if (typeof window === "undefined") return false;
  const url = new URL(window.location.href);
  return url.searchParams.get("shared") === "true";
}

/**
 * Clear the shared query parameter from URL without reload
 */
export function clearSharedParam(): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.delete("shared");
  window.history.replaceState({}, "", url.toString());
}
