import { StateCreator } from "zustand";

import { AppSlice, BoundState } from "../../types/store";
import { generateId } from "../../utils/idGenerator";

export const createAppSlice: StateCreator<BoundState, [["zustand/immer", never]], [], AppSlice> = (
  set
) => ({
  instanceId: generateId(),
  status: "INITIALIZING",
  editMode: "creating",
  toastMessage: null,
  setStatus: (status) =>
    set((state) => {
      state.status = status;
    }),
  setEditMode: (mode) =>
    set((state) => {
      state.editMode = mode;
    }),
  setToast: (msg) =>
    set((state) => {
      state.toastMessage = msg;
    }),
});
