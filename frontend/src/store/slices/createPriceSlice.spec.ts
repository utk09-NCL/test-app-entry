import { beforeEach, describe, expect, it, vi } from "vitest";

import { OrderSide } from "../../types/domain";
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
      currentBuyPrice: 0,
      currentSellPrice: 0,
      lastGrabbedSide: null,
    };

    set = vi.fn((fn: (state: Partial<BoundState>) => void) => {
      fn(mockState);
    }) as never;

    get = vi.fn(() => mockState) as never;

    slice = createPriceSlice(set, get, {} as never);
  });

  describe("initial state", () => {
    it("expect currentBuyPrice to be 0 initially", () => {
      expect(slice.currentBuyPrice).toBe(0);
    });

    it("expect currentSellPrice to be 0 initially", () => {
      expect(slice.currentSellPrice).toBe(0);
    });

    it("expect lastGrabbedSide to be null initially", () => {
      expect(slice.lastGrabbedSide).toBeNull();
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

  describe("setLastGrabbedSide", () => {
    it("expect lastGrabbedSide to be set to BUY", () => {
      slice.setLastGrabbedSide(OrderSide.BUY);

      expect(mockState.lastGrabbedSide).toBe(OrderSide.BUY);
    });

    it("expect lastGrabbedSide to be set to SELL", () => {
      slice.setLastGrabbedSide(OrderSide.SELL);

      expect(mockState.lastGrabbedSide).toBe(OrderSide.SELL);
    });

    it("expect lastGrabbedSide to be set to null", () => {
      mockState.lastGrabbedSide = OrderSide.BUY;

      slice.setLastGrabbedSide(null);

      expect(mockState.lastGrabbedSide).toBeNull();
    });

    it("expect set to be called when lastGrabbedSide is changed", () => {
      slice.setLastGrabbedSide(OrderSide.BUY);

      expect(set).toHaveBeenCalledTimes(1);
    });

    it("expect lastGrabbedSide to toggle correctly between BUY and SELL", () => {
      // Start null
      expect(mockState.lastGrabbedSide).toBeNull();

      // Set to BUY
      slice.setLastGrabbedSide(OrderSide.BUY);
      expect(mockState.lastGrabbedSide).toBe(OrderSide.BUY);

      // Change to SELL
      slice.setLastGrabbedSide(OrderSide.SELL);
      expect(mockState.lastGrabbedSide).toBe(OrderSide.SELL);

      // Reset to null
      slice.setLastGrabbedSide(null);
      expect(mockState.lastGrabbedSide).toBeNull();
    });
  });
});
