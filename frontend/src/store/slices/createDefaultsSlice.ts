/**
 * Defaults Slice - Hardcoded Application Defaults (Priority 1)
 *
 * This slice provides the lowest priority layer of form state.
 * These values are used as fallbacks when no other layer provides a value.
 *
 * Priority: 1 (lowest)
 * Overridden by: User Preferences, FDC3 Intents, User Input
 *
 * Why separate from InitialOrderSlice?
 * - Defaults are truly static (hardcoded, never change at runtime)
 * - InitialOrderSlice was mixing defaults with dynamic data (FDC3, prefs)
 * - This separation enables proper priority-based merging
 */

import { StateCreator } from "zustand";

import {
  ExpiryStrategy,
  OrderSide,
  OrderStateData,
  OrderType,
  StartMode,
} from "../../types/domain";
import { DefaultsLayerData } from "../../types/layers";
import { BoundState } from "../../types/store";

/**
 * Default values when app starts.
 * These represent sensible defaults for a new order.
 * Uses server-aligned naming (currencyPair, side, amount).
 */
export const HARDCODED_DEFAULTS: DefaultsLayerData = {
  currencyPair: "GBPUSD",
  side: OrderSide.BUY,
  orderType: OrderType.FLOAT,
  amount: { amount: 1000000, ccy: "GBP" },
  liquidityPool: "Hybrid",
  startMode: StartMode.START_NOW,
  expiry: { strategy: ExpiryStrategy.GTC },
};

/**
 * Defaults Slice Interface
 */
export interface DefaultsSlice {
  /** Hardcoded default values (never change at runtime) */
  defaults: DefaultsLayerData;
  /** Get a default value for a specific field */
  getDefault: <K extends keyof DefaultsLayerData>(field: K) => DefaultsLayerData[K];
}

export const createDefaultsSlice: StateCreator<
  BoundState,
  [["zustand/immer", never]],
  [],
  DefaultsSlice
> = () => ({
  defaults: HARDCODED_DEFAULTS,

  getDefault: <K extends keyof DefaultsLayerData>(field: K): DefaultsLayerData[K] => {
    return HARDCODED_DEFAULTS[field];
  },
});

/**
 * Helper to get full OrderStateData with defaults filled in.
 * Used when computing derived values.
 */
export const getDefaultOrderState = (): Partial<OrderStateData> => ({
  ...HARDCODED_DEFAULTS,
});
