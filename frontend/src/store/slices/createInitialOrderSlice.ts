/**
 * Initial Order Slice - Default Values and Order Presets
 *
 * This slice manages the "base" state of the order - the default values
 * before any user interaction.
 *
 * baseValues vs dirtyValues:
 * - baseValues: Server-provided defaults or presets (e.g., from FDC3 context)
 * - dirtyValues: User edits (overlay on top of baseValues)
 * - Final order = { ...baseValues, ...dirtyValues }
 *
 * Why this split?
 * - Enables "Reset to Default" functionality
 * - Tracks which fields user actually changed (for analytics)
 * - Supports pre-population from external systems (FDC3, URL params)
 *
 * Example Flow:
 * 1. App loads → baseValues set to DEFAULT_VALUES
 * 2. FDC3 intent received → baseValues updated with context
 * 3. User edits field → dirtyValues[field] = newValue
 * 4. Form shows: { ...baseValues, ...dirtyValues }
 *
 * Used by: useAppInit (initial load), OrderForm (FDC3 integration).
 */

import { StateCreator } from "zustand";

import { BoundState, InitialOrderSlice } from "../../types/store";

/**
 * Default order values when app starts.
 * These represent a "typical" order for quick testing/demos.
 *
 * Note: `account` is intentionally omitted as the actual account should come from server reference data or user preferences.
 * `liquidityPool` is set to "Hybrid" as the default pool.
 */
const DEFAULT_VALUES = {
  symbol: "GBPUSD", // Most commonly traded pair
  direction: "BUY" as const,
  orderType: "LIMIT" as const, // Safest default (requires price)
  timeInForce: "GTC" as const, // Good Till Cancel (most common)
  notional: 1000000, // 1 million units (standard institutional size)
  liquidityPool: "Hybrid", // Default liquidity source
  // account is intentionally omitted - will be populated from server data or user preferences
};

export const createInitialOrderSlice: StateCreator<
  BoundState,
  [["zustand/immer", never]],
  [],
  InitialOrderSlice
> = (set) => ({
  /** Base order values (defaults or server-provided presets) */
  baseValues: DEFAULT_VALUES,

  /**
   * Update base values (used for FDC3 context or server-side presets).
   * Merges with existing baseValues to preserve fields not in the update.
   */
  setBaseValues: (values) =>
    set((state) => {
      state.baseValues = { ...state.baseValues, ...values };
    }),
});
