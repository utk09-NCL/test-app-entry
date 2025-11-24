/**
 * Validation Schemas - The "Rules" of Form Fields
 *
 * This file uses Valibot to define validation schemas for each order type.
 * Schemas are pure, declarative definitions that specify:
 * - Required vs optional fields
 * - Data types (number, string, literal)
 * - Constraints (min, max, range)
 * - Error messages shown to users
 *
 * Why Valibot over Zod?
 * - Smaller bundle size (~1KB vs ~14KB)
 * - Tree-shakeable (only bundle what you use)
 * - TypeScript-first design
 *
 * Validation Flow:
 * 1. User types in field → debounced validation
 * 2. User submits order → full schema validation
 * 3. ValiError thrown → parsed to field-level errors
 * 4. Errors displayed inline below field
 *
 * Used by: FieldController and OrderFooter to validate field values and full order state.
 */

import * as v from "valibot";

import { NOTIONAL_LIMITS, PRICE_CONFIG } from "./constants";

/**
 * Reusable field schemas - building blocks for order schemas.
 */

/**
 * Notional amount - base schema with synchronous validation only.
 * Min/max limits prevent unrealistic trades.
 * Async validation (e.g., checking firm limits) happens server-side.
 */
const notionalSchema = v.pipe(
  v.number("Amount must be a number"),
  v.minValue(NOTIONAL_LIMITS.MIN, "Minimum amount is 1"),
  v.maxValue(NOTIONAL_LIMITS.MAX, "Amount exceeds pool limit")
);

/**
 * Price schema - ensures positive number, allows precision up to 5 decimals.
 * Used for limitPrice and stopPrice fields.
 */
const priceSchema = v.pipe(
  v.number("Price must be a number"),
  v.minValue(PRICE_CONFIG.MIN_VALID_PRICE, "Price must be positive")
);

/**
 * Required string - used for dropdowns and critical text fields.
 * Ensures the field is not empty.
 */
const requiredString = v.pipe(v.string("Required"), v.minLength(1, "Required"));

/**
 * Order Type Specific Schemas
 * Each schema defines the shape of an order for validation.
 * Optional fields use v.optional(v.nullish(...)) to allow undefined/null values.
 */

/**
 * Limit Order - executes at specified price or better.
 * Requires: symbol, direction, notional, limitPrice, account, liquidityPool
 */
export const LimitOrderSchema = v.object({
  symbol: requiredString,
  direction: requiredString,
  orderType: requiredString,
  notional: notionalSchema,
  limitPrice: priceSchema, // Required for limit orders
  account: requiredString,
  liquidityPool: requiredString,
  timeInForce: v.optional(v.nullish(requiredString)),
  orderId: v.optional(v.nullish(v.string())), // Present only after submission
  stopPrice: v.optional(v.nullish(v.number())), // Not used in limit orders
  startTime: v.optional(v.nullish(v.string())),
  notes: v.optional(v.nullish(v.string())),
});

/**
 * Market Order - executes immediately at current market price.
 * No limit price required (trades at whatever price is available).
 */
export const MarketOrderSchema = v.object({
  symbol: requiredString,
  direction: requiredString,
  orderType: requiredString,
  notional: notionalSchema,
  account: requiredString,
  liquidityPool: requiredString,
  timeInForce: v.optional(v.nullish(requiredString)),
  orderId: v.optional(v.nullish(v.string())),
  limitPrice: v.optional(v.nullish(v.number())), // Not used in market orders
  stopPrice: v.optional(v.nullish(v.number())), // Not used in market orders
  startTime: v.optional(v.nullish(v.string())),
  notes: v.optional(v.nullish(v.string())),
});

/**
 * Float Order - special order type with optional limit price.
 * No liquidityPool required (FLOAT orders route differently).
 * LimitPrice can be added via "Grab" checkbox in UI.
 */
export const FloatOrderSchema = v.object({
  symbol: requiredString,
  direction: requiredString,
  orderType: requiredString,
  notional: notionalSchema,
  limitPrice: v.optional(v.nullish(priceSchema)), // Optional - can be grabbed from current price
  account: requiredString,
  orderId: v.optional(v.nullish(v.string())),
  liquidityPool: v.optional(v.nullish(v.string())), // Not used in float orders
  timeInForce: v.optional(v.nullish(requiredString)),
  stopPrice: v.optional(v.nullish(v.number())), // Not used in float orders
  startTime: v.optional(v.nullish(v.string())),
  notes: v.optional(v.nullish(v.string())),
});

/**
 * Schema map - lookup table for validation by order type.
 * Used to get the correct schema before validation:
 * ```ts
 * const schema = SCHEMA_MAP[orderState.orderType];
 * v.parse(schema, orderState);
 * ```
 *
 * Note: TAKE_PROFIT and STOP_LOSS reuse LimitOrderSchema for simplicity.
 * In production, they would have their own schemas with stopPrice validation.
 */
export const SCHEMA_MAP: Record<string, v.GenericSchema> = {
  LIMIT: LimitOrderSchema,
  MARKET: MarketOrderSchema,
  TAKE_PROFIT: LimitOrderSchema, // Reusing Limit for demo
  STOP_LOSS: LimitOrderSchema, // Reusing Limit for demo
  FLOAT: FloatOrderSchema,
};
