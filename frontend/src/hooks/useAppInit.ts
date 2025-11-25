/**
 * useAppInit Hook
 *
 * Handles application initialization on mount. This is the bootstrap phase of the app.
 *
 * Responsibilities:
 * 1. Load reference data (Accounts, Liquidity Pools, Currency Pairs) from GraphQL server
 * 2. Subscribe to global user preferences for default account selection
 * 3. Set up FDC3 intent listeners for external context linking (e.g., from another app)
 * 4. Transition app status from "INITIALIZING" to "READY"
 *
 * Layered State Pattern:
 * - When FDC3 intent arrives, it updates baseValues (Layer 1)
 * - User interactions are stored separately in dirtyValues (Layer 2)
 * - FDC3 intents always override user changes by resetting interactions
 *
 * GraphQL Integration:
 * - Uses Apollo Client hooks (useQuery, useSubscription) to fetch data
 * - Queries: accounts, orderTypesWithPools, currencyPairs
 * - Subscription: globalUserPreferencesStream (for default account updates)
 *
 * @example
 * // In App.tsx
 * useAppInit(); // Runs once on mount
 */

import { useQuery, useSubscription } from "@apollo/client";
import { useEffect } from "react";

import { Fdc3Service } from "../api/fdc3/fdc3Service";
import { mapContextToOrder } from "../api/fdc3/intentMapper";
import {
  ACCOUNTS_QUERY,
  CCY_STATIC_QUERY,
  ORDER_TYPES_LIQUIDITY_POOLS_QUERY,
} from "../graphql/queries";
import { GLOBAL_USER_PREFERENCES_SUBSCRIPTION } from "../graphql/subscriptions";
import type {
  AccountsQueryResponse,
  CcyStaticQueryResponse,
  GlobalUserPreferencesSubscriptionResponse,
  LiquidityPoolGQL,
  OrderTypesLiquidityPoolsQueryResponse,
} from "../graphql/types";
import { useOrderEntryStore } from "../store";
import type { Account, CurrencyPair, LiquidityPool } from "../types/domain";

export const useAppInit = () => {
  // Extract actions from store (these don't change, so safe to extract)
  const setStatus = useOrderEntryStore((s) => s.setStatus);
  const setRefData = useOrderEntryStore((s) => s.setRefData);
  const setBaseValues = useOrderEntryStore((s) => s.setBaseValues);
  const resetInteractions = useOrderEntryStore((s) => s.resetFormInteractions);
  const validateRefData = useOrderEntryStore((s) => s.validateRefData);

  // Query 1: Fetch all accounts
  // Used to populate account dropdown
  // Cache policy: cache-first (reference data, rarely changes)
  const {
    data: accountsData,
    loading: accountsLoading,
    error: accountsError,
  } = useQuery<AccountsQueryResponse>(ACCOUNTS_QUERY);

  // Query 2: Fetch order types with their liquidity pools
  // Used to populate order type dropdown and determine available pools per type
  // Cache policy: cache-first (configuration data, rarely changes)
  const {
    data: orderTypesData,
    loading: orderTypesLoading,
    error: orderTypesError,
  } = useQuery<OrderTypesLiquidityPoolsQueryResponse>(ORDER_TYPES_LIQUIDITY_POOLS_QUERY);

  // Query 3: Fetch currency pairs
  // No orderType filter initially - get all pairs
  // When user changes order type, we'll refetch with the filter
  // Cache policy: cache-first, but will refetch when orderType changes
  const {
    data: currencyPairsData,
    loading: currencyPairsLoading,
    error: currencyPairsError,
  } = useQuery<CcyStaticQueryResponse>(CCY_STATIC_QUERY, {
    variables: { orderType: null }, // null = fetch all pairs initially
  });

  // Subscription: Global user preferences stream
  // Provides real-time updates when user's default account changes
  // This will override the 0th index account selection from the accounts query
  const { data: userPrefsData } = useSubscription<GlobalUserPreferencesSubscriptionResponse>(
    GLOBAL_USER_PREFERENCES_SUBSCRIPTION,
    {
      // no-cache: Real-time data, don't cache subscription results
      fetchPolicy: "no-cache",
      onError: (err) => {
        console.error("[useAppInit] User preferences subscription error:", err);
        // Non-blocking: App can continue without user preferences
      },
    }
  );

  // Effect 1: Load reference data when queries complete
  useEffect(() => {
    // Wait for all queries to complete
    const isLoading = accountsLoading || orderTypesLoading || currencyPairsLoading;
    const hasErrors = accountsError || orderTypesError || currencyPairsError;

    if (isLoading) {
      // Still loading, keep status as INITIALIZING
      setStatus("INITIALIZING");
      return;
    }

    if (hasErrors) {
      // Log errors but continue - we can work with partial data
      console.error("[useAppInit] Query errors:", {
        accountsError,
        orderTypesError,
        currencyPairsError,
      });
      // Set status to ERROR if critical queries fail
      if (accountsError) {
        setStatus("ERROR");
        return;
      }
    }

    // Map backend data to store format
    // Keep sdsId as number, don't add extra fields
    const accounts: Account[] = accountsData?.accounts || [];

    // Extract entitled order types from server response
    const entitledOrderTypes: string[] =
      orderTypesData?.orderTypesWithPools?.map((ot) => ot.orderType) || [];

    // Extract all unique liquidity pools from all order types
    // Backend returns pools nested under each order type, we need a flat list
    const poolsMap = new Map<string, LiquidityPool>();
    orderTypesData?.orderTypesWithPools?.forEach((orderType) => {
      orderType.liquidityPools?.forEach((pool: LiquidityPoolGQL) => {
        if (!poolsMap.has(pool.value)) {
          poolsMap.set(pool.value, {
            value: pool.value,
            name: pool.name,
          });
        }
      });
    });
    const pools: LiquidityPool[] = Array.from(poolsMap.values());

    // Use currency pairs as-is from the query (no transformation)
    const currencyPairs: CurrencyPair[] = currencyPairsData?.currencyPairs || [];

    // Update store with reference data
    setRefData({
      accounts,
      pools,
      currencyPairs,
      entitledOrderTypes,
    });

    // Validate reference data after loading
    // This checks if any baseValues reference unavailable data
    validateRefData();

    // Mark app as ready (hides loading screen, shows form)
    setStatus("READY");
  }, [
    accountsData,
    accountsLoading,
    accountsError,
    orderTypesData,
    orderTypesLoading,
    orderTypesError,
    currencyPairsData,
    currencyPairsLoading,
    currencyPairsError,
    setRefData,
    setStatus,
    validateRefData,
  ]);

  // Effect 2: Apply user preferences when available
  useEffect(() => {
    if (!userPrefsData?.globalUserPreferencesStream) return;

    const defaultAccount = userPrefsData.globalUserPreferencesStream.defaultGlobalAccount;

    if (defaultAccount) {
      // Update base values with preferred account
      // This overrides the default 0th index account selection
      setBaseValues({
        account: defaultAccount.sdsId.toString(),
      });

      // Validate that the default account exists in accounts list
      validateRefData();
    }
  }, [userPrefsData, setBaseValues, validateRefData]);

  // Effect 3: Initialize FDC3 Service (Phase 6)
  useEffect(() => {
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

      // Validate reference data after FDC3 intent
      // Check if intent references unavailable accounts/orderTypes/symbols/pools
      validateRefData();

      console.log("[useAppInit] FDC3 intent received and applied:", ctx);
    });
  }, [setBaseValues, resetInteractions, validateRefData]);
};
