/**
 * Shared IndexedDB utilities
 */

export interface DBConfig {
  name: string;
  version: number;
  storeName: string;
  keyPath?: string;
}

export async function openDatabase(config: DBConfig): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(config.name, config.version);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(config.storeName)) {
        if (config.keyPath) {
          db.createObjectStore(config.storeName, { keyPath: config.keyPath });
        } else {
          db.createObjectStore(config.storeName);
        }
      }
    };
  });
}
