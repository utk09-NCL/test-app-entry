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
  rowIndex?: number;
  isEditable?: boolean;
  onDoubleClick?: () => void;
}

export const RowComponent = ({
  label,
  error,
  isValidating,
  children,
  fieldKey,
  isGroupField,
  rowIndex,
  isEditable,
  onDoubleClick,
}: RowProps) => {
  const testId = fieldKey || label.toLowerCase().replace(/\s+/g, "-");
  const labelId = fieldKey ? `label-for-${fieldKey}` : undefined;
  const rowClassName =
    rowIndex !== undefined && rowIndex % 2 === 0 ? `${styles.row} ${styles.even}` : styles.row;

  const rowClassNames = `${rowClassName} ${isEditable ? styles.editable : ""}`;

  const handleLabelDoubleClick = (e: React.MouseEvent) => {
    if (isEditable && onDoubleClick) {
      e.preventDefault();
      e.stopPropagation();
      onDoubleClick();
    }
  };

  return (
    <div className={rowClassNames} data-testid={`row-${testId}`}>
      <div
        className={styles.header}
        data-testid={`row-header-${testId}`}
        onDoubleClick={handleLabelDoubleClick}
        style={isEditable ? { cursor: "pointer" } : undefined}
        title={isEditable ? "Double-click to edit" : undefined}
      >
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
