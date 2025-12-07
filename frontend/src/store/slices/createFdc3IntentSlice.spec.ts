import { beforeEach, describe, expect, it, vi } from "vitest";

import { createFdc3IntentSlice, Fdc3IntentSlice } from "./createFdc3IntentSlice";

// Mock idGenerator
vi.mock("../../utils/idGenerator", () => ({
  generateId: vi.fn(() => "mock-id-12345"),
}));

describe("createFdc3IntentSlice", () => {
  let mockState: Record<string, unknown>;
  let slice: Fdc3IntentSlice;
  let set: ReturnType<typeof vi.fn>;
  let get: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(Date, "now").mockReturnValue(1700000000000);

    mockState = {
      fdc3Intent: null,
      fdc3IntentMeta: null,
      fdc3IntentQueue: [],
      hasPendingFdc3Intent: false,
      pendingFdc3Intent: null,
      dirtyValues: {},
    };

    set = vi.fn((fn: (state: Record<string, unknown>) => void) => {
      fn(mockState);
    }) as never;

    get = vi.fn(() => mockState) as never;

    slice = createFdc3IntentSlice(set, get, {} as never);
  });

  describe("initial state", () => {
    it("expect fdc3Intent to be null initially", () => {
      expect(slice.fdc3Intent).toBeNull();
    });

    it("expect fdc3IntentMeta to be null initially", () => {
      expect(slice.fdc3IntentMeta).toBeNull();
    });

    it("expect fdc3IntentQueue to be empty initially", () => {
      expect(slice.fdc3IntentQueue).toEqual([]);
    });

    it("expect hasPendingFdc3Intent to be false initially", () => {
      expect(slice.hasPendingFdc3Intent).toBe(false);
    });

    it("expect pendingFdc3Intent to be null initially", () => {
      expect(slice.pendingFdc3Intent).toBeNull();
    });
  });

  describe("setFdc3Intent", () => {
    it("expect fdc3Intent to be set with provided data", () => {
      slice.setFdc3Intent({ currencyPair: "EURUSD", side: "SELL" }, "ExternalApp");

      expect(mockState.fdc3Intent).toMatchObject({
        currencyPair: "EURUSD",
        side: "SELL",
        receivedAt: 1700000000000,
        acknowledged: true,
      });
    });

    it("expect fdc3IntentMeta to be set with metadata", () => {
      slice.setFdc3Intent({ currencyPair: "EURUSD" }, "TradingApp");

      expect(mockState.fdc3IntentMeta).toMatchObject({
        intentId: "mock-id-12345",
        receivedAt: 1700000000000,
        sourceApp: "TradingApp",
        status: "applied",
      });
    });

    it("expect dirtyValues to be cleared when intent is applied", () => {
      mockState.dirtyValues = { notional: 2000000 };

      slice.setFdc3Intent({ currencyPair: "EURUSD" });

      expect(mockState.dirtyValues).toEqual({});
    });

    it("expect pending intent state to be cleared when intent is applied", () => {
      mockState.hasPendingFdc3Intent = true;
      mockState.pendingFdc3Intent = { currencyPair: "USDJPY" };

      slice.setFdc3Intent({ currencyPair: "EURUSD" });

      expect(mockState.hasPendingFdc3Intent).toBe(false);
      expect(mockState.pendingFdc3Intent).toBeNull();
    });
  });

  describe("queueFdc3Intent", () => {
    it("expect intent to be added to queue", () => {
      slice.queueFdc3Intent(
        { currencyPair: "EURUSD", amount: { amount: 1000000, ccy: "EUR" } },
        "ExternalApp"
      );

      expect(mockState.fdc3IntentQueue).toHaveLength(1);
      expect((mockState.fdc3IntentQueue as Array<unknown>)[0]).toMatchObject({
        data: {
          currencyPair: "EURUSD",
          amount: { amount: 1000000, ccy: "EUR" },
          receivedAt: 1700000000000,
        },
        meta: {
          intentId: "mock-id-12345",
          receivedAt: 1700000000000,
          sourceApp: "ExternalApp",
          status: "pending",
        },
      });
    });

    it("expect multiple intents to accumulate in queue", () => {
      slice.queueFdc3Intent({ currencyPair: "EURUSD" });
      slice.queueFdc3Intent({ currencyPair: "USDJPY" });

      expect(mockState.fdc3IntentQueue).toHaveLength(2);
    });
  });

  describe("processIntentQueue", () => {
    it("expect no action when queue is empty", () => {
      mockState.fdc3IntentQueue = [];

      slice.processIntentQueue();

      expect(set).not.toHaveBeenCalled();
    });

    it("expect latest intent to be applied when queue has items", () => {
      mockState.fdc3IntentQueue = [
        {
          data: { currencyPair: "EURUSD", receivedAt: 1700000000000 },
          meta: { intentId: "id-1", receivedAt: 1700000000000, status: "pending" },
        },
        {
          data: { currencyPair: "USDJPY", receivedAt: 1700000001000 },
          meta: { intentId: "id-2", receivedAt: 1700000001000, status: "pending" },
        },
      ];

      slice.processIntentQueue();

      expect(mockState.fdc3Intent).toMatchObject({
        currencyPair: "USDJPY",
        acknowledged: true,
      });
    });

    it("expect queue to be cleared after processing", () => {
      mockState.fdc3IntentQueue = [
        {
          data: { currencyPair: "EURUSD", receivedAt: 1700000000000 },
          meta: { intentId: "id-1", receivedAt: 1700000000000, status: "pending" },
        },
      ];

      slice.processIntentQueue();

      expect(mockState.fdc3IntentQueue).toEqual([]);
    });

    it("expect dirtyValues to be cleared after processing queue", () => {
      mockState.dirtyValues = { notional: 5000000 };
      mockState.fdc3IntentQueue = [
        {
          data: { currencyPair: "EURUSD", receivedAt: 1700000000000 },
          meta: { intentId: "id-1", receivedAt: 1700000000000, status: "pending" },
        },
      ];

      slice.processIntentQueue();

      expect(mockState.dirtyValues).toEqual({});
    });

    it("expect meta status to be updated to applied", () => {
      mockState.fdc3IntentQueue = [
        {
          data: { currencyPair: "EURUSD", receivedAt: 1700000000000 },
          meta: {
            intentId: "id-1",
            receivedAt: 1700000000000,
            sourceApp: "TestApp",
            status: "pending",
          },
        },
      ];

      slice.processIntentQueue();

      expect(mockState.fdc3IntentMeta).toMatchObject({
        status: "applied",
      });
    });
  });

  describe("setPendingFdc3Intent", () => {
    it("expect pending intent to be set with data", () => {
      slice.setPendingFdc3Intent({ currencyPair: "EURUSD", side: "SELL" });

      expect(mockState.pendingFdc3Intent).toEqual({ currencyPair: "EURUSD", side: "SELL" });
      expect(mockState.hasPendingFdc3Intent).toBe(true);
    });

    it("expect pending intent to be cleared when null is passed", () => {
      mockState.pendingFdc3Intent = { currencyPair: "EURUSD" };
      mockState.hasPendingFdc3Intent = true;

      slice.setPendingFdc3Intent(null);

      expect(mockState.pendingFdc3Intent).toBeNull();
      expect(mockState.hasPendingFdc3Intent).toBe(false);
    });
  });

  describe("acceptPendingIntent", () => {
    it("expect no action when no pending intent exists", () => {
      mockState.pendingFdc3Intent = null;

      // Create a fresh mock for setFdc3Intent
      const setFdc3IntentMock = vi.fn();
      mockState.setFdc3Intent = setFdc3IntentMock;

      slice.acceptPendingIntent();

      // Should return early without calling setFdc3Intent
      expect(setFdc3IntentMock).not.toHaveBeenCalled();
    });

    it("expect pending intent to be applied when it exists", () => {
      const pendingData = { currencyPair: "EURUSD", notional: 3000000 };
      mockState.pendingFdc3Intent = pendingData;

      // Mock setFdc3Intent on state
      const setFdc3IntentMock = vi.fn();
      mockState.setFdc3Intent = setFdc3IntentMock;

      slice.acceptPendingIntent();

      expect(setFdc3IntentMock).toHaveBeenCalledWith(pendingData);
    });
  });

  describe("rejectPendingIntent", () => {
    it("expect pending state to be cleared when rejected", () => {
      mockState.hasPendingFdc3Intent = true;
      mockState.pendingFdc3Intent = { currencyPair: "EURUSD" };

      slice.rejectPendingIntent();

      expect(mockState.hasPendingFdc3Intent).toBe(false);
      expect(mockState.pendingFdc3Intent).toBeNull();
    });

    it("expect meta status to be updated to rejected when meta exists", () => {
      mockState.fdc3IntentMeta = {
        intentId: "id-1",
        receivedAt: 1700000000000,
        status: "applied",
      };
      mockState.hasPendingFdc3Intent = true;
      mockState.pendingFdc3Intent = { currencyPair: "EURUSD" };

      slice.rejectPendingIntent();

      expect((mockState.fdc3IntentMeta as { status: string }).status).toBe("rejected");
    });
  });

  describe("clearFdc3Intent", () => {
    it("expect all fdc3 state to be cleared", () => {
      mockState.fdc3Intent = { currencyPair: "EURUSD" };
      mockState.fdc3IntentMeta = { intentId: "id-1", status: "applied" };
      mockState.hasPendingFdc3Intent = true;
      mockState.pendingFdc3Intent = { currencyPair: "USDJPY" };

      slice.clearFdc3Intent();

      expect(mockState.fdc3Intent).toBeNull();
      expect(mockState.fdc3IntentMeta).toBeNull();
      expect(mockState.hasPendingFdc3Intent).toBe(false);
      expect(mockState.pendingFdc3Intent).toBeNull();
    });
  });
});
