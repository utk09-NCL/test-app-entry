/**
 * Validation Schemas - The "Rules" of Form Fields
 *
 * This file uses Valibot to define validation schemas for each order type.
 * Schemas are aligned with the GraphQL `OrderEntry` input type to ensure
 * client-side validation matches server expectations.
 *
 * GraphQL OrderEntry fields (server-aligned naming):
 * - currencyPair: String!
 * - side: OrderSide!
 * - orderType: OrderType!
 * - amount: { amount: Float!, ccy: String! }
 * - level: Float (for TAKE_PROFIT, STOP_LOSS, POUNCE, etc.)
 * - liquidityPool: String
 * - account: { name: String!, sdsId: Int! }
 * - expiry: { strategy: ExpiryStrategy!, endTime: EpochTime, endTimeZone: String }
 *
 * Validation Flow:
 * 1. User types in field → debounced field-level validation
 * 2. User submits order → full schema validation via validateOrderForSubmission()
 * 3. ValiError thrown → parsed to field-level errors
 * 4. Errors displayed inline below field
 *
 * Used by: FieldRenderer (field validation), OrderFooter (submit validation).
 */

import * as v from "valibot";

import { OrderType } from "../types/domain";

import { NOTIONAL_LIMITS, PRICE_CONFIG } from "./constants";

// ============================================================================
// ENUM SCHEMAS (aligned with GraphQL enums)
// ============================================================================

/**
 * Order Side - matches GraphQL OrderSide enum
 */
export const OrderSideSchema = v.picklist(["BUY", "SELL"], "Side must be BUY or SELL");

/**
 * Order Type - matches GraphQL OrderType enum
 */
export const OrderTypeSchema = v.picklist(Object.values(OrderType), "Invalid order type");

/**
 * Expiry Strategy - matches GraphQL ExpiryStrategy enum
 */
export const ExpiryStrategySchema = v.picklist(["GTC", "GTD", "GTT"], "Invalid expiry strategy");

// ============================================================================
// NESTED OBJECT SCHEMAS (complex types)
// ============================================================================

/**
 * Amount schema - required amount with currency
 * GraphQL type: AmountInput { amount: BigDecimal!, ccy: String! }
 */
const amountSchema = v.object({
  amount: v.pipe(
    v.number("Amount must be a number"),
    v.minValue(NOTIONAL_LIMITS.MIN, "Minimum amount is 1"),
    v.maxValue(NOTIONAL_LIMITS.MAX, "Amount exceeds pool limit")
  ),
  ccy: v.pipe(v.string("Currency is required"), v.minLength(1, "Currency is required")),
});

/**
 * Account schema - required account with name and sdsId
 * GraphQL type: AccountInput { name: String!, sdsId: Int! }
 */
const accountSchema = v.object({
  name: v.pipe(v.string("Account name is required"), v.minLength(1, "Account name is required")),
  sdsId: v.number("Account sdsId is required"),
});

/**
 * Expiry schema - optional expiry configuration
 * GraphQL type: ExpiryInput { strategy: ExpiryStrategy!, endTime?: EpochTime, endTimeZone?: String }
 */
const expirySchema = v.optional(
  v.object({
    strategy: ExpiryStrategySchema,
    endTime: v.optional(v.nullish(v.number())),
    endTimeZone: v.optional(v.nullish(v.string())),
  })
);

// ============================================================================
// FIELD SCHEMAS (reusable building blocks)
// ============================================================================

/**
 * Currency pair - required non-empty string
 * GraphQL field: currencyPair
 */
const currencyPairSchema = v.pipe(
  v.string("Currency pair is required"),
  v.minLength(1, "Currency pair is required")
);

/**
 * Side - required enum value
 * GraphQL field: side
 */
const sideSchema = OrderSideSchema;

/**
 * Order type - required enum value
 * GraphQL field: orderType
 */
const orderTypeSchema = OrderTypeSchema;

/**
 * Price/Level schema - positive number with precision
 * GraphQL fields: level
 */
const priceSchema = v.pipe(
  v.number("Price must be a number"),
  v.minValue(PRICE_CONFIG.MIN_VALID_PRICE, "Price must be positive")
);

/**
 * Optional string - for non-required fields
 */
const optionalString = v.optional(v.nullish(v.string()));

/**
 * Optional number - for non-required numeric fields
 */
const optionalNumber = v.optional(v.nullish(v.number()));

/**
 * Optional account - for orders where account is not strictly required
 */
const optionalAccount = v.optional(v.nullish(accountSchema));

