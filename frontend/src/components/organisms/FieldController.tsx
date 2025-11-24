/**
 * FieldController Component
 *
 * This is the "smart" component that bridges the Zustand store and the UI for a single form field.
 * It's responsible for the entire lifecycle of a field: reading, updating, validating, and rendering.
 *
 * Key Responsibilities:
 * 1. **Data Binding**: Connects field value from store to UI component
 * 2. **Validation**: Triggers debounced validation on value changes
 * 3. **Dynamic Rendering**: Selects appropriate component based on field definition
 * 4. **Access Control**: Implements read-only logic based on editMode
 * 5. **Reference Data**: Injects dropdowns with accounts, pools, currency pairs
 *
 * How It Works:
 * - Takes a `fieldKey` (e.g., "notional", "limitPrice")
 * - Looks up field definition in FIELD_REGISTRY
 * - Renders the appropriate component (Input, Select, Toggle, etc.)
 * - Connects onChange handlers to store actions
 * - Shows validation errors and loading states
 *
 * Configuration-Driven:
 * - Field definition comes from FIELD_REGISTRY (label, component type, props)
 * - Order type determines which fields are editable (ORDER_TYPES[orderType].editableFields)
 * - No hardcoded field logic - everything driven by config
 *
 * @param fieldKey - The field name from OrderStateData (e.g., "notional")
 * @param rowIndex - Position in form (used for styling/animations)
 */

import { useEffect } from "react";

import { VALIDATION_CONFIG } from "../../config/constants";
import { FIELD_REGISTRY } from "../../config/fieldRegistry";
import { ORDER_TYPES } from "../../config/orderConfig";
import { useDebounce } from "../../hooks/useDebounce";
import { useOrderEntryStore } from "../../store";
import { OrderStateData } from "../../types/domain";
import { Input } from "../atoms/Input";
import { Select } from "../atoms/Select";
import { AmountWithCurrency } from "../molecules/AmountWithCurrency";
import { LimitPriceWithCheckbox } from "../molecules/LimitPriceWithCheckbox";
import { RowComponent } from "../molecules/RowComponent";
import { ToggleSwitch } from "../molecules/ToggleSwitch";

interface FieldControllerProps {
  fieldKey: keyof OrderStateData;
  rowIndex?: number;
}

