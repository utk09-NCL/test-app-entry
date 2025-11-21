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

/**
 * FieldController bridges the store and UI for a single form field.
 * It handles:
 * - Reading field value and validation state from store
 * - Debounced validation on value changes
 * - Dynamic component rendering based on field definition
 * - Read-only mode and editability logic
 */
export const FieldController = ({ fieldKey, rowIndex }: FieldControllerProps) => {
  // Selectors optimized to prevent re-renders
  const value = useOrderEntryStore((s) => s.getDerivedValues()[fieldKey]);
  const error = useOrderEntryStore((s) => s.errors[fieldKey]);
  const validating = useOrderEntryStore((s) => s.isValidating[fieldKey]);
  const editMode = useOrderEntryStore((s) => s.editMode);
  const symbol = useOrderEntryStore((s) => s.getDerivedValues().symbol);
  const direction = useOrderEntryStore((s) => s.getDerivedValues().direction);
  const orderType = useOrderEntryStore((s) => s.getDerivedValues().orderType);

  const setFieldValue = useOrderEntryStore((s) => s.setFieldValue);
  const validateField = useOrderEntryStore((s) => s.validateField);
  const amendOrder = useOrderEntryStore((s) => s.amendOrder);

  // Select only necessary ref data
  const accounts = useOrderEntryStore((s) => s.accounts);
  const pools = useOrderEntryStore((s) => s.pools);
  const currencyPairs = useOrderEntryStore((s) => s.currencyPairs);

  const def = FIELD_REGISTRY[fieldKey];
  const config = ORDER_TYPES[orderType as keyof typeof ORDER_TYPES];
  const isFieldEditable = config?.editableFields.includes(fieldKey);

  // Field is read-only if:
  // - In viewing mode (after submit, before amend clicked)
  // - OR in amending mode but field is not in editableFields list
  const isReadOnly = editMode === "viewing" || (editMode === "amending" && !isFieldEditable);
  const isEditable = editMode === "viewing" && isFieldEditable;

  // Get currency codes from symbol (e.g., "GBPUSD" -> ["GBP", "USD"])
  const currentPair = currencyPairs.find((p) => p.symbol === symbol);
  const ccy1 = currentPair?.base || "CCY1";
  const ccy2 = currentPair?.quote || "CCY2";

  // Debounce validation trigger
  const debouncedValue = useDebounce(value, VALIDATION_CONFIG.DEBOUNCE_MS);

  useEffect(() => {
    // Validate even when value is undefined/null to catch required field errors
    validateField(fieldKey, debouncedValue);
  }, [debouncedValue, fieldKey, validateField]);

  if (!def) return null;

  const handleChange = (val: string | number | undefined) => setFieldValue(fieldKey, val);

  let inputEl = null;

  switch (def.component) {
    case "AmountWithCurrency":
      inputEl = (
        <AmountWithCurrency
          id={fieldKey}
          name={fieldKey}
          value={value as number | undefined}
          onChange={handleChange}
          hasError={!!error}
          readOnly={isReadOnly}
          ccy1={ccy1}
          ccy2={ccy2}
        />
      );
      break;
    case "LimitPriceWithCheckbox":
      // Only use checkbox for FLOAT order type, otherwise use regular input
      if (orderType === "FLOAT") {
        inputEl = (
          <LimitPriceWithCheckbox
            id={fieldKey}
            name={fieldKey}
            value={value as number | undefined}
            onChange={handleChange}
            hasError={!!error}
            readOnly={isReadOnly}
            direction={direction}
          />
        );
      } else {
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
            step={0.0001}
            placeholder="0.00000"
          />
        );
      }
      break;
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
          {...def.props}
        />
      );
      break;
    case "Select": {
      let opts: { label: string; value: string }[] =
        (def.props?.options as { label: string; value: string }[]) || [];
      // Dynamic Option Loading
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
          {...def.props}
        />
      );
      break;
    }
    case "Toggle":
      inputEl = (
        <ToggleSwitch
          id={fieldKey}
          data-testid={`toggle-${fieldKey}`}
          value={value as string}
          onChange={handleChange}
          options={
            (def.props?.options as { label: string; value: string; variant?: string }[]) || []
          }
          disabled={isReadOnly}
        />
      );
      break;
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
