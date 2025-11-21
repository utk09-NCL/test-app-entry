import { Spinner } from "./components/atoms/Spinner";
import { OrderForm } from "./components/organisms/OrderForm";
import { OrderHeader } from "./components/organisms/OrderHeader";
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

  if (status === "INITIALIZING") {
    return (
      <div className={styles.loadingContainer}>
        <div className="text-center">
          <Spinner size="lg" />
          <p className={styles.loadingText}>Initializing...</p>
        </div>
      </div>
    );
  }

  return (
    <MainLayout>
      <OrderHeader />
      <div className={styles.scrollArea}>
        <OrderForm />
      </div>
    </MainLayout>
  );
}

export default App;
