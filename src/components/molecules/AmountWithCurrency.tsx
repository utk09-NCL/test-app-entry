import { useState } from "react";

import { AMOUNT_CONFIG } from "../../config/constants";
import { Input } from "../atoms/Input";

import styles from "./AmountWithCurrency.module.scss";

interface AmountWithCurrencyProps {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  hasError?: boolean;
  readOnly?: boolean;
  ccy1: string;
  ccy2: string;
  id?: string;
  name?: string;
}

export const AmountWithCurrency = ({
  value,
  onChange,
  hasError,
  readOnly,
  ccy1,
  ccy2,
  id,
  name,
}: AmountWithCurrencyProps) => {
  // Initialize with ccy1, reset if currencies change and current selection is invalid
  const [selectedCurrency, setSelectedCurrency] = useState<string>(() => ccy1);

  console.log("[AmountWithCurrency] Render:", { ccy1, ccy2, selectedCurrency, value });

  // Reset to ccy1 if current selection is no longer valid
  // This uses derived state pattern instead of useEffect to avoid cascading renders
  const validCurrency =
    selectedCurrency === ccy1 || selectedCurrency === ccy2 ? selectedCurrency : ccy1;

  // If we need to update because of invalid state, do it during render
  if (validCurrency !== selectedCurrency) {
    console.log("[AmountWithCurrency] Resetting to valid currency:", validCurrency);
    setSelectedCurrency(validCurrency);
  }

  const handleCurrencyToggle = () => {
    const newCurrency = validCurrency === ccy1 ? ccy2 : ccy1;
    console.log("[AmountWithCurrency] Toggle clicked:", {
      from: validCurrency,
      to: newCurrency,
    });
    setSelectedCurrency(newCurrency);
  };

  return (
    <div className={styles.container} data-testid="amount-with-currency">
      <button
        type="button"
        className={styles.toggleButton}
        onClick={handleCurrencyToggle}
        disabled={readOnly}
        data-testid="currency-toggle"
        aria-label={`Toggle currency (current: ${validCurrency})`}
      >
        {validCurrency}
      </button>
      <Input
        id={id || "amount"}
        name={name || "amount"}
        type="number"
        value={value !== undefined && value !== null ? value.toString() : ""}
        onChange={(e) => {
          const val = e.target.value;
          onChange(val === "" ? undefined : Number(val));
        }}
        hasError={hasError || false}
        readOnly={readOnly}
        min={AMOUNT_CONFIG.MIN_AMOUNT}
        step={AMOUNT_CONFIG.STEP_AMOUNT}
        placeholder={AMOUNT_CONFIG.DEFAULT_PLACEHOLDER}
        data-testid="amount-input"
      />
    </div>
  );
};
