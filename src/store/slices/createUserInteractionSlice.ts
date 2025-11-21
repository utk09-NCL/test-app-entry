import { StateCreator } from "zustand";

import { OrderStateData } from "../../types/domain";
import { BoundState, UserInteractionSlice } from "../../types/store";

export const createUserInteractionSlice: StateCreator<
  BoundState,
  [["zustand/immer", never]],
  [],
  UserInteractionSlice
> = (set) => ({
  dirtyValues: {},
  touchedFields: {},
  setFieldValue: <K extends keyof OrderStateData>(field: K, value: OrderStateData[K] | undefined) =>
    set((state) => {
      // Cast to Record with generic key to ensure type safety for the assignment
      (state.dirtyValues as Record<K, OrderStateData[K] | undefined>)[field] = value;
      state.touchedFields[field] = true;

      // Clear errors for this field on change (validation will run again via debounce)
      if (state.errors[field]) delete state.errors[field];
      if (state.serverErrors[field]) delete state.serverErrors[field];
    }),
  resetFormInteractions: () =>
    set((state) => {
      state.dirtyValues = {};
      state.touchedFields = {};
      state.errors = {};
      state.serverErrors = {};
      state.warnings = {};
    }),
  setAllTouched: () =>
    set((_state) => {
      //TODO: Add Logic to mark all fields as touched (usually for submit attempts)
      // Simplified here as we usually just iterate keys in validation
    }),
});
