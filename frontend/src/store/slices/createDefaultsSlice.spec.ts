import { describe, expect, it } from "vitest";

import { ExpiryStrategy, OrderType } from "../../types/domain";

import { DEFAULT_DATA, getDefaultOrderState } from "./createDefaultsSlice";

describe("createDefaultsSlice", () => {
  describe("DEFAULT_DATA", () => {
    it("expect currencyPair to be GBPUSD when accessing defaults", () => {
      expect(DEFAULT_DATA.currencyPair).toBe("GBPUSD");
    });

    it("expect side to be BUY when accessing defaults", () => {
      expect(DEFAULT_DATA.side).toBe("BUY");
    });

    it("expect orderType to be FLOAT when accessing defaults", () => {
      expect(DEFAULT_DATA.orderType).toBe(OrderType.FLOAT);
    });

    it("expect amount to have correct structure when accessing defaults", () => {
      expect(DEFAULT_DATA.amount).toEqual({ amount: 1000000, ccy: "GBP" });
    });

    it("expect liquidityPool to be Hybrid when accessing defaults", () => {
      expect(DEFAULT_DATA.liquidityPool).toBe("Hybrid");
    });

    it("expect expiry to have GTC strategy when accessing defaults", () => {
      expect(DEFAULT_DATA.expiry).toEqual({ strategy: ExpiryStrategy.GTC });
    });

    it("expect all required default fields to be defined when accessing defaults", () => {
      expect(DEFAULT_DATA.currencyPair).toBeDefined();
      expect(DEFAULT_DATA.side).toBeDefined();
      expect(DEFAULT_DATA.orderType).toBeDefined();
      expect(DEFAULT_DATA.amount).toBeDefined();
      expect(DEFAULT_DATA.liquidityPool).toBeDefined();
      expect(DEFAULT_DATA.expiry).toBeDefined();
    });
  });

  describe("getDefaultOrderState", () => {
    it("expect returned object to contain all defaults when getting default state", () => {
      const defaultState = getDefaultOrderState();
      expect(defaultState.currencyPair).toBe(DEFAULT_DATA.currencyPair);
      expect(defaultState.side).toBe(DEFAULT_DATA.side);
      expect(defaultState.orderType).toBe(DEFAULT_DATA.orderType);
      expect(defaultState.amount).toEqual(DEFAULT_DATA.amount);
      expect(defaultState.liquidityPool).toBe(DEFAULT_DATA.liquidityPool);
      expect(defaultState.expiry).toEqual(DEFAULT_DATA.expiry);
    });

    it("expect returned object to be a new object when getting default state", () => {
      const state1 = getDefaultOrderState();
      const state2 = getDefaultOrderState();
      expect(state1).not.toBe(state2);
      expect(state1).toEqual(state2);
    });

    it("expect amount.amount to be a valid positive number when getting default state", () => {
      const defaultState = getDefaultOrderState();
      expect(defaultState.amount?.amount).toBeGreaterThan(0);
    });

    it("expect side to be valid enum value when getting default state", () => {
      const defaultState = getDefaultOrderState();
      expect(["BUY", "SELL"]).toContain(defaultState.side);
    });

    it("expect orderType to be valid enum value when getting default state", () => {
      const defaultState = getDefaultOrderState();
      expect(Object.values(OrderType)).toContain(defaultState.orderType as OrderType);
    });

    it("expect expiry.strategy to be valid enum value when getting default state", () => {
      const defaultState = getDefaultOrderState();
      expect(Object.values(ExpiryStrategy)).toContain(defaultState.expiry?.strategy);
    });
  });
});
