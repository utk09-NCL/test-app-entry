import { useEffect, useState } from "react";

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
  const [selectedCurrency, setSelectedCurrency] = useState<string>(ccy1);

  console.log("[AmountWithCurrency] Render:", { ccy1, ccy2, selectedCurrency, value });

  // Update selected currency when ccy1/ccy2 props change
  useEffect(() => {
    console.log("[AmountWithCurrency] useEffect triggered:", { ccy1, ccy2, selectedCurrency });
    if (selectedCurrency !== ccy1 && selectedCurrency !== ccy2) {
      console.log("[AmountWithCurrency] Resetting to ccy1:", ccy1);
      setSelectedCurrency(ccy1);
    }
  }, [ccy1, ccy2, selectedCurrency]);

  const handleCurrencyToggle = () => {
    const newCurrency = selectedCurrency === ccy1 ? ccy2 : ccy1;
    console.log("[AmountWithCurrency] Toggle clicked:", {
      from: selectedCurrency,
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
        aria-label={`Toggle currency (current: ${selectedCurrency})`}
      >
        {selectedCurrency}
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
        min={1000}
        step={100000}
        placeholder="1,000,000"
        data-testid="amount-input"
      />
    </div>
  );
};
