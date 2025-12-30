import type { StateCreator, StoreMutatorIdentifier } from "zustand";

type Logger = <
  T,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
>(
  f: StateCreator<T, Mps, Mcs>,
  name?: string
) => StateCreator<T, Mps, Mcs>;

type LoggerImpl = <T>(f: StateCreator<T, [], []>, name?: string) => StateCreator<T, [], []>;

/**
 * Logger configuration object.
 * Can be modified at runtime for testing purposes.
 */
export const loggerConfig = {
  /**
   * Enable price logging. Default false to reduce console noise.
   * Prices tick ~3 times per second, so this is disabled by default.
   */
  enablePriceLogging:
    typeof import.meta !== "undefined" && import.meta.env.VITE_ENABLE_PRICE_LOGGING === "true",

  /**
   * Enable validation logging. Default false to reduce console noise.
   * Validation triggers frequently during form interactions.
   */
  enableValidationLogging:
    typeof import.meta !== "undefined" && import.meta.env.VITE_ENABLE_VALIDATION_LOGGING === "true",
};

/**
 * Check if price logging is enabled.
 * Reads from loggerConfig which can be modified for testing.
 */
export const isPriceLoggingEnabled = (): boolean => loggerConfig.enablePriceLogging;

/**
 * Check if validation logging is enabled.
 * Reads from loggerConfig which can be modified for testing.
 */
export const isValidationLoggingEnabled = (): boolean => loggerConfig.enableValidationLogging;

/**
 * Throttle interval for price update logs (in milliseconds).
 * Price updates occur ~3 times per second, so we limit logging to once per second
 * to avoid flooding the console when debugging.
 */
const PRICE_LOG_THROTTLE_MS = 1000;

/**
 * Track last time we logged a price update.
 * Used for throttling frequent price logs.
 */
export let lastPriceLogTime = 0;

/**
 * Reset the price log throttle timer.
 * Used in tests to ensure clean state between tests.
 */
export const resetPriceLogTime = (): void => {
  lastPriceLogTime = 0;
};

/**
 * Keys that are considered validation-related state.
 * These updates are filtered when ENABLE_VALIDATION_LOGGING is false.
 */
const VALIDATION_KEYS = ["isValidating", "validationRequestIds"];

/**
 * Deep equality check for two values.
 * Handles primitives, arrays, and plain objects.
 */
const isDeepEqual = (a: unknown, b: unknown): boolean => {
  // Same reference or both primitives with same value
  if (a === b) return true;

  // If either is null/undefined but not both, they're different
  if (a == null || b == null) return a === b;

  // Different types
  if (typeof a !== typeof b) return false;

  // For non-objects (primitives), strict equality already checked above
  if (typeof a !== "object") return false;

  // Arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, i) => isDeepEqual(item, b[i]));
  }

  // If one is array and other is not
  if (Array.isArray(a) !== Array.isArray(b)) return false;

  // Plain objects
  const aObj = a as Record<string, unknown>;
  const bObj = b as Record<string, unknown>;
  const aKeys = Object.keys(aObj);
  const bKeys = Object.keys(bObj);

  if (aKeys.length !== bKeys.length) return false;

  return aKeys.every((key) => isDeepEqual(aObj[key], bObj[key]));
};

/**
 * Computes the difference between two objects.
 * Returns an object containing only the changed properties.
 * Uses deep equality for objects to avoid false positives from reference changes.
 */
const getStateDiff = <T extends Record<string, unknown>>(prev: T, next: T): Partial<T> => {
  const diff: Partial<T> = {};
  const allKeys = new Set([...Object.keys(prev), ...Object.keys(next)]);

  for (const key of allKeys) {
    const prevValue = prev[key];
    const nextValue = next[key];

    // Use deep equality to avoid logging unchanged objects with new references
    if (!isDeepEqual(prevValue, nextValue)) {
      diff[key as keyof T] = nextValue as T[keyof T];
    }
  }

  return diff;
};

/**
 * Check if a state update is a price-only update.
 * These are throttled to reduce console noise.
 */
const isPriceOnlyUpdate = (diff: Record<string, unknown>): boolean => {
  const diffKeys = Object.keys(diff);
  const priceKeys = ["currentBuyPrice", "currentSellPrice"];

  // Check if diff only contains price keys
  return diffKeys.length > 0 && diffKeys.every((key) => priceKeys.includes(key));
};

