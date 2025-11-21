import { useState } from "react";

import { Input } from "../atoms/Input";

import styles from "./LimitPriceWithCheckbox.module.scss";

interface LimitPriceWithCheckboxProps {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  hasError?: boolean;
  readOnly?: boolean;
  id?: string;
  name?: string;
  onGrabPrice?: () => number;
}

export const LimitPriceWithCheckbox = ({
  value,
  onChange,
  hasError,
  readOnly,
  id,
  name,
  onGrabPrice,
}: LimitPriceWithCheckboxProps) => {
  const [autoGrab, setAutoGrab] = useState(false);

  const handleCheckboxChange = (checked: boolean) => {
    setAutoGrab(checked);
    if (checked && onGrabPrice) {
      const price = onGrabPrice();
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
        step={0.0001}
        placeholder="0.00000"
        data-testid="limit-price-input"
      />
    </div>
  );
};
