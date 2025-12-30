import { describe, expect, it } from "vitest";

import { AMOUNT_CONFIG, NOTIONAL_LIMITS, PRICE_CONFIG, VALIDATION_CONFIG } from "./constants";

describe("constants", () => {
  describe("PRICE_CONFIG", () => {
    it("expect initial prices to be 0 for auto-grab feature", () => {
      // Initial prices are 0 - actual prices come from WebSocket/GraphQL subscription
      expect(PRICE_CONFIG.INITIAL_BUY_PRICE).toBe(0);
      expect(PRICE_CONFIG.INITIAL_SELL_PRICE).toBe(0);
    });

    it("expect tick interval to be positive when defined", () => {
      expect(PRICE_CONFIG.TICK_INTERVAL_MS).toBeGreaterThan(0);
    });

    it("expect max price change to be less than 1% when simulating price ticks", () => {
      expect(PRICE_CONFIG.MAX_PRICE_CHANGE).toBeLessThan(0.01);
    });

    it("expect min price to be less than max price when setting boundaries", () => {
      expect(PRICE_CONFIG.MIN_PRICE).toBeLessThan(PRICE_CONFIG.MAX_PRICE);
    });

    it("expect price step to be 0.0001 when configuring FX precision", () => {
      expect(PRICE_CONFIG.PRICE_STEP).toBe(0.0001);
    });

    it("expect 5 decimal places when displaying prices", () => {
      expect(PRICE_CONFIG.PRICE_DECIMALS).toBe(5);
    });

    it("expect minimum valid price to be positive when validating", () => {
      expect(PRICE_CONFIG.MIN_VALID_PRICE).toBeGreaterThan(0);
    });
  });

  describe("AMOUNT_CONFIG", () => {
    it("expect minimum amount to be positive when validating", () => {
      expect(AMOUNT_CONFIG.MIN_AMOUNT).toBeGreaterThan(0);
    });

    it("expect step amount to be greater than or equal to min amount when incrementing", () => {
      expect(AMOUNT_CONFIG.STEP_AMOUNT).toBeGreaterThanOrEqual(AMOUNT_CONFIG.MIN_AMOUNT);
    });

    it("expect default placeholder to be defined when rendering input", () => {
      expect(AMOUNT_CONFIG.DEFAULT_PLACEHOLDER).toBeDefined();
      expect(AMOUNT_CONFIG.DEFAULT_PLACEHOLDER.length).toBeGreaterThan(0);
    });

    it("expect max firm limit to be greater than min amount when validating limits", () => {
      expect(AMOUNT_CONFIG.MAX_FIRM_LIMIT).toBeGreaterThan(AMOUNT_CONFIG.MIN_AMOUNT);
    });
  });

  describe("VALIDATION_CONFIG", () => {
    it("expect debounce delay to be positive when configured", () => {
      expect(VALIDATION_CONFIG.DEBOUNCE_MS).toBeGreaterThan(0);
    });

    it("expect debounce delay to be between 100-1000ms when optimizing for user input", () => {
      expect(VALIDATION_CONFIG.DEBOUNCE_MS).toBeGreaterThanOrEqual(100);
      expect(VALIDATION_CONFIG.DEBOUNCE_MS).toBeLessThanOrEqual(1000);
    });

    it("expect server validation delay to be positive when configured", () => {
      expect(VALIDATION_CONFIG.SERVER_VALIDATION_DELAY_MS).toBeGreaterThan(0);
    });
  });

  describe("NOTIONAL_LIMITS", () => {
    it("expect minimum notional to be positive when validating", () => {
      expect(NOTIONAL_LIMITS.MIN).toBeGreaterThan(0);
    });

    it("expect maximum to be greater than minimum when setting limits", () => {
      expect(NOTIONAL_LIMITS.MAX).toBeGreaterThan(NOTIONAL_LIMITS.MIN);
    });

    it("expect max limit to be up to 100 billion when setting cap", () => {
      expect(NOTIONAL_LIMITS.MAX).toBeLessThanOrEqual(100_000_000_000);
    });
  });

  describe("type safety", () => {
    it("expect all PRICE_CONFIG keys to be present when accessing config", () => {
      const expectedKeys = [
        "INITIAL_BUY_PRICE",
        "INITIAL_SELL_PRICE",
        "TICK_INTERVAL_MS",
        "MAX_PRICE_CHANGE",
        "MIN_PRICE",
        "MAX_PRICE",
        "PRICE_STEP",
        "PRICE_DECIMALS",
        "MIN_VALID_PRICE",
      ];
      expect(Object.keys(PRICE_CONFIG)).toEqual(expect.arrayContaining(expectedKeys));
    });

    it("expect all AMOUNT_CONFIG keys to be present when accessing config", () => {
      const expectedKeys = ["MIN_AMOUNT", "STEP_AMOUNT", "DEFAULT_PLACEHOLDER", "MAX_FIRM_LIMIT"];
      expect(Object.keys(AMOUNT_CONFIG)).toEqual(expect.arrayContaining(expectedKeys));
    });
  });
});
