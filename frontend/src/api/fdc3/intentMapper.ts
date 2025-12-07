/**
 * Intent Mapper - FDC3 Context to Order State Conversion
 *
 * Maps FDC3 context (external data) to our internal OrderStateData shape.
 * This allows external applications to pre-populate our order form.
 *
 * Example Flow:
 * 1. User clicks "Trade" in Bloomberg terminal
 * 2. Bloomberg broadcasts FDC3 "OrderEntry" intent with context:
 *    { ticker: "GBP/USD", amount: 2500000, side: "SELL", type: "TAKE_PROFIT" }
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

import { OrderSide, OrderStateData, OrderType } from "../../types/domain";

/**
 * FDC3 context shape (subset of spec).
 * Real FDC3 contexts have more fields, but we only map what we need.
 */
interface Fdc3Context {
  /** Instrument identifier (e.g., { ticker: "GBP/USD" }) */
  id?: { ticker?: string };
  /** Custom data (app-specific, not part of FDC3 standard) */
  customData?: {
    amount?: number | string; // Amount value
    ccy?: string; // Currency for amount
    side?: string; // BUY or SELL
    type?: string; // Order type (uses OrderType values like TAKE_PROFIT, FLOAT, etc.)
    level?: number | string; // Price level
    orderId?: string; // For amending existing orders
    accountName?: string; // Account name
    accountSdsId?: number; // Account sdsId
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
 *   customData: { amount: 2500000, ccy: "GBP", side: "SELL", type: "TAKE_PROFIT" }
 * };
 * const partial = mapContextToOrder(context);
 * // Result: { currencyPair: "GBPUSD", amount: { amount: 2500000, ccy: "GBP" }, side: "SELL" }
 */
export const mapContextToOrder = (context: unknown): Partial<OrderStateData> => {
  const ctx = context as Fdc3Context;
  const partial: Partial<OrderStateData> = {};

  // Map currencyPair (remove slash if present: "GBP/USD" → "GBPUSD")
  if (ctx.id && ctx.id.ticker) {
    partial.currencyPair = ctx.id.ticker.replace(/\//g, "");
  }

  // Map custom data (app-specific fields)
  if (ctx.customData) {
    // Amount (ensure numeric) with currency
    if (ctx.customData.amount) {
      const ccy = ctx.customData.ccy || "USD"; // Default to USD if not provided
      partial.amount = {
        amount: Number(ctx.customData.amount),
        ccy,
      };
    }

    // Side (BUY or SELL)
    if (ctx.customData.side) {
      partial.side = ctx.customData.side as OrderSide;
    }

    // Order type (uses OrderType enum values)
    if (ctx.customData.type) {
      partial.orderType = ctx.customData.type as OrderType;
    }

    // Level/price (ensure numeric)
    if (ctx.customData.level) {
      partial.level = Number(ctx.customData.level);
    }

    // Order ID (for amending existing orders)
    if (ctx.customData.orderId) {
      partial.orderId = ctx.customData.orderId;
    }

    // Account (complex type)
    if (ctx.customData.accountName) {
      partial.account = {
        name: ctx.customData.accountName,
        sdsId: ctx.customData.accountSdsId || 0,
      };
    }
  }

  return partial;
};
