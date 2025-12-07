/**
 * Field Visibility Rules - Dynamic Field Show/Hide Logic
 *
 * This config defines when fields should be visible based on form state.
 * It enables dynamic field visibility without hardcoding conditions in components.
 *
 * How it works:
 * - Each field can have a visibility rule (function that returns boolean)
 * - If no rule exists, field is visible by default
 * - Rules receive the current form values and return true if field should show
 *
 * Examples:
 * - `level` only visible for STOP_LOSS, TAKE_PROFIT, POUNCE, CALL_LEVEL, FLOAT orders
 * - `liquidityPool` hidden for FLOAT orders
 * - `startTime` only visible when expiry strategy === "GTD"
 *
 * Used by: useFieldVisibility hook, OrderForm
 *
 * Field names use server-aligned naming (currencyPair, side, amount, level).
 */

import { OrderStateData, OrderType, StartMode } from "../types/domain";

/**
 * Type for visibility rule function.
 * Receives current form values, returns true if field should be visible.
 */
export type VisibilityRule = (values: Partial<OrderStateData>) => boolean;

/**
 * Visibility rules for each field.
 * If a field is not in this map, it's always visible (default).
 */
export const FIELD_VISIBILITY_RULES: Partial<Record<keyof OrderStateData, VisibilityRule>> = {
  /**
   * Level - visible for orders that use a price level
   * For STOP_LOSS orders, hidden when liquidityPool is "FLOAT_POOL"
   */
  level: (values: Partial<OrderStateData>) => {
    const isLevelOrderType =
      values.orderType === OrderType.STOP_LOSS ||
      values.orderType === OrderType.TAKE_PROFIT ||
      values.orderType === OrderType.POUNCE ||
      values.orderType === OrderType.CALL_LEVEL ||
      values.orderType === OrderType.FLOAT;

    // For STOP_LOSS orders, hide if liquidityPool is "FLOAT_POOL"
    if (values.orderType === OrderType.STOP_LOSS && values.liquidityPool === "FLOAT_POOL") {
      return false;
    }

    return isLevelOrderType;
  },

  /**
   * Liquidity Pool - all order types need liquidity pool now
   */
  liquidityPool: (values: Partial<OrderStateData>) => values.orderType !== OrderType.FIXING,

  /**
   * Start Time - only visible when startMode is "START_AT"
   */
  startTime: (values: Partial<OrderStateData>) => values.startMode === StartMode.START_AT,

  /**
   * Start Date - only visible when startMode is "START_AT"
   */
  startDate: (values: Partial<OrderStateData>) => values.startMode === StartMode.START_AT,

  /**
   * Timezone - only visible when startMode is "START_AT"
   */
  timeZone: (values: Partial<OrderStateData>) => values.startMode === StartMode.START_AT,

  /**
   * Expiry Time - visible when expiry strategy is GTD or GTT
   */
  expiryTime: (values: Partial<OrderStateData>) =>
    values.expiry?.strategy === "GTD" || values.expiry?.strategy === "GTT",

  /**
   * Expiry Date - visible when expiry strategy is GTD or GTT
   */
  expiryDate: (values: Partial<OrderStateData>) =>
    values.expiry?.strategy === "GTD" || values.expiry?.strategy === "GTT",

  /**
   * Expiry Timezone - visible when expiry strategy is GTD or GTT
   */
  expiryTimeZone: (values: Partial<OrderStateData>) =>
    values.expiry?.strategy === "GTD" || values.expiry?.strategy === "GTT",

  /**
   * Target Execution Rate - visible for orders that need it
   */
  targetExecutionRate: (values: Partial<OrderStateData>) =>
    values.orderType === OrderType.FLOAT || values.orderType === OrderType.LIQUIDITY_SEEKER,

  /**
   * Participation Rate - only visible for PARTICIPATION orders
   */
  participationRate: (values: Partial<OrderStateData>) =>
    values.orderType === OrderType.PARTICIPATION,

  /**
   * Execution Style - visible for certain order types
   */
  executionStyle: (values: Partial<OrderStateData>) =>
    values.orderType === OrderType.AGGRESSIVE || values.orderType === OrderType.PARTICIPATION,

  /**
   * Discretion Factor - visible for orders that use it
   */
  discretionFactor: (values: Partial<OrderStateData>) =>
    values.orderType === OrderType.PARTICIPATION || values.orderType === OrderType.PEG,

  /**
   * Trigger Side - only visible for STOP_LOSS orders
   */
  triggerSide: (values: Partial<OrderStateData>) => values.orderType === OrderType.STOP_LOSS,

  /**
   * Iceberg - visible for TAKE_PROFIT orders
   */
  iceberg: (values: Partial<OrderStateData>) => values.orderType === OrderType.TAKE_PROFIT,

  /**
   * Fixing ID - only visible for FIXING orders
   */
  fixingId: (values: Partial<OrderStateData>) => values.orderType === OrderType.FIXING,

  /**
   * Fixing Date - only visible for FIXING orders
   */
  fixingDate: (values: Partial<OrderStateData>) => values.orderType === OrderType.FIXING,

  /**
   * TWAP Target End Time - only visible for TWAP orders
   */
  twapTargetEndTime: (values: Partial<OrderStateData>) => values.orderType === OrderType.TWAP,

  /**
   * TWAP Time Zone - only visible for TWAP orders
   */
  twapTimeZone: (values: Partial<OrderStateData>) => values.orderType === OrderType.TWAP,

  /**
   * Skew - visible for ADAPT and PARTICIPATION orders
   */
  skew: (values: Partial<OrderStateData>) =>
    values.orderType === OrderType.ADAPT || values.orderType === OrderType.PARTICIPATION,

  /**
   * Franchise Exposure - visible for ADAPT and PARTICIPATION orders
   */
  franchiseExposure: (values: Partial<OrderStateData>) =>
    values.orderType === OrderType.ADAPT || values.orderType === OrderType.PARTICIPATION,

  /**
   * Delay Behaviour - visible for PARTICIPATION orders
   */
  delayBehaviour: (values: Partial<OrderStateData>) => values.orderType === OrderType.PARTICIPATION,
};

/**
 * Check if a field should be visible given current form values.
 *
 * @param fieldKey - The field to check visibility for
 * @param values - Current form values
 * @returns true if field should be visible, false otherwise
 */
export const isFieldVisible = (
  fieldKey: keyof OrderStateData,
  values: Partial<OrderStateData>
): boolean => {
  const rule = FIELD_VISIBILITY_RULES[fieldKey];

  // If no rule exists, field is visible by default
  if (!rule) return true;

  return rule(values);
};

/**
 * Filter an array of fields to only include visible ones.
 *
 * @param fields - Array of field keys
 * @param values - Current form values
 * @returns Filtered array with only visible fields
 */
export const filterVisibleFields = (
  fields: (keyof OrderStateData)[],
  values: Partial<OrderStateData>
): (keyof OrderStateData)[] => {
  return fields.filter((field) => isFieldVisible(field, values));
};
