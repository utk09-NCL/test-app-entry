/**
 * Reference Data Slice - Server-Loaded Dropdown Options
 *
 * This slice stores "reference data" - static lists loaded from the server
 * that populate dropdowns throughout the app.
 *
 * Reference data includes:
 * - accounts: Trading accounts user can submit to
 * - pools: Liquidity pools for order routing
 * - currencyPairs: Available currency pairs for trading
 *
 * Why separate from form state?
 * - Loaded once on app init (not per-order)
 * - Shared across all order types
 * - Enables loading indicator during initialization
 *
 * Loading Flow:
 * 1. App starts → status = INITIALIZING, isLoadingRefData = true
 * 2. useAppInit fetches data from API
 * 3. setRefData called → populates arrays, isLoadingRefData = false
 * 4. App status → READY
 *
 * Used by: useAppInit (loads data), Select components (render options).
 */

import { StateCreator } from "zustand";

import { BoundState, RefDataSlice } from "../../types/store";

export const createRefDataSlice: StateCreator<
  BoundState,
  [["zustand/immer", never]],
  [],
  RefDataSlice
> = (set) => ({
  /** Trading accounts available for order submission */
  accounts: [],

  /** Liquidity pools for order routing (e.g., "GATOR_POOL_1", "BANK_A") */
  pools: [],

  /** Currency pairs available for trading (e.g., "GBPUSD", "EURUSD") */
  currencyPairs: [],

  /** Order types user is entitled to (from server) */
  entitledOrderTypes: [],

  /** Loading state for reference data fetch */
  isLoadingRefData: true,

  /**
   * Set all reference data at once.
   * Called after successful API fetch in useAppInit.
   */
  setRefData: (data) =>
    set((state) => {
      state.accounts = data.accounts;
      state.pools = data.pools;
      state.currencyPairs = data.currencyPairs;
      state.entitledOrderTypes = data.entitledOrderTypes;
      state.isLoadingRefData = false; // Loading complete
    }),
});
