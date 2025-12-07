import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderHook } from "@testing-library/react";

import { OrderType } from "../../types/domain";

import { useFieldReadOnly } from "./useFieldReadOnly";

// Mock the store
vi.mock("../../store", () => ({
  useOrderEntryStore: vi.fn(),
}));

// Mock orderConfig
vi.mock("../../config/orderConfig", () => ({
  ORDER_TYPES: {
    [OrderType.TAKE_PROFIT]: {
      fields: ["side", "liquidityPool", "amount", "level", "expiry", "account"],
      initialFocus: "level",
      editableFields: ["amount", "level", "expiry"],
    },
    [OrderType.LIQUIDITY_SEEKER]: {
      fields: ["side", "liquidityPool", "amount", "expiry", "account"],
      initialFocus: "amount",
      editableFields: ["amount", "expiry"],
    },
    [OrderType.STOP_LOSS]: {
      fields: ["side", "liquidityPool", "amount", "level", "expiry", "account"],
      initialFocus: "level",
      editableFields: ["amount", "level", "expiry"],
    },
  },
}));

import { useOrderEntryStore } from "../../store";

describe("useFieldReadOnly", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockStore = (
    editMode: "creating" | "viewing" | "amending",
    orderType: string,
    refDataError?: string
  ) => {
    return vi.mocked(useOrderEntryStore).mockImplementation((selector) => {
      const state = {
        editMode,
        getDerivedValues: () => ({ orderType }),
        refDataErrors: refDataError ? { testField: refDataError } : {},
      };
      return selector(state as never);
    });
  };

  describe("creating mode", () => {
    it("expect field to not be read-only when in creating mode", () => {
      createMockStore("creating", OrderType.TAKE_PROFIT);

      const { result } = renderHook(() => useFieldReadOnly("level"));

      expect(result.current.isReadOnly).toBe(false);
      expect(result.current.editMode).toBe("creating");
    });

    it("expect field to not be editable when in creating mode", () => {
      createMockStore("creating", OrderType.TAKE_PROFIT);

      const { result } = renderHook(() => useFieldReadOnly("level"));

      expect(result.current.isEditable).toBe(false);
    });
  });

  describe("viewing mode", () => {
    it("expect all fields to be read-only when in viewing mode", () => {
      createMockStore("viewing", OrderType.TAKE_PROFIT);

      const { result } = renderHook(() => useFieldReadOnly("level"));

      expect(result.current.isReadOnly).toBe(true);
      expect(result.current.editMode).toBe("viewing");
    });

    it("expect editable field to have isEditable true when in viewing mode", () => {
      createMockStore("viewing", OrderType.TAKE_PROFIT);

      const { result } = renderHook(() => useFieldReadOnly("level"));

      expect(result.current.isEditable).toBe(true);
    });

    it("expect non-editable field to have isEditable false when in viewing mode", () => {
      createMockStore("viewing", OrderType.TAKE_PROFIT);

      const { result } = renderHook(() => useFieldReadOnly("side"));

      expect(result.current.isEditable).toBe(false);
    });
  });

  describe("amending mode", () => {
    it("expect editable field to not be read-only when in amending mode", () => {
      createMockStore("amending", OrderType.TAKE_PROFIT);

      const { result } = renderHook(() => useFieldReadOnly("level"));

      expect(result.current.isReadOnly).toBe(false);
    });

    it("expect non-editable field to be read-only when in amending mode", () => {
      createMockStore("amending", OrderType.TAKE_PROFIT);

      const { result } = renderHook(() => useFieldReadOnly("side"));

      expect(result.current.isReadOnly).toBe(true);
    });

    it("expect isEditable to be false when in amending mode", () => {
      createMockStore("amending", OrderType.TAKE_PROFIT);

      const { result } = renderHook(() => useFieldReadOnly("level"));

      expect(result.current.isEditable).toBe(false);
    });
  });

  describe("always read-only fields", () => {
    it("expect currencyPair to always be read-only when in any mode", () => {
      createMockStore("creating", OrderType.TAKE_PROFIT);

      const { result } = renderHook(() => useFieldReadOnly("currencyPair"));

      expect(result.current.isReadOnly).toBe(true);
      expect(result.current.isEditable).toBe(false);
    });
  });

  describe("order type specific", () => {
    it("expect level to be editable for STOP_LOSS when in viewing mode", () => {
      createMockStore("viewing", OrderType.STOP_LOSS);

      const { result } = renderHook(() => useFieldReadOnly("level"));

      expect(result.current.isEditable).toBe(true);
    });

    it("expect level to not be editable for LIQUIDITY_SEEKER when in viewing mode", () => {
      createMockStore("viewing", OrderType.LIQUIDITY_SEEKER);

      const { result } = renderHook(() => useFieldReadOnly("level"));

      expect(result.current.isEditable).toBe(false);
    });
  });
});
