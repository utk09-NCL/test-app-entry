/**
 * Store Selectors - Reusable functions and hooks for accessing store state
 *
 * This file provides two types of selectors:
 * 1. Pure selector functions (select*) - Take state as input, testable
 * 2. Hook wrappers (use*) - For use in React components
 *
 * Benefits:
 * - Encapsulates store structure (components don't need to know state shape)
 * - Memoized selections (prevents unnecessary re-renders)
 * - Type-safe access to nested state
 * - Single source of truth for common selections
 * - Testable without React
 *
 * Usage in components:
 * ```tsx
 * const amount = useAmount();
 * const { buyPrice, sellPrice } = useCurrentPrices();
 * ```
 *
 * Usage in tests or vanilla JS:
 * ```ts
 * const state = useOrderEntryStore.getState();
 * const amount = selectAmount(state);
 * ```
 */

import { BoundState } from "../types/store";

import { useOrderEntryStore } from "./index";

// ============================================================
// Amount Selectors
// ============================================================

/** Select the full amount object { amount, ccy } from derived values. */
export const selectAmount = (state: BoundState) => state.getDerivedValues().amount;

/** Select only the numeric amount value. */
export const selectNumericAmount = (state: BoundState) => state.getDerivedValues().amount?.amount;

/** Select the currency code from the amount. */
export const selectAmountCurrency = (state: BoundState) => state.getDerivedValues().amount?.ccy;

/** Hook: Get the full amount object. */
export const useAmount = () => useOrderEntryStore(selectAmount);

/** Hook: Get only the numeric amount value. */
export const useNumericAmount = () => useOrderEntryStore(selectNumericAmount);

/** Hook: Get the currency code from the amount. */
export const useAmountCurrency = () => useOrderEntryStore(selectAmountCurrency);

// ============================================================
// Currency Pair Selectors
// ============================================================

/** Select the current currency pair symbol (e.g., "GBPUSD"). */
export const selectCurrencyPair = (state: BoundState) => state.getDerivedValues().currencyPair;

/** Select the full currency pair object with all metadata. */
export const selectCurrencyPairDetails = (state: BoundState) => {
  const symbol = state.getDerivedValues().currencyPair;
  return state.currencyPairs.find((cp) => cp.symbol === symbol);
};

/** Select both currency codes from the current pair. */
export const selectCurrencies = (state: BoundState) => {
  const pair = selectCurrencyPairDetails(state);
  return {
    ccy1: pair?.ccy1 || "CCY1",
    ccy2: pair?.ccy2 || "CCY2",
  };
};

/** Hook: Get the current currency pair symbol. */
export const useCurrencyPair = () => useOrderEntryStore(selectCurrencyPair);

/** Hook: Get the full currency pair object. */
export const useCurrencyPairDetails = () => useOrderEntryStore(selectCurrencyPairDetails);

/** Hook: Get both currency codes from the current pair. */
export const useCurrencies = () => useOrderEntryStore(selectCurrencies);

// ============================================================
// Order Details Selectors
// ============================================================

/** Select the current order side (BUY or SELL). */
export const selectSide = (state: BoundState) => state.getDerivedValues().side;

/** Select the current order type. */
export const selectOrderType = (state: BoundState) => state.getDerivedValues().orderType;

/** Select the current level (limit price). */
export const selectLevel = (state: BoundState) => state.getDerivedValues().level;

/** Select the current liquidity pool. */
export const selectLiquidityPool = (state: BoundState) => state.getDerivedValues().liquidityPool;

/** Select the current account. */
export const selectAccount = (state: BoundState) => state.getDerivedValues().account;

/** Select the current expiry configuration. */
export const selectExpiry = (state: BoundState) => state.getDerivedValues().expiry;

/** Hook: Get the current order side. */
export const useSide = () => useOrderEntryStore(selectSide);

/** Hook: Get the current order type. */
export const useOrderType = () => useOrderEntryStore(selectOrderType);

/** Hook: Get the current level. */
export const useLevel = () => useOrderEntryStore(selectLevel);

/** Hook: Get the current liquidity pool. */
export const useLiquidityPool = () => useOrderEntryStore(selectLiquidityPool);

/** Hook: Get the current account. */
export const useAccount = () => useOrderEntryStore(selectAccount);

/** Hook: Get the current expiry configuration. */
export const useExpiry = () => useOrderEntryStore(selectExpiry);

// ============================================================
// Price Selectors
// ============================================================

/** Select the current buy price (ask). */
export const selectBuyPrice = (state: BoundState) => state.currentBuyPrice;

/** Select the current sell price (bid). */
export const selectSellPrice = (state: BoundState) => state.currentSellPrice;

/** Select both current prices. */
export const selectCurrentPrices = (state: BoundState) => ({
  buyPrice: state.currentBuyPrice,
  sellPrice: state.currentSellPrice,
});

/** Select whether prices are available (non-zero). */
export const selectPricesAvailable = (state: BoundState) =>
  state.currentBuyPrice > 0 && state.currentSellPrice > 0;

/** Hook: Get the current buy price. */
export const useBuyPrice = () => useOrderEntryStore(selectBuyPrice);

