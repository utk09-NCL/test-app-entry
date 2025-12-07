/**
 * useFieldValue Hook
 *
 * Provides the current value for a field and a setter function.
 * Value is derived from the priority-based merge (defaults → userPrefs → fdc3 → userInput).
 *
 * This hook:
 * - Reads from getDerivedValues() which handles priority merge
 * - Provides a type-safe setter that calls setFieldValue
 * - Triggers ref data validation after value changes
 *
 * @param fieldKey - The field name from OrderStateData
 * @returns [value, setValue] tuple
 */

import { useCallback } from "react";

import { useOrderEntryStore } from "../../store";
import { OrderStateData } from "../../types/domain";

// Value can be any field type from OrderStateData (primitives, objects, or undefined)
type FieldValue = OrderStateData[keyof OrderStateData];

export interface UseFieldValueReturn {
  /** Current field value (from derived state) */
  value: FieldValue;
  /** Update field value */
  setValue: (value: FieldValue) => void;
}

export const useFieldValue = (fieldKey: keyof OrderStateData): UseFieldValueReturn => {
  // Get the current value for this field (merged from all layers)
  // This can be any type from OrderStateData, including complex objects
  const value = useOrderEntryStore((s) => s.getDerivedValues()[fieldKey]) as FieldValue;

  // Get actions
  const setFieldValue = useOrderEntryStore((s) => s.setFieldValue);
  const validateRefData = useOrderEntryStore((s) => s.validateRefData);

  // Memoized setter that updates value and triggers ref data validation
  const setValue = useCallback(
    (newValue: FieldValue) => {
      setFieldValue(fieldKey, newValue);
      // Re-validate reference data after field change
      // validateRefData runs synchronously and reads from the store,
      // which is already updated by setFieldValue (Zustand updates are synchronous)
      validateRefData();
    },
    [fieldKey, setFieldValue, validateRefData]
  );

  return { value, setValue };
};
