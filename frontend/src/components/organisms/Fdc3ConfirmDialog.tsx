/**
 * FDC3 Confirm Dialog Component
 *
 * @deprecated Use Fdc3ConfirmDialogPopup from './Fdc3ConfirmDialogPopup' instead.
 * This component uses a custom modal implementation. The new Fdc3ConfirmDialogPopup
 * uses the unified Popup system with better cross-platform support.
 *
 * This modal dialog appears when an FDC3 intent arrives while the user
 * has unsaved changes in the form. It gives the user a choice:
 * - Accept: Apply the incoming intent data, discarding unsaved changes
 * - Reject: Keep the current form state, ignore the intent
 *
 * The dialog shows details of the incoming intent so the user can make
 * an informed decision (symbol, direction, amount, source app, etc.).
 *
 * Uses the portal pattern to render at document root (above all other content).
 */

import { useOrderEntryStore } from "../../store";

import styles from "./Fdc3ConfirmDialog.module.scss";

/**
 * Warning Icon SVG component
 */
const WarningIcon = () => (
  <svg
    className={styles.icon}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

/**
 * Format a number as currency for display
 */
const formatAmount = (amount: number | undefined): string => {
  if (amount === undefined) return "-";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const Fdc3ConfirmDialog = () => {
  // Subscribe to pending intent state
  const hasPendingIntent = useOrderEntryStore((s) => s.hasPendingFdc3Intent);
  const pendingIntent = useOrderEntryStore((s) => s.pendingFdc3Intent);
  const acceptPendingIntent = useOrderEntryStore((s) => s.acceptPendingIntent);
  const rejectPendingIntent = useOrderEntryStore((s) => s.rejectPendingIntent);

  // Don't render if no pending intent
  if (!hasPendingIntent || !pendingIntent) {
    return null;
  }

  return (
    <div className={styles.overlay} data-testid="fdc3-confirm-dialog">
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="fdc3-dialog-title"
      >
        <div className={styles.header}>
          <WarningIcon />
          <h2 id="fdc3-dialog-title" className={styles.title}>
            Incoming Order Request
          </h2>
        </div>

        <p className={styles.message}>
          You have unsaved changes. A new order request has arrived from another application. Would
          you like to apply the new data and discard your current changes?
        </p>

        <div className={styles.intentDetails}>
          {pendingIntent.currencyPair && (
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Currency Pair</span>
              <span className={styles.detailValue}>{pendingIntent.currencyPair}</span>
            </div>
          )}
          {pendingIntent.side && (
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Side</span>
              <span className={styles.detailValue}>{pendingIntent.side}</span>
            </div>
          )}
          {pendingIntent.amount !== undefined && (
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Amount</span>
              <span className={styles.detailValue}>
                {formatAmount(pendingIntent.amount.amount)} {pendingIntent.amount.ccy}
              </span>
            </div>
          )}
          {pendingIntent.orderType && (
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Order Type</span>
              <span className={styles.detailValue}>{pendingIntent.orderType}</span>
            </div>
          )}
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={`${styles.button} ${styles.rejectButton}`}
            onClick={rejectPendingIntent}
            data-testid="fdc3-reject-btn"
          >
            Keep My Changes
          </button>
          <button
            type="button"
            className={`${styles.button} ${styles.acceptButton}`}
            onClick={acceptPendingIntent}
            data-testid="fdc3-accept-btn"
          >
            Apply New Data
          </button>
        </div>
      </div>
    </div>
  );
};
