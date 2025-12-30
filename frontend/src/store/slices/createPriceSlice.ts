/**
 * Price Slice - Current Market Prices and Auto-Grab Tracking
 *
 * This slice stores the latest market prices for the selected currency pair.
 * Prices are updated by the TickingPrice component via WebSocket subscription
 * (or simulation in dev mode).
 *
 * Why store prices in global state?
 * - Multiple components need current prices (TickingPrice display, level field auto-grab)
 * - Avoids prop drilling through multiple layers
 * - Single source of truth for market data
 *
 * Auto-Grab Feature:
 * - Level field automatically shows ticking price based on side (BUY→ask, SELL→bid)
 * - Continues until user manually edits the field
 * - lastGrabbedSide tracks the side for proper price direction
 *
 * Price Flow:
 * 1. TickingPrice component subscribes to GATOR_DATA_SUBSCRIPTION
 * 2. Prices stored in this slice via setCurrentPrices (every tick)
 * 3. getDerivedValues() computes level from prices when auto-grab is active
 *
 * Used by: TickingPrice (updates), createDerivedSlice (reads for auto-grab).
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
   * Initial value is 0 (no price available until subscription connects).
   */
  currentBuyPrice: 0,

  /**
   * Current sell price (bid) - price at which user can SELL the pair.
   * Typically slightly lower than buy price (spread).
   * Initial value is 0 (no price available until subscription connects).
   */
  currentSellPrice: 0,

  /**
   * Last side that was used for auto-grab.
   * Used to track side changes for proper price direction switching.
   * null means auto-grab hasn't started yet.
   */
  lastGrabbedSide: null,

  /**
   * Update both buy and sell prices atomically.
   * Called by TickingPrice every tick interval (~3 times per second).
   */
  setCurrentPrices: (buyPrice, sellPrice) =>
    set((state) => {
      state.currentBuyPrice = buyPrice;
      state.currentSellPrice = sellPrice;
    }),

  /**
   * Update the last grabbed side.
   * Called when side changes to track price direction for auto-grab.
   */
  setLastGrabbedSide: (side) =>
    set((state) => {
      state.lastGrabbedSide = side;
    }),
});
