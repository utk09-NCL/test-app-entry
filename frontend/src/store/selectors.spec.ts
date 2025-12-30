import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderHook } from "@testing-library/react";

import { OrderSide, OrderType } from "../types/domain";

import { useOrderEntryStore } from "./index";
import {
  selectAccount,
  selectAccounts,
  selectAmount,
  selectAmountCurrency,
  selectAppStatus,
  selectBuyPrice,
  selectCurrencies,
  selectCurrencyPair,
  selectCurrencyPairDetails,
  selectCurrencyPairs,
  selectCurrentOrderId,
  selectCurrentPrices,
  selectDerivedValues,
  selectDirtyValues,
  selectEditMode,
  selectEntitledOrderTypes,
  selectErrors,
  selectExpiry,
  selectGlobalError,
  selectIsDirty,
  selectIsFieldDirty,
  selectIsFormValid,
  selectIsLoadingRefData,
  selectIsReady,
  selectIsSubmitting,
  selectLevel,
  selectLiquidityPool,
  selectNumericAmount,
  selectOrderType,
  selectPools,
  selectPricesAvailable,
  selectSellPrice,
  selectServerErrors,
  selectSide,
  selectToastMessage,
  selectWarnings,
  useAccount,
  useAccounts,
  useAmount,
  useAmountCurrency,
  useAppStatus,
  useBuyPrice,
  useCurrencies,
  useCurrencyPair,
  useCurrencyPairDetails,
  useCurrencyPairs,
  useCurrentOrderId,
  useCurrentPrices,
  useDerivedValues,
  useDirtyValues,
  useEditMode,
  useEntitledOrderTypes,
  useErrors,
  useExpiry,
  useGlobalError,
  useIsDirty,
  useIsFieldDirty,
  useIsFormValid,
  useIsLoadingRefData,
  useIsReady,
  useIsSubmitting,
  useLevel,
  useLiquidityPool,
  useNumericAmount,
  useOrderType,
  usePools,
  usePricesAvailable,
  useSellPrice,
  useServerErrors,
  useSide,
  useToastMessage,
  useWarnings,
} from "./selectors";

// Mock GraphQL client to prevent actual network calls
vi.mock("../graphql/client", () => ({
  graphqlClient: {
    subscribe: vi.fn(() => ({
      subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
    })),
    mutate: vi.fn(),
  },
}));

