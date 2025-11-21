import * as v from "valibot";

import { NOTIONAL_LIMITS, PRICE_CONFIG } from "./constants";

// Common schemas
const notionalSchema = v.pipe(
  v.number("Amount must be a number"),
  v.minValue(NOTIONAL_LIMITS.MIN, "Minimum amount is 1"),
  v.maxValue(NOTIONAL_LIMITS.MAX, "Amount exceeds pool limit")
);

const priceSchema = v.pipe(
  v.number("Price must be a number"),
  v.minValue(PRICE_CONFIG.MIN_VALID_PRICE, "Price must be positive")
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
  timeInForce: v.optional(v.nullish(requiredString)),
  orderId: v.optional(v.nullish(v.string())),
  stopPrice: v.optional(v.nullish(v.number())),
  startTime: v.optional(v.nullish(v.string())),
  notes: v.optional(v.nullish(v.string())),
});

export const MarketOrderSchema = v.object({
  symbol: requiredString,
  direction: requiredString,
  orderType: requiredString,
  notional: notionalSchema,
  account: requiredString,
  liquidityPool: requiredString,
  timeInForce: v.optional(v.nullish(requiredString)),
  orderId: v.optional(v.nullish(v.string())),
  limitPrice: v.optional(v.nullish(v.number())),
  stopPrice: v.optional(v.nullish(v.number())),
  startTime: v.optional(v.nullish(v.string())),
  notes: v.optional(v.nullish(v.string())),
});

export const FloatOrderSchema = v.object({
  symbol: requiredString,
  direction: requiredString,
  orderType: requiredString,
  notional: notionalSchema,
  limitPrice: v.optional(v.nullish(priceSchema)), // Optional for FLOAT
  account: requiredString,
  orderId: v.optional(v.nullish(v.string())),
  liquidityPool: v.optional(v.nullish(v.string())),
  timeInForce: v.optional(v.nullish(requiredString)),
  stopPrice: v.optional(v.nullish(v.number())),
  startTime: v.optional(v.nullish(v.string())),
  notes: v.optional(v.nullish(v.string())),
});

// Map schemas to types
export const SCHEMA_MAP: Record<string, v.GenericSchema> = {
  LIMIT: LimitOrderSchema,
  MARKET: MarketOrderSchema,
  TAKE_PROFIT: LimitOrderSchema, // Reusing Limit for demo
  STOP_LOSS: LimitOrderSchema, // Reusing Limit for demo
  FLOAT: FloatOrderSchema,
};
