/**
 * useFieldState Hook
 *
 * Provides validation state for a field:
 * - error: Client-side validation error
 * - serverError: Server-side validation error
 * - refDataError: Reference data unavailable error
 * - warning: Advisory warning (non-blocking)
 * - isValidating: True while async validation is running
 *
 * Also handles debounced validation triggering.
 *
 * @param fieldKey - The field name from OrderStateData
 * @returns Validation state object
 */

import { useEffect } from "react";

import { VALIDATION_CONFIG } from "../../config/constants";
import { useOrderEntryStore } from "../../store";
import { OrderStateData } from "../../types/domain";
import { useDebounce } from "../useDebounce";

export interface UseFieldStateReturn {
  /** Client-side validation error */
  error: string | undefined;
  /** Server-side validation error */
  serverError: string | undefined;
  /** Reference data unavailable error */
  refDataError: string | undefined;
  /** Advisory warning (non-blocking) */
  warning: string | undefined;
  /** True while async validation is running */
  isValidating: boolean;
  /** Whether field has any error (client, server, or refData) */
  hasError: boolean;
  /** Combined error message (prefers server, then client, then refData) */
  combinedError: string | undefined;
}

export const useFieldState = (fieldKey: keyof OrderStateData): UseFieldStateReturn => {
  // Get validation state for this field
  const error = useOrderEntryStore((s) => s.errors[fieldKey]);
  const serverError = useOrderEntryStore((s) => s.serverErrors[fieldKey]);
  const refDataError = useOrderEntryStore((s) => s.refDataErrors[fieldKey]);
  const warning = useOrderEntryStore((s) => s.warnings[fieldKey]);
  const isValidating = useOrderEntryStore((s) => s.isValidating[fieldKey]) ?? false;

  // Get current value for debounced validation
  const value = useOrderEntryStore((s) => s.getDerivedValues()[fieldKey]);

  // Get order type to revalidate when it changes
  const orderType = useOrderEntryStore((s) => s.getDerivedValues().orderType);

  // Get validate action
  const validateField = useOrderEntryStore((s) => s.validateField);

  // Debounce the value to avoid validating on every keystroke
  const debouncedValue = useDebounce(value, VALIDATION_CONFIG.DEBOUNCE_MS);

  // Trigger validation when debounced value changes
  useEffect(() => {
    // IMPORTANT: Validate even when value is undefined/null
    // This catches required field errors (e.g., empty notional)
    validateField(fieldKey, debouncedValue);
  }, [debouncedValue, fieldKey, validateField]);

  // Trigger validation when order type changes (new fields may have new requirements)
  useEffect(() => {
    validateField(fieldKey, value);
  }, [orderType, fieldKey, validateField, value]);

  // Compute derived state
  const hasError = !!(error || serverError || refDataError);
  const combinedError = serverError || error || refDataError;

  return {
    error,
    serverError,
    refDataError,
    warning,
    isValidating,
    hasError,
    combinedError,
  };
};
