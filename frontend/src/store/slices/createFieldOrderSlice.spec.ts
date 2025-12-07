import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { OrderType } from "../../types/domain";

import { createFieldOrderSlice, FieldOrderSlice } from "./createFieldOrderSlice";

// Mock orderConfig
vi.mock("../../config/orderConfig", () => ({
  ORDER_TYPES: {
    [OrderType.FLOAT]: {
      fields: ["side", "currencyPair", "amount", "level", "expiry"],
    },
    [OrderType.STOP_LOSS]: {
      fields: ["side", "currencyPair", "amount"],
    },
    [OrderType.TAKE_PROFIT]: {
      fields: ["side", "currencyPair", "amount", "level", "expiry"],
    },
  },
  getViewFields: vi.fn((orderType: string) => {
    if (orderType === OrderType.FLOAT) {
      return ["side", "currencyPair", "amount", "level", "expiry"];
    }
    if (orderType === OrderType.STOP_LOSS) {
      return ["side", "currencyPair", "amount"];
    }
    return [];
  }),
}));

describe("createFieldOrderSlice", () => {
  let mockState: Record<string, unknown>;
  let slice: FieldOrderSlice;
  let set: ReturnType<typeof vi.fn>;
  let get: ReturnType<typeof vi.fn>;
  let localStorageMock: Record<string, string>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock localStorage
    localStorageMock = {};
    vi.stubGlobal("localStorage", {
      getItem: vi.fn((key: string) => localStorageMock[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageMock[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageMock[key];
      }),
    });

    // Mock window.dispatchEvent
    vi.stubGlobal("dispatchEvent", vi.fn());

    // Mock StorageEvent to avoid jsdom limitation
    vi.stubGlobal(
      "StorageEvent",
      class MockStorageEvent extends Event {
        key: string | null;
        oldValue: string | null;
        newValue: string | null;
        storageArea: Storage | null;

        constructor(type: string, init?: StorageEventInit) {
          super(type);
          this.key = init?.key ?? null;
          this.oldValue = init?.oldValue ?? null;
          this.newValue = init?.newValue ?? null;
          this.storageArea = init?.storageArea ?? null;
        }
      }
    );

    // Suppress console.error for expected errors in tests
    vi.spyOn(console, "error").mockImplementation(() => {});

    mockState = {
      fieldOrders: {},
      draftFieldOrders: {},
      isReorderMode: false,
    };

    set = vi.fn((fn: (state: Record<string, unknown>) => void) => {
      fn(mockState);
    }) as never;

    get = vi.fn(() => mockState) as never;

    slice = createFieldOrderSlice(set, get, {} as never);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe("initial state", () => {
    it("expect fieldOrders to be empty object initially", () => {
      expect(slice.fieldOrders).toEqual({});
    });

    it("expect draftFieldOrders to be empty object initially", () => {
      expect(slice.draftFieldOrders).toEqual({});
    });

    it("expect isReorderMode to be false initially", () => {
      expect(slice.isReorderMode).toBe(false);
    });
  });

  describe("initFieldOrderFromStorage", () => {
    it("expect fieldOrders to be loaded from localStorage", () => {
      localStorageMock["fx-order-field-order"] = JSON.stringify({
        [OrderType.FLOAT]: ["amount", "side", "level"],
      });

      slice.initFieldOrderFromStorage();

      expect(mockState.fieldOrders).toEqual({
        [OrderType.FLOAT]: ["amount", "side", "level"],
      });
    });

    it("expect reorderMode to be loaded from localStorage", () => {
      localStorageMock["fx-order-reorder-mode"] = "true";

      slice.initFieldOrderFromStorage();

      expect(mockState.isReorderMode).toBe(true);
    });

    it("expect empty object when localStorage has no data", () => {
      slice.initFieldOrderFromStorage();

      expect(mockState.fieldOrders).toEqual({});
    });

    it("expect empty object when localStorage has invalid JSON", () => {
      localStorageMock["fx-order-field-order"] = "invalid-json";

      // Should not throw and should set empty object
      slice.initFieldOrderFromStorage();
      expect(mockState.fieldOrders).toEqual({});
    });

    it("expect draftFieldOrders to be cleared on init", () => {
      mockState.draftFieldOrders = { [OrderType.FLOAT]: ["amount"] };

      slice.initFieldOrderFromStorage();

      expect(mockState.draftFieldOrders).toEqual({});
    });
  });

  describe("getFieldOrder", () => {
    it("expect config fields when no custom order exists", () => {
      const fields = slice.getFieldOrder(OrderType.FLOAT);

      expect(fields).toContain("side");
      expect(fields).toContain("amount");
      expect(fields).toContain("level");
    });

    it("expect persisted order when not in reorder mode", () => {
      mockState.fieldOrders = {
        [OrderType.FLOAT]: ["amount", "side", "currencyPair", "level", "expiry"],
      };

      const fields = slice.getFieldOrder(OrderType.FLOAT);

      expect(fields[0]).toBe("amount");
      expect(fields[1]).toBe("side");
    });

    it("expect draft order when in reorder mode with draft", () => {
      mockState.isReorderMode = true;
      mockState.draftFieldOrders = {
        [OrderType.FLOAT]: ["level", "amount", "side", "currencyPair", "expiry"],
      };

      const fields = slice.getFieldOrder(OrderType.FLOAT);

      expect(fields[0]).toBe("level");
      expect(fields[1]).toBe("amount");
    });

    it("expect persisted order as fallback in reorder mode when no draft", () => {
      mockState.isReorderMode = true;
      mockState.fieldOrders = {
        [OrderType.FLOAT]: ["amount", "side", "currencyPair", "level", "expiry"],
      };
      mockState.draftFieldOrders = {};

      const fields = slice.getFieldOrder(OrderType.FLOAT);

      expect(fields[0]).toBe("amount");
    });

    it("expect fields to be returned in view mode", () => {
      const fields = slice.getFieldOrder(OrderType.FLOAT, true);

      expect(fields.length).toBeGreaterThan(0);
    });

    it("expect empty array for unknown order type", () => {
      const fields = slice.getFieldOrder("UNKNOWN" as never);

      expect(fields).toEqual([]);
    });

    it("expect new config fields appended to saved order", () => {
      // Simulate saved order missing a field that's now in config
      mockState.fieldOrders = {
        [OrderType.FLOAT]: ["side", "amount"], // Missing level, currencyPair, expiry
      };

      const fields = slice.getFieldOrder(OrderType.FLOAT);

      // Should have saved fields first, then new fields appended
      expect(fields[0]).toBe("side");
      expect(fields[1]).toBe("amount");
      expect(fields).toContain("level");
      expect(fields).toContain("currencyPair");
      expect(fields).toContain("expiry");
    });
  });

  describe("hasCustomOrder", () => {
    it("expect false when no custom order is saved", () => {
      expect(slice.hasCustomOrder(OrderType.FLOAT)).toBe(false);
    });

    it("expect true when custom order is saved", () => {
      mockState.fieldOrders = {
        [OrderType.FLOAT]: ["notional", "side"],
      };

      expect(slice.hasCustomOrder(OrderType.FLOAT)).toBe(true);
    });

    it("expect false when custom order is empty array", () => {
      mockState.fieldOrders = {
        [OrderType.FLOAT]: [],
      };

      expect(slice.hasCustomOrder(OrderType.FLOAT)).toBe(false);
    });
  });

  describe("updateFieldOrder", () => {
    it("expect draft to be updated with new order", () => {
      slice.updateFieldOrder(OrderType.FLOAT, ["level", "side", "currencyPair"]);

      expect(mockState.draftFieldOrders).toEqual({
        [OrderType.FLOAT]: ["level", "side", "currencyPair"],
      });
    });

    it("expect execution field to be filtered out from saved order", () => {
      slice.updateFieldOrder(OrderType.FLOAT, ["execution", "level", "side"]);

      expect(
        (mockState.draftFieldOrders as Record<string, string[]>)[OrderType.FLOAT]
      ).not.toContain("execution");
      expect((mockState.draftFieldOrders as Record<string, string[]>)[OrderType.FLOAT]).toContain(
        "level"
      );
    });
  });

  describe("resetFieldOrderToDefault", () => {
    it("expect draft to be set to empty array", () => {
      slice.resetFieldOrderToDefault(OrderType.FLOAT);

      expect((mockState.draftFieldOrders as Record<string, unknown[]>)[OrderType.FLOAT]).toEqual(
        []
      );
    });
  });

  describe("saveFieldOrderAndExit", () => {
    it("expect draft to be persisted to fieldOrders", () => {
      mockState.draftFieldOrders = {
        [OrderType.FLOAT]: ["notional", "side", "level"],
      };

      slice.saveFieldOrderAndExit();

      expect((mockState.fieldOrders as Record<string, string[]>)[OrderType.FLOAT]).toEqual([
        "notional",
        "side",
        "level",
      ]);
    });

    it("expect localStorage to be updated", () => {
      mockState.draftFieldOrders = {
        [OrderType.FLOAT]: ["notional", "side"],
      };

      slice.saveFieldOrderAndExit();

      expect(localStorage.setItem).toHaveBeenCalledWith("fx-order-field-order", expect.any(String));
    });

    it("expect localStorage reorder mode to be set to false", () => {
      mockState.draftFieldOrders = {
        [OrderType.FLOAT]: ["notional"],
      };

      slice.saveFieldOrderAndExit();

      expect(localStorage.setItem).toHaveBeenCalledWith("fx-order-reorder-mode", "false");
    });

    it("expect reorder mode to be disabled", () => {
      mockState.isReorderMode = true;
      mockState.draftFieldOrders = {
        [OrderType.FLOAT]: ["notional"],
      };

      slice.saveFieldOrderAndExit();

      expect(mockState.isReorderMode).toBe(false);
    });

    it("expect draft to be cleared after save", () => {
      mockState.draftFieldOrders = {
        [OrderType.FLOAT]: ["notional"],
      };

      slice.saveFieldOrderAndExit();

      expect(mockState.draftFieldOrders).toEqual({});
    });

    it("expect persisted order to be deleted when draft is empty array", () => {
      mockState.fieldOrders = {
        [OrderType.FLOAT]: ["notional", "side"],
      };
      mockState.draftFieldOrders = {
        [OrderType.FLOAT]: [], // Empty = reset to default
      };

      slice.saveFieldOrderAndExit();

      expect((mockState.fieldOrders as Record<string, unknown>)[OrderType.FLOAT]).toBeUndefined();
    });
  });

  describe("cancelReorderMode", () => {
    it("expect draft to be cleared", () => {
      mockState.draftFieldOrders = {
        [OrderType.FLOAT]: ["notional"],
      };

      slice.cancelReorderMode();

      expect(mockState.draftFieldOrders).toEqual({});
    });

    it("expect reorder mode to be disabled", () => {
      mockState.isReorderMode = true;

      slice.cancelReorderMode();

      expect(mockState.isReorderMode).toBe(false);
    });

    it("expect localStorage reorder mode to be set to false", () => {
      slice.cancelReorderMode();

      expect(localStorage.setItem).toHaveBeenCalledWith("fx-order-reorder-mode", "false");
    });
  });

  describe("toggleReorderMode", () => {
    it("expect reorder mode to be enabled when currently disabled", () => {
      mockState.isReorderMode = false;

      slice.toggleReorderMode();

      expect(mockState.isReorderMode).toBe(true);
    });

    it("expect reorder mode to be disabled when currently enabled", () => {
      mockState.isReorderMode = true;

      slice.toggleReorderMode();

      expect(mockState.isReorderMode).toBe(false);
    });

    it("expect draft to be cleared when entering reorder mode", () => {
      mockState.isReorderMode = false;
      mockState.draftFieldOrders = {
        [OrderType.FLOAT]: ["old"],
      };

      slice.toggleReorderMode();

      expect(mockState.draftFieldOrders).toEqual({});
    });

    it("expect draft to be discarded when exiting via toggle", () => {
      mockState.isReorderMode = true;
      mockState.draftFieldOrders = {
        [OrderType.FLOAT]: ["unsaved"],
      };

      slice.toggleReorderMode();

      expect(mockState.draftFieldOrders).toEqual({});
    });

    it("expect localStorage to be updated with new mode", () => {
      mockState.isReorderMode = false;

      slice.toggleReorderMode();

      expect(localStorage.setItem).toHaveBeenCalledWith("fx-order-reorder-mode", "true");
    });
  });

  describe("error handling", () => {
    it("expect empty object when getStoredFieldOrders encounters error", () => {
      // Make localStorage.getItem throw an error
      vi.mocked(localStorage.getItem).mockImplementation(() => {
        throw new Error("localStorage unavailable");
      });

      slice.initFieldOrderFromStorage();

      expect(mockState.fieldOrders).toEqual({});
    });

    it("expect false when getReorderModeEnabled encounters error", () => {
      // Make localStorage.getItem throw an error
      vi.mocked(localStorage.getItem).mockImplementation(() => {
        throw new Error("localStorage unavailable");
      });

      // getReorderModeEnabled is called internally during init
      slice.initFieldOrderFromStorage();

      // Should default to false when error occurs
      expect(mockState.isReorderMode).toBe(false);
    });

    it("expect console error when saveFieldOrders encounters localStorage error", async () => {
      // Reset modules to get a fresh import
      vi.resetModules();

      // Track console.error calls
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      // Create a localStorage mock that throws on setItem for field orders
      const setItemMock = vi.fn((key: string) => {
        if (key === "fx-order-field-order") {
          throw new Error("QuotaExceededError");
        }
      });

      const localStorageMockWithError = {
        getItem: vi.fn((key: string) => {
          if (key === "fx-order-field-order") {
            return JSON.stringify({});
          }
          if (key === "fx-order-reorder-mode") {
            return "true";
          }
          return null;
        }),
        setItem: setItemMock,
        removeItem: vi.fn(),
      };
      vi.stubGlobal("localStorage", localStorageMockWithError);

      // Re-stub dispatchEvent and StorageEvent
      vi.stubGlobal("dispatchEvent", vi.fn());
      vi.stubGlobal(
        "StorageEvent",
        class MockStorageEvent extends Event {
          key: string | null;
          oldValue: string | null;
          newValue: string | null;
          storageArea: Storage | null;

          constructor(type: string, init?: StorageEventInit) {
            super(type);
            this.key = init?.key ?? null;
            this.oldValue = init?.oldValue ?? null;
            this.newValue = init?.newValue ?? null;
            this.storageArea = init?.storageArea ?? null;
          }
        }
      );

      // Import the module fresh after stubbing globals
      const { createFieldOrderSlice: freshCreateFieldOrderSlice } = await import(
        "./createFieldOrderSlice"
      );

      // Create fresh mock state with draft
      const freshMockState: Record<string, unknown> = {
        fieldOrders: {},
        draftFieldOrders: {
          [OrderType.FLOAT]: ["notional", "side", "currencyPair"],
        },
        isReorderMode: true,
      };

      const freshSet = vi.fn((fn: (state: Record<string, unknown>) => void) => {
        fn(freshMockState);
      }) as never;

      const freshGet = vi.fn(() => freshMockState) as never;

      // Create a new slice that captures the error-throwing localStorage
      const freshSlice = freshCreateFieldOrderSlice(freshSet, freshGet, {} as never);

      // Call the method - should trigger the error in saveFieldOrders
      freshSlice.saveFieldOrderAndExit();

      // Check if setItem was called at all
      expect(setItemMock).toHaveBeenCalled();

      // Verify console.error was called with the expected message
      expect(consoleSpy).toHaveBeenCalledWith(
        "[FieldOrderSlice] Failed to save field orders:",
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });
});
