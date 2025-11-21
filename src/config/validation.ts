import * as v from "valibot";

// Common schemas
const notionalSchema = v.pipe(
  v.number("Amount must be a number"),
  v.minValue(1000, "Minimum amount is 1,000"),
  v.maxValue(1000000000, "Amount exceeds pool limit")
);

const priceSchema = v.pipe(
  v.number("Price must be a number"),
  v.minValue(0.00001, "Price must be positive")
);

const requiredString = v.pipe(v.string("Required"), v.minLength(1, "Required"));

// Order Type Specific Schemas
export const LimitOrderSchema = v.object({
  symbol: requiredString,
  direction: requiredString,
  orderType: requiredString,
  notional: notionalSchema,
  limitPrice: priceSchema,
  account: requiredString,
  liquidityPool: requiredString,
  timeInForce: v.optional(requiredString),
});

export const MarketOrderSchema = v.object({
  symbol: requiredString,
  direction: requiredString,
  orderType: requiredString,
  notional: notionalSchema,
  account: requiredString,
  liquidityPool: requiredString,
  timeInForce: v.optional(requiredString),
});

// Map schemas to types
export const SCHEMA_MAP: Record<string, v.GenericSchema> = {
  LIMIT: LimitOrderSchema,
  MARKET: MarketOrderSchema,
  TAKE_PROFIT: LimitOrderSchema, // Reusing Limit for demo
  STOP_LOSS: LimitOrderSchema, // Reusing Limit for demo
};
