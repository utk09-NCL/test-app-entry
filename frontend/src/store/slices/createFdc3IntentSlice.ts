/**
 * FDC3 Intent Slice - External Application Data (Priority 3)
 *
 * This slice stores data received from FDC3 intents (external applications).
 * FDC3 intents override user preferences but can be overridden by user input.
 *
 * Priority: 3
 * Overrides: Defaults, User Preferences
 * Overridden by: User Input (unless new intent arrives)
 *
 * Key Behavior:
 * - When a new FDC3 intent arrives, it CLEARS user input (dirtyValues)
 * - This is because an FDC3 intent is a new user action from another app
 * - User can then modify the pre-populated values
 *
 * Intent Queue:
 * - Intents that arrive before app is ready are queued
 * - Queue is processed once app reaches READY state
 * - This solves the timing issue where FDC3 arrives before ref data
 *
 * Confirmation Dialog:
 * - If user has unsaved changes and new intent arrives, show confirmation
 * - User can accept (apply intent) or reject (keep current state)
 */

import { StateCreator } from "zustand";

import { Fdc3IntentLayerData, Fdc3IntentMetadata } from "../../types/layers";
import { BoundState } from "../../types/store";
import { generateId } from "../../utils/idGenerator";

/**
 * FDC3 Intent Slice Interface
 */
export interface Fdc3IntentSlice {
  /** Current FDC3 intent data (if any) */
  fdc3Intent: Fdc3IntentLayerData | null;
  /** Metadata about the current intent */
  fdc3IntentMeta: Fdc3IntentMetadata | null;
  /** Queue of intents received before app was ready */
  fdc3IntentQueue: Array<{ data: Fdc3IntentLayerData; meta: Fdc3IntentMetadata }>;
  /** Whether there's a pending intent waiting for user confirmation */
  hasPendingFdc3Intent: boolean;
  /** Pending intent data (shown in confirmation dialog) */
  pendingFdc3Intent: Fdc3IntentLayerData | null;

  /** Set FDC3 intent data (called when intent is applied) */
  setFdc3Intent: (data: Fdc3IntentLayerData, sourceApp?: string) => void;
  /** Queue an intent for later processing */
  queueFdc3Intent: (data: Fdc3IntentLayerData, sourceApp?: string) => void;
  /** Process queued intents (called when app becomes ready) */
  processIntentQueue: () => void;
  /** Set pending intent for confirmation */
  setPendingFdc3Intent: (data: Fdc3IntentLayerData | null) => void;
  /** Accept pending intent (apply it and clear user input) */
  acceptPendingIntent: () => void;
  /** Reject pending intent (discard it, keep user input) */
  rejectPendingIntent: () => void;
  /** Clear FDC3 intent data */
  clearFdc3Intent: () => void;
}

export const createFdc3IntentSlice: StateCreator<
  BoundState,
  [["zustand/immer", never]],
  [],
  Fdc3IntentSlice
> = (set, get) => ({
  fdc3Intent: null,
  fdc3IntentMeta: null,
  fdc3IntentQueue: [],
  hasPendingFdc3Intent: false,
  pendingFdc3Intent: null,

  setFdc3Intent: (data, sourceApp) =>
    set((state) => {
      const intentId = generateId();
      const receivedAt = Date.now();

      state.fdc3Intent = {
        ...data,
        receivedAt,
        acknowledged: true,
      };

      state.fdc3IntentMeta = {
        intentId,
        receivedAt,
        sourceApp,
        status: "applied",
      };

      // Clear user input when new intent is applied
      // This ensures FDC3 data takes precedence
      state.dirtyValues = {};

      // Clear any pending intent
      state.hasPendingFdc3Intent = false;
      state.pendingFdc3Intent = null;

      console.log(`[FDC3IntentSlice] Intent applied:`, { intentId, data, sourceApp });
    }),

  queueFdc3Intent: (data, sourceApp) =>
    set((state) => {
      const intentId = generateId();
      const receivedAt = Date.now();

      state.fdc3IntentQueue.push({
        data: { ...data, receivedAt },
        meta: {
          intentId,
          receivedAt,
          sourceApp,
          status: "pending",
        },
      });

      console.log(`[FDC3IntentSlice] Intent queued (app not ready):`, { intentId, data });
    }),

  processIntentQueue: () => {
    const queue = get().fdc3IntentQueue;

    if (queue.length === 0) return;

    // Process only the most recent intent (discard older ones)
    const latestIntent = queue[queue.length - 1];

    set((state) => {
      state.fdc3Intent = {
        ...latestIntent.data,
        acknowledged: true,
      };
      state.fdc3IntentMeta = {
        ...latestIntent.meta,
        status: "applied",
      };

      // Clear the queue
      state.fdc3IntentQueue = [];

      // Clear user input
      state.dirtyValues = {};

      console.log(`[FDC3IntentSlice] Queued intent processed:`, latestIntent);
    });
  },

  setPendingFdc3Intent: (data) =>
    set((state) => {
      state.pendingFdc3Intent = data;
      state.hasPendingFdc3Intent = data !== null;
    }),

  acceptPendingIntent: () => {
    const pending = get().pendingFdc3Intent;
    if (!pending) return;

    // Apply the pending intent
    get().setFdc3Intent(pending);
  },

  rejectPendingIntent: () =>
    set((state) => {
      if (state.fdc3IntentMeta) {
        state.fdc3IntentMeta.status = "rejected";
      }
      state.hasPendingFdc3Intent = false;
      state.pendingFdc3Intent = null;

      console.log(`[FDC3IntentSlice] Pending intent rejected by user`);
    }),

  clearFdc3Intent: () =>
    set((state) => {
      state.fdc3Intent = null;
      state.fdc3IntentMeta = null;
      state.hasPendingFdc3Intent = false;
      state.pendingFdc3Intent = null;
    }),
});
