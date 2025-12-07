import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderHook } from "@testing-library/react";

import { useFieldOptions } from "./useFieldOptions";

// Mock the store
vi.mock("../../store", () => ({
  useOrderEntryStore: vi.fn(),
}));

import { useOrderEntryStore } from "../../store";

describe("useFieldOptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockStore = (
    accounts: Array<{ name: string; sdsId: number }> = [],
    pools: Array<{ name: string; value: string }> = [],
    isLoadingRefData = false,
    currentAccount?: { name: string; sdsId: number },
    currentLiquidityPool?: string,
    currentSide?: string
  ) => {
    return vi.mocked(useOrderEntryStore).mockImplementation((selector) => {
      const state = {
        accounts,
        pools,
        isLoadingRefData,
        getDerivedValues: () => ({
          account: currentAccount,
          liquidityPool: currentLiquidityPool,
          side: currentSide,
        }),
      };
      return selector(state as never);
    });
  };

  describe("account field", () => {
    it("expect account options to be derived from accounts ref data when loaded", () => {
      const accounts = [
        { name: "Account 1", sdsId: 123 },
        { name: "Account 2", sdsId: 456 },
      ];
      createMockStore(accounts);

      const { result } = renderHook(() => useFieldOptions("account"));

      expect(result.current.options).toHaveLength(2);
      expect(result.current.options[0]).toEqual({ label: "Account 1", value: "123" });
      expect(result.current.options[1]).toEqual({ label: "Account 2", value: "456" });
    });

    it("expect isLoading to be true when ref data is loading", () => {
      createMockStore([], [], true);

      const { result } = renderHook(() => useFieldOptions("account"));

      expect(result.current.isLoading).toBe(true);
    });

    it("expect isLoading to be false when ref data is loaded", () => {
      createMockStore([{ name: "Test", sdsId: 1 }], [], false);

      const { result } = renderHook(() => useFieldOptions("account"));

      expect(result.current.isLoading).toBe(false);
    });

    it("expect unavailable account to be added to options when current value not in list", () => {
      const accounts = [{ name: "Account 1", sdsId: 123 }];
      createMockStore(accounts, [], false, { name: "Unavailable Account", sdsId: 999 });

      const { result } = renderHook(() => useFieldOptions("account"));

      expect(result.current.options).toHaveLength(2);
      expect(result.current.options[0]).toEqual({
        label: "Unavailable Account (Unavailable)",
        value: "999",
      });
    });

    it("expect no unavailable option when current value exists in list", () => {
      const accounts = [{ name: "Account 1", sdsId: 123 }];
      createMockStore(accounts, [], false, { name: "Account 1", sdsId: 123 });

      const { result } = renderHook(() => useFieldOptions("account"));

      expect(result.current.options).toHaveLength(1);
      expect(result.current.options[0].label).not.toContain("Unavailable");
    });
  });

  describe("liquidityPool field", () => {
    it("expect pool options to be derived from pools ref data when loaded", () => {
      const pools = [
        { name: "Pool A", value: "POOL_A" },
        { name: "Pool B", value: "POOL_B" },
      ];
      createMockStore([], pools);

      const { result } = renderHook(() => useFieldOptions("liquidityPool"));

      expect(result.current.options).toHaveLength(2);
      expect(result.current.options[0]).toEqual({ label: "Pool A", value: "POOL_A" });
      expect(result.current.options[1]).toEqual({ label: "Pool B", value: "POOL_B" });
    });

    it("expect isLoading to be true when ref data is loading", () => {
      createMockStore([], [], true);

      const { result } = renderHook(() => useFieldOptions("liquidityPool"));

      expect(result.current.isLoading).toBe(true);
    });

    it("expect unavailable pool to be added to options when current value not in list", () => {
      const pools = [{ name: "Pool A", value: "POOL_A" }];
      createMockStore([], pools, false, undefined, "UNKNOWN_POOL");

      const { result } = renderHook(() => useFieldOptions("liquidityPool"));

      expect(result.current.options).toHaveLength(2);
      expect(result.current.options[0]).toEqual({
        label: "UNKNOWN_POOL (Unavailable)",
        value: "UNKNOWN_POOL",
      });
    });
  });

  describe("startMode field", () => {
    it("expect startMode options to include START_NOW and START_AT", () => {
      createMockStore();

      const { result } = renderHook(() => useFieldOptions("startMode"));

      expect(result.current.options).toHaveLength(2);
      expect(result.current.options[0]).toEqual({ label: "Start Now", value: "START_NOW" });
      expect(result.current.options[1]).toEqual({ label: "Start At", value: "START_AT" });
    });
  });

  describe("timeZone and expiryTimeZone fields", () => {
    it("expect timeZone options to include all timezone options", () => {
      createMockStore();

      const { result } = renderHook(() => useFieldOptions("timeZone"));

      expect(result.current.options).toHaveLength(10);
      expect(result.current.options[0]).toEqual({ label: "LDN", value: "Europe/London" });
      expect(result.current.options[9]).toEqual({ label: "HKT", value: "Asia/Hong_Kong" });
    });

    it("expect expiryTimeZone options to include all timezone options", () => {
      createMockStore();

      const { result } = renderHook(() => useFieldOptions("expiryTimeZone"));

      expect(result.current.options).toHaveLength(10);
      expect(result.current.options[0]).toEqual({ label: "LDN", value: "Europe/London" });
      expect(result.current.options[9]).toEqual({ label: "HKT", value: "Asia/Hong_Kong" });
    });
  });

  describe("expiry field", () => {
    it("expect expiry options to include GTC, GTD, and GTT", () => {
      createMockStore();

      const { result } = renderHook(() => useFieldOptions("expiry"));

      expect(result.current.options).toHaveLength(3);
      expect(result.current.options[0]).toEqual({ label: "GTC (Good Till Cancel)", value: "GTC" });
      expect(result.current.options[1]).toEqual({ label: "GTD (Good Till Date)", value: "GTD" });
      expect(result.current.options[2]).toEqual({ label: "GTT (Good Till Time)", value: "GTT" });
    });
  });

  describe("triggerSide field", () => {
    it("expect triggerSide options for BUY side to show Trailing Bid, Mid, Leading Offer", () => {
      createMockStore([], [], false, undefined, undefined, "BUY");

      const { result } = renderHook(() => useFieldOptions("triggerSide"));

      expect(result.current.options).toHaveLength(3);
      expect(result.current.options[0]).toEqual({ label: "Trailing Bid", value: "TRAILING" });
      expect(result.current.options[1]).toEqual({ label: "Mid", value: "MID" });
      expect(result.current.options[2]).toEqual({ label: "Leading Offer", value: "LEADING" });
    });

    it("expect triggerSide options for SELL side to show Trailing Offer, Mid, Leading Bid", () => {
      createMockStore([], [], false, undefined, undefined, "SELL");

      const { result } = renderHook(() => useFieldOptions("triggerSide"));

      expect(result.current.options).toHaveLength(3);
      expect(result.current.options[0]).toEqual({ label: "Trailing Offer", value: "TRAILING" });
      expect(result.current.options[1]).toEqual({ label: "Mid", value: "MID" });
      expect(result.current.options[2]).toEqual({ label: "Leading Bid", value: "LEADING" });
    });

    it("expect empty triggerSide options when side is undefined", () => {
      createMockStore();

      const { result } = renderHook(() => useFieldOptions("triggerSide"));

      expect(result.current.options).toEqual([]);
    });
  });

  describe("other fields", () => {
    it("expect empty options array when field is not a select field", () => {
      createMockStore();

      const { result } = renderHook(() => useFieldOptions("level"));

      expect(result.current.options).toEqual([]);
    });

    it("expect isLoading to be false when field is not a ref data field", () => {
      createMockStore([], [], true);

      const { result } = renderHook(() => useFieldOptions("currencyPair"));

      expect(result.current.isLoading).toBe(false);
    });
  });
});
