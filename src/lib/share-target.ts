/**
 * Share Target utilities for retrieving files shared from other apps
 */

const DB_NAME = "param-img-share";
const STORE_NAME = "shared-files";

async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

/**
 * Retrieve and clear shared files from IndexedDB
 * Returns empty array if no files or if IndexedDB is not available
 */
export async function getSharedFiles(): Promise<File[]> {
  if (typeof indexedDB === "undefined") {
    return [];
  }

  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    // Get all files
    const files: File[] = [];
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
