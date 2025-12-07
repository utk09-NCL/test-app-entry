import React from "react";

import { TargetExecutionRate } from "../../types/domain";

import styles from "./RangeSlider.module.scss";

/**
 * Props for the RangeSlider component.
 */
interface RangeSliderProps {
  /** Current value */
  value?: TargetExecutionRate;
  /** Callback when value changes */
  onChange: (value: TargetExecutionRate) => void;
  /** Whether the slider is disabled */
  disabled?: boolean;
  /** Unique identifier */
  id?: string;
  /** Name attribute */
  name?: string;
}

/**
 * RangeSlider - A range slider for selecting target execution rate.
 *
 * Displays 5 discrete steps: Slow, Medium-, Medium, Medium+, Fast
 *
 * @example
 * ```tsx
 * <RangeSlider
 *   value={targetExecutionRate}
 *   onChange={setTargetExecutionRate}
 * />
 * ```
 */
export const RangeSlider: React.FC<RangeSliderProps> = ({
  value,
  onChange,
  disabled,
  id,
  name,
}) => {
  const steps = [
    { label: "Slow", value: TargetExecutionRate.TARGET_EXECUTION_RATE_SLOW },
    { label: "Medium-", value: TargetExecutionRate.TARGET_EXECUTION_RATE_MEDIUM_MINUS },
    { label: "Medium", value: TargetExecutionRate.TARGET_EXECUTION_RATE_MEDIUM },
    { label: "Medium+", value: TargetExecutionRate.TARGET_EXECUTION_RATE_MEDIUM_PLUS },
    { label: "Fast", value: TargetExecutionRate.TARGET_EXECUTION_RATE_FAST },
  ];

  const currentIndex = steps.findIndex((s) => s.value === value);
  const sliderValue = currentIndex >= 0 ? currentIndex : 2; // Default to Medium

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const index = Number(e.target.value);
    if (index >= 0 && index < steps.length) {
      onChange(steps[index].value);
    }
  };

  return (
    <div className={styles.container}>
      <input
        type="range"
        id={id}
        name={name}
        min="0"
        max={steps.length - 1}
        step="1"
        value={sliderValue}
        onChange={handleChange}
        disabled={disabled}
        className={styles.slider}
      />
      <div className={styles.labels}>
        {steps.map((step, index) => (
          <span
            key={step.value}
            className={`${styles.label} ${index === sliderValue ? styles.active : ""}`}
          >
            {step.label}
          </span>
        ))}
      </div>
    </div>
  );
};
