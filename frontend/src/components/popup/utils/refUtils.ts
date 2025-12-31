/**
 * Ref Utilities for Popup Component
 *
 * This module provides utilities for working with React refs.
 *
 * @module popup/utils/refUtils
 */

import type React from "react";

/**
 * Helper to set a ref value - works with both callback and object refs.
 * This is extracted to a function to avoid ESLint immutability warnings.
 *
 * @param ref - The ref to set (callback, object, or undefined/null)
 * @param value - The value to set on the ref
 */
export const setRef = <T>(ref: React.Ref<T> | undefined | null, value: T | null): void => {
  if (!ref) return;
  if (typeof ref === "function") {
    ref(value);
  } else if (typeof ref === "object") {
    // This is a MutableRefObject - the assignment is intentional
    (ref as React.MutableRefObject<T | null>).current = value;
  }
};
