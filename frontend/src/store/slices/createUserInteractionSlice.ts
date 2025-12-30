/**
 * User Interaction Slice - User Edits and Field State
 *
 * This slice tracks everything the user has done to the form:
 * - dirtyValues: Fields the user has edited (overlay on baseValues)
 * - setFieldValue: Updates a field (called by FieldController)
 * - resetFormInteractions: Clears all edits (for "New Order" flow)
 *
 * Why "dirty" values?
 * Term from form libraries (Formik, React Hook Form) meaning "user-modified".
 * - Clean state: baseValues (defaults)
 * - Dirty state: dirtyValues (user changes)
 * - Final state: { ...baseValues, ...dirtyValues }
 *
 * Field Update Flow:
 * 1. User types in Input → onChange fires
 * 2. FieldController calls setFieldValue(field, value)
 * 3. dirtyValues[field] = value
 * 4. Errors cleared for that field (validation will rerun)
 * 5. getDerivedValues() returns merged state
 *
 * Auto-Grab Level Reset Logic:
 * - Order type change: Always clears dirtyValues.level (resets to auto-grab)
 * - Currency pair change: Always clears dirtyValues.level (resets to auto-grab)
 * - Side change: Does NOT clear dirty level (user edits are preserved)
 *
 * Used by: FieldController (updates), OrderForm (reads merged values).
 */

import { StateCreator } from "zustand";

import { OrderSide, OrderStateData } from "../../types/domain";
import { BoundState, UserInteractionSlice } from "../../types/store";

export const createUserInteractionSlice: StateCreator<
  BoundState,
  [["zustand/immer", never]],
  [],
  UserInteractionSlice
> = (set, get) => ({
  /**
   * User-modified field values (overlay on baseValues).
   * Keys only exist for fields the user has actually changed.
   */
  dirtyValues: {},

  /**
   * Update a single field value.
   * Called by FieldController on every user input (debounced for validation).
   *
   * Side effects:
   * - Clears existing errors (validation will rerun)
   * - Clears server errors (may be stale after edit)
   * - Order type or currency pair change: Clears level to reset auto-grab
   * - Side change: Updates lastGrabbedSide for price direction tracking
   */
  setFieldValue: <K extends keyof OrderStateData>(field: K, value: OrderStateData[K] | undefined) =>
    set((state) => {
      // Update dirty values with type-safe assignment
      (state.dirtyValues as Record<K, OrderStateData[K] | undefined>)[field] = value;

      // Clear errors for this field (user is actively fixing it)
      if (state.errors[field]) delete state.errors[field];
      if (state.serverErrors[field]) delete state.serverErrors[field];

      // ============================================
      // AUTO-GRAB LEVEL RESET LOGIC
      // ============================================
      // Order type or currency pair change → always reset level to auto-grab
      // This ensures user gets fresh prices when context changes significantly
      if (field === "orderType" || field === "currencyPair") {
        delete state.dirtyValues.level;
      }

      // Side change → track the new side for auto-grab price direction
      // Note: We do NOT clear dirty level here - user edits are preserved
      if (field === "side") {
        get().setLastGrabbedSide(value as OrderSide);
      }
    }),

  /**
   * Reset all user interactions (for "New Order" flow).
   * Clears:
   * - dirtyValues: User edits
   * - errors/warnings: Validation state
   *
   * baseValues remain intact (defaults are preserved).
   */
  resetFormInteractions: () =>
    set((state) => {
      state.dirtyValues = {};
      state.errors = {};
      state.serverErrors = {};
      state.warnings = {};
    }),
});
