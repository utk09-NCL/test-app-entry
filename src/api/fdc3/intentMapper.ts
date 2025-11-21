/**
 * Intent Mapper - FDC3 Context to Order State Conversion
 *
 * Maps FDC3 context (external data) to our internal OrderStateData shape.
 * This allows external applications to pre-populate our order form.
 *
 * Example Flow:
 * 1. User clicks "Trade" in Bloomberg terminal
 * 2. Bloomberg broadcasts FDC3 "OrderEntry" intent with context:
 *    { ticker: "GBP/USD", amount: 2500000, side: "SELL" }
 * 3. Our app receives intent → intentMapper converts to OrderStateData
 * 4. Store updates baseValues with mapped data
 * 5. Form pre-populates with values
 *
 * Why a separate mapper?
 * - Isolates FDC3-specific logic from business logic
 * - Enables easy testing (mock contexts)
 * - Handles format mismatches (e.g., "GBP/USD" → "GBPUSD")
 *
 * Used by: useAppInit to process FDC3 contexts.
 */

import { Direction, OrderStateData, OrderType } from "../../types/domain";

/**
 * FDC3 context shape (subset of spec).
 * Real FDC3 contexts have more fields, but we only map what we need.
 */
interface Fdc3Context {
  /** Instrument identifier (e.g., { ticker: "GBP/USD" }) */
  id?: { ticker?: string };
  /** Custom data (app-specific, not part of FDC3 standard) */
  customData?: {
    amount?: number | string; // Notional amount
    side?: string; // BUY or SELL
    type?: string; // Order type (LIMIT, MARKET, etc.)
    limitPrice?: number | string; // Limit price
    orderId?: string; // For amending existing orders
  };
}

/**
 * Map FDC3 context to partial OrderStateData.
 *
 * @param context - FDC3 context (unknown type for flexibility)
 * @returns Partial order state to merge with baseValues
 *
 * @example
 * const context = {
 *   id: { ticker: "GBP/USD" },
 *   customData: { amount: 2500000, side: "SELL" }
 * };
 * const partial = mapContextToOrder(context);
 * // Result: { symbol: "GBPUSD", notional: 2500000, direction: "SELL" }
 */
export const mapContextToOrder = (context: unknown): Partial<OrderStateData> => {
  const ctx = context as Fdc3Context;
  const partial: Partial<OrderStateData> = {};

  // Map symbol (remove slash if present: "GBP/USD" → "GBPUSD")
  if (ctx.id && ctx.id.ticker) {
    partial.symbol = ctx.id.ticker.replace(/\//g, "");
  }

  // Map custom data (app-specific fields)
  if (ctx.customData) {
    // Notional amount (ensure numeric)
    if (ctx.customData.amount) {
      partial.notional = Number(ctx.customData.amount);
    }

    // Direction (BUY or SELL)
    if (ctx.customData.side) {
      partial.direction = ctx.customData.side as Direction;
    }

    // Order type (LIMIT, MARKET, etc.)
    if (ctx.customData.type) {
      partial.orderType = ctx.customData.type as OrderType;
    }

    // Limit price (ensure numeric)
    if (ctx.customData.limitPrice) {
      partial.limitPrice = Number(ctx.customData.limitPrice);
    }

    // Order ID (for amending existing orders)
    if (ctx.customData.orderId) {
      partial.orderId = ctx.customData.orderId;
    }
  }

  return partial;
};
