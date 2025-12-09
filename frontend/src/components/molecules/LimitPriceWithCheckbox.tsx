import { useEffect } from "react";

import { PRICE_CONFIG } from "../../config/constants";
import { useOrderEntryStore } from "../../store";
import { Input } from "../atoms/Input";

import styles from "./LimitPriceWithCheckbox.module.scss";

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
  /** Current order direction (BUY or SELL) - used to grab correct price */
  direction?: string;
}

/**
 * LimitPriceWithCheckbox - A specialized input for limit prices with auto-grab feature.
 *
 * Used exclusively for FLOAT order type. Allows traders to:
 * - Manually enter a limit price
 * - OR check "Grab" to automatically use the current market price
 *
 * When "Grab" is checked:
 * - Input becomes read-only
 * - Price is automatically grabbed from TickingPrice component
 * - BUY orders grab the buy price, SELL orders grab the sell price
 * - Price updates automatically when direction changes
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
  direction,
}: LimitPriceWithCheckboxProps) => {
  // Get auto-grab state from store
  const autoGrab = useOrderEntryStore((s) => s.autoGrabPrice);
  const setAutoGrab = useOrderEntryStore((s) => s.setAutoGrabPrice);

  // Subscribe to current market prices from store
  // These are updated by the TickingPrice component
  const currentBuyPrice = useOrderEntryStore((s) => s.currentBuyPrice);
  const currentSellPrice = useOrderEntryStore((s) => s.currentSellPrice);

  /**
   * Re-grab price when direction changes while checkbox is checked.
   * E.g., user checks "Grab" for BUY, then switches to SELL.
   * This ensures the price stays in sync with the current direction.
   */
  useEffect(() => {
    if (autoGrab && direction) {
      // Select appropriate price based on direction
      const price = direction === "BUY" ? currentBuyPrice : currentSellPrice;
      onChange(price);
    }
  }, [direction, autoGrab, currentBuyPrice, currentSellPrice, onChange]);

  /**
   * Handle checkbox state change.
   * When checked, immediately grab the current price.
   */
  const handleCheckboxChange = (checked: boolean) => {
    setAutoGrab(checked);
    if (checked && direction) {
      const price = direction === "BUY" ? currentBuyPrice : currentSellPrice;
      onChange(price);
    }
  };

  return (
    <div className={styles.container} data-testid="limit-price-with-checkbox">
      {/* "Grab" checkbox to auto-fill from market price */}
      <label className={styles.checkboxWrapper}>
        <input
          type="checkbox"
          checked={autoGrab}
          onChange={(e) => handleCheckboxChange(e.target.checked)}
          disabled={readOnly}
          className={styles.checkbox}
          data-testid="grab-price-checkbox"
        />
        <span className={styles.checkboxLabel}>Grab</span>
      </label>
      {/* Price input - becomes read-only when auto-grab is active */}
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
        readOnly={readOnly || autoGrab} // Read-only if explicitly set OR if auto-grab is active
        step={PRICE_CONFIG.PRICE_STEP} // 0.0001 for 5 decimal precision
        placeholder="0.00000"
        data-testid="limit-price-input"
      />
    </div>
  );
};
