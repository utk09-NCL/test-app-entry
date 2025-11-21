import { StateCreator } from "zustand";

import { BoundState, RefDataSlice } from "../../types/store";

export const createRefDataSlice: StateCreator<
  BoundState,
  [["zustand/immer", never]],
  [],
  RefDataSlice
> = (set) => ({
  accounts: [],
  pools: [],
  currencyPairs: [],
  isLoadingRefData: true,
  setRefData: (data) =>
    set((state) => {
      state.accounts = data.accounts;
      state.pools = data.pools;
      state.currencyPairs = data.currencyPairs;
      state.isLoadingRefData = false;
    }),
});
