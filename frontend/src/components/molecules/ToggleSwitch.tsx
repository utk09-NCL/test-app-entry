import styles from "./ToggleSwitch.module.scss";

/**
 * Props for the ToggleSwitch component.
 */
interface ToggleProps {
  /** Currently selected value */
  value: string;
  /** Callback when a different option is selected */
  onChange: (val: string) => void;
  /** Array of options to display as toggle buttons */
  options: { label: string; value: string; variant?: string }[];
  /** Test ID for component testing */
  "data-testid"?: string;
  /** Unique identifier for the toggle group */
  id?: string;
  /** Whether all buttons should be disabled */
  disabled?: boolean;
}

/**
 * ToggleSwitch - A segmented control molecule for mutually exclusive choices.
 *
 * Used for Direction (BUY/SELL) and other binary/ternary choices.
 * Renders as a group of connected buttons with only one active at a time.
 *
 * Features:
 * - Visually distinct active state
 * - Optional variant styling for active button (e.g., red for SELL, green for BUY)
 * - Accessible via role="group" and aria attributes
 *
 * @example
 * ```tsx
 * <ToggleSwitch
 *   value={direction}
 *   onChange={setDirection}
 *   options={[
 *     { label: "BUY", value: "BUY", variant: "buy" },
 *     { label: "SELL", value: "SELL", variant: "sell" }
 *   ]}
 * />
 * ```
 */
export const ToggleSwitch = ({
  value,
  onChange,
  options,
  "data-testid": testId,
  id,
  disabled,
}: ToggleProps) => {
  const resolvedTestId = testId ?? "toggle-switch";

  return (
    <div
      className={styles.container}
      data-testid={resolvedTestId}
      role="group" // ARIA role for grouped buttons
      id={id}
      aria-labelledby={id ? `label-for-${id}` : undefined} // Link to label for accessibility
    >
      {options.map((opt) => {
        const isActive = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button" // Prevent form submission
            data-testid={`${resolvedTestId}-option-${opt.value}`}
            onClick={() => !disabled && onChange(opt.value)}
            disabled={disabled}
            data-appstate={isActive ? "active" : "inactive"}
            data-variant={opt.variant}
            // Apply base, active, and variant styles
            className={`${styles.button} ${isActive ? styles.active : ""} ${
              isActive && opt.variant ? styles[opt.variant] : ""
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};
