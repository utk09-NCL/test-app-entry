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
 * Auto-Grab Level Feature:
 * - When conditions are met, level is computed from current ticking price
 * - BUY side uses currentBuyPrice (ask), SELL side uses currentSellPrice (bid)
 * - Stops when user manually edits level or FDC3 provides level
 *
 * Used by: FieldRenderer (form display), ValidationSlice, SubmissionSlice.
 */

import { StateCreator } from "zustand";

import { OrderSide, OrderStateData, OrderType } from "../../types/domain";
import { BoundState, DerivedSlice } from "../../types/store";

/**
 * Order types that have the level field visible.
 * Used to determine if auto-grab should be active.
 */
const LEVEL_ORDER_TYPES: OrderType[] = [
  OrderType.TAKE_PROFIT,
  OrderType.STOP_LOSS,
  OrderType.POUNCE,
  OrderType.CALL_LEVEL,
  OrderType.FLOAT,
];

/**
 * Helper to merge defined values from a source into target.
 * Only copies values that are not undefined.
 *
 * @param target - Object to merge into
 * @param source - Object to merge from
 */
const mergeDefined = (target: Partial<OrderStateData>, source: Partial<OrderStateData>): void => {
  Object.keys(source).forEach((key) => {
    const value = source[key as keyof OrderStateData];
    if (value !== undefined) {
      (target as Record<string, unknown>)[key] = value;
    }
  });
};

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
    // Higher priority than user prefs, lower than user input
    if (fdc3Intent) {
      mergeDefined(merged, fdc3Intent as Partial<OrderStateData>);
    }

    // Apply user input (Priority 4 - highest)
    // User edits always win - they override everything
    mergeDefined(merged, userInput);

    // Add execution status if available (for display)
    const executionStatus = get().orderStatus;
    if (executionStatus && merged.execution) {
      // Note: execution is read-only from subscription, don't override
    }

    // ============================================
    // AUTO-GRAB LEVEL COMPUTATION
    // ============================================
    // Compute level from ticking price when auto-grab conditions are met:
    // 1. Order type has level field visible
    // 2. User hasn't manually edited level (not in dirtyValues)
    // 3. FDC3 hasn't provided level
    // 4. Prices are available (> 0)
    const currentBuyPrice = get().currentBuyPrice;
    const currentSellPrice = get().currentSellPrice;
    const orderType = merged.orderType as OrderType;
    const side = merged.side as OrderSide;

    const isLevelOrderType = LEVEL_ORDER_TYPES.includes(orderType);
    const userHasNotEditedLevel = userInput.level === undefined;
    const fdc3HasNoLevel = fdc3Intent?.level === undefined;
    const pricesAvailable = currentBuyPrice > 0 && currentSellPrice > 0;

    if (isLevelOrderType && userHasNotEditedLevel && fdc3HasNoLevel && pricesAvailable) {
      // Auto-grab: set level based on side direction
      // BUY orders use ask price (currentBuyPrice)
      // SELL orders use bid price (currentSellPrice)
      merged.level = side === OrderSide.BUY ? currentBuyPrice : currentSellPrice;
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
