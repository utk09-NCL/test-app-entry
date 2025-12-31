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
 *
 * GraphQL Integration:
 * - ApolloProvider wraps the entire app to provide GraphQL client context
 * - All queries/mutations/subscriptions use the configured Apollo client
 */

import { ApolloProvider } from "@apollo/client";

import { Spinner } from "./components/atoms/Spinner";
import { Fdc3ConfirmDialogPopup } from "./components/organisms/Fdc3ConfirmDialogPopup";
import { OrderForm } from "./components/organisms/OrderForm";
import { OrderHeader } from "./components/organisms/OrderHeader";
import { PopupProvider } from "./components/popup";
import { MainLayout } from "./components/templates/MainLayout";
import { graphqlClient } from "./graphql/client";
import { useAppInit } from "./hooks/useAppInit";
import { useKeyboardHotkeys } from "./hooks/useKeyboardHotkeys";
import { useOrderTracking } from "./hooks/useOrderTracking";
import { useOrderEntryStore } from "./store";

import styles from "./App.module.scss";

function App() {
  // Initialize Data and Services
  // This hook loads reference data from the server and sets up FDC3 listeners
  useAppInit();

  // Track order status updates via ORDER_SUBSCRIPTION
  useOrderTracking();

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
  // Fdc3ConfirmDialog: Modal shown when FDC3 intent arrives with unsaved changes
  return (
    <MainLayout>
      <OrderHeader />
      <div data-testid="order-form-entry">
        <OrderForm />
      </div>
      <Fdc3ConfirmDialogPopup />
    </MainLayout>
  );
}

export default function AppWithProviders() {
  return (
    <ApolloProvider client={graphqlClient}>
      <PopupProvider>
        <App />
      </PopupProvider>
    </ApolloProvider>
  );
}
