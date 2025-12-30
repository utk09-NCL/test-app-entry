import { AMOUNT_CONFIG } from "../../config/constants";
import { Input } from "../atoms/Input";

import styles from "./AmountWithCurrency.module.scss";

/**
 * Props for the AmountWithCurrency component.
 */
interface AmountWithCurrencyProps {
  /** The numeric amount value */
  value: number | undefined;
  /** Callback when amount changes */
  onChange: (value: number | undefined) => void;
  /** Whether the input has a validation error */
  hasError?: boolean;
  /** Whether the input is read-only */
  readOnly?: boolean;
  /** First currency code (base currency, e.g., "GBP") */
  ccy1: string;
  /** Second currency code (quote currency, e.g., "USD") */
  ccy2: string;
  /** Unique identifier for the input */
  id?: string;
  /** Name attribute for the input */
  name?: string;
  /** Currently selected currency (controlled) */
  selectedCurrency: string;
  /** Callback when currency changes */
  onCurrencyChange: (ccy: string) => void;
}

/**
 * AmountWithCurrency - A specialized input for notional amounts with currency toggle.
 *
 * For FX orders, the notional amount can be denominated in either the base or quote currency.
 * For example, for GBP/USD:
 * - User can enter 1,000,000 GBP (buy/sell 1M pounds)
 * - OR 1,000,000 USD (buy/sell USD worth of pounds)
 *
 * Features:
 * - Toggle button to switch between ccy1 and ccy2
 * - Automatic currency selection validation (derived state pattern)
 * - Integrated with numeric input for amount entry
 *
 * @example
 * ```tsx
 * <AmountWithCurrency
 *   value={notional}
 *   onChange={setNotional}
 *   ccy1="GBP"
 *   ccy2="USD"
 * />
 * ```
 */
export const AmountWithCurrency = ({
  value,
  onChange,
  hasError,
  readOnly,
  ccy1,
  ccy2,
  id,
  name,
  selectedCurrency,
  onCurrencyChange,
}: AmountWithCurrencyProps) => {
  // Validate that selected currency is still valid (in case symbol changed)
  const validCurrency =
    selectedCurrency === ccy1 || selectedCurrency === ccy2 ? selectedCurrency : ccy1;

  /**
   * Toggle between base and quote currency.
   * E.g., GBP <-> USD
   */
  const handleCurrencyToggle = () => {
    const newCurrency = validCurrency === ccy1 ? ccy2 : ccy1;
    onCurrencyChange(newCurrency);
  };

  return (
    <div className={styles.container} data-testid="amount-with-currency">
      {/* Currency toggle button */}
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
      {/* Numeric amount input */}
      <Input
        id={id || "amount"}
        name={name || "amount"}
        type="number"
        value={value !== undefined && value !== null ? value.toString() : ""}
        onChange={(e) => {
          const val = e.target.value;
          // Convert empty string to undefined, otherwise parse as number
          onChange(val === "" ? undefined : Number(val));
        }}
        hasError={hasError || false}
        readOnly={readOnly}
        min={AMOUNT_CONFIG.MIN_AMOUNT} // Minimum notional from config
        step={AMOUNT_CONFIG.STEP_AMOUNT} // Step increment (e.g., 100,000)
        placeholder={AMOUNT_CONFIG.DEFAULT_PLACEHOLDER} // e.g., "1,000,000"
        data-testid="amount-input"
      />
    </div>
  );
};
