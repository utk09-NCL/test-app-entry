import React from "react";

import styles from "./Input.module.scss";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
  id?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, hasError, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`${styles.input} ${hasError ? styles.error : ""} ${className || ""}`}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
