/**
 * ReorderModeBanner Component - Visual indicator when reorder mode is active
 *
 * Displays a subtle banner above the footer when reorder mode is enabled,
 * informing the user that they can drag fields to reorder them.
 *
 * Features:
 * - Shows only when reorder mode is active
 * - Reset to Default button - resets draft to config default (doesn't persist)
 * - Save button - persists draft to localStorage and exits reorder mode
 * - Subtle, non-intrusive design
 *
 * Props pattern: Receives field order state/actions via props from OrderForm
 * to ensure single source of truth (fixes state sync issues).
 *
 * Used by: OrderForm, placed above OrderFooter
 */

import { FieldOrderHookReturn } from "../../hooks/useFieldOrder";
import { OrderType } from "../../types/domain";

import styles from "./ReorderModeBanner.module.scss";

interface ReorderModeBannerProps {
  /** Current order type (for reset functionality) */
  orderType: OrderType;
  /** Field order state and actions (passed from parent for single source of truth) */
  fieldOrder: FieldOrderHookReturn;
}

/**
 * DragIcon - SVG drag handle icon (matches DragHandle component)
 */
const DragIcon = () => (
  <svg
    width="12"
    height="18"
    viewBox="0 0 12 18"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    className={styles.icon}
    aria-hidden="true"
  >
    <circle cx="3" cy="3" r="1.5" />
    <circle cx="9" cy="3" r="1.5" />
    <circle cx="3" cy="9" r="1.5" />
    <circle cx="9" cy="9" r="1.5" />
    <circle cx="3" cy="15" r="1.5" />
    <circle cx="9" cy="15" r="1.5" />
  </svg>
);

/**
 * ReorderModeBanner - Indicator and controls for reorder mode
 */
export const ReorderModeBanner = ({ orderType, fieldOrder }: ReorderModeBannerProps) => {
  const { isReorderMode, resetToDefault, saveAndExit } = fieldOrder;

  // Only show when reorder mode is active
  if (!isReorderMode) return null;

  return (
    <div className={styles.banner} data-testid="reorder-mode-banner">
      <div className={styles.content}>
        <DragIcon />
        <span className={styles.text}>Reorder mode active, drag fields to rearrange</span>
      </div>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.resetButton}
          onClick={() => resetToDefault(orderType)}
          data-testid="reset-field-order"
        >
          Reset to Default
        </button>
        <button
          type="button"
          className={styles.saveButton}
          onClick={saveAndExit}
          data-testid="save-field-order"
        >
          Save
        </button>
      </div>
    </div>
  );
};
