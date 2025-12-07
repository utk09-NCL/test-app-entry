/**
 * useFieldReadOnly Hook
 *
 * Computes whether a field should be read-only based on:
 * 1. editMode (viewing, amending, creating)
 * 2. Order type configuration (which fields are editable)
 * 3. Field-specific overrides (symbol is always read-only in form)
 *
 * Also provides `isEditable` flag for double-click-to-amend feature.
 *
 * @param fieldKey - The field name from OrderStateData
 * @returns Read-only state and editability
 */

import { useMemo } from "react";

import { ORDER_TYPES } from "../../config/orderConfig";
import { useOrderEntryStore } from "../../store";
import { OrderStateData } from "../../types/domain";

export interface UseFieldReadOnlyReturn {
  /** Whether field should be read-only */
  isReadOnly: boolean;
  /** Whether field can be edited (shows "double-click to edit" affordance) */
  isEditable: boolean;
  /** Current edit mode */
  editMode: "creating" | "viewing" | "amending";
}

/**
 * Fields that are always read-only in the form (regardless of edit mode)
 */
const ALWAYS_READ_ONLY_FIELDS: Array<keyof OrderStateData> = ["currencyPair", "execution"];

export const useFieldReadOnly = (fieldKey: keyof OrderStateData): UseFieldReadOnlyReturn => {
  // Get edit mode
  const editMode = useOrderEntryStore((s) => s.editMode);

  // Get order type to look up editable fields
  const orderType = useOrderEntryStore((s) => s.getDerivedValues().orderType);

  // Get ref data error for this field (affects amending behavior)
  const refDataError = useOrderEntryStore((s) => s.refDataErrors[fieldKey]);

  // Compute read-only state
  const { isReadOnly, isEditable } = useMemo(() => {
    // Always read-only fields
    if (ALWAYS_READ_ONLY_FIELDS.includes(fieldKey)) {
      return { isReadOnly: true, isEditable: false };
    }

    // Get order type configuration
    const config = ORDER_TYPES[orderType as keyof typeof ORDER_TYPES];
    const isFieldEditable = config?.editableFields.includes(fieldKey) ?? false;

    // Field is read-only if:
    // 1. In "viewing" mode - ALL fields read-only
    // 2. In "amending" mode AND field is NOT in editableFields list
    // 3. In "amending" mode AND field has refDataError (can't edit unavailable data)
    const readOnly =
      editMode === "viewing" ||
      (editMode === "amending" && !isFieldEditable) ||
      (editMode === "amending" && !!refDataError);

    // Flag for double-click-to-amend feature
    // Only editable fields in viewing mode show the "Double-click to edit" affordance
    const editable = editMode === "viewing" && isFieldEditable;

    return { isReadOnly: readOnly, isEditable: editable };
  }, [fieldKey, editMode, orderType, refDataError]);

  return { isReadOnly, isEditable, editMode };
};
