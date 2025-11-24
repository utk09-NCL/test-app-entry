/**
 * Price Slice - Current Market Prices
 *
 * This slice stores the latest market prices for the selected currency pair.
 * Prices are updated by the TickingPrice component via simulation (in prod,
 * would come from real-time market data feed).
 *
 * Why store prices in global state?
 * - Multiple components need current prices (TickingPrice display, LimitPriceWithCheckbox grab)
 * - Avoids prop drilling through multiple layers
 * - Single source of truth for market data
 *
 * Price Flow:
 * 1. TickingPrice component updates prices every 1 second
 * 2. Prices stored in this slice via setCurrentPrices
 * 3. LimitPriceWithCheckbox reads prices when "Grab" checkbox clicked
 *
 * Used by: TickingPrice (updates), LimitPriceWithCheckbox (reads).
 */

import { StateCreator } from "zustand";

import { BoundState, PriceSlice } from "../../types/store";

export const createPriceSlice: StateCreator<
  BoundState,
  [["zustand/immer", never]],
  [],
  PriceSlice
> = (set) => ({
  /**
   * Current buy price (ask) - price at which user can BUY the pair.
   * For GBPUSD = 1.27345, user pays $1.27345 for each £1.
   */
  currentBuyPrice: 1.27345,

  /**
   * Current sell price (bid) - price at which user can SELL the pair.
   * Typically slightly lower than buy price (spread).
   */
  currentSellPrice: 1.27325,

  /**
   * Update both buy and sell prices atomically.
   * Called by TickingPrice every tick interval.
   */
  setCurrentPrices: (buyPrice, sellPrice) =>
    set((state) => {
      state.currentBuyPrice = buyPrice;
      state.currentSellPrice = sellPrice;
    }),
});
