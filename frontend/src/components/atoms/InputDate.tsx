import React from "react";

import styles from "./Input.module.scss";

/**
 * Props for the InputDate component.
 */
interface InputDateProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  /** Whether the input has a validation error (applies error styling) */
  hasError?: boolean;
  /** Unique identifier for the input element */
  id?: string;
  /** Value in YYYY-MM-DD format */
  value?: string;
  /** Callback when date changes */
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * InputDate - A date input field for YYYY-MM-DD format.
 *
 * Uses the native HTML5 date picker for consistent cross-browser experience.
 *
 * @example
 * ```tsx
 * <InputDate
 *   value={startDate}
 *   onChange={(e) => setStartDate(e.target.value)}
 * />
 * ```
 */
export const InputDate = React.forwardRef<HTMLInputElement, InputDateProps>(
  ({ className, hasError, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type="date"
        className={`${styles.input} ${hasError ? styles.error : ""} ${className || ""}`}
        {...props}
      />
    );
  }
);

InputDate.displayName = "InputDate";
