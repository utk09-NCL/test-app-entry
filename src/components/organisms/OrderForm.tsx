import { useEffect } from "react";

import { FIELD_REGISTRY } from "../../config/fieldRegistry";
import { ORDER_TYPES } from "../../config/orderConfig";
import { useDebounce } from "../../hooks/useDebounce";
import { useOrderEntryStore } from "../../store";
import { OrderStateData, OrderType } from "../../types/domain";
import { Input } from "../atoms/Input";
import { Select } from "../atoms/Select";
import { RowComponent } from "../molecules/RowComponent";
import { ToggleSwitch } from "../molecules/ToggleSwitch";

import styles from "./OrderForm.module.scss";

// Component to bridge store and UI for a single field
const FieldController = ({ fieldKey }: { fieldKey: keyof OrderStateData }) => {
  // Selectors optimized to prevent re-renders
  const value = useOrderEntryStore((s) => s.getDerivedValues()[fieldKey]);
  const error = useOrderEntryStore((s) => s.errors[fieldKey]);
  const validating = useOrderEntryStore((s) => s.isValidating[fieldKey]);

  const setFieldValue = useOrderEntryStore((s) => s.setFieldValue);
  const validateField = useOrderEntryStore((s) => s.validateField);

  // Select only necessary ref data
  const accounts = useOrderEntryStore((s) => s.accounts);
  const pools = useOrderEntryStore((s) => s.pools);

  const def = FIELD_REGISTRY[fieldKey];

  // Debounce validation trigger
  const debouncedValue = useDebounce(value, 300); // 300ms debounce for validation

  useEffect(() => {
    if (debouncedValue !== undefined) {
      validateField(fieldKey, debouncedValue);
    }
  }, [debouncedValue, fieldKey, validateField]);

  if (!def) return null;

  const handleChange = (val: string | number | undefined) => setFieldValue(fieldKey, val);

  let inputEl = null;

  switch (def.component) {
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
    >
      {inputEl}
    </RowComponent>
  );
};

export const OrderForm = () => {
  // Use shallow to prevent re-renders when other parts of derived values change
  const orderType = useOrderEntryStore((s) => s.getDerivedValues().orderType);
  const config = ORDER_TYPES[orderType as keyof typeof ORDER_TYPES];

  // If order type is invalid or not loaded yet
  if (!config) return <div className={styles.loading}>Loading Order Config...</div>;

  return (
    <div className={styles.container} data-testid="order-form">
      {/* Always show Order Type Selector first */}
      <RowComponent label="Order Type" fieldKey="orderType">
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
        />
      </RowComponent>

      <div className={styles.grid} data-testid="order-form-fields">
        {config.fields.map((fieldKey) => (
          <FieldController key={fieldKey} fieldKey={fieldKey} />
        ))}
      </div>
    </div>
  );
};
