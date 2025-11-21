import { useShallow } from "zustand/react/shallow";

import { useOrderEntryStore } from "../../store";
import { formatCurrency } from "../../utils/numberFormats";

import styles from "./ReadOnlyView.module.scss";

export const ReadOnlyView = () => {
  const values = useOrderEntryStore(useShallow((s) => s.getDerivedValues()));
  const amend = useOrderEntryStore((s) => s.amendOrder);
  const reset = useOrderEntryStore((s) => s.resetFormInteractions);
  const setStatus = useOrderEntryStore((s) => s.setStatus);

  const handleNewOrder = () => {
    reset();
    setStatus("READY");
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.iconWrapper}>
          <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5 13l4 4L19 7"
            ></path>
          </svg>
        </div>
        <h2 className={styles.title}>Order Placed</h2>
        <p className={styles.subtitle}>ID: {values.orderId || "ORD-8829-X"}</p>
      </div>

      <div className={styles.details}>
        <div className={styles.row}>
          <span className={styles.label}>Type</span>
          <span className={styles.value}>
            {values.direction} {values.orderType}
          </span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Symbol</span>
          <span className={styles.valueBold}>{values.symbol}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Notional</span>
          <span className={`${styles.value} ${styles.valueBold}`}>
            {formatCurrency(Number(values.notional), values.symbol.split("/")[0])}
          </span>
        </div>
        <div className={styles.statusRow}>
          <span className={styles.label}>Status</span>
          <span className={styles.status}>Pending Fill</span>
        </div>
      </div>

      <div className={styles.actions}>
        <button onClick={amend} className={styles.btnAmend}>
          Amend
        </button>
        <button onClick={handleNewOrder} className={styles.btnNew}>
          New Order
        </button>
      </div>
    </div>
  );
};