/**
 * Check if a state update is a validation-only update.
 * These are filtered when ENABLE_VALIDATION_LOGGING is false.
 */
const isValidationOnlyUpdate = (diff: Record<string, unknown>): boolean => {
  const diffKeys = Object.keys(diff);

  // Check if diff only contains validation keys
  return diffKeys.length > 0 && diffKeys.every((key) => VALIDATION_KEYS.includes(key));
};

/**
 * Check if a value is a plain object (not array, null, Date, etc.)
 */
const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.prototype.toString.call(value) === "[object Object]"
  );
};

/**
 * Logs the diff for both primitives and objects.
 */
const logDiff = <T extends Record<string, unknown>>(
  prev: T,
  next: T,
  diff: Partial<T>,
  storeName: string
) => {
  const primitiveChanges: Record<string, { from: unknown; to: unknown }> = {};
  const objectChanges: Array<{ key: string; from: unknown; to: unknown }> = [];

  for (const key in diff) {
    const prevValue = prev[key];
    const nextValue = next[key];

    // Separate primitives from objects
    if (isPlainObject(prevValue) || isPlainObject(nextValue)) {
      objectChanges.push({ key, from: prevValue, to: nextValue });
    } else {
      primitiveChanges[key] = { from: prevValue, to: nextValue };
    }
  }

  console.group(`--- ${storeName} state update ---`);

  // Log primitive changes in a table
  if (Object.keys(primitiveChanges).length > 0) {
    console.log("%cPrimitive changes:", "color: #3b82f6; font-weight: bold");
    console.table(primitiveChanges);
  }

  // Log object changes with expanded view
  if (objectChanges.length > 0) {
    console.log("%cObject changes:", "color: #cfbe02ff; font-weight: bold");

    objectChanges.forEach(({ key, from, to }) => {
      console.groupCollapsed(` ${key}`);

      // Check if objects are empty before using console.table
      const fromIsEmpty = isPlainObject(from) && Object.keys(from).length === 0;
      const toIsEmpty = isPlainObject(to) && Object.keys(to).length === 0;

      // Show Before
      console.log("%cBefore:", "color: #ef4444; font-weight: bold");
      if (fromIsEmpty) {
        console.log(" (empty object)");
      } else {
        console.table(from);
      }

      // Show After
      console.log("%cAfter:", "color: #10b981; font-weight: bold");
      if (toIsEmpty) {
        console.log(" (empty object)");
      } else {
        console.table(to);
      }

      console.groupEnd();
    });
  }

  console.groupEnd();
};

const loggerImpl: LoggerImpl = (f, name) => (set, get, store) => {
  const loggedSet = ((arg1: unknown, arg2?: unknown) => {
    if (process.env.NODE_ENV === "development") {
      const prevState = get();

      // Apply the state update
      (set as (...args: unknown[]) => void)(arg1, arg2);

      const nextState = get();

      // Calculate diff
      const diff = getStateDiff(
        prevState as Record<string, unknown>,
        nextState as Record<string, unknown>
      );

      // Only log if there are changes
      if (Object.keys(diff).length > 0) {
        // Handle price-only updates: skip entirely if disabled, throttle if enabled
        if (isPriceOnlyUpdate(diff)) {
          if (isPriceLoggingEnabled()) {
            const now = Date.now();
            if (now - lastPriceLogTime >= PRICE_LOG_THROTTLE_MS) {
              lastPriceLogTime = now;
              logDiff(
                prevState as Record<string, unknown>,
                nextState as Record<string, unknown>,
                diff,
                `${name || "zustand"} [price tick]`
              );
            }
          }
          // Skip logging for price updates (either disabled or throttled)
        } else if (isValidationOnlyUpdate(diff)) {
          // Skip validation updates if logging is disabled
          if (isValidationLoggingEnabled()) {
            logDiff(
              prevState as Record<string, unknown>,
              nextState as Record<string, unknown>,
              diff,
              `${name || "zustand"} [validation]`
            );
          }
        } else {
          logDiff(
            prevState as Record<string, unknown>,
            nextState as Record<string, unknown>,
            diff,
            name || "zustand"
          );
        }
      }
    } else {
      (set as (...args: unknown[]) => void)(arg1, arg2);
    }
  }) as typeof set;

  store.setState = loggedSet;
  return f(loggedSet, get, store);
};

export const loggerMiddleware = loggerImpl as unknown as Logger;
