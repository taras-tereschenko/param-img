/**
 * Reusable type predicates for safe type narrowing
 */

/** Check if error is a quota exceeded error (IndexedDB/localStorage) */
export function isQuotaExceededError(error: unknown): error is DOMException {
  return (
    error instanceof DOMException &&
    (error.name === "QuotaExceededError" ||
      error.name === "NS_ERROR_DOM_QUOTA_REACHED")
  );
}

/** Check if error is an abort error (user cancelled) */
export function isAbortError(error: unknown): error is DOMException {
  return error instanceof DOMException && error.name === "AbortError";
}

/** Type guard for non-empty arrays */
export function isNonEmpty<T>(
  arr: ReadonlyArray<T>,
): arr is readonly [T, ...Array<T>] {
  return arr.length > 0;
}