/** Hook: Get the current sell price. */
export const useSellPrice = () => useOrderEntryStore(selectSellPrice);

/** Hook: Get both current prices. */
export const useCurrentPrices = () => useOrderEntryStore(selectCurrentPrices);

/** Hook: Check if prices are available. */
export const usePricesAvailable = () => useOrderEntryStore(selectPricesAvailable);

// ============================================================
// App State Selectors
// ============================================================

/** Select the current edit mode (creating, viewing, amending). */
export const selectEditMode = (state: BoundState) => state.editMode;

/** Select the application status. */
export const selectAppStatus = (state: BoundState) => state.status;

/** Select whether the app is ready. */
export const selectIsReady = (state: BoundState) => state.status === "READY";

/** Select whether the app is submitting. */
export const selectIsSubmitting = (state: BoundState) => state.status === "SUBMITTING";

/** Select the current order ID. */
export const selectCurrentOrderId = (state: BoundState) => state.currentOrderId;

/** Select the current toast message. */
export const selectToastMessage = (state: BoundState) => state.toastMessage;

/** Hook: Get the current edit mode. */
export const useEditMode = () => useOrderEntryStore(selectEditMode);

/** Hook: Get the application status. */
export const useAppStatus = () => useOrderEntryStore(selectAppStatus);

/** Hook: Check if the app is ready. */
export const useIsReady = () => useOrderEntryStore(selectIsReady);

/** Hook: Check if the app is submitting. */
export const useIsSubmitting = () => useOrderEntryStore(selectIsSubmitting);

/** Hook: Get the current order ID. */
export const useCurrentOrderId = () => useOrderEntryStore(selectCurrentOrderId);

/** Hook: Get the current toast message. */
export const useToastMessage = () => useOrderEntryStore(selectToastMessage);

// ============================================================
// Validation Selectors
// ============================================================

/** Select all validation errors. */
export const selectErrors = (state: BoundState) => state.errors;

/** Select all server errors. */
export const selectServerErrors = (state: BoundState) => state.serverErrors;

/** Select all warnings. */
export const selectWarnings = (state: BoundState) => state.warnings;

/** Select the global error message. */
export const selectGlobalError = (state: BoundState) => state.globalError;

/** Select whether the form is valid. */
export const selectIsFormValid = (state: BoundState) => state.isFormValid();

/** Select whether the form has been modified. */
export const selectIsDirty = (state: BoundState) => state.isDirty();

/** Hook: Get all validation errors. */
export const useErrors = () => useOrderEntryStore(selectErrors);

/** Hook: Get all server errors. */
export const useServerErrors = () => useOrderEntryStore(selectServerErrors);

/** Hook: Get all warnings. */
export const useWarnings = () => useOrderEntryStore(selectWarnings);

/** Hook: Get the global error message. */
export const useGlobalError = () => useOrderEntryStore(selectGlobalError);

/** Hook: Check if the form is valid. */
export const useIsFormValid = () => useOrderEntryStore(selectIsFormValid);

/** Hook: Check if the form has been modified. */
export const useIsDirty = () => useOrderEntryStore(selectIsDirty);

// ============================================================
// Reference Data Selectors
// ============================================================

/** Select all available accounts. */
export const selectAccounts = (state: BoundState) => state.accounts;

/** Select all available liquidity pools. */
export const selectPools = (state: BoundState) => state.pools;

/** Select all available currency pairs. */
export const selectCurrencyPairs = (state: BoundState) => state.currencyPairs;

/** Select entitled order types. */
export const selectEntitledOrderTypes = (state: BoundState) => state.entitledOrderTypes;

/** Select whether reference data is loading. */
export const selectIsLoadingRefData = (state: BoundState) => state.isLoadingRefData;

/** Hook: Get all available accounts. */
export const useAccounts = () => useOrderEntryStore(selectAccounts);

/** Hook: Get all available liquidity pools. */
export const usePools = () => useOrderEntryStore(selectPools);

/** Hook: Get all available currency pairs. */
export const useCurrencyPairs = () => useOrderEntryStore(selectCurrencyPairs);

/** Hook: Get entitled order types. */
export const useEntitledOrderTypes = () => useOrderEntryStore(selectEntitledOrderTypes);

/** Hook: Check if reference data is loading. */
export const useIsLoadingRefData = () => useOrderEntryStore(selectIsLoadingRefData);

// ============================================================
// Derived Values Selectors
// ============================================================

/** Select all derived values (full merged order state). */
export const selectDerivedValues = (state: BoundState) => state.getDerivedValues();

/** Select user-modified field values. */
export const selectDirtyValues = (state: BoundState) => state.dirtyValues;

/** Select whether a specific field has been modified. */
export const selectIsFieldDirty = (state: BoundState, fieldKey: string) =>
  fieldKey in state.dirtyValues;

/** Hook: Get all derived values. */
export const useDerivedValues = () => useOrderEntryStore(selectDerivedValues);

/** Hook: Get user-modified field values. */
export const useDirtyValues = () => useOrderEntryStore(selectDirtyValues);

/** Hook: Check if a specific field has been modified. */
export const useIsFieldDirty = (fieldKey: string) =>
  useOrderEntryStore((state) => selectIsFieldDirty(state, fieldKey));
