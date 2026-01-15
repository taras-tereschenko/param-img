import { useCallback, useEffect, useRef, useState } from "react";
import type {
  AmbientBaseType,
  BackgroundType,
  BorderRadiusOption,
} from "./types";
import type { ProcessError, ProcessResponse } from "./canvas-worker";

export interface ProcessParams {
  imageId?: string; // Unique ID for caching ImageBitmap in worker
  imageDataUrl: string;
  backgroundType: BackgroundType;
  customColor: string | null;
  scale: number;
  ambientBase?: AmbientBaseType;
  ambientCustomColor?: string | null;
  blurRadius?: number;
  borderRadius?: BorderRadiusOption;
  maxSize?: number | null; // null or undefined = full resolution
}

type Callback = (url: string) => void;
type ErrorCallback = (error: string) => void;

interface PendingRequest {
  resolve: Callback;
  reject: ErrorCallback;
}

let globalWorker: Worker | null = null;
const globalPending: Map<string, PendingRequest> = new Map();
// Track which imageIds have been sent to worker (cache is populated)
const sentImageIds: Set<string> = new Set();
let instanceCount = 0;

function generateId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Initialize the shared worker instance
 */
function initWorker(): Worker {
  if (!globalWorker) {
    globalWorker = new Worker(new URL("./canvas-worker.ts", import.meta.url), {
      type: "module",
    });

    globalWorker.onmessage = (
      e: MessageEvent<ProcessResponse | ProcessError>,
    ) => {
      const { id } = e.data;
      const pending = globalPending.get(id);

      if (pending) {
        if ("blob" in e.data) {
          const url = URL.createObjectURL(e.data.blob);
          pending.resolve(url);
        } else if ("error" in e.data) {
          pending.reject(e.data.error);
        }
        globalPending.delete(id);
      }
    };

    globalWorker.onerror = (error) => {
      console.error("Canvas worker error:", error);
    };
  }

  return globalWorker;
}

/**
 * Cleanup worker when no more instances are using it
 */
function cleanupWorker(): void {
  instanceCount--;
  if (instanceCount === 0 && globalWorker) {
    globalWorker.terminate();
    globalWorker = null;
    globalPending.clear();
    sentImageIds.clear();
  }
}

/**
 * Clear the cached ImageBitmap for a specific image in the worker
 * Call this when an image is removed to free memory
 */
export function clearImageCache(imageId: string): void {
  sentImageIds.delete(imageId);
  if (globalWorker) {
    globalWorker.postMessage({ type: "clearCache", imageId });
  }
}

/**
 * Check if OffscreenCanvas is supported
 */
export function supportsOffscreenCanvas(): boolean {
  return typeof OffscreenCanvas !== "undefined";
}

/**
 * Hook to process images using a Web Worker with OffscreenCanvas
 *
 * Returns a process function that sends work to the worker and calls back with the result URL.
 * The worker is shared across all hook instances and cleaned up when the last one unmounts.
 */
export function useCanvasWorker() {
  const [isSupported] = useState(() => supportsOffscreenCanvas());
  const latestRequestRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isSupported) return;

    instanceCount++;
    initWorker();

    return () => {
      // Cancel any pending request for this hook instance
      if (latestRequestRef.current) {
        globalPending.delete(latestRequestRef.current);
      }
      cleanupWorker();
    };
  }, [isSupported]);

  const process = useCallback(
    (
      params: ProcessParams,
      onSuccess: Callback,
      onError?: ErrorCallback,
    ): (() => void) => {
      if (!isSupported || !globalWorker) {
        onError?.("OffscreenCanvas not supported");
        return () => {};
      }

      const id = generateId();

      // Cancel previous request from this hook instance
      if (latestRequestRef.current) {
        globalPending.delete(latestRequestRef.current);
      }
      latestRequestRef.current = id;

      globalPending.set(id, {
        resolve: (url) => {
          // Only call callback if this is still the latest request
          if (latestRequestRef.current === id) {
            onSuccess(url);
          } else {
            // Revoke URL if request was superseded
            URL.revokeObjectURL(url);
          }
        },
        reject: (error) => {
          if (latestRequestRef.current === id) {
            onError?.(error);
          }
        },
      });

      // Optimization: Skip sending dataUrl if worker already has this image cached
      const { imageId, imageDataUrl, ...restParams } = params;
      const alreadyCached = imageId && sentImageIds.has(imageId);

      if (imageId && !alreadyCached) {
        sentImageIds.add(imageId);
      }

      globalWorker.postMessage({
        id,
        imageId,
        // Only send dataUrl on first request for this imageId
        imageDataUrl: alreadyCached ? undefined : imageDataUrl,
        ...restParams,
      });

      // Return cancel function
      return () => {
        globalPending.delete(id);
        if (latestRequestRef.current === id) {
          latestRequestRef.current = null;
        }
      };
    },
    [isSupported],
  );

  return { process, isSupported };
}
