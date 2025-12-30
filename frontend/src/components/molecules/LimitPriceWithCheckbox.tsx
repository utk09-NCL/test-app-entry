import { PRICE_CONFIG } from "../../config/constants";
import { Input } from "../atoms/Input";

/**
 * Props for the LimitPriceWithCheckbox component.
 */
interface LimitPriceWithCheckboxProps {
  /** The limit price value */
  value: number | undefined;
  /** Callback when price changes */
  onChange: (value: number | undefined) => void;
  /** Whether the input has a validation error */
  hasError?: boolean;
  /** Whether the input is read-only */
  readOnly?: boolean;
  /** Unique identifier for the input */
  id?: string;
  /** Name attribute for the input */
  name?: string;
  /** Current order direction (BUY or SELL) - kept for API compatibility */
  direction?: string;
}

/**
 * LimitPriceWithCheckbox - A specialized input for limit prices.
 *
 * Note: The "Grab" checkbox has been removed. Auto-grab is now handled
 * automatically by the store (createDerivedSlice.ts). The level field
 * continuously updates with ticking prices until the user manually edits it.
 *
 * Auto-Grab Behavior (handled in store):
 * - BUY orders show the ask price (currentBuyPrice)
 * - SELL orders show the bid price (currentSellPrice)
 * - User edit stops auto-grab (field becomes "dirty")
 * - Order type or currency pair change resets to auto-grab
 *
 * @example
 * ```tsx
 * <LimitPriceWithCheckbox
 *   value={limitPrice}
 *   onChange={setLimitPrice}
 *   direction="BUY"
 * />
 * ```
 */
export const LimitPriceWithCheckbox = ({
  value,
  onChange,
  hasError,
  readOnly,
  id,
  name,
}: LimitPriceWithCheckboxProps) => {
  return (
    <Input
      id={id || "limitPrice"}
      name={name || "limitPrice"}
      type="number"
      value={value !== undefined && value !== null ? value.toString() : ""}
      onChange={(e) => {
        const val = e.target.value;
        // Convert empty string to undefined, otherwise parse as number
        onChange(val === "" ? undefined : Number(val));
      }}
      hasError={hasError || false}
      readOnly={readOnly}
      step={PRICE_CONFIG.PRICE_STEP} // 0.0001 for 5 decimal precision
      placeholder="0.00000"
      data-testid="limit-price-input"
    />
  );
};
