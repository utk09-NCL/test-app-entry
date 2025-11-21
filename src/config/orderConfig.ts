import { OrderStateData, OrderType } from "../types/domain";

export interface OrderConfig {
  fields: (keyof OrderStateData)[];
  initialFocus: keyof OrderStateData;
  editableFields: (keyof OrderStateData)[]; // Fields that can be edited in READ_ONLY mode via double-click
}

export const ORDER_TYPES: Record<OrderType, OrderConfig> = {
  MARKET: {
    fields: ["direction", "liquidityPool", "notional", "timeInForce", "account"],
    initialFocus: "notional",
    editableFields: ["notional", "timeInForce"],
  },
  LIMIT: {
    fields: ["direction", "liquidityPool", "notional", "limitPrice", "timeInForce", "account"],
    initialFocus: "limitPrice",
    editableFields: ["notional", "limitPrice", "timeInForce"],
  },
  TAKE_PROFIT: {
    fields: ["direction", "liquidityPool", "notional", "limitPrice", "timeInForce", "account"],
    initialFocus: "limitPrice",
    editableFields: ["notional", "limitPrice", "timeInForce"],
  },
  STOP_LOSS: {
    fields: ["direction", "liquidityPool", "notional", "stopPrice", "timeInForce", "account"],
    initialFocus: "stopPrice",
    editableFields: ["notional", "stopPrice", "timeInForce"],
  },
  FLOAT: {
    fields: ["direction", "notional", "limitPrice", "account"],
    initialFocus: "notional",
    editableFields: ["notional", "limitPrice"],
  },
};