export const FieldController = ({ fieldKey, rowIndex }: FieldControllerProps) => {
  // ===== State Selectors =====
  // Using granular selectors to prevent unnecessary re-renders
  // Each selector only subscribes to the specific slice of state it needs

  // Get the current value for this field (merged from baseValues + dirtyValues)
  const value = useOrderEntryStore((s) => s.getDerivedValues()[fieldKey]);

  // Get validation state for this field
  const error = useOrderEntryStore((s) => s.errors[fieldKey]); // Error message if validation failed
  const validating = useOrderEntryStore((s) => s.isValidating[fieldKey]); // True while async validation is running

  // Get edit mode to determine field interactivity
  const editMode = useOrderEntryStore((s) => s.editMode);

  // Get related field values (needed for conditional rendering)
  const symbol = useOrderEntryStore((s) => s.getDerivedValues().symbol); // For currency pair lookup
  const direction = useOrderEntryStore((s) => s.getDerivedValues().direction); // For LimitPriceWithCheckbox
  const orderType = useOrderEntryStore((s) => s.getDerivedValues().orderType); // For field visibility

  // ===== Action Selectors =====
  // Get functions to update store (these are stable references)
  const setFieldValue = useOrderEntryStore((s) => s.setFieldValue);
  const validateField = useOrderEntryStore((s) => s.validateField);
  const amendOrder = useOrderEntryStore((s) => s.amendOrder);

  // ===== Reference Data =====
  // Get dropdown options (loaded during app initialization)
  const accounts = useOrderEntryStore((s) => s.accounts);
  const pools = useOrderEntryStore((s) => s.pools);
  const currencyPairs = useOrderEntryStore((s) => s.currencyPairs);

  // ===== Configuration Lookup =====
  // Get field definition from registry (label, component type, props)
  const def = FIELD_REGISTRY[fieldKey];

  // Get order type configuration (which fields are editable in amend mode)
  const config = ORDER_TYPES[orderType as keyof typeof ORDER_TYPES];
  const isFieldEditable = config?.editableFields.includes(fieldKey);

  // ===== Read-Only Logic =====
  // Determine if this field should be read-only
  // Field is read-only if:
  // 1. In "viewing" mode (after submit, before amend clicked) - ALL fields read-only
  // 2. In "amending" mode AND field is NOT in editableFields list - selective read-only
  const isReadOnly = editMode === "viewing" || (editMode === "amending" && !isFieldEditable);

  // Flag for double-click-to-amend feature
  // Only editable fields in viewing mode show the "Double-click to edit" affordance
  const isEditable = editMode === "viewing" && isFieldEditable;

  // ===== Currency Pair Parsing =====
  // Extract base and quote currencies from symbol (e.g., "GBPUSD" → GBP, USD)
  // Used by AmountWithCurrency component for toggle button
  const currentPair = currencyPairs.find((p) => p.symbol === symbol);
  const ccy1 = currentPair?.base || "CCY1"; // Fallback to generic labels if pair not found
  const ccy2 = currentPair?.quote || "CCY2";

  // ===== Debounced Validation =====
  // Don't validate on every keystroke - wait for user to stop typing
  // Reduces server load and prevents validation "flicker"
  const debouncedValue = useDebounce(value, VALIDATION_CONFIG.DEBOUNCE_MS);

  // Trigger validation when debounced value changes
  useEffect(() => {
    // IMPORTANT: Validate even when value is undefined/null
    // This catches required field errors (e.g., empty notional)
    validateField(fieldKey, debouncedValue);
  }, [debouncedValue, fieldKey, validateField]);

  // Safety check: If field definition doesn't exist, don't render anything
  // This shouldn't happen if config is correct, but prevents runtime errors
  if (!def) return null;

  // ===== Change Handler =====
  // Wrapper function that updates store when field value changes
  const handleChange = (val: string | number | undefined) => setFieldValue(fieldKey, val);

  // ===== Component Selection =====
  // Based on field definition, render the appropriate input component
  // This is where the "configuration-driven UI" magic happens
  let inputEl = null;

  switch (def.component) {
    // Custom component: Amount input with currency toggle (CCY1/CCY2)
    // Used for: notional field
    case "AmountWithCurrency":
      inputEl = (
        <AmountWithCurrency
          id={fieldKey}
          name={fieldKey}
          value={value as number | undefined}
          onChange={handleChange}
          hasError={!!error}
          readOnly={isReadOnly}
          ccy1={ccy1} // Base currency (e.g., GBP in GBPUSD)
          ccy2={ccy2} // Quote currency (e.g., USD in GBPUSD)
        />
      );
      break;

    // Custom component: Limit price with "Grab" checkbox
    // Used for: limitPrice field in FLOAT orders
    case "LimitPriceWithCheckbox":
      // Special case: Only use checkbox component for FLOAT order type
      // Other order types use regular number input for limit price
      if (orderType === "FLOAT") {
        inputEl = (
          <LimitPriceWithCheckbox
            id={fieldKey}
            name={fieldKey}
            value={value as number | undefined}
            onChange={handleChange}
            hasError={!!error}
            readOnly={isReadOnly}
            direction={direction} // BUY or SELL - determines which price to grab
          />
        );
      } else {
        // Fallback: Regular number input for non-FLOAT orders
        inputEl = (
          <Input
            id={fieldKey}
            name={fieldKey}
            data-testid={`input-${fieldKey}`}
            type="number"
            value={value !== undefined && value !== null ? value.toString() : ""}
            onChange={(e) => {
              const val = e.target.value;
              // Convert empty string to undefined, otherwise parse as number
              handleChange(val === "" ? undefined : Number(val));
            }}
            hasError={!!error}
            readOnly={isReadOnly}
            step={0.0001} // FX precision
            placeholder="0.00000"
          />
        );
      }
      break;

    // Standard number input
    // Used for: stopPrice, icebergAmount, etc.
    case "InputNumber":
      inputEl = (
        <Input
          id={fieldKey}
          name={fieldKey}
          data-testid={`input-${fieldKey}`}
          type="number"
          value={value !== undefined && value !== null ? value.toString() : ""}
          onChange={(e) => {
            const val = e.target.value;
            handleChange(val === "" ? undefined : Number(val));
          }}
          hasError={!!error}
          readOnly={isReadOnly}
          {...def.props} // Spread additional props from field definition (min, max, step, etc.)
        />
      );
      break;

    // Dropdown selector
    // Used for: account, liquidityPool, timeInForce
    case "Select": {
      // Start with options from field definition (if any)
      let opts: { label: string; value: string }[] =
        (def.props?.options as { label: string; value: string }[]) || [];

      // Dynamic Option Loading: Replace with data from store
      // This allows dropdowns to be populated from server data
      if (fieldKey === "account") opts = accounts.map((a) => ({ label: a.name, value: a.id }));
      if (fieldKey === "liquidityPool") opts = pools.map((p) => ({ label: p.name, value: p.id }));

      inputEl = (
        <Select
          id={fieldKey}
          name={fieldKey}
          data-testid={`select-${fieldKey}`}
          value={(value as string) || ""}
          onChange={(e) => handleChange(e.target.value)}
          hasError={!!error}
          options={opts}
          disabled={isReadOnly}
          {...def.props} // Additional props from field definition
        />
      );
      break;
    }

    // Inline toggle switch (e.g., BUY/SELL, GTC/GTD)
    // Used for: direction field
    case "Toggle":
      inputEl = (
        <ToggleSwitch
          id={fieldKey}
          data-testid={`toggle-${fieldKey}`}
          value={value as string}
          onChange={handleChange}
          options={
            // Options come from field definition (e.g., [{label: "BUY", value: "BUY"}, ...])
            (def.props?.options as { label: string; value: string; variant?: string }[]) || []
          }
          disabled={isReadOnly}
        />
      );
      break;

    // Text input (fallback / default case)
    // Used for: notes, orderId, etc.
    case "InputText":
    default:
      inputEl = (
        <Input
          id={fieldKey}
          name={fieldKey}
          data-testid={`input-${fieldKey}`}
          type="text"
          value={(value as string) || ""}
          onChange={(e) => handleChange(e.target.value)}
          hasError={!!error}
          readOnly={isReadOnly}
          {...def.props}
        />
      );
  }

  // ===== Final Render =====
  // Wrap the input element in RowComponent
  // RowComponent provides: label, error display, validation spinner, layout
  return (
    <RowComponent
      label={def.label}
      error={error}
      isValidating={validating}
      fieldKey={fieldKey}
      isGroupField={def.component === "Toggle"}
      rowIndex={rowIndex ?? 0}
      isEditable={isEditable}
      onDoubleClick={amendOrder}
    >
      {inputEl}
    </RowComponent>
  );
};
