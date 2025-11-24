/**
 * App Component - The Root Application Component
 *
 * This is the main entry point for the FX Order Entry application.
 * It handles the application lifecycle and renders the appropriate views based on the app status.
 *
 * Architecture Flow:
 * 1. App initializes services and loads reference data (accounts, pools, currency pairs)
 * 2. Shows loading screen while status is "INITIALIZING"
 * 3. Once initialized, renders the main trading interface with:
 *    - OrderHeader: Symbol selection and live ticking prices
 *    - OrderForm: Dynamic form fields based on order type
 *    - OrderFooter: Action buttons (Submit/Amend) - rendered inside OrderForm
 *
 * State Management:
 * - Uses Zustand store with "Layered State" pattern (baseValues + dirtyValues)
 * - Status determines which view to show
 * - All business logic is handled in store slices, not in components
 */

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
  // This hook loads reference data from the server and sets up FDC3 listeners
  useAppInit();

  // Set up global keyboard shortcuts (e.g., Ctrl+Enter to submit)
  useKeyboardHotkeys();

  // Subscribe to app status to determine what to render
  // Status can be: "INITIALIZING" | "READY" | "SUBMITTING" | "ERROR"
  const status = useOrderEntryStore((s) => s.status);

  // Show loading screen while fetching initial data
  // This prevents rendering an incomplete form with empty dropdowns
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

  // Main application layout
  // OrderHeader: Currency pair selection and live price display
  // OrderForm: Dynamic form that changes based on selected order type
  // OrderFooter: Action buttons (rendered inside OrderForm component)
  return (
    <MainLayout>
      <OrderHeader />
      <div className={styles.scrollArea} data-testid="order-form-entry">
        <OrderForm />
      </div>
    </MainLayout>
  );
}

export default App;
