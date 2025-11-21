import React from "react";

import styles from "./Select.module.scss";

/**
 * Props for the Select component.
 * Extends all standard HTML select attributes.
 */
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  /** Array of options to render in the dropdown */
  options?: { label: string; value: string | number }[];
  /** Whether the select has a validation error (applies error styling) */
  hasError?: boolean;
  /** Unique identifier for the select element */
  id?: string;
}

/**
 * Select - A styled dropdown selection atom.
 *
 * Features:
 * - Custom styled dropdown with consistent appearance across browsers
 * - Custom chevron icon (not affected by browser default styles)
 * - Support for both options array prop and children for flexibility
 * - Error state styling
 * - Forward ref support
 *
 * @example
 * ```tsx
 * // Using options prop
 * <Select
 *   value={orderType}
 *   onChange={(e) => setOrderType(e.target.value)}
 *   options={[
 *     { label: "Market", value: "MARKET" },
 *     { label: "Limit", value: "LIMIT" }
 *   ]}
 * />
 * ```
 */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, children, hasError, ...props }, ref) => {
    return (
      <div className={styles.container}>
        <select
          ref={ref}
          // Combine base styles, error styles, and custom className
          className={`${styles.select} ${hasError ? styles.error : ""} ${className || ""}`}
          {...props} // Spread all native HTML select attributes
        >
          {/* Render options from array if provided */}
          {options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
          {/* Allow children for custom option rendering */}
          {children}
        </select>
        {/* Custom chevron icon for consistent appearance */}
        <div className={styles.iconWrapper}>
          <svg className={styles.icon} viewBox="0 0 20 20">
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
          </svg>
        </div>
      </div>
    );
  }
);

// Display name for React DevTools
Select.displayName = "Select";
