/**
 * MainLayout Template - Root Layout with Toast Notifications
 *
 * The outermost container for the order entry app.
 * Provides:
 * - Centered card layout (desktop-friendly)
 * - Global toast notifications (success/error messages)
 * - Consistent styling and spacing
 *
 * Why a template component?
 * - Atomic Design pattern: Templates are page-level layouts
 * - Wraps all organisms (OrderHeader, OrderForm, OrderFooter)
 * - Single place to add global UI elements (toasts, modals, etc.)
 *
 * Toast Notifications:
 * - Displayed at bottom of card
 * - Auto-dismissed by user (click X button)
 * - Success (green) vs Error (red) styling
 *
 * Used by: App.tsx to wrap the entire order entry form.
 */

import React from "react";

import { useOrderEntryStore } from "../../store";

import styles from "./MainLayout.module.scss";

interface Props {
  /** Page content (OrderHeader + OrderForm) */
  children: React.ReactNode;
}

export const MainLayout = ({ children }: Props) => {
  // Toast state from global store
  const toast = useOrderEntryStore((s) => s.toastMessage);
  const setToast = useOrderEntryStore((s) => s.setToast);

  return (
    <div className={styles.layout} data-testid="main-layout">
      {/* Card container - centered, shadowed, white background */}
      <div className={styles.card}>
        {/* Page content (OrderHeader + OrderForm) */}
        {children}

        {/* Toast Notification - only shown when toast is set */}
        {toast && (
          <div
            className={`${styles.toast} ${toast.type === "error" ? styles.error : styles.success}`}
          >
            {/* Toast message text */}
            <span className={styles.toastText}>{toast.text}</span>

            {/* Close button - clicking dismisses toast */}
            <button onClick={() => setToast(null)} className={styles.closeBtn}>
              ×
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
