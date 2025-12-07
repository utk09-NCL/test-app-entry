import { describe, expect, it, vi } from "vitest";

import { renderHook } from "@testing-library/react";

import { OrderType } from "../types/domain";

import { useFieldOrder } from "./useFieldOrder";

// Mock the store
vi.mock("../store", () => ({
  useOrderEntryStore: vi.fn(),
}));

import { useOrderEntryStore } from "../store";

describe("useFieldOrder", () => {
  const mockGetFieldOrder = vi.fn();
  const mockHasCustomOrder = vi.fn();
  const mockUpdateFieldOrder = vi.fn();
  const mockResetFieldOrderToDefault = vi.fn();
  const mockSaveFieldOrderAndExit = vi.fn();
  const mockCancelReorderMode = vi.fn();
  const mockToggleReorderMode = vi.fn();

  const setupMockStore = (overrides: { isReorderMode?: boolean } = {}) => {
    vi.mocked(useOrderEntryStore).mockImplementation((selector) => {
      const state = {
        isReorderMode: overrides.isReorderMode ?? false,
        fieldOrders: {},
        draftFieldOrders: {},
        getFieldOrder: mockGetFieldOrder,
        hasCustomOrder: mockHasCustomOrder,
        updateFieldOrder: mockUpdateFieldOrder,
        resetFieldOrderToDefault: mockResetFieldOrderToDefault,
        saveFieldOrderAndExit: mockSaveFieldOrderAndExit,
        cancelReorderMode: mockCancelReorderMode,
        toggleReorderMode: mockToggleReorderMode,
      };
      return selector(state as never);
    });
  };

  describe("state access", () => {
    it("expect isReorderMode to be false when store returns false", () => {
      setupMockStore({ isReorderMode: false });

      const { result } = renderHook(() => useFieldOrder());

      expect(result.current.isReorderMode).toBe(false);
    });

    it("expect isReorderMode to be true when store returns true", () => {
      setupMockStore({ isReorderMode: true });

      const { result } = renderHook(() => useFieldOrder());

      expect(result.current.isReorderMode).toBe(true);
    });

    it("expect fieldOrders to be empty object initially", () => {
      setupMockStore();

      const { result } = renderHook(() => useFieldOrder());

      expect(result.current.fieldOrders).toEqual({});
    });

    it("expect draftFieldOrders to be empty object initially", () => {
      setupMockStore();

      const { result } = renderHook(() => useFieldOrder());

      expect(result.current.draftFieldOrders).toEqual({});
    });
  });

  describe("action delegation", () => {
    it("expect getFieldOrder to call store's getFieldOrder", () => {
      setupMockStore();
      mockGetFieldOrder.mockReturnValue(["side", "notional", "level"]);

      const { result } = renderHook(() => useFieldOrder());
      const fields = result.current.getFieldOrder(OrderType.FLOAT);

      expect(mockGetFieldOrder).toHaveBeenCalledWith(OrderType.FLOAT);
      expect(fields).toEqual(["side", "notional", "level"]);
    });

    it("expect hasCustomOrder to call store's hasCustomOrder", () => {
      setupMockStore();
      mockHasCustomOrder.mockReturnValue(true);

      const { result } = renderHook(() => useFieldOrder());
      const hasCustom = result.current.hasCustomOrder(OrderType.FLOAT);

      expect(mockHasCustomOrder).toHaveBeenCalledWith(OrderType.FLOAT);
      expect(hasCustom).toBe(true);
    });

    it("expect updateFieldOrder to call store's updateFieldOrder", () => {
      setupMockStore();

      const { result } = renderHook(() => useFieldOrder());
      const newOrder = ["amount", "side", "level"] as const;
      result.current.updateFieldOrder(OrderType.FLOAT, [...newOrder]);

      expect(mockUpdateFieldOrder).toHaveBeenCalledWith(OrderType.FLOAT, [...newOrder]);
    });

    it("expect resetToDefault to call store's resetFieldOrderToDefault", () => {
      setupMockStore();

      const { result } = renderHook(() => useFieldOrder());
      result.current.resetToDefault(OrderType.FLOAT);

      expect(mockResetFieldOrderToDefault).toHaveBeenCalledWith(OrderType.FLOAT);
    });

    it("expect saveAndExit to call store's saveFieldOrderAndExit", () => {
      setupMockStore();

      const { result } = renderHook(() => useFieldOrder());
      result.current.saveAndExit();

      expect(mockSaveFieldOrderAndExit).toHaveBeenCalled();
    });

    it("expect cancelReorder to call store's cancelReorderMode", () => {
      setupMockStore();

      const { result } = renderHook(() => useFieldOrder());
      result.current.cancelReorder();

      expect(mockCancelReorderMode).toHaveBeenCalled();
    });

    it("expect toggleReorderMode to call store's toggleReorderMode", () => {
      setupMockStore();

      const { result } = renderHook(() => useFieldOrder());
      result.current.toggleReorderMode();

      expect(mockToggleReorderMode).toHaveBeenCalled();
    });
  });

  describe("view mode parameter", () => {
    it("expect getFieldOrder to pass isViewMode parameter to store", () => {
      setupMockStore();
      mockGetFieldOrder.mockReturnValue(["status", "side", "notional"]);

      const { result } = renderHook(() => useFieldOrder());
      result.current.getFieldOrder(OrderType.FLOAT, true);

      expect(mockGetFieldOrder).toHaveBeenCalledWith(OrderType.FLOAT, true);
    });

    it("expect getFieldOrder to work without isViewMode parameter", () => {
      setupMockStore();
      mockGetFieldOrder.mockReturnValue(["side", "notional"]);

      const { result } = renderHook(() => useFieldOrder());
      result.current.getFieldOrder(OrderType.FLOAT);

      expect(mockGetFieldOrder).toHaveBeenCalledWith(OrderType.FLOAT);
    });
  });
});
