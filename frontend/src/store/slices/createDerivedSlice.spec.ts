import { describe, expect, it, vi } from "vitest";

import { ExpiryStrategy, OrderType } from "../../types/domain";
import { DerivedSlice } from "../../types/store";

import { createDerivedSlice } from "./createDerivedSlice";

describe("createDerivedSlice", () => {
  const createMockState = (overrides: {
    defaults?: Record<string, unknown>;
    userPrefs?: Record<string, unknown>;
    fdc3Intent?: Record<string, unknown> | null;
    dirtyValues?: Record<string, unknown>;
    errors?: Record<string, string>;
    serverErrors?: Record<string, string>;
    refDataErrors?: Record<string, string>;
    accounts?: Array<{ name: string; sdsId: number }>;
  }) => ({
    defaults: {
      currencyPair: "GBPUSD",
      side: "BUY",
      orderType: OrderType.FLOAT,
      amount: { amount: 1000000, ccy: "GBP" },
      expiry: { strategy: ExpiryStrategy.GTC },
      liquidityPool: "Hybrid",
      ...overrides.defaults,
    },
    userPrefs: overrides.userPrefs ?? {},
    fdc3Intent: overrides.fdc3Intent ?? null,
    dirtyValues: overrides.dirtyValues ?? {},
    errors: overrides.errors ?? {},
    serverErrors: overrides.serverErrors ?? {},
    refDataErrors: overrides.refDataErrors ?? {},
    accounts: overrides.accounts ?? [],
  });

  const createSlice = (mockState: ReturnType<typeof createMockState>): DerivedSlice => {
    const get = vi.fn().mockReturnValue(mockState);
    const set = vi.fn();
    return createDerivedSlice(set as never, get as never, {} as never);
  };

  describe("getDerivedValues", () => {
    it("expect defaults to be returned when no other layers have data", () => {
      const slice = createSlice(createMockState({}));
      const derived = slice.getDerivedValues();

      expect(derived.currencyPair).toBe("GBPUSD");
      expect(derived.side).toBe("BUY");
      expect(derived.orderType).toBe(OrderType.FLOAT);
      expect(derived.amount).toEqual({ amount: 1000000, ccy: "GBP" });
    });

    it("expect user preferences to override defaults when no fdc3 or user input", () => {
      const slice = createSlice(
        createMockState({
          accounts: [
            { name: "Account 123", sdsId: 123 },
            { name: "Account 456", sdsId: 456 },
          ],
          userPrefs: {
            defaultAccount: "Account 123",
            defaultLiquidityPool: "TopTier",
            defaultOrderType: OrderType.LIQUIDITY_SEEKER,
          },
        })
      );
      const derived = slice.getDerivedValues();

      expect(derived.account).toEqual({ name: "Account 123", sdsId: 123 });
      expect(derived.liquidityPool).toBe("TopTier");
      expect(derived.orderType).toBe(OrderType.LIQUIDITY_SEEKER);
    });

    it("expect fdc3 intent to override user preferences", () => {
      const slice = createSlice(
        createMockState({
          accounts: [
            { name: "Account 123", sdsId: 123 },
            { name: "FDC3 Account", sdsId: 456 },
          ],
          userPrefs: {
            defaultAccount: "Account 123",
            defaultLiquidityPool: "TopTier",
          },
          fdc3Intent: {
            currencyPair: "EURUSD",
            side: "SELL",
            amount: { amount: 5000000, ccy: "EUR" },
            account: { name: "FDC3 Account", sdsId: 456 },
          },
        })
      );
      const derived = slice.getDerivedValues();

      expect(derived.currencyPair).toBe("EURUSD");
      expect(derived.side).toBe("SELL");
      expect(derived.amount).toEqual({ amount: 5000000, ccy: "EUR" });
      expect(derived.account).toEqual({ name: "FDC3 Account", sdsId: 456 });
      expect(derived.liquidityPool).toBe("TopTier");
    });

    it("expect user input to override all other layers", () => {
      const slice = createSlice(
        createMockState({
          accounts: [{ name: "Account 123", sdsId: 123 }],
          userPrefs: {
            defaultAccount: "Account 123",
          },
          fdc3Intent: {
            currencyPair: "EURUSD",
            amount: { amount: 5000000, ccy: "EUR" },
          },
          dirtyValues: {
            currencyPair: "USDJPY",
            amount: { amount: 2000000, ccy: "USD" },
            level: 145.5,
          },
        })
      );
      const derived = slice.getDerivedValues();

      expect(derived.currencyPair).toBe("USDJPY");
      expect(derived.amount).toEqual({ amount: 2000000, ccy: "USD" });
      expect(derived.level).toBe(145.5);
    });

    it("expect fdc3 level to be applied when provided", () => {
      const slice = createSlice(createMockState({ fdc3Intent: { level: 1.275 } }));
      const derived = slice.getDerivedValues();

      expect(derived.level).toBe(1.275);
    });

    it("expect fdc3 orderId to be applied when provided", () => {
      const slice = createSlice(createMockState({ fdc3Intent: { orderId: "ORDER-12345" } }));
      const derived = slice.getDerivedValues();

      expect(derived.orderId).toBe("ORDER-12345");
    });

    it("expect fdc3 orderType to override userPrefs orderType", () => {
      const slice = createSlice(
        createMockState({
          userPrefs: { defaultOrderType: OrderType.TAKE_PROFIT },
          fdc3Intent: { orderType: OrderType.POUNCE },
        })
      );
      const derived = slice.getDerivedValues();

      expect(derived.orderType).toBe(OrderType.POUNCE);
    });

    it("expect fdc3 liquidityPool to be applied when provided", () => {
      const slice = createSlice(createMockState({ fdc3Intent: { liquidityPool: "FDC3_Pool" } }));
      const derived = slice.getDerivedValues();

      expect(derived.liquidityPool).toBe("FDC3_Pool");
    });
  });

  describe("isDirty", () => {
    it("expect isDirty to return false when dirtyValues is empty", () => {
      const slice = createSlice(createMockState({ dirtyValues: {} }));
      expect(slice.isDirty()).toBe(false);
    });

    it("expect isDirty to return true when dirtyValues has entries", () => {
      const slice = createSlice(
        createMockState({ dirtyValues: { amount: { amount: 2000000, ccy: "GBP" } } })
      );
      expect(slice.isDirty()).toBe(true);
    });

    it("expect isDirty to return true when multiple dirty values exist", () => {
      const slice = createSlice(
        createMockState({
          dirtyValues: { amount: { amount: 2000000, ccy: "GBP" }, level: 1.275, side: "SELL" },
        })
      );
      expect(slice.isDirty()).toBe(true);
    });
  });

  describe("isFormValid", () => {
    it("expect isFormValid to return true when no errors exist", () => {
      const slice = createSlice(
        createMockState({ errors: {}, serverErrors: {}, refDataErrors: {} })
      );
      expect(slice.isFormValid()).toBe(true);
    });

    it("expect isFormValid to return false when client errors exist", () => {
      const slice = createSlice(
        createMockState({
          errors: { amount: "Amount is required" },
          serverErrors: {},
          refDataErrors: {},
        })
      );
      expect(slice.isFormValid()).toBe(false);
    });

    it("expect isFormValid to return false when server errors exist", () => {
      const slice = createSlice(
        createMockState({
          errors: {},
          serverErrors: { amount: "Exceeds firm limit" },
          refDataErrors: {},
        })
      );
      expect(slice.isFormValid()).toBe(false);
    });

    it("expect isFormValid to return false when refData errors exist", () => {
      const slice = createSlice(
        createMockState({
          errors: {},
          serverErrors: {},
          refDataErrors: { account: "Account not available" },
        })
      );
      expect(slice.isFormValid()).toBe(false);
    });

    it("expect isFormValid to return false when multiple error types exist", () => {
      const slice = createSlice(
        createMockState({
          errors: { amount: "Invalid" },
          serverErrors: { level: "Invalid price" },
          refDataErrors: { account: "Account not available" },
        })
      );
      expect(slice.isFormValid()).toBe(false);
    });
  });
});