describe("Store Selectors", () => {
  beforeEach(() => {
    const store = useOrderEntryStore.getState();
    store.setStatus("READY");
    store.setEditMode("creating");
    store.resetFormInteractions();
    store.clearValidationState();
    // Reset prices to 0
    store.setCurrentPrices(0, 0);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Amount Selectors", () => {
    it("expect selectAmount to return amount object from derived values", () => {
      const state = useOrderEntryStore.getState();
      const amount = selectAmount(state);

      expect(amount).toBeDefined();
      expect(amount?.amount).toBe(1000000);
      expect(amount?.ccy).toBeDefined();
    });

    it("expect selectNumericAmount to return only the numeric value", () => {
      const state = useOrderEntryStore.getState();
      const numericAmount = selectNumericAmount(state);

      expect(numericAmount).toBe(1000000);
    });

    it("expect selectAmountCurrency to return currency code", () => {
      const state = useOrderEntryStore.getState();
      const ccy = selectAmountCurrency(state);

      expect(ccy).toBeDefined();
      expect(typeof ccy).toBe("string");
    });

    it("expect amount to reflect user changes", () => {
      const store = useOrderEntryStore.getState();
      store.setFieldValue("amount", { amount: 500000, ccy: "USD" });

      const state = useOrderEntryStore.getState();
      const amount = selectAmount(state);

      expect(amount?.amount).toBe(500000);
      expect(amount?.ccy).toBe("USD");
    });
  });

  describe("Currency Pair Selectors", () => {
    it("expect selectCurrencyPair to return default currency pair", () => {
      const state = useOrderEntryStore.getState();
      const currencyPair = selectCurrencyPair(state);

      expect(currencyPair).toBe("GBPUSD");
    });

    it("expect selectCurrencyPair to reflect user changes", () => {
      const store = useOrderEntryStore.getState();
      store.setFieldValue("currencyPair", "EURUSD");

      const state = useOrderEntryStore.getState();
      const currencyPair = selectCurrencyPair(state);

      expect(currencyPair).toBe("EURUSD");
    });

    it("expect selectCurrencyPairDetails to return undefined when pair not in ref data", () => {
      const state = useOrderEntryStore.getState();
      const details = selectCurrencyPairDetails(state);

      // Currency pairs are empty initially (before ref data loads)
      expect(details).toBeUndefined();
    });

    it("expect selectCurrencies to return default currencies when pair not found", () => {
      const state = useOrderEntryStore.getState();
      const { ccy1, ccy2 } = selectCurrencies(state);

      expect(ccy1).toBe("CCY1");
      expect(ccy2).toBe("CCY2");
    });

    it("expect selectCurrencies to return actual currencies when ref data is loaded", () => {
      const store = useOrderEntryStore.getState();
      store.setRefData({
        accounts: [],
        pools: [],
        currencyPairs: [
          {
            id: "GBPUSD_1",
            symbol: "GBPUSD",
            ccy1: "GBP",
            ccy2: "USD",
            ccy1Deliverable: true,
            ccy2Deliverable: true,
            ccy1Onshore: true,
            ccy2Onshore: true,
            spotPrecision: 5,
            bigDigits: 2,
            bigDigitsOffset: 2,
            additionalPrecision: 0,
            minPipStep: 1,
            defaultPipStep: 1,
            defaultTenor: "SP",
            tenor: "SP",
            stopLossAllowed: true,
          },
        ],
        entitledOrderTypes: [],
      });

      const state = useOrderEntryStore.getState();
      const { ccy1, ccy2 } = selectCurrencies(state);

      expect(ccy1).toBe("GBP");
      expect(ccy2).toBe("USD");
    });
  });

  describe("Order Details Selectors", () => {
    it("expect selectSide to return default side", () => {
      const state = useOrderEntryStore.getState();
      const side = selectSide(state);

      expect(side).toBe(OrderSide.BUY);
    });

    it("expect selectSide to reflect user changes", () => {
      const store = useOrderEntryStore.getState();
      store.setFieldValue("side", OrderSide.SELL);

      const state = useOrderEntryStore.getState();
      const side = selectSide(state);

      expect(side).toBe(OrderSide.SELL);
    });

    it("expect selectOrderType to return default order type", () => {
      const state = useOrderEntryStore.getState();
      const orderType = selectOrderType(state);

      expect(orderType).toBe(OrderType.FLOAT);
    });

    it("expect selectOrderType to reflect user changes", () => {
      const store = useOrderEntryStore.getState();
      store.setFieldValue("orderType", OrderType.STOP_LOSS);

      const state = useOrderEntryStore.getState();
      const orderType = selectOrderType(state);

      expect(orderType).toBe(OrderType.STOP_LOSS);
    });

    it("expect selectLevel to return undefined when not set", () => {
      const state = useOrderEntryStore.getState();
      const level = selectLevel(state);

      // Level is undefined by default (no auto-grab when prices are 0)
      expect(level).toBeUndefined();
    });

    it("expect selectLevel to reflect user changes", () => {
      const store = useOrderEntryStore.getState();
      store.setFieldValue("level", 1.2345);

      const state = useOrderEntryStore.getState();
      const level = selectLevel(state);

      expect(level).toBe(1.2345);
    });

    it("expect selectLiquidityPool to return default pool", () => {
      const state = useOrderEntryStore.getState();
      const pool = selectLiquidityPool(state);

      expect(pool).toBe("Hybrid");
    });

    it("expect selectAccount to return undefined initially", () => {
      const state = useOrderEntryStore.getState();
      const account = selectAccount(state);

      // Account is undefined until user selects one
      expect(account).toBeUndefined();
    });

    it("expect selectExpiry to return default expiry", () => {
      const state = useOrderEntryStore.getState();
      const expiry = selectExpiry(state);

      expect(expiry).toBeDefined();
      expect(expiry?.strategy).toBe("GTC");
    });
  });

  describe("Price Selectors", () => {
    it("expect selectBuyPrice to return 0 initially", () => {
      const state = useOrderEntryStore.getState();
      const buyPrice = selectBuyPrice(state);

      expect(buyPrice).toBe(0);
    });

    it("expect selectSellPrice to return 0 initially", () => {
      const state = useOrderEntryStore.getState();
      const sellPrice = selectSellPrice(state);

      expect(sellPrice).toBe(0);
    });

    it("expect selectCurrentPrices to return both prices", () => {
      const state = useOrderEntryStore.getState();
      const { buyPrice, sellPrice } = selectCurrentPrices(state);

      expect(buyPrice).toBe(0);
      expect(sellPrice).toBe(0);
    });

    it("expect prices to update when setCurrentPrices is called", () => {
      const store = useOrderEntryStore.getState();
      store.setCurrentPrices(1.2735, 1.2732);

      const state = useOrderEntryStore.getState();
      const { buyPrice, sellPrice } = selectCurrentPrices(state);

      expect(buyPrice).toBe(1.2735);
      expect(sellPrice).toBe(1.2732);
    });

    it("expect selectPricesAvailable to return false when prices are 0", () => {
      const state = useOrderEntryStore.getState();
      const available = selectPricesAvailable(state);

      expect(available).toBe(false);
    });

    it("expect selectPricesAvailable to return true when prices are set", () => {
      const store = useOrderEntryStore.getState();
      store.setCurrentPrices(1.5, 1.49);

      const state = useOrderEntryStore.getState();
      const available = selectPricesAvailable(state);

      expect(available).toBe(true);
    });
  });

  describe("App State Selectors", () => {
    it("expect selectEditMode to return creating initially", () => {
      const state = useOrderEntryStore.getState();
      const editMode = selectEditMode(state);

      expect(editMode).toBe("creating");
    });

    it("expect selectEditMode to reflect changes", () => {
      const store = useOrderEntryStore.getState();
      store.setEditMode("viewing");

      const state = useOrderEntryStore.getState();
      const editMode = selectEditMode(state);

      expect(editMode).toBe("viewing");
    });

    it("expect selectAppStatus to return READY after setup", () => {
      const state = useOrderEntryStore.getState();
      const status = selectAppStatus(state);

      expect(status).toBe("READY");
    });

    it("expect selectIsReady to return true when status is READY", () => {
      const state = useOrderEntryStore.getState();
      const isReady = selectIsReady(state);

      expect(isReady).toBe(true);
    });

    it("expect selectIsReady to return false when status is not READY", () => {
      const store = useOrderEntryStore.getState();
      store.setStatus("SUBMITTING");

      const state = useOrderEntryStore.getState();
      const isReady = selectIsReady(state);

      expect(isReady).toBe(false);
    });

    it("expect selectIsSubmitting to return true when status is SUBMITTING", () => {
      const store = useOrderEntryStore.getState();
      store.setStatus("SUBMITTING");

      const state = useOrderEntryStore.getState();
      const isSubmitting = selectIsSubmitting(state);

      expect(isSubmitting).toBe(true);
    });

    it("expect selectCurrentOrderId to return null initially", () => {
      const state = useOrderEntryStore.getState();
      const orderId = selectCurrentOrderId(state);

      expect(orderId).toBeNull();
    });

    it("expect selectCurrentOrderId to reflect changes", () => {
      const store = useOrderEntryStore.getState();
      store.setCurrentOrderId("ORDER-123");

      const state = useOrderEntryStore.getState();
      const orderId = selectCurrentOrderId(state);

      expect(orderId).toBe("ORDER-123");
    });

    it("expect selectToastMessage to return null initially", () => {
      const state = useOrderEntryStore.getState();
      const toast = selectToastMessage(state);

      expect(toast).toBeNull();
    });
  });

  describe("Validation Selectors", () => {
    it("expect selectErrors to return empty object initially", () => {
      const state = useOrderEntryStore.getState();
      const errors = selectErrors(state);

      expect(errors).toEqual({});
    });

    it("expect selectServerErrors to return empty object initially", () => {
      const state = useOrderEntryStore.getState();
      const serverErrors = selectServerErrors(state);

      expect(serverErrors).toEqual({});
    });

    it("expect selectWarnings to return empty object initially", () => {
      const state = useOrderEntryStore.getState();
      const warnings = selectWarnings(state);

      expect(warnings).toEqual({});
    });

    it("expect selectGlobalError to return null initially", () => {
      const state = useOrderEntryStore.getState();
      const globalError = selectGlobalError(state);

      expect(globalError).toBeNull();
    });

    it("expect selectGlobalError to reflect changes", () => {
      const store = useOrderEntryStore.getState();
      store.setGlobalError("Something went wrong");

      const state = useOrderEntryStore.getState();
      const globalError = selectGlobalError(state);

      expect(globalError).toBe("Something went wrong");
    });

    it("expect selectIsFormValid to return true when no errors", () => {
      const state = useOrderEntryStore.getState();
      const isValid = selectIsFormValid(state);

      expect(isValid).toBe(true);
    });

    it("expect selectIsDirty to return false when no user changes", () => {
      const state = useOrderEntryStore.getState();
      const isDirty = selectIsDirty(state);

      expect(isDirty).toBe(false);
    });

    it("expect selectIsDirty to return true after user changes", () => {
      const store = useOrderEntryStore.getState();
      store.setFieldValue("level", 1.5);

      const state = useOrderEntryStore.getState();
      const isDirty = selectIsDirty(state);

      expect(isDirty).toBe(true);
    });
  });

  describe("Reference Data Selectors", () => {
    it("expect selectAccounts to return accounts from ref data", () => {
      const store = useOrderEntryStore.getState();
      store.setRefData({
        accounts: [{ sdsId: 1, name: "Test Account" }],
        pools: [],
        currencyPairs: [],
        entitledOrderTypes: [],
      });

      const state = useOrderEntryStore.getState();
      const accounts = selectAccounts(state);

      expect(accounts).toHaveLength(1);
      expect(accounts[0].name).toBe("Test Account");
    });

    it("expect selectPools to return pools from ref data", () => {
      const store = useOrderEntryStore.getState();
      store.setRefData({
        accounts: [],
        pools: [{ name: "Test Pool", value: "POOL1" }],
        currencyPairs: [],
        entitledOrderTypes: [],
      });

      const state = useOrderEntryStore.getState();
      const pools = selectPools(state);

      expect(pools).toHaveLength(1);
      expect(pools[0].name).toBe("Test Pool");
    });

    it("expect selectCurrencyPairs to return currency pairs from ref data", () => {
      const store = useOrderEntryStore.getState();
      store.setRefData({
        accounts: [],
        pools: [],
        currencyPairs: [
          {
            id: "EURUSD_1",
            symbol: "EURUSD",
            ccy1: "EUR",
            ccy2: "USD",
            ccy1Deliverable: true,
            ccy2Deliverable: true,
            ccy1Onshore: true,
            ccy2Onshore: true,
            spotPrecision: 5,
            bigDigits: 2,
            bigDigitsOffset: 2,
            additionalPrecision: 0,
            minPipStep: 1,
            defaultPipStep: 1,
            defaultTenor: "SP",
            tenor: "SP",
            stopLossAllowed: true,
          },
        ],
        entitledOrderTypes: [],
      });

      const state = useOrderEntryStore.getState();
      const pairs = selectCurrencyPairs(state);

      expect(pairs).toHaveLength(1);
      expect(pairs[0].symbol).toBe("EURUSD");
    });

    it("expect selectEntitledOrderTypes to return order types from ref data", () => {
      const store = useOrderEntryStore.getState();
      store.setRefData({
        accounts: [],
        pools: [],
        currencyPairs: [],
        entitledOrderTypes: ["FLOAT", "STOP_LOSS"],
      });

      const state = useOrderEntryStore.getState();
      const types = selectEntitledOrderTypes(state);

      expect(types).toEqual(["FLOAT", "STOP_LOSS"]);
    });

    it("expect selectIsLoadingRefData to return false after ref data is set", () => {
      const store = useOrderEntryStore.getState();
      store.setRefData({
        accounts: [],
        pools: [],
        currencyPairs: [],
        entitledOrderTypes: [],
      });

      const state = useOrderEntryStore.getState();
      const isLoading = selectIsLoadingRefData(state);

      expect(isLoading).toBe(false);
    });
  });

  describe("Derived Values Selectors", () => {
    it("expect selectDerivedValues to return full order state", () => {
      const state = useOrderEntryStore.getState();
      const derived = selectDerivedValues(state);

      expect(derived.currencyPair).toBe("GBPUSD");
      expect(derived.side).toBe(OrderSide.BUY);
      expect(derived.orderType).toBe(OrderType.FLOAT);
      expect(derived.amount).toBeDefined();
    });

    it("expect selectDirtyValues to return empty object initially", () => {
      const state = useOrderEntryStore.getState();
      const dirty = selectDirtyValues(state);

      expect(dirty).toEqual({});
    });

    it("expect selectDirtyValues to include user changes", () => {
      const store = useOrderEntryStore.getState();
      store.setFieldValue("level", 1.5);
      store.setFieldValue("side", OrderSide.SELL);

      const state = useOrderEntryStore.getState();
      const dirty = selectDirtyValues(state);

      expect(dirty.level).toBe(1.5);
      expect(dirty.side).toBe(OrderSide.SELL);
    });

    it("expect selectIsFieldDirty to return false for untouched field", () => {
      const state = useOrderEntryStore.getState();
      const isDirty = selectIsFieldDirty(state, "level");

      expect(isDirty).toBe(false);
    });

    it("expect selectIsFieldDirty to return true for modified field", () => {
      const store = useOrderEntryStore.getState();
      store.setFieldValue("level", 1.5);

      const state = useOrderEntryStore.getState();
      const isDirty = selectIsFieldDirty(state, "level");

      expect(isDirty).toBe(true);
    });
  });

  describe("Hook Wrappers", () => {
    // These tests verify that hook wrappers are properly exported as functions.
    // We can't call hooks directly outside React, but we can verify they exist.

    it("expect all amount hook wrappers to be functions", () => {
      expect(typeof useAmount).toBe("function");
      expect(typeof useNumericAmount).toBe("function");
      expect(typeof useAmountCurrency).toBe("function");
    });

    it("expect all currency pair hook wrappers to be functions", () => {
      expect(typeof useCurrencyPair).toBe("function");
      expect(typeof useCurrencyPairDetails).toBe("function");
      expect(typeof useCurrencies).toBe("function");
    });

    it("expect all order details hook wrappers to be functions", () => {
      expect(typeof useSide).toBe("function");
      expect(typeof useOrderType).toBe("function");
      expect(typeof useLevel).toBe("function");
      expect(typeof useLiquidityPool).toBe("function");
      expect(typeof useAccount).toBe("function");
      expect(typeof useExpiry).toBe("function");
    });

    it("expect all price hook wrappers to be functions", () => {
      expect(typeof useBuyPrice).toBe("function");
      expect(typeof useSellPrice).toBe("function");
      expect(typeof useCurrentPrices).toBe("function");
      expect(typeof usePricesAvailable).toBe("function");
    });

    it("expect all app state hook wrappers to be functions", () => {
      expect(typeof useEditMode).toBe("function");
      expect(typeof useAppStatus).toBe("function");
      expect(typeof useIsReady).toBe("function");
      expect(typeof useIsSubmitting).toBe("function");
      expect(typeof useCurrentOrderId).toBe("function");
      expect(typeof useToastMessage).toBe("function");
    });

    it("expect all validation hook wrappers to be functions", () => {
      expect(typeof useErrors).toBe("function");
      expect(typeof useServerErrors).toBe("function");
      expect(typeof useWarnings).toBe("function");
      expect(typeof useGlobalError).toBe("function");
      expect(typeof useIsFormValid).toBe("function");
      expect(typeof useIsDirty).toBe("function");
    });

    it("expect all reference data hook wrappers to be functions", () => {
      expect(typeof useAccounts).toBe("function");
      expect(typeof usePools).toBe("function");
      expect(typeof useCurrencyPairs).toBe("function");
      expect(typeof useEntitledOrderTypes).toBe("function");
      expect(typeof useIsLoadingRefData).toBe("function");
    });

    it("expect all derived values hook wrappers to be functions", () => {
      expect(typeof useDerivedValues).toBe("function");
      expect(typeof useDirtyValues).toBe("function");
      expect(typeof useIsFieldDirty).toBe("function");
    });

    it("expect useIsFieldDirty to return correct value when called with renderHook", () => {
      // Reset store state
      const store = useOrderEntryStore.getState();
      store.resetFormInteractions();

      // Test with untouched field
      const { result: cleanResult } = renderHook(() => useIsFieldDirty("level"));
      expect(cleanResult.current).toBe(false);

      // Set a field value to make it dirty
      store.setFieldValue("level", 1.5);

      // Test with dirty field
      const { result: dirtyResult } = renderHook(() => useIsFieldDirty("level"));
      expect(dirtyResult.current).toBe(true);
    });
  });
});
