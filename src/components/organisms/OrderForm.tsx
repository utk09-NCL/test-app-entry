import { useEffect } from "react";

import { FIELD_REGISTRY } from "../../config/fieldRegistry";
import { ORDER_TYPES } from "../../config/orderConfig";
import { useDebounce } from "../../hooks/useDebounce";
import { useOrderEntryStore } from "../../store";
import { OrderStateData, OrderType } from "../../types/domain";
import { Input } from "../atoms/Input";
import { Select } from "../atoms/Select";
import { AmountWithCurrency } from "../molecules/AmountWithCurrency";
import { LimitPriceWithCheckbox } from "../molecules/LimitPriceWithCheckbox";
import { RowComponent } from "../molecules/RowComponent";
import { ToggleSwitch } from "../molecules/ToggleSwitch";

import styles from "./OrderForm.module.scss";

// Component to bridge store and UI for a single field
const FieldController = ({
  fieldKey,
  rowIndex,
}: {
  fieldKey: keyof OrderStateData;
  rowIndex?: number;
}) => {
  // Selectors optimized to prevent re-renders
  const value = useOrderEntryStore((s) => s.getDerivedValues()[fieldKey]);
  const error = useOrderEntryStore((s) => s.errors[fieldKey]);
  const validating = useOrderEntryStore((s) => s.isValidating[fieldKey]);
  const status = useOrderEntryStore((s) => s.status);
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
  const isInReadOnlyMode = status === "READ_ONLY";
  const isAmending = status === "AMENDING";
  const isFieldEditable = config?.editableFields.includes(fieldKey);

  // Field is read-only if:
  // - In READ_ONLY status (after submit, before amend clicked)
  // - OR in AMENDING status but field is not in editableFields list
  const isReadOnly = isInReadOnlyMode || (isAmending && !isFieldEditable);
  const isEditable = isInReadOnlyMode && isFieldEditable;

  // Get currency codes from symbol (e.g., "GBPUSD" -> ["GBP", "USD"])
  const currentPair = currencyPairs.find((p) => p.symbol === symbol);
  const ccy1 = currentPair?.base || "CCY1";
  const ccy2 = currentPair?.quote || "CCY2";

  // Debounce validation trigger
  const debouncedValue = useDebounce(value, 300); // 300ms debounce for validation

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
            onGrabPrice={() => {
              // Get the appropriate price based on direction from store
              const buyPrice = useOrderEntryStore.getState().currentBuyPrice;
              const sellPrice = useOrderEntryStore.getState().currentSellPrice;
              return direction === "BUY" ? buyPrice : sellPrice;
            }}
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

export const OrderForm = () => {
  const orderType = useOrderEntryStore((s) => s.getDerivedValues().orderType);
  const status = useOrderEntryStore((s) => s.status);
  const isReadOnly = status === "READ_ONLY";
  const isAmending = status === "AMENDING";
  const config = ORDER_TYPES[orderType as keyof typeof ORDER_TYPES];

  // If order type is invalid or not loaded yet
  if (!config) return <div className={styles.loading}>Loading Order Config...</div>;

  return (
    <div className={styles.container} data-testid="order-form">
      {/* Always show Order Type Selector first */}
      <RowComponent label="Order Type" fieldKey="orderType" rowIndex={0}>
        <Select
          id="orderType"
          name="orderType"
          data-testid="select-orderType"
          value={orderType}
          onChange={(e) =>
            useOrderEntryStore.getState().setFieldValue("orderType", e.target.value as OrderType)
          }
          options={Object.keys(ORDER_TYPES).map((t) => ({
            label: t,
            value: t,
          }))}
          disabled={isReadOnly || isAmending}
        />
      </RowComponent>

      <div className={styles.grid} data-testid="order-form-fields">
        {config.fields.map((fieldKey, index) => (
          <FieldController key={fieldKey} fieldKey={fieldKey} rowIndex={index + 1} />
        ))}
      </div>
    </div>
  );
};
