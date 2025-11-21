import { Direction, OrderStateData, OrderType } from "../../types/domain";

interface Fdc3Context {
  id?: { ticker?: string };
  customData?: {
    amount?: number | string;
    side?: string;
    type?: string;
    limitPrice?: number | string;
    orderId?: string;
  };
}

export const mapContextToOrder = (context: unknown): Partial<OrderStateData> => {
  const ctx = context as Fdc3Context;
  const partial: Partial<OrderStateData> = {};

  if (ctx.id && ctx.id.ticker) {
    // Remove slash from symbol if present (e.g., "GBP/USD" -> "GBPUSD")
    partial.symbol = ctx.id.ticker.replace(/\//g, "");
  }

  // Handling custom data often found in FDC3 intents for orders
  if (ctx.customData) {
    if (ctx.customData.amount) partial.notional = Number(ctx.customData.amount);
    if (ctx.customData.side) partial.direction = ctx.customData.side as Direction;
    if (ctx.customData.type) partial.orderType = ctx.customData.type as OrderType;
    if (ctx.customData.limitPrice) partial.limitPrice = Number(ctx.customData.limitPrice);
    if (ctx.customData.orderId) partial.orderId = ctx.customData.orderId; // For Amend
  }

  return partial;
};
