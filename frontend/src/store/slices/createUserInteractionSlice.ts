/**
 * User Interaction Slice - User Edits and Field State
 *
 * This slice tracks everything the user has done to the form:
 * - dirtyValues: Fields the user has edited (overlay on baseValues)
 * - touchedFields: Fields the user has interacted with (for error display)
 * - setFieldValue: Updates a field (called by FieldController)
 * - resetFormInteractions: Clears all edits (for "New Order" flow)
 *
 * Why "dirty" values?\n * Term from form libraries (Formik, React Hook Form) meaning "user-modified".\n * - Clean state: baseValues (defaults)\n * - Dirty state: dirtyValues (user changes)\n * - Final state: { ...baseValues, ...dirtyValues }\n *
 * Field Update Flow:\n * 1. User types in Input → onChange fires\n * 2. FieldController calls setFieldValue(field, value)\n * 3. dirtyValues[field] = value, touchedFields[field] = true\n * 4. Errors cleared for that field (validation will rerun)\n * 5. getDerivedValues() returns merged state\n *
 * Used by: FieldController (updates), OrderForm (reads merged values).\n */

import { StateCreator } from "zustand";

import { OrderStateData } from "../../types/domain";
import { BoundState, UserInteractionSlice } from "../../types/store";

export const createUserInteractionSlice: StateCreator<
  BoundState,
  [["zustand/immer", never]],
  [],
  UserInteractionSlice
> = (set) => ({
  /**
   * User-modified field values (overlay on baseValues).
   * Keys only exist for fields the user has actually changed.
   */
  dirtyValues: {},

  /**
   * Fields the user has interacted with (focused/blurred).
   * Used to determine when to show validation errors:
   * - Don't show errors on pristine fields (not touched)
   * - Show errors after user leaves field (on blur)
   */
  touchedFields: {},

  /**
   * Update a single field value.
   * Called by FieldController on every user input (debounced for validation).
   *
   * Side effects:
   * - Marks field as touched
   * - Clears existing errors (validation will rerun)
   * - Clears server errors (may be stale after edit)
   */
  setFieldValue: <K extends keyof OrderStateData>(field: K, value: OrderStateData[K] | undefined) =>
    set((state) => {
      // Update dirty values with type-safe assignment
      (state.dirtyValues as Record<K, OrderStateData[K] | undefined>)[field] = value;
      state.touchedFields[field] = true;

      // Clear errors for this field (user is actively fixing it)
      if (state.errors[field]) delete state.errors[field];
      if (state.serverErrors[field]) delete state.serverErrors[field];
    }),

  /**
   * Reset all user interactions (for "New Order" flow).
   * Clears:
   * - dirtyValues: User edits
   * - touchedFields: Interaction tracking
   * - errors/warnings: Validation state
   *
   * baseValues remain intact (defaults are preserved).
   */
  resetFormInteractions: () =>
    set((state) => {
      state.dirtyValues = {};
      state.touchedFields = {};
      state.errors = {};
      state.serverErrors = {};
      state.warnings = {};
    }),
});
