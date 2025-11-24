/**
 * useDebounce Hook - Delay Value Updates
 *
 * Delays updating a value until after a specified time has passed without changes.
 * This prevents expensive operations (validation, API calls) from running on every keystroke.
 *
 * How it works:
 * 1. User types → value changes
 * 2. Timer starts (e.g., 300ms)
 * 3. If user types again within 300ms → timer resets
 * 4. After 300ms of no typing → debounced value updates
 *
 * Use cases:
 * - Field validation (wait for user to stop typing)
 * - Search queries (don't search on every keystroke)
 * - API calls (reduce network traffic)
 *
 * Used by: FieldController for debounced validation.
 *
 * @example
 * const [searchTerm, setSearchTerm] = useState("");
 * const debouncedSearch = useDebounce(searchTerm, 300);
 *
 * useEffect(() => {
 *   // Only runs 300ms after user stops typing
 *   fetchSearchResults(debouncedSearch);
 * }, [debouncedSearch]);
 */

import { useEffect, useState } from "react";

/**
 * Debounce a value - delays updates until value stabilizes.
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds before updating (e.g., 300)
 * @returns Debounced value (updates after delay)
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set a timeout to update the debounced value after delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup: Clear timeout if value changes before delay completes
    // This ensures only the latest value is used
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Re-run when value or delay changes

  return debouncedValue;
}
