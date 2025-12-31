/**
 * FDC3 Confirm Dialog Component (Popup-based)
 *
 * This modal dialog appears when an FDC3 intent arrives while the user
 * has unsaved changes in the form. It gives the user a choice:
 * - Accept: Apply the incoming intent data, discarding unsaved changes
 * - Reject: Keep the current form state, ignore the intent
 *
 * The dialog shows details of the incoming intent so the user can make
 * an informed decision (symbol, direction, amount, source app, etc.).
 *
 * Uses the unified Popup system for consistent cross-platform behavior
 * in both OpenFin and web browser environments.
 *
 * @module organisms/Fdc3ConfirmDialogPopup
 */

import React, { useCallback, useEffect, useRef } from "react";

import { useOrderEntryStore } from "../../store";
import { DialogPopup, usePopupChild } from "../popup";

import styles from "./Fdc3ConfirmDialog.module.scss";

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

/**
 * Warning Icon SVG component
 */
const WarningIcon: React.FC = () => (
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

// =============================================================================
// DIALOG CONTENT COMPONENT
// =============================================================================

/**
 * Props for the dialog content component.
 * These are passed from the store via the popup.
 */
interface Fdc3DialogContentProps {
  pendingIntent: {
    currencyPair?: string;
    side?: string;
    amount?: { amount: number; ccy: string };
    orderType?: string;
  };
  onAccept: () => void;
  onReject: () => void;
}

/**
 * The actual dialog content rendered inside the popup.
 * Uses usePopupChild() to access the close function.
 */
const Fdc3DialogContent: React.FC<Fdc3DialogContentProps> = ({
  pendingIntent,
  onAccept,
  onReject,
}) => {
  const { close } = usePopupChild();

  // Focus the reject button on mount for accessibility
  const rejectButtonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    rejectButtonRef.current?.focus();
  }, []);

  /**
   * Handle accept action - apply incoming intent data
   */
  const handleAccept = useCallback(() => {
    onAccept();
    close({ confirmed: true, closeReason: "submit" });
  }, [onAccept, close]);

  /**
   * Handle reject action - keep current form state
   */
  const handleReject = useCallback(() => {
    onReject();
    close({ confirmed: false, closeReason: "cancel" });
  }, [onReject, close]);

  // Note: We don't use .dialog wrapper here because the popup-container provides
  // the card-like styling (background, border, shadow). We use .dialogContent instead.
  return (
    <div className={styles.dialogContent} data-testid="fdc3-confirm-dialog-content">
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
          ref={rejectButtonRef}
          type="button"
          className={`${styles.button} ${styles.rejectButton}`}
          onClick={handleReject}
          data-testid="fdc3-reject-btn"
        >
          Keep My Changes
        </button>
        <button
          type="button"
          className={`${styles.button} ${styles.acceptButton}`}
          onClick={handleAccept}
          data-testid="fdc3-accept-btn"
        >
          Apply New Data
        </button>
      </div>
    </div>
  );
};

// Display name for React DevTools
Fdc3DialogContent.displayName = "Fdc3DialogContent";

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * FDC3 Confirm Dialog using the Popup system.
 *
 * This component manages the dialog lifecycle based on store state.
 * When hasPendingFdc3Intent is true, the dialog opens automatically.
 *
 * Features:
 * - Modal behavior (backdrop, focus trap)
 * - Escape key to reject
 * - Cross-platform support (OpenFin and web)
 * - Theme synchronization
 *
 * @example
 * ```tsx
 * // In App.tsx, render once at app level
 * <Fdc3ConfirmDialogPopup />
 * ```
 */
export const Fdc3ConfirmDialogPopup: React.FC = () => {
  // Subscribe to pending intent state from store
  const hasPendingIntent = useOrderEntryStore((s) => s.hasPendingFdc3Intent);
  const pendingIntent = useOrderEntryStore((s) => s.pendingFdc3Intent);
  const acceptPendingIntent = useOrderEntryStore((s) => s.acceptPendingIntent);
  const rejectPendingIntent = useOrderEntryStore((s) => s.rejectPendingIntent);

  /**
   * Handle dialog close from popup system (e.g., Escape key).
   * Treats as rejection since user didn't explicitly accept.
   */
  const handleClose = useCallback(() => {
    // If closed via Escape or other means, treat as reject
    if (hasPendingIntent) {
      rejectPendingIntent();
    }
  }, [hasPendingIntent, rejectPendingIntent]);

  /**
   * Create the content component with current props.
   * Memoized to prevent unnecessary re-renders.
   */
  const DialogContent = useCallback(() => {
    if (!pendingIntent) return null;
    return (
      <Fdc3DialogContent
        pendingIntent={pendingIntent}
        onAccept={acceptPendingIntent}
        onReject={rejectPendingIntent}
      />
    );
  }, [pendingIntent, acceptPendingIntent, rejectPendingIntent]);

  // Don't render anything if no pending intent
  // The DialogPopup will handle the open/close state
  return (
    <DialogPopup
      isOpen={hasPendingIntent}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
      content={{ type: "component", component: DialogContent }}
      closeOnEscape
      // eslint-disable-next-line jsx-a11y/no-autofocus -- Intentional for modal dialogs
      autoFocus
      restoreFocus
      data-testid="fdc3-confirm-dialog"
    >
      {/* Hidden trigger - dialog is controlled by store state */}
      <span style={{ display: "none" }} />
    </DialogPopup>
  );
};

// Display name for React DevTools
Fdc3ConfirmDialogPopup.displayName = "Fdc3ConfirmDialogPopup";

export default Fdc3ConfirmDialogPopup;
