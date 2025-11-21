import React from "react";

import styles from "./Select.module.scss";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options?: { label: string; value: string | number }[];
  hasError?: boolean;
  id?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, children, hasError, ...props }, ref) => {
    return (
      <div className={styles.container}>
        <select
          ref={ref}
          className={`${styles.select} ${hasError ? styles.error : ""} ${className || ""}`}
          {...props}
        >
          {options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
          {children}
        </select>
        <div className={styles.iconWrapper}>
          <svg className={styles.icon} viewBox="0 0 20 20">
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
          </svg>
        </div>
      </div>
    );
  }
);

Select.displayName = "Select";
