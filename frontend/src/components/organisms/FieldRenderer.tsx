/**
 * FieldRenderer Component
 *
 * This is the refactored replacement for FieldController. It renders a form field
 * by composing smaller hooks rather than having all logic in one component.
 *
 * Key Differences from FieldController:
 * - Uses hooks for each concern (value, options, state, readOnly)
 * - Uses componentFactory helpers for type checking
 * - Renders each component type explicitly for type safety
 * - Easier to test and extend
 *
 * Hook Composition:
 * - useFieldValue: Get/set field value
 * - useFieldOptions: Get dropdown options (for Select fields)
 * - useFieldState: Get validation state (errors, warnings)
 * - useFieldReadOnly: Compute read-only state
 *
 * @param fieldKey - The field name from OrderStateData
 * @param rowIndex - Position in form (used for styling)
 */

import React from "react";

import {
  getInputType,
  isAmountWithCurrencyComponent,
  isInputDateComponent,
  isInputTimeComponent,
  isLimitPriceComponent,
  isRangeSliderComponent,
  isSelectComponent,
  isToggleComponent,
} from "../../config/componentFactory";
import { PRICE_CONFIG } from "../../config/constants";
import { FIELD_REGISTRY } from "../../config/fieldRegistry";
import {
  useFieldOptions,
  useFieldReadOnly,
  useFieldState,
  useFieldValue,
  useFieldVisibility,
} from "../../hooks/fieldConnectors";
import { useOrderEntryStore } from "../../store";
import { ExpiryStrategy, OrderStateData, TargetExecutionRate } from "../../types/domain";
import { Input } from "../atoms/Input";
import { InputDate } from "../atoms/InputDate";
import { InputTime } from "../atoms/InputTime";
import { RangeSlider } from "../atoms/RangeSlider";
import { Select } from "../atoms/Select";
import { Spinner } from "../atoms/Spinner";
import { AmountWithCurrency } from "../molecules/AmountWithCurrency";
import { LimitPriceWithCheckbox } from "../molecules/LimitPriceWithCheckbox";
import { RowComponent } from "../molecules/RowComponent";
import { ToggleSwitch } from "../molecules/ToggleSwitch";

interface FieldRendererProps {
  fieldKey: keyof OrderStateData;
  rowIndex?: number;
}

/**
 * FieldRenderer with React.memo for performance optimization.
 * Prevents re-renders when props haven't changed.
 * Critical for forms with many fields (10-15+ fields per order type).
 */
