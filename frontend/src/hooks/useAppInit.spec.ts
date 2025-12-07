/**
 * Tests for useAppInit hook
 *
 * This hook handles application initialization:
 * - Loading reference data (accounts, pools, currency pairs)
 * - User preferences subscription
 * - FDC3 intent handling
 * - Field order initialization from localStorage
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderHook } from "@testing-library/react";

// Mock the apollo client hooks
vi.mock("@apollo/client", () => ({
  useQuery: vi.fn(),
  useSubscription: vi.fn(),
  gql: vi.fn((strings: TemplateStringsArray) => strings.join("")),
}));

// Mock the store
vi.mock("../store", () => ({
  useOrderEntryStore: vi.fn(),
}));

// Mock FDC3 service
vi.mock("../api/fdc3/fdc3Service", () => ({
  Fdc3Service: {
    getInstance: vi.fn(() => ({
      initialize: vi.fn(),
    })),
  },
}));

// Mock intent mapper
vi.mock("../api/fdc3/intentMapper", () => ({
  mapContextToOrder: vi.fn((ctx) => ({
    currencyPair: ctx.currencyPair,
    side: ctx.side,
  })),
}));

// Import after mocks
import { useQuery, useSubscription } from "@apollo/client";

import { Fdc3Service } from "../api/fdc3/fdc3Service";
import { mapContextToOrder } from "../api/fdc3/intentMapper";
import { useOrderEntryStore } from "../store";

import { useAppInit } from "./useAppInit";

describe("useAppInit", () => {
  // Mock store actions
  const mockSetStatus = vi.fn();
  const mockSetRefData = vi.fn();
  const mockValidateRefData = vi.fn();
  const mockInitFieldOrderFromStorage = vi.fn();
  const mockSetUserPrefs = vi.fn();
  const mockSetFdc3Intent = vi.fn();
  const mockQueueFdc3Intent = vi.fn();
  const mockProcessIntentQueue = vi.fn();
  const mockIsDirty = vi.fn(() => false);
  const mockSetPendingFdc3Intent = vi.fn();

  // Mock query results
  const mockAccountsData = {
    accounts: [
      { sdsId: 123, name: "Account 1" },
      { sdsId: 456, name: "Account 2" },
    ],
  };

  const mockOrderTypesData = {
    orderTypesWithPools: [
      {
        orderType: "TAKE_PROFIT",
        liquidityPools: [
          { value: "POOL1", name: "Pool 1" },
          { value: "POOL2", name: "Pool 2" },
        ],
      },
      {
        orderType: "LIQUIDITY_SEEKER",
        liquidityPools: [{ value: "POOL1", name: "Pool 1" }],
      },
    ],
  };

  const mockCurrencyPairsData = {
    currencyPairs: [
      { currencyPair: "GBPUSD", baseCurrency: "GBP", quoteCurrency: "USD" },
      { currencyPair: "EURUSD", baseCurrency: "EUR", quoteCurrency: "USD" },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default store mock
    vi.mocked(useOrderEntryStore).mockImplementation((selector) => {
      const state = {
        setStatus: mockSetStatus,
        setRefData: mockSetRefData,
        validateRefData: mockValidateRefData,
        initFieldOrderFromStorage: mockInitFieldOrderFromStorage,
        setUserPrefs: mockSetUserPrefs,
        setFdc3Intent: mockSetFdc3Intent,
        queueFdc3Intent: mockQueueFdc3Intent,
        processIntentQueue: mockProcessIntentQueue,
        isDirty: mockIsDirty,
        setPendingFdc3Intent: mockSetPendingFdc3Intent,
        status: "READY",
      };
      return selector(state as never);
    });

    // Default query mocks - loading
    vi.mocked(useQuery).mockReturnValue({
      data: undefined,
      loading: true,
      error: undefined,
    } as never);

    // Default subscription mock
    vi.mocked(useSubscription).mockReturnValue({
      data: undefined,
    } as never);
  });

  describe("reference data loading", () => {
    it("expect status to be INITIALIZING while queries are loading", () => {
      vi.mocked(useQuery)
        .mockReturnValueOnce({ data: undefined, loading: true, error: undefined } as never)
        .mockReturnValueOnce({ data: undefined, loading: true, error: undefined } as never)
        .mockReturnValueOnce({ data: undefined, loading: true, error: undefined } as never);

      renderHook(() => useAppInit());

      expect(mockSetStatus).toHaveBeenCalledWith("INITIALIZING");
    });

    it("expect setRefData to be called when all queries complete", () => {
      vi.mocked(useQuery)
        .mockReturnValueOnce({ data: mockAccountsData, loading: false, error: undefined } as never)
        .mockReturnValueOnce({
          data: mockOrderTypesData,
          loading: false,
          error: undefined,
        } as never)
        .mockReturnValueOnce({
          data: mockCurrencyPairsData,
          loading: false,
          error: undefined,
        } as never);

      renderHook(() => useAppInit());

      expect(mockSetRefData).toHaveBeenCalledWith({
        accounts: mockAccountsData.accounts,
        pools: expect.arrayContaining([
          { value: "POOL1", name: "Pool 1" },
          { value: "POOL2", name: "Pool 2" },
        ]),
        currencyPairs: mockCurrencyPairsData.currencyPairs,
        entitledOrderTypes: ["TAKE_PROFIT", "LIQUIDITY_SEEKER"],
      });
    });

    it("expect status to be READY when queries complete successfully", () => {
      vi.mocked(useQuery)
        .mockReturnValueOnce({ data: mockAccountsData, loading: false, error: undefined } as never)
        .mockReturnValueOnce({
          data: mockOrderTypesData,
          loading: false,
          error: undefined,
        } as never)
        .mockReturnValueOnce({
          data: mockCurrencyPairsData,
          loading: false,
          error: undefined,
        } as never);

      renderHook(() => useAppInit());

      expect(mockSetStatus).toHaveBeenCalledWith("READY");
    });

    it("expect validateRefData to be called after setting ref data", () => {
      vi.mocked(useQuery)
        .mockReturnValueOnce({ data: mockAccountsData, loading: false, error: undefined } as never)
        .mockReturnValueOnce({
          data: mockOrderTypesData,
          loading: false,
          error: undefined,
        } as never)
        .mockReturnValueOnce({
          data: mockCurrencyPairsData,
          loading: false,
          error: undefined,
        } as never);

      renderHook(() => useAppInit());

      expect(mockValidateRefData).toHaveBeenCalled();
    });

    it("expect processIntentQueue to be called when app becomes ready", () => {
      vi.mocked(useQuery)
        .mockReturnValueOnce({ data: mockAccountsData, loading: false, error: undefined } as never)
        .mockReturnValueOnce({
          data: mockOrderTypesData,
          loading: false,
          error: undefined,
        } as never)
        .mockReturnValueOnce({
          data: mockCurrencyPairsData,
          loading: false,
          error: undefined,
        } as never);

      renderHook(() => useAppInit());

      expect(mockProcessIntentQueue).toHaveBeenCalled();
    });

    it("expect status to be ERROR when accounts query fails", () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      vi.mocked(useQuery)
        .mockReturnValueOnce({
          data: undefined,
          loading: false,
          error: new Error("Network error"),
        } as never)
        .mockReturnValueOnce({
          data: mockOrderTypesData,
          loading: false,
          error: undefined,
        } as never)
        .mockReturnValueOnce({
          data: mockCurrencyPairsData,
          loading: false,
          error: undefined,
        } as never);

      renderHook(() => useAppInit());

      expect(mockSetStatus).toHaveBeenCalledWith("ERROR");

      consoleErrorSpy.mockRestore();
    });

    it("expect empty arrays when query data is undefined", () => {
      vi.mocked(useQuery)
        .mockReturnValueOnce({ data: undefined, loading: false, error: undefined } as never)
        .mockReturnValueOnce({ data: undefined, loading: false, error: undefined } as never)
        .mockReturnValueOnce({ data: undefined, loading: false, error: undefined } as never);

      renderHook(() => useAppInit());

      expect(mockSetRefData).toHaveBeenCalledWith({
        accounts: [],
        pools: [],
        currencyPairs: [],
        entitledOrderTypes: [],
      });
    });

    it("expect pools to be deduplicated across order types", () => {
      const orderTypesWithDuplicatePools = {
        orderTypesWithPools: [
          {
            orderType: "TAKE_PROFIT",
            liquidityPools: [{ value: "POOL1", name: "Pool 1" }],
          },
          {
            orderType: "LIQUIDITY_SEEKER",
            liquidityPools: [{ value: "POOL1", name: "Pool 1" }], // Duplicate
          },
        ],
      };

      vi.mocked(useQuery)
        .mockReturnValueOnce({ data: mockAccountsData, loading: false, error: undefined } as never)
        .mockReturnValueOnce({
          data: orderTypesWithDuplicatePools,
          loading: false,
          error: undefined,
        } as never)
        .mockReturnValueOnce({
          data: mockCurrencyPairsData,
          loading: false,
          error: undefined,
        } as never);

      renderHook(() => useAppInit());

      const refDataCall = mockSetRefData.mock.calls[0][0];
      expect(refDataCall.pools).toHaveLength(1);
      expect(refDataCall.pools[0].value).toBe("POOL1");
    });

    it("expect to log errors but continue when non-critical queries fail", () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      vi.mocked(useQuery)
        .mockReturnValueOnce({ data: mockAccountsData, loading: false, error: undefined } as never)
        .mockReturnValueOnce({
          data: undefined,
          loading: false,
          error: new Error("OrderTypes error"),
        } as never)
        .mockReturnValueOnce({
          data: undefined,
          loading: false,
          error: new Error("CurrencyPairs error"),
        } as never);

      renderHook(() => useAppInit());

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[useAppInit] Query errors:",
        expect.any(Object)
      );
      expect(mockSetStatus).toHaveBeenCalledWith("READY");

      consoleErrorSpy.mockRestore();
    });
  });

  describe("user preferences subscription", () => {
    beforeEach(() => {
      // Setup queries to complete successfully
      vi.mocked(useQuery)
        .mockReturnValueOnce({ data: mockAccountsData, loading: false, error: undefined } as never)
        .mockReturnValueOnce({
          data: mockOrderTypesData,
          loading: false,
          error: undefined,
        } as never)
        .mockReturnValueOnce({
          data: mockCurrencyPairsData,
          loading: false,
          error: undefined,
        } as never);
    });

    it("expect setUserPrefs to be called when subscription returns data", () => {
      vi.mocked(useSubscription).mockReturnValue({
        data: {
          globalUserPreferencesStream: {
            defaultGlobalAccount: { sdsId: 123 },
          },
        },
      } as never);

      renderHook(() => useAppInit());

      expect(mockSetUserPrefs).toHaveBeenCalledWith({
        defaultAccount: "123",
      });
    });

    it("expect validateRefData to be called after user prefs are set", () => {
      vi.mocked(useSubscription).mockReturnValue({
        data: {
          globalUserPreferencesStream: {
            defaultGlobalAccount: { sdsId: 456 },
          },
        },
      } as never);

      renderHook(() => useAppInit());

      // validateRefData should be called at least once for user prefs
      expect(mockValidateRefData).toHaveBeenCalled();
    });

    it("expect setUserPrefs not to be called when subscription data is empty", () => {
      vi.mocked(useSubscription).mockReturnValue({
        data: {
          globalUserPreferencesStream: {
            defaultGlobalAccount: null,
          },
        },
      } as never);

      renderHook(() => useAppInit());

      expect(mockSetUserPrefs).not.toHaveBeenCalled();
    });

    it("expect setUserPrefs not to be called when subscription returns undefined", () => {
      vi.mocked(useSubscription).mockReturnValue({
        data: undefined,
      } as never);

      renderHook(() => useAppInit());

      expect(mockSetUserPrefs).not.toHaveBeenCalled();
    });

    it("expect error to be logged when subscription has error callback triggered", () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      // Capture the onError callback from useSubscription call
      let onErrorCallback: ((err: unknown) => void) | undefined;

      vi.mocked(useSubscription).mockImplementation((_query, options) => {
        onErrorCallback = options?.onError as ((err: unknown) => void) | undefined;
        return { data: undefined } as never;
      });

      renderHook(() => useAppInit());

      // Trigger the onError callback
      if (onErrorCallback) {
        onErrorCallback(new Error("Subscription error"));
      }

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[useAppInit] User preferences subscription error:",
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe("FDC3 intent handling", () => {
    let fdc3InitializeCallback: (ctx: unknown) => void;

    beforeEach(() => {
      // Setup queries to complete successfully
      vi.mocked(useQuery)
        .mockReturnValueOnce({ data: mockAccountsData, loading: false, error: undefined } as never)
        .mockReturnValueOnce({
          data: mockOrderTypesData,
          loading: false,
          error: undefined,
        } as never)
        .mockReturnValueOnce({
          data: mockCurrencyPairsData,
          loading: false,
          error: undefined,
        } as never);

      // Capture the FDC3 initialize callback
      vi.mocked(Fdc3Service.getInstance).mockReturnValue({
        initialize: vi.fn((callback) => {
          fdc3InitializeCallback = callback;
        }),
      } as never);

      // Override store mock to provide getState
      vi.mocked(useOrderEntryStore).mockImplementation((selector) => {
        const state = {
          setStatus: mockSetStatus,
          setRefData: mockSetRefData,
          validateRefData: mockValidateRefData,
          initFieldOrderFromStorage: mockInitFieldOrderFromStorage,
          setUserPrefs: mockSetUserPrefs,
          setFdc3Intent: mockSetFdc3Intent,
          queueFdc3Intent: mockQueueFdc3Intent,
          processIntentQueue: mockProcessIntentQueue,
          isDirty: mockIsDirty,
          setPendingFdc3Intent: mockSetPendingFdc3Intent,
          status: "READY",
        };
        return selector(state as never);
      });

      // Also mock getState for the FDC3 handler
      (useOrderEntryStore as unknown as { getState: () => unknown }).getState = vi.fn(() => ({
        status: "READY",
      }));
    });

    it("expect FDC3 service to be initialized", () => {
      renderHook(() => useAppInit());

      expect(Fdc3Service.getInstance().initialize).toHaveBeenCalled();
    });

    it("expect intent to be applied when app is ready and form is not dirty", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      (useOrderEntryStore as unknown as { getState: () => unknown }).getState = vi.fn(() => ({
        status: "READY",
      }));

      renderHook(() => useAppInit());

      // Simulate FDC3 intent
      const mockContext = { currencyPair: "EURUSD", side: "BUY" };
      fdc3InitializeCallback(mockContext);

      expect(mapContextToOrder).toHaveBeenCalledWith(mockContext);
      expect(mockSetFdc3Intent).toHaveBeenCalled();
      expect(mockValidateRefData).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("expect intent to be queued when app is not ready", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      (useOrderEntryStore as unknown as { getState: () => unknown }).getState = vi.fn(() => ({
        status: "INITIALIZING",
      }));

      renderHook(() => useAppInit());

      const mockContext = { currencyPair: "USDJPY" };
      fdc3InitializeCallback(mockContext);

      expect(mockQueueFdc3Intent).toHaveBeenCalled();
      expect(mockSetFdc3Intent).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("expect intent to be set as pending when form is dirty", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      mockIsDirty.mockReturnValue(true);

      (useOrderEntryStore as unknown as { getState: () => unknown }).getState = vi.fn(() => ({
        status: "READY",
      }));

      renderHook(() => useAppInit());

      const mockContext = { currencyPair: "GBPJPY" };
      fdc3InitializeCallback(mockContext);

      expect(mockSetPendingFdc3Intent).toHaveBeenCalled();
      expect(mockSetFdc3Intent).not.toHaveBeenCalled();
      expect(mockQueueFdc3Intent).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe("field order initialization", () => {
    beforeEach(() => {
      vi.mocked(useQuery)
        .mockReturnValueOnce({ data: mockAccountsData, loading: false, error: undefined } as never)
        .mockReturnValueOnce({
          data: mockOrderTypesData,
          loading: false,
          error: undefined,
        } as never)
        .mockReturnValueOnce({
          data: mockCurrencyPairsData,
          loading: false,
          error: undefined,
        } as never);
    });

    it("expect initFieldOrderFromStorage to be called on mount", () => {
      renderHook(() => useAppInit());

      expect(mockInitFieldOrderFromStorage).toHaveBeenCalled();
    });
  });
});
