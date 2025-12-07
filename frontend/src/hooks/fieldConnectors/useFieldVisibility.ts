/**
 * useFieldVisibility Hook
 *
 * Determines whether a field should be visible based on current form state.
 * Uses visibility rules defined in config/visibilityRules.ts.
 *
 * @param fieldKey - The field to check visibility for
 * @returns boolean indicating if field should be rendered
 */

import { useMemo } from "react";

import { isFieldVisible } from "../../config/visibilityRules";
import { useOrderEntryStore } from "../../store";
import { OrderStateData } from "../../types/domain";

export const useFieldVisibility = (fieldKey: keyof OrderStateData): boolean => {
  // Get only the specific form values needed for visibility rules
  // Using individual selectors prevents infinite re-render loop
  const orderType = useOrderEntryStore((s) => s.getDerivedValues().orderType);
  const expiry = useOrderEntryStore((s) => s.getDerivedValues().expiry);
  const startMode = useOrderEntryStore((s) => s.getDerivedValues().startMode);
  const liquidityPool = useOrderEntryStore((s) => s.getDerivedValues().liquidityPool);

  // Memoize visibility check to avoid recalculation on unrelated state changes
  const isVisible = useMemo(() => {
    const values: Partial<OrderStateData> = {
      orderType,
      ...(expiry && { expiry }),
      ...(startMode && { startMode }),
      ...(liquidityPool && { liquidityPool }),
    };
    return isFieldVisible(fieldKey, values);
  }, [fieldKey, orderType, expiry, startMode, liquidityPool]);

  return isVisible;
};