// ============================================================================
// ORDER TYPE SCHEMAS
// ============================================================================

/**
 * Common base fields for all order types.
 * Required: currencyPair, side, orderType, amount
 */
const commonBase = {
  currencyPair: currencyPairSchema,
  side: sideSchema,
  orderType: orderTypeSchema,
  amount: amountSchema,
};

/**
 * Shared optional fields across many order types.
 */
const sharedOptional = {
  liquidityPool: optionalString,
  account: optionalAccount,
  orderId: optionalString,
  level: optionalNumber,
  startTime: optionalString, // HH:mm:ss format
  startDate: optionalString, // YYYY-MM-DD format
  startMode: optionalString,
  timeZone: optionalString,
  expiry: expirySchema,
  expiryTime: optionalString, // HH:mm:ss format
  expiryDate: optionalString, // YYYY-MM-DD format
  expiryTimeZone: optionalString,
  ndf: v.optional(v.nullish(v.boolean())),
  onshore: v.optional(v.nullish(v.boolean())),
};

/**
 * Float Order - optional level, optional pool (grab).
 */
export const FloatOrderSchema = v.object({
  ...commonBase,
  ...sharedOptional,
  level: v.optional(v.nullish(priceSchema)),
  targetExecutionRate: optionalString,
});

/**
 * Take Profit - requires target level and pool.
 */
export const TakeProfitOrderSchema = v.object({
  ...commonBase,
  ...sharedOptional,
  level: priceSchema,
  iceberg: optionalNumber,
});

/**
 * Stop Loss - requires level and pool.
 */
export const StopLossOrderSchema = v.object({
  ...commonBase,
  ...sharedOptional,
  level: priceSchema,
  triggerSide: optionalString,
});

/**
 * Liquidity Seeker - market-style, pool required, price optional.
 */
export const LiquiditySeekerOrderSchema = v.object({
  ...commonBase,
  ...sharedOptional,
  targetExecutionRate: optionalString,
});

/**
 * Aggressive - pool required, execution style optional.
 */
export const AggressiveOrderSchema = v.object({
  ...commonBase,
  ...sharedOptional,
  executionStyle: optionalString,
  discretionFactor: optionalString,
});

/**
 * IOC - immediate-or-cancel, pool required.
 */
export const IocOrderSchema = v.object({
  ...commonBase,
  ...sharedOptional,
});

/**
 * Adapt - pool required, skew/franchiseExposure optional.
 */
export const AdaptOrderSchema = v.object({
  ...commonBase,
  ...sharedOptional,
  skew: optionalString,
  franchiseExposure: optionalString,
});

/**
 * Call Level - level required (reuse price schema), pool required.
 */
export const CallLevelOrderSchema = v.object({
  ...commonBase,
  ...sharedOptional,
  level: priceSchema,
});

/**
 * Pounce - level required, pool required.
 */
export const PounceOrderSchema = v.object({
  ...commonBase,
  ...sharedOptional,
  level: priceSchema,
});

/**
 * Peg - pool required, discretionFactor optional.
 */
export const PegOrderSchema = v.object({
  ...commonBase,
  ...sharedOptional,
  discretionFactor: optionalString,
});

/**
 * Participation - pool required, participation/execution details optional.
 */
export const ParticipationOrderSchema = v.object({
  ...commonBase,
  ...sharedOptional,
  participationRate: optionalString,
  executionStyle: optionalString,
  discretionFactor: optionalString,
  delayBehaviour: optionalString,
  skew: optionalString,
  franchiseExposure: optionalString,
});

/**
 * TWAP - pool required, schedule fields optional.
 */
export const TwapOrderSchema = v.object({
  ...commonBase,
  ...sharedOptional,
  twapTargetEndTime: optionalNumber,
  twapTimeZone: optionalString,
});

/**
 * Fixing - pool required, fixingId/date optional.
 */
export const FixingOrderSchema = v.object({
  ...commonBase,
  ...sharedOptional,
  fixingId: optionalNumber,
  fixingDate: optionalString,
});

// ============================================================================
// SCHEMA MAP & VALIDATION HELPERS
// ============================================================================

/**
 * Schema map - lookup table for validation by order type.
 */
