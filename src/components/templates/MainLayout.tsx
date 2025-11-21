import React from "react";

import { useOrderEntryStore } from "../../store";

import styles from "./MainLayout.module.scss";

interface Props {
  children: React.ReactNode;
}

export const MainLayout = ({ children }: Props) => {
  const toast = useOrderEntryStore((s) => s.toastMessage);
  const setToast = useOrderEntryStore((s) => s.setToast);

  return (
    <div className={styles.layout}>
      <div className={styles.card}>
        {children}

        {/* Toast Notification */}
        {toast && (
          <div
            className={`${styles.toast} ${toast.type === "error" ? styles.error : styles.success}`}
          >
            <span className={styles.toastText}>{toast.text}</span>
            <button onClick={() => setToast(null)} className={styles.closeBtn}>
              ×
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
