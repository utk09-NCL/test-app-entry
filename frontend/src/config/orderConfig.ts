/**
 * Order Configuration - The "When and Which" of Form Fields
 *
 * This configuration defines which fields appear for each order type.
 * It controls:
 * - Field visibility (which fields show up)
 * - Field order (top to bottom)
 * - Initial focus (where cursor goes when order type selected)
 * - Editability (which fields can be amended after submission)
 *
 * This enables the "config-driven UI" pattern where the form structure
 * is data, not hard-coded JSX.
 *
 * Used by: OrderForm to dynamically render fields for the selected order type.
 */

import { OrderStateData, OrderType } from "../types/domain";

/**
 * Configuration for a single order type.
 */
export interface OrderConfig {
  /** Array of field keys to display (in order) */
  fields: (keyof OrderStateData)[];
  /** Fields to display in view/amend mode (includes status) */
  viewFields: (keyof OrderStateData)[];
  /** Which field should receive focus when this order type is selected */
  initialFocus: keyof OrderStateData;
  /**
   * Fields that can be edited after order submission (via double-click in read-only mode).
   * Typically includes: notional, price, time in force
   * Excludes: direction, liquidity pool (can't change after submission)
   */
  editableFields: (keyof OrderStateData)[];
}

/**
 * Configuration for all order types.
 * Key = order type enum value
 * Value = configuration object
 */
export const ORDER_TYPES: Record<OrderType, OrderConfig> = {
  /** Market Order - immediate execution at current market price */
  MARKET: {
    fields: ["direction", "liquidityPool", "notional", "timeInForce", "account"],
    viewFields: ["status", "direction", "liquidityPool", "notional", "timeInForce", "account"],
    initialFocus: "notional", // Most important field for market orders
    editableFields: ["notional", "timeInForce"], // Can only change amount and duration
  },
  /** Limit Order - executes at specified price or better */
  LIMIT: {
    fields: ["direction", "liquidityPool", "notional", "limitPrice", "timeInForce", "account"],
    viewFields: [
      "status",
      "direction",
      "liquidityPool",
      "notional",
      "limitPrice",
      "timeInForce",
      "account",
    ],
    initialFocus: "limitPrice", // Traders typically enter price first
    editableFields: ["notional", "limitPrice", "timeInForce"],
  },
  /** Take Profit - closes position when price reaches target */
  TAKE_PROFIT: {
    fields: ["direction", "liquidityPool", "notional", "limitPrice", "timeInForce", "account"],
    viewFields: [
      "status",
      "direction",
      "liquidityPool",
      "notional",
      "limitPrice",
      "timeInForce",
      "account",
    ],
    initialFocus: "limitPrice",
    editableFields: ["notional", "limitPrice", "timeInForce"],
  },
  /** Stop Loss - closes position to limit losses */
  STOP_LOSS: {
    fields: ["direction", "liquidityPool", "notional", "stopPrice", "timeInForce", "account"],
    viewFields: [
      "status",
      "direction",
      "liquidityPool",
      "notional",
      "stopPrice",
      "timeInForce",
      "account",
    ],
    initialFocus: "stopPrice", // Stop price is the key field
    editableFields: ["notional", "stopPrice", "timeInForce"],
  },
  /** Float Order - special order type with optional limit price and auto-grab feature */
  FLOAT: {
    fields: ["direction", "notional", "limitPrice", "account"],
    viewFields: ["status", "direction", "notional", "limitPrice", "account"],
    // Note: No liquidityPool for FLOAT orders
    initialFocus: "notional",
    editableFields: ["notional", "limitPrice"], // No timeInForce for FLOAT
  },
};