export const FieldRenderer = React.memo(({ fieldKey, rowIndex }: FieldRendererProps) => {
  // ===== Hooks (must be called unconditionally) =====
  const { value, setValue } = useFieldValue(fieldKey);
  const { options, isLoading } = useFieldOptions(fieldKey);
  const { hasError, combinedError, warning, isValidating } = useFieldState(fieldKey);
  const { isReadOnly, isEditable } = useFieldReadOnly(fieldKey);
  const isVisible = useFieldVisibility(fieldKey);

  // ===== Related State (for special components) =====
  const accounts = useOrderEntryStore((s) => s.accounts);
  const currencyPairs = useOrderEntryStore((s) => s.currencyPairs);
  const currencyPair = useOrderEntryStore((s) => s.getDerivedValues().currencyPair);
  const side = useOrderEntryStore((s) => s.getDerivedValues().side);
  const orderType = useOrderEntryStore((s) => s.getDerivedValues().orderType);
  const amendOrder = useOrderEntryStore((s) => s.amendOrder);
  const refDataError = useOrderEntryStore((s) => s.refDataErrors[fieldKey]);
  const editMode = useOrderEntryStore((s) => s.editMode);

  // ===== Field Configuration =====
  const def = FIELD_REGISTRY[fieldKey];

  // ===== Currency Pair Parsing =====
  const currentPair = currencyPairs.find((p) => p.symbol === currencyPair);
  const ccy1 = currentPair?.ccy1 || "CCY1";
  const ccy2 = currentPair?.ccy2 || "CCY2";

  // ===== Safety Check =====
  if (!def) return null;

  // ===== Visibility Check =====
  if (!isVisible) return null;

  // ===== Complex object fields - prevent rendering as regular inputs =====
  // These fields contain nested objects (Account, Amount, Expiry, etc.) and
  // cannot be represented in HTML input value attributes (causes "[object Object]" error)
  const complexObjectFields = new Set<keyof OrderStateData>([
    "account", // { name, sdsId }
    "expiry", // { strategy, endTime, endTimeZone }
    "execution", // { agent, status, filled, ... }
    "orderOtherComments", // { firstComment, secondComment, thirdComment }
    "rollInfo", // { tenor, valueDate }
  ]);

  // If this is a complex object field without a dedicated component, don't render it
  if (complexObjectFields.has(fieldKey) && !isAmountWithCurrencyComponent(def.component)) {
    // These should have dedicated components (Select for account, DateTime for expiry, etc.)
    // If no appropriate component is defined, skip rendering to avoid React warnings
    return null;
  }

  // ===== Common RowComponent Props =====
  const rowProps = {
    label: def.label,
    fieldKey,
    rowIndex: rowIndex ?? 0,
    isEditable,
    onDoubleClick: amendOrder,
    isValidating,
    ...(combinedError !== undefined && { error: combinedError }),
    ...(!combinedError && warning !== undefined && { warning }),
  };

  // ===== Render Loading State =====
  if (isLoading && isSelectComponent(def.component)) {
    return (
      <RowComponent label={def.label} fieldKey={fieldKey} rowIndex={rowIndex ?? 0}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Spinner size="sm" data-testid={`spinner-${fieldKey}`} />
          <span style={{ color: "#94a3b8", fontSize: "0.875rem" }}>Loading...</span>
        </div>
      </RowComponent>
    );
  }

  // ===== Render AmountWithCurrency =====
  if (isAmountWithCurrencyComponent(def.component)) {
    // Extract numeric amount from Amount object {amount, ccy}
    const currentAmount = value && typeof value === "object" && "amount" in value ? value : null;
    const numericAmount = currentAmount ? (currentAmount.amount as number | undefined) : undefined;
    const currentCcy = currentAmount?.ccy || ccy1;

    return (
      <RowComponent {...rowProps}>
        <AmountWithCurrency
          id={fieldKey}
          name={fieldKey}
          data-testid={`input-${fieldKey}`}
          value={numericAmount}
          onChange={(val: number | undefined) => {
            // Construct Amount object with current currency
            setValue({ amount: val || 0, ccy: currentCcy });
          }}
          hasError={hasError}
          readOnly={isReadOnly}
          ccy1={ccy1}
          ccy2={ccy2}
        />
      </RowComponent>
    );
  }

  // ===== Render LimitPriceWithCheckbox (FLOAT orders only) =====
  if (isLimitPriceComponent(def.component)) {
    if (orderType === "FLOAT") {
      return (
        <RowComponent {...rowProps}>
          <LimitPriceWithCheckbox
            id={fieldKey}
            name={fieldKey}
            data-testid={`input-${fieldKey}`}
            value={value as number | undefined}
            onChange={setValue as (val: number | undefined) => void}
            hasError={hasError}
            readOnly={isReadOnly}
            direction={side}
          />
        </RowComponent>
      );
    }
    // Non-FLOAT orders: fallback to regular Input
    // Safety: only convert primitives to string (avoid [object Object] errors)
    const numValue = typeof value === "number" ? String(value) : "";
    return (
      <RowComponent {...rowProps}>
        <Input
          id={fieldKey}
          name={fieldKey}
          data-testid={`input-${fieldKey}`}
          type="number"
          value={numValue}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const val = e.target.value;
            setValue(val === "" ? undefined : Number(val));
          }}
          hasError={hasError}
          readOnly={isReadOnly}
          step={PRICE_CONFIG.PRICE_STEP}
          placeholder="0.00000"
        />
      </RowComponent>
    );
  }

  // ===== Render Toggle (BUY/SELL) =====
  if (isToggleComponent(def.component)) {
    // Safety: ensure value is a string (BUY or SELL)
    const toggleValue = typeof value === "string" ? value : "";
    return (
      <RowComponent {...rowProps} isGroupField>
        <ToggleSwitch
          id={fieldKey}
          data-testid={`toggle-${fieldKey}`}
          value={toggleValue}
          onChange={setValue as (val: string) => void}
          disabled={isReadOnly}
          options={[
            { label: "BUY", value: "BUY", variant: "buy" },
            { label: "SELL", value: "SELL", variant: "sell" },
          ]}
        />
      </RowComponent>
    );
  }

  // ===== Render Select =====
  if (isSelectComponent(def.component)) {
    // Handle complex object fields (account, expiry) specially
    let selectValue = "";
    let handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => setValue(e.target.value);

    if (fieldKey === "account") {
      // Account: display sdsId as string, but store as {name, sdsId} object
      selectValue =
        value && typeof value === "object" && "sdsId" in value ? String(value.sdsId) : "";
      handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const sdsId = Number(e.target.value);
        const account = accounts.find((a) => a.sdsId === sdsId);
        if (account) {
          setValue(account);
        }
      };
    } else if (fieldKey === "expiry") {
      // Expiry: display strategy as string, but store as {strategy} object
      selectValue = value && typeof value === "object" && "strategy" in value ? value.strategy : "";
      handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setValue({ strategy: e.target.value as ExpiryStrategy });
      };
    } else {
      // Regular string fields
      selectValue = typeof value === "string" ? value : "";
    }

    return (
      <RowComponent {...rowProps}>
        <Select
          id={fieldKey}
          name={fieldKey}
          data-testid={`select-${fieldKey}`}
          value={selectValue}
          onChange={handleChange}
          options={options}
          hasError={hasError}
          disabled={isReadOnly || (editMode === "amending" && !!refDataError)}
        />
      </RowComponent>
    );
  }

  // ===== Render InputTime (HH:mm:ss) =====
  if (isInputTimeComponent(def.component)) {
    const timeValue = typeof value === "string" ? value : "";
    return (
      <RowComponent {...rowProps}>
        <InputTime
          id={fieldKey}
          name={fieldKey}
          data-testid={`input-time-${fieldKey}`}
          value={timeValue}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
          hasError={hasError}
          readOnly={isReadOnly}
          placeholder="HH:mm:ss"
        />
      </RowComponent>
    );
  }

  // ===== Render InputDate (YYYY-MM-DD) =====
  if (isInputDateComponent(def.component)) {
    const dateValue = typeof value === "string" ? value : "";
    return (
      <RowComponent {...rowProps}>
        <InputDate
          id={fieldKey}
          name={fieldKey}
          data-testid={`input-date-${fieldKey}`}
          value={dateValue}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
          hasError={hasError}
          readOnly={isReadOnly}
        />
      </RowComponent>
    );
  }

  // ===== Render RangeSlider (Target Execution Rate) =====
  if (isRangeSliderComponent(def.component)) {
    return (
      <RowComponent {...rowProps}>
        <RangeSlider
          id={fieldKey}
          name={fieldKey}
          value={value as TargetExecutionRate}
          onChange={setValue}
          disabled={isReadOnly}
        />
      </RowComponent>
    );
  }

  // ===== Render Input (text or number) =====
  const inputType = getInputType(def.component);
  const isInputReadOnly = isReadOnly || fieldKey === "currencyPair" || fieldKey === "execution";

  if (inputType === "number") {
    // Safety: only convert primitives to string (avoid [object Object] errors)
    const numValue = typeof value === "number" ? String(value) : "";
    return (
      <RowComponent {...rowProps}>
        <Input
          id={fieldKey}
          name={fieldKey}
          data-testid={`input-${fieldKey}`}
          type="number"
          value={numValue}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const val = e.target.value;
            setValue(val === "" ? undefined : Number(val));
          }}
          hasError={hasError}
          readOnly={isInputReadOnly}
          step={PRICE_CONFIG.PRICE_STEP}
          placeholder="0.00000"
        />
      </RowComponent>
    );
  }

  // Text input (default)
  // Safety check: ensure value is a primitive string (not an object)
  const stringValue =
    typeof value === "string"
      ? value
      : typeof value === "object" && value
        ? JSON.stringify(value)
        : "";

  return (
    <RowComponent {...rowProps}>
      <Input
        id={fieldKey}
        name={fieldKey}
        data-testid={`input-${fieldKey}`}
        type="text"
        value={stringValue || ""}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
        hasError={hasError}
        readOnly={isInputReadOnly}
      />
    </RowComponent>
  );
});

// Display name for React DevTools
FieldRenderer.displayName = "FieldRenderer";
