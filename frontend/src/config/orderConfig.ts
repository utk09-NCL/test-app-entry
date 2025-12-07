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
 *
 * Field names use server-aligned naming (currencyPair, side, amount, level).
 */

import { OrderStateData, OrderType } from "../types/domain";

/**
 * Configuration for a single order type.
 */
export interface OrderConfig {
  /** Array of field keys to display (in order) */
  fields: (keyof OrderStateData)[];
  /** Which field should receive focus when this order type is selected */
  initialFocus: keyof OrderStateData;
  /**
   * Fields that can be edited after order submission (via double-click in read-only mode).
   * Typically includes: amount, level
   * Excludes: side, liquidity pool (can't change after submission)
   */
  editableFields: (keyof OrderStateData)[];
}

/**
 * Get view fields for an order type (includes execution at the beginning).
 * View fields are shown in view/amend mode.
 */
export const getViewFields = (orderType: OrderType): (keyof OrderStateData)[] => {
  const config = ORDER_TYPES[orderType];
  return ["execution", ...config.fields];
};

/**
 * Configuration for all order types.
 * Key = order type enum value
 * Value = configuration object
 */
export const ORDER_TYPES: Record<OrderType, OrderConfig> = {
  /** POUNCE - executes at specified level */
  [OrderType.POUNCE]: {
    fields: ["side", "liquidityPool", "amount", "level", "expiry", "account"],
    initialFocus: "level",
    editableFields: ["amount", "level", "expiry"],
  },
  /** TAKE_PROFIT - closes position when price reaches target */
  [OrderType.TAKE_PROFIT]: {
    fields: [
      "side",
      "liquidityPool",
      "amount",
      "level",
      "iceberg",
      "startMode",
      "timeZone",
      "startTime",
      "startDate",
      "expiry",
      "expiryTimeZone",
      "expiryTime",
      "expiryDate",
      "account",
    ],
    initialFocus: "level",
    editableFields: [
      "amount",
      "level",
      "iceberg",
      "startMode",
      "timeZone",
      "startTime",
      "startDate",
      "expiry",
      "expiryTimeZone",
      "expiryTime",
      "expiryDate",
    ],
  },

  /** STOP_LOSS - closes position to limit losses */
  [OrderType.STOP_LOSS]: {
    fields: [
      "side",
      "liquidityPool",
      "amount",
      "level",
      "triggerSide",
      "startMode",
      "timeZone",
      "startTime",
      "startDate",
      "expiry",
      "expiryTimeZone",
      "expiryTime",
      "expiryDate",
      "account",
    ],
    initialFocus: "level",
    editableFields: [
      "amount",
      "level",
      "triggerSide",
      "startMode",
      "timeZone",
      "startTime",
      "startDate",
      "expiry",
      "expiryTimeZone",
      "expiryTime",
      "expiryDate",
    ],
  },

  /** FLOAT - with Start scheduling */
  [OrderType.FLOAT]: {
    fields: [
      "side",
      "liquidityPool",
      "targetExecutionRate",
      "level",
      "amount",
      "startMode",
      "timeZone",
      "startTime",
      "startDate",
      "expiry",
      "expiryTimeZone",
      "expiryTime",
      "expiryDate",
      "account",
    ],
    initialFocus: "amount",
    editableFields: [
      "targetExecutionRate",
      "amount",
      "level",
      "startMode",
      "timeZone",
      "startTime",
      "startDate",
      "expiry",
      "expiryTimeZone",
      "expiryTime",
      "expiryDate",
    ],
  },

  /** LIQUIDITY_SEEKER - with Start scheduling */
  [OrderType.LIQUIDITY_SEEKER]: {
    fields: [
      "side",
      "liquidityPool",
      "amount",
      "startMode",
      "timeZone",
      "startTime",
      "startDate",
      "expiry",
      "expiryTimeZone",
      "expiryTime",
      "expiryDate",
      "account",
    ],
    initialFocus: "amount",
    editableFields: [
      "amount",
      "startMode",
      "timeZone",
      "startTime",
      "startDate",
      "expiry",
      "expiryTimeZone",
      "expiryTime",
      "expiryDate",
    ],
  },
  /** PARTICIPATION - participates in market movement */
  [OrderType.PARTICIPATION]: {
    fields: [
      "side",
      "liquidityPool",
      "amount",
      "participationRate",
      "executionStyle",
      "expiry",
      "account",
    ],
    initialFocus: "participationRate",
    editableFields: ["amount", "participationRate", "expiry"],
  },
  /** TWAP - Time-Weighted Average Price execution */
  [OrderType.TWAP]: {
    fields: ["side", "liquidityPool", "amount", "twapTargetEndTime", "timeZone", "account"],
    initialFocus: "twapTargetEndTime",
    editableFields: ["amount", "twapTargetEndTime"],
  },
  /** FIXING - executes at fixing price */
  [OrderType.FIXING]: {
    fields: ["side", "liquidityPool", "amount", "fixingId", "fixingDate", "account"],
    initialFocus: "fixingId",
    editableFields: ["amount"],
  },
  /** AGGRESSIVE - aggressive execution strategy */
  [OrderType.AGGRESSIVE]: {
    fields: [
      "side",
      "liquidityPool",
      "amount",
      "executionStyle",
      "discretionFactor",
      "expiry",
      "account",
    ],
    initialFocus: "amount",
    editableFields: ["amount", "expiry"],
  },
  /** IOC - Immediate Or Cancel execution */
  [OrderType.IOC]: {
    fields: ["side", "liquidityPool", "amount", "account"],
    initialFocus: "amount",
    editableFields: ["amount"],
  },
  /** ADAPT - adapts to market conditions */
  [OrderType.ADAPT]: {
    fields: ["side", "liquidityPool", "amount", "skew", "franchiseExposure", "expiry", "account"],
    initialFocus: "amount",
    editableFields: ["amount", "skew", "expiry"],
  },
  /** CALL_LEVEL - executes at call level */
  [OrderType.CALL_LEVEL]: {
    fields: ["side", "liquidityPool", "amount", "level", "account"],
    initialFocus: "level",
    editableFields: ["amount", "level"],
  },
  /** PEG - pegged order type */
  [OrderType.PEG]: {
    fields: ["side", "liquidityPool", "amount", "discretionFactor", "expiry", "account"],
    initialFocus: "amount",
    editableFields: ["amount", "discretionFactor", "expiry"],
  },
};
