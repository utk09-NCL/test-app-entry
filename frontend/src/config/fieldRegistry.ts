/**
 * Field Registry - The "What and How" of Form Fields
 *
 * This registry defines all possible form fields that can appear in orders.
 * It maps field keys (e.g., "limitPrice") to their:
 * - Display label ("Limit Price")
 * - Component type (Input, Select, Toggle, etc.)
 *
 * Note: Component-specific props (min, max, step, etc.) are NOT stored here.
 * Each component imports its own config from constants.ts (e.g., AMOUNT_CONFIG, PRICE_CONFIG).
 * This keeps the registry lean and avoids dead code.
 *
 * This enables:
 * - Dynamic form rendering based on orderConfig
 * - Consistent field behavior across order types
 * - Single source of truth for field definitions
 *
 * Used by: FieldController to render the appropriate component for each field.
 */

/**
 * Definition of a single form field.
 */
export interface FieldDefinition {
  /** Human-readable label displayed next to the field */
  label: string;
  /** Component type to render (determines which atom/molecule to use) */
  component:
    | "InputNumber" // Standard numeric input
    | "InputText" // Standard text input
    | "InputTime" // Time input (HH:mm:ss)
    | "InputDate" // Date picker (YYYY-MM-DD)
    | "Select" // Dropdown selection
    | "Toggle" // Segmented control (BUY/SELL)
    | "RangeSlider" // Range slider for target execution rate
    | "DateTime" // Date/time picker
    | "AmountWithCurrency" // Amount with currency toggle
    | "LimitPriceWithCheckbox"; // Price input with "Grab" checkbox
}

/**
 * Registry of all form fields.
 * Key = field name in OrderStateData (server-aligned)
 * Value = field definition
 */
export const FIELD_REGISTRY: Record<string, FieldDefinition> = {
  /** BUY/SELL toggle switch */
  side: {
    label: "Direction",
    component: "Toggle",
  },
  /** Currency pair symbol (usually set by OrderHeader, not editable in form) */
  currencyPair: {
    label: "Symbol",
    component: "InputText",
  },
  /** Amount with currency toggle (GBP/USD) */
  amount: {
    label: "Amount",
    component: "AmountWithCurrency",
  },
  /** Price level for limit/stop/take-profit orders */
  level: {
    label: "Limit Price",
    component: "InputNumber",
  },
  /** Iceberg size for TAKE_PROFIT orders */
  iceberg: {
    label: "Iceberg",
    component: "InputNumber",
  },
  /** Liquidity pool selection (options loaded from server) */
  liquidityPool: {
    label: "Liquidity Pool",
    component: "Select",
  },
  /** Account selection (options loaded from server) */
  account: {
    label: "Account",
    component: "Select",
  },
  /** Expiry configuration */
  expiry: {
    label: "Expiry",
    component: "Select",
  },
  /** Start time for scheduled orders */
  startTime: {
    label: "Start Time",
    component: "InputTime",
  },
  /** Target execution rate for FLOAT/LIQUIDITY_SEEKER */
  targetExecutionRate: {
    label: "Target Rate",
    component: "RangeSlider",
  },
  /** Participation rate for PARTICIPATION orders */
  participationRate: {
    label: "Participation Rate",
    component: "InputNumber",
  },
  /** Execution style for execution orders */
  executionStyle: {
    label: "Execution Style",
    component: "Select",
  },
  /** Trigger side for STOP_LOSS orders */
  triggerSide: {
    label: "Trigger Side",
    component: "Select",
  },
  /** Execution info (read-only, shown in view/amend mode) */
  execution: {
    label: "Execution",
    component: "InputText",
  },
  /** Start mode for scheduled orders (Start Now vs Start At) */
  startMode: {
    label: "Start",
    component: "Select",
  },
  /** Timezone for start time and other time-based fields */
  timeZone: {
    label: "Timezone",
    component: "Select",
  },
  /** Start date for scheduled orders (calendar picker) */
  startDate: {
    label: "Start Date",
    component: "InputDate",
  },
  /** Expiry date for GTD/GTT orders (calendar picker) */
  expiryDate: {
    label: "Expiry Date",
    component: "InputDate",
  },
  /** Expiry time for GTD/GTT orders */
  expiryTime: {
    label: "Expiry Time",
    component: "InputTime",
  },
  /** Expiry timezone for GTD/GTT orders */
  expiryTimeZone: {
    label: "Expiry Timezone",
    component: "Select",
  },
};
