import React from "react";

import { Spinner } from "../atoms/Spinner";

import styles from "./RowComponent.module.scss";

/**
 * Props for the RowComponent molecule.
 */
interface RowProps {
  /** Label text displayed on the left */
  label: string;
  /** Validation error message (displayed below the field) */
  error?: string;
  /** Whether async validation is in progress */
  isValidating?: boolean;
  /** The form field component (Input, Select, Toggle, etc.) */
  children: React.ReactNode;
  /** Unique key for the field (used for accessibility and testing) */
  fieldKey?: string;
  /** Whether this row contains a group of inputs (Toggle) vs single input */
  isGroupField?: boolean;
  /** Row index for alternating row background colors */
  rowIndex?: number;
  /** Whether this field can be edited via double-click in read-only mode */
  isEditable?: boolean;
  /** Callback when label is double-clicked (triggers amend mode) */
  onDoubleClick?: () => void;
}

/**
 * RowComponent - A consistent layout wrapper for form fields.
 *
 * Provides a standardized layout for all form fields with:
 * - Label on the left
 * - Input/Select/Toggle on the right
 * - Error message below
 * - Validation spinner next to label when validating
 * - Alternating row backgrounds for better readability
 * - Double-click support for amending read-only fields
 *
 * This molecule is the building block for the entire form UI.
 *
 * @example
 * ```tsx
 * <RowComponent
 *   label="Limit Price"
 *   error={validationError}
 *   isValidating={isChecking}
 *   fieldKey="limitPrice"
 * >
 *   <Input type="number" value={price} onChange={setPrice} />
 * </RowComponent>
 * ```
 */
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
  // Generate test ID from fieldKey or label for component testing
  const testId = fieldKey || label.toLowerCase().replace(/\s+/g, "-");
  // Create accessible label ID for aria-labelledby
  const labelId = fieldKey ? `label-for-${fieldKey}` : undefined;
  // Apply alternating row background for even rows
  const rowClassName =
    rowIndex !== undefined && rowIndex % 2 === 0 ? `${styles.row} ${styles.even}` : styles.row;

  // Add editable class if field can be clicked to amend
  const rowClassNames = `${rowClassName} ${isEditable ? styles.editable : ""}`;

  /**
   * Handle double-click on label area to trigger amend mode.
   * Only works when isEditable is true (read-only mode with editable field).
   */
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
