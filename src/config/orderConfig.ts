import { OrderStateData, OrderType } from "../types/domain";

export interface OrderConfig {
  fields: (keyof OrderStateData)[];
  initialFocus: keyof OrderStateData;
}

export const ORDER_TYPES: Record<OrderType, OrderConfig> = {
  MARKET: {
    fields: ["direction", "liquidityPool", "notional", "timeInForce", "account"],
    initialFocus: "notional",
  },
  LIMIT: {
    fields: ["direction", "liquidityPool", "notional", "limitPrice", "timeInForce", "account"],
    initialFocus: "limitPrice",
  },
  TAKE_PROFIT: {
    fields: ["direction", "liquidityPool", "notional", "limitPrice", "timeInForce", "account"],
    initialFocus: "limitPrice",
  },
  STOP_LOSS: {
    fields: ["direction", "liquidityPool", "notional", "stopPrice", "timeInForce", "account"],
    initialFocus: "stopPrice",
  },
};
