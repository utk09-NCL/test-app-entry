import { StateCreator } from "zustand";

import { BoundState, InitialOrderSlice } from "../../types/store";

const DEFAULT_VALUES = {
  symbol: "GBPUSD",
  direction: "BUY" as const,
  orderType: "LIMIT" as const,
  timeInForce: "GTC" as const,
  notional: 1000000,
  liquidityPool: "GATOR_POOL_1",
  account: "ACC-001",
};

export const createInitialOrderSlice: StateCreator<
  BoundState,
  [["zustand/immer", never]],
  [],
  InitialOrderSlice
> = (set) => ({
  baseValues: DEFAULT_VALUES,
  setBaseValues: (values) =>
    set((state) => {
      state.baseValues = { ...state.baseValues, ...values };
    }),
});
