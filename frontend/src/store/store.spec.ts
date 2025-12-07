/**
 * Integration Tests for Zustand Store
 *
 * Tests the store slices by using the actual store instance.
 * This is more effective than unit testing individual slice creators
 * because Zustand slices are tightly coupled with the store.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { OrderType } from "../types/domain";

import { useOrderEntryStore } from "./index";

// Mock GraphQL client to prevent actual network calls
vi.mock("../graphql/client", () => ({
  graphqlClient: {
    subscribe: vi.fn(() => ({
      subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
    })),
    mutate: vi.fn(),
  },
}));

describe("Zustand Store Integration", () => {
  // Reset store to initial state before each test
  beforeEach(() => {
    const store = useOrderEntryStore.getState();
    // Reset relevant state
    store.setStatus("INITIALIZING");
    store.setEditMode("creating");
    store.resetFormInteractions();
    store.clearValidationState();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("AppSlice", () => {
    it("expect initial status to be INITIALIZING when store is created", () => {
      const { status } = useOrderEntryStore.getState();
      expect(status).toBe("INITIALIZING");
    });

    it("expect status to change when setStatus is called", () => {
      const store = useOrderEntryStore.getState();
      store.setStatus("READY");

      const { status } = useOrderEntryStore.getState();
      expect(status).toBe("READY");
    });

    it("expect editMode to be creating when store is initialized", () => {
      const { editMode } = useOrderEntryStore.getState();
      expect(editMode).toBe("creating");
    });

    it("expect editMode to change when setEditMode is called", () => {
      const store = useOrderEntryStore.getState();
      store.setEditMode("viewing");

      const { editMode } = useOrderEntryStore.getState();
      expect(editMode).toBe("viewing");
    });

    it("expect currentOrderId to be null initially", () => {
      const { currentOrderId } = useOrderEntryStore.getState();
      expect(currentOrderId).toBeNull();
    });

    it("expect currentOrderId to change when setCurrentOrderId is called", () => {
      const store = useOrderEntryStore.getState();
      store.setCurrentOrderId("ORDER-123");

      const { currentOrderId } = useOrderEntryStore.getState();
      expect(currentOrderId).toBe("ORDER-123");
    });

    it("expect toast to be set when setToast is called", () => {
      const store = useOrderEntryStore.getState();
      store.setToast({ type: "success", text: "Order submitted" });

      const { toastMessage } = useOrderEntryStore.getState();
      expect(toastMessage).toEqual({ type: "success", text: "Order submitted" });
    });

    it("expect toast to be cleared when setToast is called with null", () => {
      const store = useOrderEntryStore.getState();
      store.setToast({ type: "error", text: "Error" });
      store.setToast(null);

      const { toastMessage } = useOrderEntryStore.getState();
      expect(toastMessage).toBeNull();
    });
  });

  describe("PriceSlice", () => {
    it("expect initial prices to be set when store is created", () => {
      const { currentBuyPrice, currentSellPrice } = useOrderEntryStore.getState();
      expect(currentBuyPrice).toBeGreaterThan(0);
      expect(currentSellPrice).toBeGreaterThan(0);
    });

    it("expect prices to update when setCurrentPrices is called", () => {
      const store = useOrderEntryStore.getState();
      store.setCurrentPrices(1.5, 1.49);

      const { currentBuyPrice, currentSellPrice } = useOrderEntryStore.getState();
      expect(currentBuyPrice).toBe(1.5);
      expect(currentSellPrice).toBe(1.49);
    });

    it("expect buy price to be greater than sell price when spread is positive", () => {
      const store = useOrderEntryStore.getState();
      store.setCurrentPrices(1.27345, 1.27325);

      const { currentBuyPrice, currentSellPrice } = useOrderEntryStore.getState();
      expect(currentBuyPrice).toBeGreaterThan(currentSellPrice);
    });
  });

  describe("RefDataSlice", () => {
    it("expect isLoadingRefData to be true initially", () => {
      const { isLoadingRefData } = useOrderEntryStore.getState();
      expect(isLoadingRefData).toBe(true);
    });

    it("expect ref data arrays to be empty initially", () => {
      const { accounts, pools, currencyPairs, entitledOrderTypes } = useOrderEntryStore.getState();
      expect(accounts).toEqual([]);
      expect(pools).toEqual([]);
      expect(currencyPairs).toEqual([]);
      expect(entitledOrderTypes).toEqual([]);
    });

    it("expect ref data to be set when setRefData is called", () => {
      const store = useOrderEntryStore.getState();
      const mockRefData = {
        accounts: [{ sdsId: 1, name: "Account 1" }],
        pools: [{ name: "Pool 1", value: "POOL1" }],
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
        entitledOrderTypes: [OrderType.FLOAT, OrderType.STOP_LOSS],
      };

      store.setRefData(mockRefData);

      const state = useOrderEntryStore.getState();
      expect(state.accounts).toHaveLength(1);
      expect(state.pools).toHaveLength(1);
      expect(state.currencyPairs).toHaveLength(1);
      expect(state.entitledOrderTypes).toEqual([OrderType.FLOAT, OrderType.STOP_LOSS]);
      expect(state.isLoadingRefData).toBe(false);
    });
  });

  describe("UserPrefsSlice", () => {
    it("expect userPrefs to be empty initially", () => {
      const { userPrefs, userPrefsLoaded } = useOrderEntryStore.getState();
      expect(userPrefs).toEqual({});
      expect(userPrefsLoaded).toBe(false);
    });

    it("expect userPrefs to be set when setUserPrefs is called", () => {
      const store = useOrderEntryStore.getState();
      store.setUserPrefs({ defaultAccount: "ACC001", defaultLiquidityPool: "POOL1" });

      const { userPrefs, userPrefsLoaded } = useOrderEntryStore.getState();
      expect(userPrefs.defaultAccount).toBe("ACC001");
      expect(userPrefs.defaultLiquidityPool).toBe("POOL1");
      expect(userPrefsLoaded).toBe(true);
    });

    it("expect userPrefsLoaded to be marked true when markUserPrefsLoaded is called", () => {
      const store = useOrderEntryStore.getState();
      store.markUserPrefsLoaded();

      const { userPrefsLoaded } = useOrderEntryStore.getState();
      expect(userPrefsLoaded).toBe(true);
    });

    it("expect userPrefs to be cleared when clearUserPrefs is called", () => {
      const store = useOrderEntryStore.getState();
      store.setUserPrefs({ defaultAccount: "ACC001" });
      store.clearUserPrefs();

      const { userPrefs, userPrefsLoaded } = useOrderEntryStore.getState();
      expect(userPrefs).toEqual({});
      expect(userPrefsLoaded).toBe(false);
    });
  });

  describe("UserInteractionSlice", () => {
    it("expect dirtyValues to be empty initially", () => {
      const { dirtyValues } = useOrderEntryStore.getState();
      expect(dirtyValues).toEqual({});
    });

    it("expect dirtyValues to update when setFieldValue is called", () => {
      const store = useOrderEntryStore.getState();
      store.setFieldValue("level", 1.5);

      const { dirtyValues } = useOrderEntryStore.getState();
      expect(dirtyValues.level).toBe(1.5);
    });

    it("expect dirtyValues to be cleared when resetFormInteractions is called", () => {
      const store = useOrderEntryStore.getState();
      store.setFieldValue("level", 1.5);
      store.setFieldValue("currencyPair", "EURUSD");
      store.resetFormInteractions();

      const { dirtyValues } = useOrderEntryStore.getState();
      expect(dirtyValues).toEqual({});
    });

    it("expect errors to be cleared for field when setFieldValue is called", () => {
      const store = useOrderEntryStore.getState();
      // Manually set an error
      store.setGlobalError("Test error");
      store.setFieldValue("level", 1.5);

      const { errors } = useOrderEntryStore.getState();
      expect(errors.level).toBeUndefined();
    });
  });

  describe("DerivedSlice", () => {
    it("expect getDerivedValues to return defaults when no user input", () => {
      const store = useOrderEntryStore.getState();
      const derived = store.getDerivedValues();

      expect(derived.currencyPair).toBe("GBPUSD");
      expect(derived.side).toBe("BUY");
      expect(derived.orderType).toBe(OrderType.FLOAT);
      expect(derived.amount?.amount).toBe(1000000);
    });

    it("expect getDerivedValues to include user input when dirty", () => {
      const store = useOrderEntryStore.getState();
      store.setFieldValue("level", 1.5);

      const derived = store.getDerivedValues();
      expect(derived.level).toBe(1.5);
    });

    it("expect isDirty to return false when no user input", () => {
      const store = useOrderEntryStore.getState();
      store.resetFormInteractions();

      expect(store.isDirty()).toBe(false);
    });

    it("expect isDirty to return true when user has made changes", () => {
      const store = useOrderEntryStore.getState();
      store.setFieldValue("level", 1.5);

      expect(store.isDirty()).toBe(true);
    });
  });

  describe("ValidationSlice", () => {
    it("expect errors to be empty initially", () => {
      const { errors, serverErrors, warnings, refDataErrors } = useOrderEntryStore.getState();
      expect(errors).toEqual({});
      expect(serverErrors).toEqual({});
      expect(warnings).toEqual({});
      expect(refDataErrors).toEqual({});
    });

    it("expect globalError to be set when setGlobalError is called", () => {
      const store = useOrderEntryStore.getState();
      store.setGlobalError("Something went wrong");

      const { globalError } = useOrderEntryStore.getState();
      expect(globalError).toBe("Something went wrong");
    });

    it("expect validation state to be cleared when clearValidationState is called", () => {
      const store = useOrderEntryStore.getState();
      store.setGlobalError("Error");
      store.clearValidationState();

      const state = useOrderEntryStore.getState();
      expect(state.errors).toEqual({});
      expect(state.serverErrors).toEqual({});
      expect(state.warnings).toEqual({});
      expect(state.refDataErrors).toEqual({});
      expect(state.globalError).toBeNull();
    });
  });

  describe("DefaultsSlice", () => {
    it("expect defaults to contain standard values when accessed", () => {
      const { defaults } = useOrderEntryStore.getState();

      expect(defaults.currencyPair).toBe("GBPUSD");
      expect(defaults.side).toBe("BUY");
      expect(defaults.orderType).toBe(OrderType.FLOAT);
      expect(defaults.amount?.amount).toBe(1000000);
      expect(defaults.liquidityPool).toBe("Hybrid");
    });

    it("expect getDefault to return correct value for each field", () => {
      const store = useOrderEntryStore.getState();

      expect(store.getDefault("currencyPair")).toBe("GBPUSD");
      expect(store.getDefault("side")).toBe("BUY");
      expect(store.getDefault("orderType")).toBe(OrderType.FLOAT);
    });
  });

  describe("FieldOrderSlice", () => {
    it("expect fieldOrders to be empty object initially", () => {
      const { fieldOrders } = useOrderEntryStore.getState();
      expect(fieldOrders).toEqual({});
    });

    it("expect isReorderMode to be false initially", () => {
      const { isReorderMode } = useOrderEntryStore.getState();
      expect(isReorderMode).toBe(false);
    });

    it("expect reorder mode to be enabled when toggleReorderMode is called", () => {
      const store = useOrderEntryStore.getState();
      store.toggleReorderMode();

      const { isReorderMode } = useOrderEntryStore.getState();
      expect(isReorderMode).toBe(true);

      // Reset for other tests
      store.cancelReorderMode();
    });

    it("expect reorder mode to be disabled when cancelReorderMode is called", () => {
      const store = useOrderEntryStore.getState();
      store.toggleReorderMode(); // Enable first
      store.cancelReorderMode();

      const { isReorderMode } = useOrderEntryStore.getState();
      expect(isReorderMode).toBe(false);
    });

    it("expect getFieldOrder to return config fields when no custom order exists", () => {
      const store = useOrderEntryStore.getState();
      const fields = store.getFieldOrder(OrderType.FLOAT);

      expect(fields).toContain("side");
      expect(fields).toContain("amount");
      expect(fields).toContain("level");
    });

    it("expect hasCustomOrder to return false when no custom order is set", () => {
      const store = useOrderEntryStore.getState();
      expect(store.hasCustomOrder(OrderType.FLOAT)).toBe(false);
    });
  });
});
