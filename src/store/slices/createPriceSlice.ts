import { StateCreator } from "zustand";

import { BoundState, PriceSlice } from "../../types/store";

export const createPriceSlice: StateCreator<
  BoundState,
  [["zustand/immer", never]],
  [],
  PriceSlice
> = (set) => ({
  currentBuyPrice: 1.27345,
  currentSellPrice: 1.27325,
  setCurrentPrices: (buyPrice, sellPrice) =>
    set((state) => {
      state.currentBuyPrice = buyPrice;
      state.currentSellPrice = sellPrice;
    }),
});
