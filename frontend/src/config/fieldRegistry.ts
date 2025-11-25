/**
 * Field Registry - The "What and How" of Form Fields
 *
 * This registry defines all possible form fields that can appear in orders.
 * It maps field keys (e.g., "limitPrice") to their:
 * - Display label ("Limit Price")
 * - Component type (Input, Select, Toggle, etc.)
 * - Component-specific props (min, max, options, etc.)
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
    | "Select" // Dropdown selection
    | "Toggle" // Segmented control (BUY/SELL)
    | "DateTime" // Date/time picker
    | "AmountWithCurrency" // Amount with currency toggle
    | "LimitPriceWithCheckbox"; // Price input with "Grab" checkbox
  /** Additional props passed to the component */
  props?: Record<string, unknown>;
}

/**
 * Registry of all form fields.
 * Key = field name in OrderStateData
 * Value = field definition
 */
export const FIELD_REGISTRY: Record<string, FieldDefinition> = {
  /** BUY/SELL toggle switch */
  direction: {
    label: "Direction",
    component: "Toggle",
    props: {
      options: [
        { label: "BUY", value: "BUY", variant: "buy" }, // Green styling
        { label: "SELL", value: "SELL", variant: "sell" }, // Red styling
      ],
    },
  },
  /** Currency pair symbol (usually set by OrderHeader, not editable in form) */
  symbol: {
    label: "Symbol",
    component: "InputText",
    props: { disabled: true },
  },
  /** Notional amount with currency toggle (GBP/USD) */
  notional: {
    label: "Amount",
    component: "AmountWithCurrency",
    props: { min: 1000, step: 100000, placeholder: "1,000,000" },
  },
  /** Limit price with optional "Grab" checkbox (FLOAT orders only) */
  limitPrice: {
    label: "Limit Price",
    component: "LimitPriceWithCheckbox",
    props: { precision: 5, step: 0.0001 },
  },
  /** Stop price for STOP_LOSS orders */
  stopPrice: {
    label: "Stop Price",
    component: "InputNumber",
    props: { precision: 5, step: 0.0001 },
  },
  /** Liquidity pool selection (options loaded from server) */
  liquidityPool: {
    label: "Liquidity Pool",
    component: "Select",
    props: { placeholder: "Select Pool" },
  },
  /** Account selection (options loaded from server) */
  account: {
    label: "Account",
    component: "Select",
    props: { placeholder: "Select Account" },
  },
  /** Time In Force - how long order remains active */
  timeInForce: {
    label: "Time In Force",
    component: "Select",
    props: {
      options: [
        { label: "Good Till Cancel (GTC)", value: "GTC" }, // Open until filled or cancelled
        { label: "Immediate Or Cancel (IOC)", value: "IOC" }, // Fill immediately or cancel
        { label: "Fill Or Kill (FOK)", value: "FOK" }, // Fill completely or cancel
        { label: "Good Till Date (GTD)", value: "GTD" }, // Open until specified date
      ],
    },
  },
  /** Start time for scheduled orders */
  startTime: {
    label: "Start Time",
    component: "DateTime",
    props: {},
  },
  /** Order status (read-only, shown in view/amend mode) */
  status: {
    label: "Status",
    component: "InputText",
    props: { disabled: true },
  },
};
