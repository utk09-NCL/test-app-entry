/**
 * Derived Slice - Computed values from multiple state layers.
 *
 * This slice computes the final form state by merging multiple layers:
 * 1. Defaults (hardcoded values) - Priority 1
 * 2. User Preferences (from server) - Priority 2
 * 3. FDC3 Intent (from external app) - Priority 3
 * 4. User Input (manual edits) - Priority 4 (highest)
 *
 * Higher priority values override lower priority values.
 *
 * Used by: FieldRenderer (form display), ValidationSlice, SubmissionSlice.
 */

import { StateCreator } from "zustand";

import { OrderStateData } from "../../types/domain";
import { BoundState, DerivedSlice } from "../../types/store";

export const createDerivedSlice: StateCreator<
  BoundState,
  [["zustand/immer", never]],
  [],
  DerivedSlice
> = (_set, get) => ({
  /**
   * Get the final merged order state using priority-based layering.
   *
   * Priority Order (lowest to highest):
   * 1. Defaults (hardcoded values)
   * 2. User Preferences (from server subscription)
   * 3. FDC3 Intent (from external app)
   * 4. User Input (manual edits - highest priority)
   *
   * Higher priority values override lower priority values.
   * This ensures FDC3 intents work correctly regardless of load timing.
   */
  getDerivedValues: () => {
    // Layer 1: Hardcoded defaults (Priority 1)
    const defaults = get().defaults;

    // Layer 2: User preferences (Priority 2)
    const userPrefs = get().userPrefs;

    // Layer 3: FDC3 intent data (Priority 3)
    const fdc3Intent = get().fdc3Intent;

    // Layer 4: User manual input (Priority 4 - highest)
    const userInput = get().dirtyValues;

    // Build merged object with priority-based override
    // Start with defaults, then layer on higher priority sources
    const merged: Partial<OrderStateData> = { ...defaults };

    // Get accounts list for resolving account string to object
    const accounts = get().accounts;

    // Apply user preferences (Priority 2)
    if (userPrefs.defaultAccount && !fdc3Intent?.account && !userInput.account) {
      // Resolve account string to account object from accounts list
      const matchedAccount = accounts.find((acc) => acc.name === userPrefs.defaultAccount);
      if (matchedAccount) {
        merged.account = { name: matchedAccount.name, sdsId: matchedAccount.sdsId };
      }
    }
    if (userPrefs.defaultLiquidityPool && !fdc3Intent?.liquidityPool && !userInput.liquidityPool) {
      merged.liquidityPool = userPrefs.defaultLiquidityPool;
    }
    if (userPrefs.defaultOrderType && !fdc3Intent?.orderType && !userInput.orderType) {
      merged.orderType = userPrefs.defaultOrderType as OrderStateData["orderType"];
    }

    // Apply FDC3 intent data (Priority 3)
    if (fdc3Intent) {
      if (fdc3Intent.currencyPair !== undefined) merged.currencyPair = fdc3Intent.currencyPair;
      if (fdc3Intent.side !== undefined) merged.side = fdc3Intent.side as OrderStateData["side"];
      if (fdc3Intent.orderType !== undefined)
        merged.orderType = fdc3Intent.orderType as OrderStateData["orderType"];
      if (fdc3Intent.amount !== undefined) merged.amount = fdc3Intent.amount;
      if (fdc3Intent.level !== undefined) merged.level = fdc3Intent.level;
      if (fdc3Intent.account !== undefined) merged.account = fdc3Intent.account;
      if (fdc3Intent.liquidityPool !== undefined) merged.liquidityPool = fdc3Intent.liquidityPool;
      if (fdc3Intent.orderId !== undefined) merged.orderId = fdc3Intent.orderId;
    }

    // Apply user input (Priority 4 - highest)
    // User edits always win
    Object.keys(userInput).forEach((key) => {
      const value = userInput[key as keyof OrderStateData];
      if (value !== undefined) {
        (merged as Record<string, unknown>)[key] = value;
      }
    });

    // Add execution status if available (for display)
    const executionStatus = get().orderStatus;
    if (executionStatus && merged.execution) {
      // Note: execution is read-only from subscription, don't override
    }

    return merged as OrderStateData;
  },

  /**
   * Check if user has made any edits.
   * Used to enable "Reset" button or show unsaved changes warning.
   */
  isDirty: () => {
    return Object.keys(get().dirtyValues).length > 0;
  },

  /**
   * Check if form is valid (no errors).
   * Used to enable/disable Submit button.
   */
  isFormValid: () => {
    const s = get();
    return (
      Object.keys(s.errors).length === 0 &&
      Object.keys(s.serverErrors).length === 0 &&
      Object.keys(s.refDataErrors).length === 0
    );
  },
});
