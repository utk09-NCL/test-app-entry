import { beforeEach, describe, expect, it, vi } from "vitest";

import { OrderSide } from "../../types/domain";
import type { UserInteractionSlice } from "../../types/store";

import { createUserInteractionSlice } from "./createUserInteractionSlice";

describe("createUserInteractionSlice", () => {
  let mockState: Record<string, unknown>;
  let slice: UserInteractionSlice;
  let set: ReturnType<typeof vi.fn>;
  let get: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockState = {
      dirtyValues: {},
      errors: {},
      serverErrors: {},
      warnings: {},
    };

    set = vi.fn((fn: (state: Record<string, unknown>) => void) => {
      fn(mockState);
    }) as never;

    // Mock get() to return the state plus the setLastGrabbedSide function
    get = vi.fn(() => ({
      ...mockState,
      setLastGrabbedSide: vi.fn(),
    })) as never;

    slice = createUserInteractionSlice(set, get, {} as never);
  });

  describe("initial state", () => {
    it("expect dirtyValues to be empty object initially", () => {
      expect(slice.dirtyValues).toEqual({});
    });
  });

  describe("setFieldValue", () => {
    it("expect dirtyValue to be set when field is updated", () => {
      slice.setFieldValue("currencyPair", "EURUSD");

      expect((mockState.dirtyValues as Record<string, unknown>).currencyPair).toBe("EURUSD");
    });

    it("expect dirtyValue to be updated when field is changed multiple times", () => {
      slice.setFieldValue("currencyPair", "GBPUSD");
      slice.setFieldValue("currencyPair", "EURUSD");

      expect((mockState.dirtyValues as Record<string, unknown>).currencyPair).toBe("EURUSD");
    });

    it("expect error to be cleared when field is set", () => {
      mockState.errors = { currencyPair: "Invalid currencyPair" };

      slice.setFieldValue("currencyPair", "EURUSD");

      expect((mockState.errors as Record<string, unknown>).currencyPair).toBeUndefined();
    });

    it("expect server error to be cleared when field is set", () => {
      mockState.serverErrors = { amount: "Exceeds limit" };

      slice.setFieldValue("amount", { amount: 5000000, ccy: "GBP" });

      expect((mockState.serverErrors as Record<string, unknown>).amount).toBeUndefined();
    });

    it("expect multiple fields to be tracked independently", () => {
      slice.setFieldValue("currencyPair", "GBPUSD");
      slice.setFieldValue("side", OrderSide.BUY);
      slice.setFieldValue("amount", { amount: 1000000, ccy: "GBP" });

      const dirty = mockState.dirtyValues as Record<string, unknown>;
      expect(dirty.currencyPair).toBe("GBPUSD");
      expect(dirty.side).toBe(OrderSide.BUY);
      expect(dirty.amount).toEqual({ amount: 1000000, ccy: "GBP" });
    });

    it("expect field to be set to undefined when value is undefined", () => {
      slice.setFieldValue("currencyPair", "EURUSD");
      slice.setFieldValue("currencyPair", undefined);

      expect((mockState.dirtyValues as Record<string, unknown>).currencyPair).toBeUndefined();
    });

    it("expect numeric field to be set correctly", () => {
      slice.setFieldValue("level", 1.275);

      expect((mockState.dirtyValues as Record<string, unknown>).level).toBe(1.275);
    });

    it("expect optional field to be set correctly", () => {
      slice.setFieldValue("level", 1.2);

      expect((mockState.dirtyValues as Record<string, unknown>).level).toBe(1.2);
    });

    it("expect error to be preserved for other fields when clearing one field's error", () => {
      mockState.errors = { currencyPair: "Invalid", amount: "Too small" };

      slice.setFieldValue("currencyPair", "EURUSD");

      expect((mockState.errors as Record<string, unknown>).currencyPair).toBeUndefined();
      expect((mockState.errors as Record<string, unknown>).amount).toBe("Too small");
    });
  });

  describe("resetFormInteractions", () => {
    it("expect dirtyValues to be cleared", () => {
      mockState.dirtyValues = { currencyPair: "EURUSD", amount: { amount: 1000000, ccy: "EUR" } };

      slice.resetFormInteractions();

      expect(mockState.dirtyValues).toEqual({});
    });

    it("expect errors to be cleared", () => {
      mockState.errors = { currencyPair: "Invalid" };

      slice.resetFormInteractions();

      expect(mockState.errors).toEqual({});
    });

    it("expect serverErrors to be cleared", () => {
      mockState.serverErrors = { notional: "Exceeds limit" };

      slice.resetFormInteractions();

      expect(mockState.serverErrors).toEqual({});
    });

    it("expect warnings to be cleared", () => {
      mockState.warnings = { notional: "Large trade" };

      slice.resetFormInteractions();

      expect(mockState.warnings).toEqual({});
    });

    it("expect all interaction state to be cleared at once", () => {
      mockState.dirtyValues = { currencyPair: "EURUSD" };
      mockState.errors = { currencyPair: "Invalid" };
      mockState.serverErrors = { notional: "Exceeds limit" };
      mockState.warnings = { notional: "Large trade" };

      slice.resetFormInteractions();

      expect(mockState.dirtyValues).toEqual({});
      expect(mockState.errors).toEqual({});
      expect(mockState.serverErrors).toEqual({});
      expect(mockState.warnings).toEqual({});
    });

    it("expect subsequent updates to work after reset", () => {
      mockState.dirtyValues = { currencyPair: "EURUSD" };
      slice.resetFormInteractions();
      slice.setFieldValue("currencyPair", "GBPUSD");

      expect((mockState.dirtyValues as Record<string, unknown>).currencyPair).toBe("GBPUSD");
    });
  });
});
