import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

import { BoundState } from "../types/store";

import { loggerMiddleware } from "./middleware/logger";
import { createAppSlice } from "./slices/createAppSlice";
import { createComputedSlice } from "./slices/createComputedSlice";
import { createInitialOrderSlice } from "./slices/createInitialOrderSlice";
import { createPriceSlice } from "./slices/createPriceSlice";
import { createRefDataSlice } from "./slices/createRefDataSlice";
import { createUserInteractionSlice } from "./slices/createUserInteractionSlice";

export const useOrderEntryStore = create<BoundState>()(
  loggerMiddleware(
    devtools(
      immer((...a) => ({
        ...createAppSlice(...a),
        ...createRefDataSlice(...a),
        ...createInitialOrderSlice(...a),
        ...createUserInteractionSlice(...a),
        ...createComputedSlice(...a),
        ...createPriceSlice(...a),
      })),
      { name: "Order_Entry_Store" }
    )
  )
);

declare global {
  interface Window {
    __ORDER_STORE__: typeof useOrderEntryStore;
  }
}

window.__ORDER_STORE__ = useOrderEntryStore;
