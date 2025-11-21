import React from "react";

import styles from "./Input.module.scss";

/**
 * Props for the Input component.
 * Extends all standard HTML input attributes for maximum flexibility.
 */
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Whether the input has a validation error (applies error styling) */
  hasError?: boolean;
  /** Unique identifier for the input element */
  id?: string;
}

/**
 * Input - A styled text/number input field atom.
 *
 * This is a base input component used throughout the application.
 * It extends the native HTML input with:
 * - Consistent styling via CSS modules
 * - Error state styling
 * - Forward ref support for parent components to access the DOM element
 *
 * @example
 * ```tsx
 * <Input
 *   type="number"
 *   value={price}
 *   onChange={(e) => setPrice(e.target.value)}
 *   hasError={!!validationError}
 *   placeholder="Enter price"
 * />
 * ```
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, hasError, ...props }, ref) => {
    return (
      <input
        ref={ref}
        // Combine base styles, error styles (if applicable), and custom className
        className={`${styles.input} ${hasError ? styles.error : ""} ${className || ""}`}
        {...props} // Spread all native HTML input attributes (type, value, onChange, etc.)
      />
    );
  }
);

// Display name for React DevTools
Input.displayName = "Input";