export const SCHEMA_MAP: Record<OrderType, v.GenericSchema> = {
  [OrderType.FLOAT]: FloatOrderSchema,
  [OrderType.TAKE_PROFIT]: TakeProfitOrderSchema,
  [OrderType.STOP_LOSS]: StopLossOrderSchema,
  [OrderType.LIQUIDITY_SEEKER]: LiquiditySeekerOrderSchema,
  [OrderType.AGGRESSIVE]: AggressiveOrderSchema,
  [OrderType.IOC]: IocOrderSchema,
  [OrderType.ADAPT]: AdaptOrderSchema,
  [OrderType.CALL_LEVEL]: CallLevelOrderSchema,
  [OrderType.POUNCE]: PounceOrderSchema,
  [OrderType.PEG]: PegOrderSchema,
  [OrderType.PARTICIPATION]: ParticipationOrderSchema,
  [OrderType.TWAP]: TwapOrderSchema,
  [OrderType.FIXING]: FixingOrderSchema,
};

/**
 * Validation result type
 */
export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

/**
 * Convert Valibot issues to a simple field → message map. Root-level issues
 * (no path) are captured under `_root` to avoid losing non-field errors.
 */
export const mapIssuesToErrors = (
  issues: v.ValiError<v.GenericSchema>["issues"]
): Record<string, string> => {
  const errors: Record<string, string> = {};

  for (const issue of issues) {
    const path = issue.path;
    if (path && path.length > 0) {
      const fieldKey = String(path[0].key);
      if (!errors[fieldKey]) {
        errors[fieldKey] = issue.message;
      }
    } else if (!errors._root) {
      // Root-level error (no specific field)
      errors._root = issue.message;
    }
  }

  return errors;
};

/**
 * Validate an order for submission.
 * Runs full schema validation and returns field-level errors.
 *
 * @param values - The order data to validate
 * @returns ValidationResult with valid flag and error map
 */
export const validateOrderForSubmission = (values: Record<string, unknown>): ValidationResult => {
  const orderType = values.orderType as OrderType;
  if (!Object.values(OrderType).includes(orderType)) {
    return {
      valid: false,
      errors: { orderType: `Unknown order type: ${String(orderType)}` },
    };
  }

  const schema = SCHEMA_MAP[orderType];

  const result = v.safeParse(schema, values);

  if (!result.success) {
    const errors = mapIssuesToErrors(result.issues);
    return { valid: false, errors };
  }

  // Custom validation: if startMode is "START_AT", require startTime, startDate, timeZone
  const errors: Record<string, string> = {};
  if (values.startMode === "START_AT") {
    if (!values.startTime || values.startTime === "") {
      errors.startTime = "Start time is required when Start Mode is 'Start At'";
    }
    if (!values.startDate || values.startDate === "") {
      errors.startDate = "Start date is required when Start Mode is 'Start At'";
    }
    if (!values.timeZone || values.timeZone === "") {
      errors.timeZone = "Timezone is required when Start Mode is 'Start At'";
    }
  }

  // Custom validation: if expiry strategy is GTD or GTT, require expiryTime, expiryDate, expiryTimeZone
  const expiry = values.expiry as { strategy?: string } | undefined;
  if (expiry?.strategy === "GTD" || expiry?.strategy === "GTT") {
    if (!values.expiryTime || values.expiryTime === "") {
      errors.expiryTime = "Expiry time is required for GTD/GTT orders";
    }
    if (!values.expiryDate || values.expiryDate === "") {
      errors.expiryDate = "Expiry date is required for GTD/GTT orders";
    }
    if (!values.expiryTimeZone || values.expiryTimeZone === "") {
      errors.expiryTimeZone = "Expiry timezone is required for GTD/GTT orders";
    }
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, errors: {} };
};

/**
 * Validate a single field value against its schema.
 * Used for real-time field validation.
 *
 * @param field - Field name to validate
 * @param value - Field value
 * @param orderType - Current order type
 * @returns Error message or undefined if valid
 */
export const validateField = (
  field: string,
  value: unknown,
  orderType: string
): string | undefined => {
  const typedOrderType = orderType as OrderType;
  if (!Object.values(OrderType).includes(typedOrderType)) return undefined;
  const schema = SCHEMA_MAP[typedOrderType];

  // Create a partial object with the field to validate
  // We need to include required fields with dummy values to avoid unrelated errors
  const testData: Record<string, unknown> = {
    currencyPair: "GBPUSD",
    side: "BUY",
    orderType: orderType,
    amount: { amount: 1000000, ccy: "GBP" },
    liquidityPool: "test",
    level: 1.0,
    [field]: value,
  };

  const result = v.safeParse(schema, testData);

  if (result.success) return undefined;

  // Find error specific to this field
  const fieldIssue = result.issues.find((issue) => {
    const path = issue.path;
    return path && path.length > 0 && path[0].key === field;
  });

  return fieldIssue?.message;
};
