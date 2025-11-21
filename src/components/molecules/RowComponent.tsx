import React from "react";

import { Spinner } from "../atoms/Spinner";

import styles from "./RowComponent.module.scss";

interface RowProps {
  label: string;
  error?: string;
  isValidating?: boolean;
  children: React.ReactNode;
  fieldKey?: string;
  isGroupField?: boolean;
}

export const RowComponent = ({
  label,
  error,
  isValidating,
  children,
  fieldKey,
  isGroupField,
}: RowProps) => {
  const testId = fieldKey || label.toLowerCase().replace(/\s+/g, "-");
  const labelId = fieldKey ? `label-for-${fieldKey}` : undefined;

  return (
    <div className={styles.row} data-testid={`row-${testId}`}>
      <div className={styles.header} data-testid={`row-header-${testId}`}>
        <label
          className={styles.label}
          data-testid={`label-${testId}`}
          htmlFor={isGroupField ? undefined : fieldKey}
          id={labelId}
        >
          {label}
        </label>
        {isValidating && <Spinner size="sm" data-testid={`spinner-${testId}`} />}
      </div>
      <div className={styles.content} data-testid={`content-${testId}`}>
        {children}
      </div>
      {error ? (
        <span className={styles.error} data-testid={`error-${testId}`}>
          {error}
        </span>
      ) : (
        <div className={styles.spacer} data-testid={`spacer-${testId}`}></div>
      )}
    </div>
  );
};
