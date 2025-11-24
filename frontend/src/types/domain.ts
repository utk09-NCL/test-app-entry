/**
 * Domain Types - Business Entities and Models
 *
 * This file defines the core business domain for FX order entry:
 * - Order types (LIMIT, MARKET, STOP_LOSS, etc.)
 * - Reference data entities (Account, LiquidityPool, CurrencyPair)
 * - Order state shape (OrderStateData)
 *
 * Why separate from store types?
 * - Domain types represent business concepts (can be shared with backend)
 * - Store types represent UI state structure (Zustand-specific)
 * - Clean separation enables reuse in APIs, services, and tests
 */

/** Order direction - BUY or SELL */
export type Direction = "BUY" | "SELL";

/**
 * Order type - determines which fields are required and how order is executed.
 * - LIMIT: Execute at specified price or better
 * - MARKET: Execute immediately at best available price
 * - STOP_LOSS: Close position to limit losses
 * - TAKE_PROFIT: Close position when profit target reached
 * - FLOAT: Special order type with optional limit price
 */
export type OrderType = "LIMIT" | "MARKET" | "STOP_LOSS" | "TAKE_PROFIT" | "FLOAT";

/**
 * Time In Force - how long order remains active.
 * - GTC: Good Till Cancel (open until filled or cancelled)
 * - GTD: Good Till Date (open until specified date)
 * - IOC: Immediate Or Cancel (fill immediately or cancel)
 * - FOK: Fill Or Kill (fill completely or cancel)
 */
export type TimeInForce = "GTC" | "GTD" | "IOC" | "FOK";

/**
 * Order status after submission (server-side states).
 * Not used in UI state - this is for viewing submitted orders.
 */
export type OrderStatus =
  | "PENDING"
  | "FILLED"
  | "PARTIALLY_FILLED"
  | "CANCELLED"
  | "REJECTED"
  | "NEW";

/**
 * Trading account - where order will be submitted.
 */
export interface Account {
  id: string; // e.g., "ACC-001"
  name: string; // e.g., "Trading Account 1"
  currency: string; // e.g., "USD"
}

/**
 * Liquidity pool - source of market liquidity for order execution.
 */
export interface LiquidityPool {
  id: string; // e.g., "GATOR_POOL_1"
  name: string; // e.g., "Gator Pool"
  provider: string; // e.g., "Bank A"
}

/**
 * Currency pair - asset being traded.
 */
export interface CurrencyPair {
  symbol: string; // e.g., "GBPUSD", "EURUSD"
  base: string; // e.g., "GBP" (what you're buying/selling)
  quote: string; // e.g., "USD" (what you're paying with)
  precision: number; // Decimal places for price display
}

/**
 * Order State Data - the complete shape of an order in the form.
 * This is the "single source of truth" for what constitutes a valid order.
 *
 * Used throughout the app:
 * - Store: baseValues + dirtyValues merge to this shape
 * - Validation: Valibot schemas validate this shape
 * - Submission: API receives this shape (minus UI-only fields)
 */
export interface OrderStateData {
  orderId?: string; // Present if amending existing order
  symbol: string; // Currency pair (e.g., "GBPUSD")
  direction: Direction; // BUY or SELL
  orderType: OrderType; // LIMIT, MARKET, etc.
  notional: number; // Amount to trade (e.g., 1,000,000)
  limitPrice?: number; // Required for LIMIT/TAKE_PROFIT, optional for FLOAT
  stopPrice?: number; // Required for STOP_LOSS
  liquidityPool: string; // Where to route order
  account: string; // Which account to use
  timeInForce: TimeInForce; // How long order stays active
  startTime?: string; // ISO timestamp for scheduled orders
  notes?: string; // User notes (not used in validation)
}

/**
 * Validation error - returned from server or client validation.
 * Not currently used in UI (we use simple string errors).
 */
export interface ValidationError {
  field: string;
  message: string;
  type: "SOFT" | "HARD"; // SOFT = warning, HARD = blocking error
}
