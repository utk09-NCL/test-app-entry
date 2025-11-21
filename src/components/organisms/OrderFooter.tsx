import { useOrderEntryStore } from "../../store";
import { Spinner } from "../atoms/Spinner";

import styles from "./OrderFooter.module.scss";

export const OrderFooter = () => {
  const status = useOrderEntryStore((s) => s.status);
  const editMode = useOrderEntryStore((s) => s.editMode);
  const submitOrder = useOrderEntryStore((s) => s.submitOrder);
  const amendOrder = useOrderEntryStore((s) => s.amendOrder);
  const errors = useOrderEntryStore((s) => s.errors);
  const serverErrors = useOrderEntryStore((s) => s.serverErrors);
  const hasErrors = Object.keys(errors).length > 0 || Object.keys(serverErrors).length > 0;

  return (
    <div className={styles.footer}>
      {editMode === "viewing" ? (
        <button onClick={() => amendOrder()} className={styles.submitBtn}>
          AMEND ORDER
        </button>
      ) : (
        <button
          onClick={() => submitOrder()}
          disabled={status === "SUBMITTING" || hasErrors}
          className={styles.submitBtn}
        >
          {status === "SUBMITTING" ? <Spinner size="md" /> : "SUBMIT ORDER"}
        </button>
      )}
    </div>
  );
};
