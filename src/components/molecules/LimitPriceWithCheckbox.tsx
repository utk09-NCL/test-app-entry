import { useEffect, useState } from "react";

import { PRICE_CONFIG } from "../../config/constants";
import { useOrderEntryStore } from "../../store";
import { Input } from "../atoms/Input";

import styles from "./LimitPriceWithCheckbox.module.scss";

interface LimitPriceWithCheckboxProps {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  hasError?: boolean;
  readOnly?: boolean;
  id?: string;
  name?: string;
  direction?: string; // Track direction for re-grab
}

export const LimitPriceWithCheckbox = ({
  value,
  onChange,
  hasError,
  readOnly,
  id,
  name,
  direction,
}: LimitPriceWithCheckboxProps) => {
  const [autoGrab, setAutoGrab] = useState(false);
  const currentBuyPrice = useOrderEntryStore((s) => s.currentBuyPrice);
  const currentSellPrice = useOrderEntryStore((s) => s.currentSellPrice);

  // Re-grab price when direction changes while checkbox is checked
  useEffect(() => {
    if (autoGrab && direction) {
      const price = direction === "BUY" ? currentBuyPrice : currentSellPrice;
      onChange(price);
    }
  }, [direction, autoGrab, currentBuyPrice, currentSellPrice, onChange]);

  const handleCheckboxChange = (checked: boolean) => {
    setAutoGrab(checked);
    if (checked && direction) {
      const price = direction === "BUY" ? currentBuyPrice : currentSellPrice;
      onChange(price);
    }
  };

  return (
    <div className={styles.container} data-testid="limit-price-with-checkbox">
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
      <Input
        id={id || "limitPrice"}
        name={name || "limitPrice"}
        type="number"
        value={value !== undefined && value !== null ? value.toString() : ""}
        onChange={(e) => {
          const val = e.target.value;
          onChange(val === "" ? undefined : Number(val));
        }}
        hasError={hasError || false}
        readOnly={readOnly || autoGrab}
        step={PRICE_CONFIG.PRICE_STEP}
        placeholder="0.00000"
        data-testid="limit-price-input"
      />
    </div>
  );
};
