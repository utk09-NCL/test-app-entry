import * as v from "valibot";
import { describe, expect, it } from "vitest";

import { OrderType } from "../types/domain";

import {
  mapIssuesToErrors,
  OrderSideSchema,
  OrderTypeSchema,
  SCHEMA_MAP,
  validateField,
  validateOrderForSubmission,
} from "./validation";

describe("validation", () => {
  describe("OrderSideSchema", () => {
    it("expect BUY to be valid when validating side", () => {
      const result = v.safeParse(OrderSideSchema, "BUY");
      expect(result.success).toBe(true);
    });

    it("expect SELL to be valid when validating side", () => {
      const result = v.safeParse(OrderSideSchema, "SELL");
      expect(result.success).toBe(true);
    });

    it("expect HOLD to be invalid when validating side", () => {
      const result = v.safeParse(OrderSideSchema, "HOLD");
      expect(result.success).toBe(false);
    });

    it("expect empty string to be invalid when validating side", () => {
      const result = v.safeParse(OrderSideSchema, "");
      expect(result.success).toBe(false);
    });
  });

  describe("OrderTypeSchema", () => {
    it("expect FLOAT to be valid when validating order type", () => {
      const result = v.safeParse(OrderTypeSchema, OrderType.FLOAT);
      expect(result.success).toBe(true);
    });

    it("expect STOP_LOSS to be valid when validating order type", () => {
      const result = v.safeParse(OrderTypeSchema, OrderType.STOP_LOSS);
      expect(result.success).toBe(true);
    });

    it("expect TAKE_PROFIT to be valid when validating order type", () => {
      const result = v.safeParse(OrderTypeSchema, OrderType.TAKE_PROFIT);
      expect(result.success).toBe(true);
    });

    it("expect LIQUIDITY_SEEKER to be valid when validating order type", () => {
      const result = v.safeParse(OrderTypeSchema, OrderType.LIQUIDITY_SEEKER);
      expect(result.success).toBe(true);
    });

    it("expect ADAPT to be valid when validating order type", () => {
      const result = v.safeParse(OrderTypeSchema, OrderType.ADAPT);
      expect(result.success).toBe(true);
    });

    it("expect INVALID to be invalid when validating order type", () => {
      const result = v.safeParse(OrderTypeSchema, "INVALID");
      expect(result.success).toBe(false);
    });
  });

  describe("SCHEMA_MAP", () => {
    it("expect all order types to have schemas when accessing map", () => {
      Object.values(OrderType).forEach((type) => {
        expect(SCHEMA_MAP[type]).toBeDefined();
      });
    });
  });

  describe("validateOrderForSubmission", () => {
    const validTakeProfitOrder = {
      currencyPair: "GBPUSD",
      side: "BUY",
      orderType: OrderType.TAKE_PROFIT,
      amount: { amount: 1000000, ccy: "GBP" },
      level: 1.27345,
      account: { name: "Account 1", sdsId: 1001 },
      liquidityPool: "POOL1",
    };

    const validLiquiditySeekerOrder = {
      currencyPair: "EURUSD",
      side: "SELL",
      orderType: OrderType.LIQUIDITY_SEEKER,
      amount: { amount: 500000, ccy: "EUR" },
      account: { name: "Account 1", sdsId: 1001 },
      liquidityPool: "POOL1",
    };

    const validStopLossOrder = {
      currencyPair: "USDJPY",
      side: "SELL",
      orderType: OrderType.STOP_LOSS,
      amount: { amount: 1000000, ccy: "USD" },
      level: 145.5,
      account: { name: "Account 1", sdsId: 1001 },
      liquidityPool: "POOL1",
    };

    it("expect valid result when submitting valid take profit order", () => {
      const result = validateOrderForSubmission(validTakeProfitOrder);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it("expect valid result when submitting valid liquidity seeker order", () => {
      const result = validateOrderForSubmission(validLiquiditySeekerOrder);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it("expect valid result when submitting valid stop loss order", () => {
      const result = validateOrderForSubmission(validStopLossOrder);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it("expect error when currencyPair is missing", () => {
      const order = { ...validTakeProfitOrder, currencyPair: "" };
      const result = validateOrderForSubmission(order);
      expect(result.valid).toBe(false);
      expect(result.errors.currencyPair).toBeDefined();
    });

    it("expect error when amount is below minimum", () => {
      const order = { ...validTakeProfitOrder, amount: { amount: 0, ccy: "GBP" } };
      const result = validateOrderForSubmission(order);
      expect(result.valid).toBe(false);
      expect(result.errors.amount).toBeDefined();
    });

    it("expect error when amount exceeds maximum", () => {
      const order = { ...validTakeProfitOrder, amount: { amount: 200_000_000_000, ccy: "GBP" } };
      const result = validateOrderForSubmission(order);
      expect(result.valid).toBe(false);
      expect(result.errors.amount).toBeDefined();
    });

    it("expect error when level is missing for take profit order", () => {
      const order = { ...validTakeProfitOrder, level: undefined };
      const result = validateOrderForSubmission(order);
      expect(result.valid).toBe(false);
      expect(result.errors.level).toBeDefined();
    });

    it("expect error when level is missing for stop loss order", () => {
      const order = { ...validStopLossOrder, level: undefined };
      const result = validateOrderForSubmission(order);
      expect(result.valid).toBe(false);
      expect(result.errors.level).toBeDefined();
    });

    it("expect valid when account is undefined (optional field)", () => {
      const order = { ...validTakeProfitOrder, account: undefined };
      const result = validateOrderForSubmission(order);
      expect(result.valid).toBe(true);
    });

    it("expect valid when liquidityPool is empty string (optional field)", () => {
      const order = { ...validTakeProfitOrder, liquidityPool: "" };
      const result = validateOrderForSubmission(order);
      expect(result.valid).toBe(true);
    });

    it("expect error when orderType is unknown", () => {
      const order = {
        ...validTakeProfitOrder,
        orderType: "UNKNOWN",
      } as unknown as Record<string, unknown>;
      const result = validateOrderForSubmission(order);
      expect(result.valid).toBe(false);
      expect(result.errors.orderType).toContain("Unknown order type");
    });

    it("expect error when side is invalid", () => {
      const order = { ...validTakeProfitOrder, side: "HOLD" };
      const result = validateOrderForSubmission(order);
      expect(result.valid).toBe(false);
      expect(result.errors.side).toBeDefined();
    });

    it("expect error when level is zero", () => {
      const order = { ...validTakeProfitOrder, level: 0 };
      const result = validateOrderForSubmission(order);
      expect(result.valid).toBe(false);
      expect(result.errors.level).toBeDefined();
    });

    it("expect error when level is negative", () => {
      const order = { ...validTakeProfitOrder, level: -1.5 };
      const result = validateOrderForSubmission(order);
      expect(result.valid).toBe(false);
      expect(result.errors.level).toBeDefined();
    });

    it("expect error when startMode is START_AT but startTime is missing", () => {
      const order = {
        ...validTakeProfitOrder,
        startMode: "START_AT",
        startDate: "2024-01-01",
        timeZone: "America/New_York",
      };
      const result = validateOrderForSubmission(order);
      expect(result.valid).toBe(false);
      expect(result.errors.startTime).toBe("Start time is required when Start Mode is 'Start At'");
    });

    it("expect error when startMode is START_AT but startDate is missing", () => {
      const order = {
        ...validTakeProfitOrder,
        startMode: "START_AT",
        startTime: "10:30:00",
        timeZone: "America/New_York",
      };
      const result = validateOrderForSubmission(order);
      expect(result.valid).toBe(false);
      expect(result.errors.startDate).toBe("Start date is required when Start Mode is 'Start At'");
    });

    it("expect error when startMode is START_AT but timeZone is missing", () => {
      const order = {
        ...validTakeProfitOrder,
        startMode: "START_AT",
        startTime: "10:30:00",
        startDate: "2024-01-01",
      };
      const result = validateOrderForSubmission(order);
      expect(result.valid).toBe(false);
      expect(result.errors.timeZone).toBe("Timezone is required when Start Mode is 'Start At'");
    });

    it("expect error when expiry strategy is GTD but expiryTime is missing", () => {
      const order = {
        ...validTakeProfitOrder,
        expiry: { strategy: "GTD" },
        expiryDate: "2024-12-31",
        expiryTimeZone: "America/New_York",
      };
      const result = validateOrderForSubmission(order);
      expect(result.valid).toBe(false);
      expect(result.errors.expiryTime).toBe("Expiry time is required for GTD/GTT orders");
    });

    it("expect error when expiry strategy is GTD but expiryDate is missing", () => {
      const order = {
        ...validTakeProfitOrder,
        expiry: { strategy: "GTD" },
        expiryTime: "16:00:00",
        expiryTimeZone: "America/New_York",
      };
      const result = validateOrderForSubmission(order);
      expect(result.valid).toBe(false);
      expect(result.errors.expiryDate).toBe("Expiry date is required for GTD/GTT orders");
    });

    it("expect error when expiry strategy is GTD but expiryTimeZone is missing", () => {
      const order = {
        ...validTakeProfitOrder,
        expiry: { strategy: "GTD" },
        expiryTime: "16:00:00",
        expiryDate: "2024-12-31",
      };
      const result = validateOrderForSubmission(order);
      expect(result.valid).toBe(false);
      expect(result.errors.expiryTimeZone).toBe("Expiry timezone is required for GTD/GTT orders");
    });

    it("expect error when expiry strategy is GTT but expiryTime is missing", () => {
      const order = {
        ...validTakeProfitOrder,
        expiry: { strategy: "GTT" },
        expiryDate: "2024-12-31",
        expiryTimeZone: "America/New_York",
      };
      const result = validateOrderForSubmission(order);
      expect(result.valid).toBe(false);
      expect(result.errors.expiryTime).toBe("Expiry time is required for GTD/GTT orders");
    });

    it("expect valid when expiry strategy is GTC", () => {
      const order = {
        ...validTakeProfitOrder,
        expiry: { strategy: "GTC" },
      };
      const result = validateOrderForSubmission(order);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });
  });

  describe("validateField", () => {
    it("expect undefined when validating valid amount for TAKE_PROFIT order", () => {
      const error = validateField("amount", { amount: 1000000, ccy: "GBP" }, OrderType.TAKE_PROFIT);
      expect(error).toBeUndefined();
    });

    it("expect error message when validating zero amount for TAKE_PROFIT order", () => {
      const error = validateField("amount", { amount: 0, ccy: "GBP" }, OrderType.TAKE_PROFIT);
      expect(error).toBeDefined();
    });

    it("expect error message when validating negative amount for TAKE_PROFIT order", () => {
      const error = validateField("amount", { amount: -1000, ccy: "GBP" }, OrderType.TAKE_PROFIT);
      expect(error).toBeDefined();
    });

    it("expect undefined when validating valid level for TAKE_PROFIT order", () => {
      const error = validateField("level", 1.27345, OrderType.TAKE_PROFIT);
      expect(error).toBeUndefined();
    });

    it("expect error message when validating zero level for TAKE_PROFIT order", () => {
      const error = validateField("level", 0, OrderType.TAKE_PROFIT);
      expect(error).toBeDefined();
    });

    it("expect undefined when validating valid currencyPair for LIQUIDITY_SEEKER order", () => {
      const error = validateField("currencyPair", "GBPUSD", OrderType.LIQUIDITY_SEEKER);
      expect(error).toBeUndefined();
    });

    it("expect error message when validating empty currencyPair for LIQUIDITY_SEEKER order", () => {
      const error = validateField("currencyPair", "", OrderType.LIQUIDITY_SEEKER);
      expect(error).toBeDefined();
    });

    it("expect undefined when validating field for unknown order type", () => {
      const error = validateField("amount", { amount: 1000000, ccy: "GBP" }, "UNKNOWN");
      expect(error).toBeUndefined();
    });

    it("expect undefined when validating valid side for TAKE_PROFIT order", () => {
      const error = validateField("side", "BUY", OrderType.TAKE_PROFIT);
      expect(error).toBeUndefined();
    });

    it("expect error message when validating invalid side for TAKE_PROFIT order", () => {
      const error = validateField("side", "HOLD", OrderType.TAKE_PROFIT);
      expect(error).toBeDefined();
    });

    it("expect root error when issue has no path", () => {
      const errors = mapIssuesToErrors([
        {
          message: "Root level failure",
          path: [],
        } as never,
      ]);

      expect(errors._root).toBe("Root level failure");
    });
  });
});
