import { beforeEach, describe, expect, it, vi } from "vitest";

import type { BoundState, PriceSlice } from "../../types/store";

import { createPriceSlice } from "./createPriceSlice";

describe("createPriceSlice", () => {
  let mockState: Partial<BoundState>;
  let slice: PriceSlice;
  let set: ReturnType<typeof vi.fn>;
  let get: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockState = {
      currentBuyPrice: 1.27345,
      currentSellPrice: 1.27325,
      autoGrabPrice: false,
    };

    set = vi.fn((fn: (state: Partial<BoundState>) => void) => {
      fn(mockState);
    }) as never;

    get = vi.fn(() => mockState) as never;

    slice = createPriceSlice(set, get, {} as never);
  });

  describe("initial state", () => {
    it("expect currentBuyPrice to be initialized", () => {
      expect(slice.currentBuyPrice).toBe(1.27345);
    });

    it("expect currentSellPrice to be initialized", () => {
      expect(slice.currentSellPrice).toBe(1.27325);
    });

    it("expect autoGrabPrice to be false initially", () => {
      expect(slice.autoGrabPrice).toBe(false);
    });
  });

  describe("setCurrentPrices", () => {
    it("expect both buy and sell prices to be updated", () => {
      slice.setCurrentPrices(1.285, 1.2848);

      expect(mockState.currentBuyPrice).toBe(1.285);
      expect(mockState.currentSellPrice).toBe(1.2848);
    });

    it("expect set to be called when prices are updated", () => {
      slice.setCurrentPrices(1.3, 1.2998);

      expect(set).toHaveBeenCalledTimes(1);
    });

    it("expect prices to update atomically", () => {
      slice.setCurrentPrices(1.25, 1.2498);

      // Both should be updated in the same state mutation
      expect(mockState.currentBuyPrice).toBe(1.25);
      expect(mockState.currentSellPrice).toBe(1.2498);
    });

    it("expect buy price to be higher than sell price", () => {
      slice.setCurrentPrices(1.2735, 1.2732);

      expect(mockState.currentBuyPrice).toBeGreaterThan(mockState.currentSellPrice as number);
    });
  });

  describe("setAutoGrabPrice", () => {
    it("expect autoGrabPrice to be set to true", () => {
      slice.setAutoGrabPrice(true);

      expect(mockState.autoGrabPrice).toBe(true);
    });

    it("expect autoGrabPrice to be set to false", () => {
      mockState.autoGrabPrice = true;

      slice.setAutoGrabPrice(false);

      expect(mockState.autoGrabPrice).toBe(false);
    });

    it("expect set to be called when autoGrabPrice is toggled", () => {
      slice.setAutoGrabPrice(true);

      expect(set).toHaveBeenCalledTimes(1);
    });

    it("expect autoGrabPrice to toggle correctly", () => {
      // Start false
      expect(mockState.autoGrabPrice).toBe(false);

      // Toggle to true
      slice.setAutoGrabPrice(true);
      expect(mockState.autoGrabPrice).toBe(true);

      // Toggle back to false
      slice.setAutoGrabPrice(false);
      expect(mockState.autoGrabPrice).toBe(false);
    });
  });
});
