/**
 * App Slice - Lifecycle and UI Mode Management
 *
 * This slice manages high-level application state:
 * - status: Application lifecycle (INITIALIZING → READY → SUBMITTING → ERROR)
 * - editMode: UI mode (creating → viewing → amending)
 * - instanceId: Unique identifier for this app instance
 * - toastMessage: Global notifications (success/error messages)
 *
 * Why separate status from editMode?
 * - status: Technical lifecycle (async operations, loading states)
 * - editMode: User intent (what should the UI allow?)
 *
 * This separation prevents state explosion (e.g., "INITIALIZING_CREATING",
 * "READY_VIEWING", "SUBMITTING_AMENDING") and makes conditional logic cleaner.
 *
 * Used by: App.tsx, OrderForm, OrderFooter for conditional rendering and flow control.
 */

import { StateCreator } from "zustand";

import { AppSlice, BoundState } from "../../types/store";
import { generateId } from "../../utils/idGenerator";

export const createAppSlice: StateCreator<BoundState, [["zustand/immer", never]], [], AppSlice> = (
  set
) => ({
  /** Unique ID for this app instance (useful for debugging multi-window scenarios) */
  instanceId: generateId(),

  /**
   * Application lifecycle status.
   * - INITIALIZING: Loading reference data (accounts, pools, currencies)
   * - READY: Ready for user interaction
   * - SUBMITTING: Order submission in progress (shows loading, disables submit)
   * - ERROR: Fatal error occurred (shows error screen)
   */
  status: "INITIALIZING",

  /**
   * UI edit mode.
   * - creating: Fresh order entry (all fields editable)
   * - viewing: Read-only mode after submission (double-click to amend)
   * - amending: Editing submitted order (only editableFields from orderConfig)
   */
  editMode: "creating",

  /** Toast notification for user feedback (null = no toast) */
  toastMessage: null,

  /** Update application lifecycle status */
  setStatus: (status) =>
    set((state) => {
      state.status = status;
    }),

  /** Update UI edit mode */
  setEditMode: (mode) =>
    set((state) => {
      state.editMode = mode;
    }),

  /** Show toast notification (auto-dismissed by UI after timeout) */
  setToast: (msg) =>
    set((state) => {
      state.toastMessage = msg;
    }),
});
