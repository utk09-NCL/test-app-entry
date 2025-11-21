/**
 * ID Generator - Simple Unique ID Creation
 *
 * Generates unique IDs using timestamp + random string.
 * Format: [timestamp in base36][random string in base36]
 *
 * Example output: "l5x8k2f_9g3h1m"
 *
 * Why this approach?
 * - Collision-resistant (timestamp ensures uniqueness across time)
 * - No dependencies (no uuid library needed)
 * - Short and human-readable (good for debugging)
 *
 * Used for: App instance IDs, temporary keys, client-side tracking.
 * NOT suitable for: Server-side entity IDs (use UUID or database sequences).
 */

/**
 * Generate a unique ID.
 * @returns A unique string ID (e.g., "l5x8k2f_9g3h1m")
 */
export const generateId = (): string => {
  // Timestamp in base36 (shorter than decimal)
  const timestamp = Date.now().toString(36);
  // Random string in base36 (removes leading "0.")
  const randomPart = Math.random().toString(36).substring(2);
  // Combine with separator for readability
  return timestamp + randomPart;
};
