import React from "react";

import styles from "./Input.module.scss";

/**
 * Props for the InputTime component.
 */
interface InputTimeProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  /** Whether the input has a validation error (applies error styling) */
  hasError?: boolean;
  /** Unique identifier for the input element */
  id?: string;
  /** Value in HH:mm:ss format */
  value?: string;
  /** Callback when time changes */
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * InputTime - A time input field for HH:mm:ss format.
 *
 * @example
 * ```tsx
 * <InputTime
 *   value={startTime}
 *   onChange={(e) => setStartTime(e.target.value)}
 *   placeholder="HH:mm:ss"
 * />
 * ```
 */
export const InputTime = React.forwardRef<HTMLInputElement, InputTimeProps>(
  ({ className, hasError, placeholder = "HH:mm:ss", ...props }, ref) => {
    return (
      <input
        ref={ref}
        type="text"
        className={`${styles.input} ${hasError ? styles.error : ""} ${className || ""}`}
        placeholder={placeholder}
        {...props}
      />
    );
  }
);

InputTime.displayName = "InputTime";
