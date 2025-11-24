/**
 * useAppInit Hook
 *
 * Handles application initialization on mount. This is the bootstrap phase of the app.
 *
 * Responsibilities:
 * 1. Load reference data (Accounts, Liquidity Pools, Currency Pairs) from the server
 * 2. Set up FDC3 intent listeners for external context linking (e.g., from another app)
 * 3. Transition app status from "INITIALIZING" to "READY"
 *
 * Layered State Pattern:
 * - When FDC3 intent arrives, it updates baseValues (Layer 1)
 * - User interactions are stored separately in dirtyValues (Layer 2)
 * - FDC3 intents always override user changes by resetting interactions
 *
 * TODO (Phase 5): Replace setTimeout with actual WebSocket/GraphQL subscriptions
 *
 * @example
 * // In App.tsx
 * useAppInit(); // Runs once on mount
 */

import { useEffect } from "react";

import { Fdc3Service } from "../api/fdc3/fdc3Service";
import { mapContextToOrder } from "../api/fdc3/intentMapper";
import { useOrderEntryStore } from "../store";

export const useAppInit = () => {
  // Extract actions from store (these don't change, so safe to extract)
  const setStatus = useOrderEntryStore((s) => s.setStatus);
  const setRefData = useOrderEntryStore((s) => s.setRefData);
  const setBaseValues = useOrderEntryStore((s) => s.setBaseValues);
  const resetInteractions = useOrderEntryStore((s) => s.resetFormInteractions);

  useEffect(() => {
    const init = async () => {
      // Mark app as initializing (shows loading screen)
      setStatus("INITIALIZING");

      // 1. Load Reference Data (Mocked for now)
      // In Phase 5, this will be replaced with WebSocket GraphQL queries:
      // - GET_ACCOUNTS_QUERY
      // - GET_LIQUIDITY_POOLS_QUERY
      // - GET_CURRENCY_PAIRS_QUERY
      setTimeout(() => {
        setRefData({
          // Mock accounts - represents trading accounts/desks
          accounts: [
            { id: "ACC-001", name: "Hedge Fund A", currency: "USD" },
            { id: "ACC-002", name: "Prop Desk Alpha", currency: "EUR" },
            { id: "ACC-003", name: "Client Omnibus", currency: "GBP" },
          ],
          // Mock liquidity pools - where orders are routed
          pools: [
            { id: "GATOR_POOL_1", name: "Gator Liquid", provider: "Int" },
            { id: "EXT_POOL_A", name: "External Agg 1", provider: "Ext" },
          ],
          // Mock currency pairs - available trading instruments
          currencyPairs: [
            { symbol: "GBPUSD", base: "GBP", quote: "USD", precision: 5 },
            { symbol: "EURUSD", base: "EUR", quote: "USD", precision: 5 },
            { symbol: "USDINR", base: "USD", quote: "INR", precision: 4 },
            { symbol: "GBPINR", base: "GBP", quote: "INR", precision: 4 },
            { symbol: "EURGBP", base: "EUR", quote: "GBP", precision: 5 },
          ],
        });

        // Mark app as ready (hides loading screen, shows form)
        setStatus("READY");
      }, 1500);

      // 2. Initialize FDC3 Service (Phase 6)
      // FDC3 allows other apps to send trade data to this app
      // Example: User clicks "Trade" on a chart app → this app receives symbol/amount
      Fdc3Service.getInstance().initialize((ctx) => {
        // Convert FDC3 context (external format) to our internal Order format
        const mapped = mapContextToOrder(ctx);

        // Update base values with FDC3 data
        setBaseValues(mapped);

        // CRITICAL: Reset user interactions when FDC3 intent arrives
        // This ensures external intents always take precedence over manual edits
        resetInteractions();
      });
    };

    init();

    // Dependencies: These are action functions from the store
    // They're stable references (don't change), but ESLint requires listing them
  }, [setStatus, setRefData, setBaseValues, resetInteractions]);
};
