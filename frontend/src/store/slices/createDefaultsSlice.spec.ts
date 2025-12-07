import { describe, expect, it } from "vitest";

import { ExpiryStrategy, OrderType } from "../../types/domain";

import { getDefaultOrderState, HARDCODED_DEFAULTS } from "./createDefaultsSlice";

describe("createDefaultsSlice", () => {
  describe("HARDCODED_DEFAULTS", () => {
    it("expect currencyPair to be GBPUSD when accessing defaults", () => {
      expect(HARDCODED_DEFAULTS.currencyPair).toBe("GBPUSD");
    });

    it("expect side to be BUY when accessing defaults", () => {
      expect(HARDCODED_DEFAULTS.side).toBe("BUY");
    });

    it("expect orderType to be FLOAT when accessing defaults", () => {
      expect(HARDCODED_DEFAULTS.orderType).toBe(OrderType.FLOAT);
    });

    it("expect amount to have correct structure when accessing defaults", () => {
      expect(HARDCODED_DEFAULTS.amount).toEqual({ amount: 1000000, ccy: "GBP" });
    });

    it("expect liquidityPool to be Hybrid when accessing defaults", () => {
      expect(HARDCODED_DEFAULTS.liquidityPool).toBe("Hybrid");
    });

    it("expect expiry to have GTC strategy when accessing defaults", () => {
      expect(HARDCODED_DEFAULTS.expiry).toEqual({ strategy: ExpiryStrategy.GTC });
    });

    it("expect all required default fields to be defined when accessing defaults", () => {
      expect(HARDCODED_DEFAULTS.currencyPair).toBeDefined();
      expect(HARDCODED_DEFAULTS.side).toBeDefined();
      expect(HARDCODED_DEFAULTS.orderType).toBeDefined();
      expect(HARDCODED_DEFAULTS.amount).toBeDefined();
      expect(HARDCODED_DEFAULTS.liquidityPool).toBeDefined();
      expect(HARDCODED_DEFAULTS.expiry).toBeDefined();
    });
  });

  describe("getDefaultOrderState", () => {
    it("expect returned object to contain all defaults when getting default state", () => {
      const defaultState = getDefaultOrderState();
      expect(defaultState.currencyPair).toBe(HARDCODED_DEFAULTS.currencyPair);
      expect(defaultState.side).toBe(HARDCODED_DEFAULTS.side);
      expect(defaultState.orderType).toBe(HARDCODED_DEFAULTS.orderType);
      expect(defaultState.amount).toEqual(HARDCODED_DEFAULTS.amount);
      expect(defaultState.liquidityPool).toBe(HARDCODED_DEFAULTS.liquidityPool);
      expect(defaultState.expiry).toEqual(HARDCODED_DEFAULTS.expiry);
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
