import { Spinner } from "./components/atoms/Spinner";
import { OrderForm } from "./components/organisms/OrderForm";
import { OrderHeader } from "./components/organisms/OrderHeader";
import { ReadOnlyView } from "./components/organisms/ReadOnlyView";
import { MainLayout } from "./components/templates/MainLayout";
import { useAppInit } from "./hooks/useAppInit";
import { useKeyboardHotkeys } from "./hooks/useKeyboardHotkeys";
import { useOrderEntryStore } from "./store";

import styles from "./App.module.scss";

function App() {
  // Initialize Data and Services
  useAppInit();
  useKeyboardHotkeys();

  const status = useOrderEntryStore((s) => s.status);
  const submitOrder = useOrderEntryStore((s) => s.submitOrder);

  if (status === "INITIALIZING") {
    return (
      <div className={styles.loadingContainer}>
        <div className="text-center">
          <Spinner size="lg" />
          <p className={styles.loadingText}>Initializing Gator FX...</p>
        </div>
      </div>
    );
  }

  return (
    <MainLayout>
      {status === "READ_ONLY" ? (
        <ReadOnlyView />
      ) : (
        <>
          <OrderHeader />
          <div className={styles.scrollArea}>
            <OrderForm />
          </div>
          <div className={styles.footer}>
            <button
              onClick={() => submitOrder()}
              disabled={status === "SUBMITTING"}
              className={styles.submitBtn}
            >
              {status === "SUBMITTING" ? <Spinner size="md" /> : "SUBMIT ORDER"}
            </button>
          </div>
        </>
      )}
    </MainLayout>
  );
}

export default App;
