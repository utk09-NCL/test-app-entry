/**
 * ReorderModeBanner Component - Visual indicator when reorder mode is active
 *
 * Displays a subtle banner above the footer when reorder mode is enabled,
 * informing the user that they can drag fields to reorder them.
 *
 * Features:
 * - Shows only when reorder mode is active
 * - Reset to default button for current order type
 * - Subtle, non-intrusive design
 *
 * Used by: OrderForm, placed above OrderFooter
 */

import { useFieldOrder } from "../../hooks/useFieldOrder";
import { OrderType } from "../../types/domain";

import styles from "./ReorderModeBanner.module.scss";

interface ReorderModeBannerProps {
  /** Current order type (for reset functionality) */
  orderType: OrderType;
}

/**
 * ReorderModeBanner - Indicator and controls for reorder mode
 */
export const ReorderModeBanner = ({ orderType }: ReorderModeBannerProps) => {
  const { isReorderMode, hasCustomOrder, resetToDefault } = useFieldOrder();

  // Only show when reorder mode is active
  if (!isReorderMode) return null;

  const showReset = hasCustomOrder(orderType);

  return (
    <div className={styles.banner} data-testid="reorder-mode-banner">
      <div className={styles.content}>
        <span className={styles.icon}>⠿</span>
        <span className={styles.text}>Reorder Mode Active — Drag fields to rearrange</span>
      </div>
      {showReset && (
        <button
          type="button"
          className={styles.resetButton}
          onClick={() => resetToDefault(orderType)}
          data-testid="reset-field-order"
        >
          Reset to Default
        </button>
      )}
    </div>
  );
};
