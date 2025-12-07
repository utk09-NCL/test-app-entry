import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderHook } from "@testing-library/react";

import { OrderType } from "../../types/domain";

import { useFieldVisibility } from "./useFieldVisibility";

// Mock the store
vi.mock("../../store", () => ({
  useOrderEntryStore: vi.fn(),
}));

// Mock the visibility rules
vi.mock("../../config/visibilityRules", () => ({
  isFieldVisible: vi.fn(),
}));

import { isFieldVisible } from "../../config/visibilityRules";
import { useOrderEntryStore } from "../../store";

describe("useFieldVisibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("expect field to be visible when isFieldVisible returns true", () => {
    const mockDerivedValues = { orderType: OrderType.TAKE_PROFIT };
    vi.mocked(useOrderEntryStore).mockImplementation((selector) =>
      selector({ getDerivedValues: () => mockDerivedValues } as never)
    );
    vi.mocked(isFieldVisible).mockReturnValue(true);

    const { result } = renderHook(() => useFieldVisibility("level"));

    expect(result.current).toBe(true);
    expect(isFieldVisible).toHaveBeenCalledWith("level", mockDerivedValues);
  });

  it("expect field to be hidden when isFieldVisible returns false", () => {
    const mockDerivedValues = { orderType: OrderType.LIQUIDITY_SEEKER };
    vi.mocked(useOrderEntryStore).mockImplementation((selector) =>
      selector({ getDerivedValues: () => mockDerivedValues } as never)
    );
    vi.mocked(isFieldVisible).mockReturnValue(false);

    const { result } = renderHook(() => useFieldVisibility("level"));

    expect(result.current).toBe(false);
    expect(isFieldVisible).toHaveBeenCalledWith("level", mockDerivedValues);
  });

  it("expect level to be visible when orderType is STOP_LOSS", () => {
    const mockDerivedValues = { orderType: OrderType.STOP_LOSS };
    vi.mocked(useOrderEntryStore).mockImplementation((selector) =>
      selector({ getDerivedValues: () => mockDerivedValues } as never)
    );
    vi.mocked(isFieldVisible).mockReturnValue(true);

    const { result } = renderHook(() => useFieldVisibility("level"));

    expect(result.current).toBe(true);
    expect(isFieldVisible).toHaveBeenCalledWith("level", mockDerivedValues);
  });

  it("expect level to be hidden when orderType is LIQUIDITY_SEEKER", () => {
    const mockDerivedValues = { orderType: OrderType.LIQUIDITY_SEEKER };
    vi.mocked(useOrderEntryStore).mockImplementation((selector) =>
      selector({ getDerivedValues: () => mockDerivedValues } as never)
    );
    vi.mocked(isFieldVisible).mockReturnValue(false);

    const { result } = renderHook(() => useFieldVisibility("level"));

    expect(result.current).toBe(false);
  });

  it("expect isFieldVisible to be called with correct fieldKey when rendering", () => {
    const mockDerivedValues = { orderType: OrderType.FLOAT };
    vi.mocked(useOrderEntryStore).mockImplementation((selector) =>
      selector({ getDerivedValues: () => mockDerivedValues } as never)
    );
    vi.mocked(isFieldVisible).mockReturnValue(true);

    renderHook(() => useFieldVisibility("liquidityPool"));

    expect(isFieldVisible).toHaveBeenCalledWith("liquidityPool", mockDerivedValues);
  });

  it("expect hook to use getDerivedValues from store when determining visibility", () => {
    const mockGetDerivedValues = vi.fn().mockReturnValue({ orderType: OrderType.LIQUIDITY_SEEKER });
    vi.mocked(useOrderEntryStore).mockImplementation((selector) =>
      selector({ getDerivedValues: mockGetDerivedValues } as never)
    );
    vi.mocked(isFieldVisible).mockReturnValue(true);

    renderHook(() => useFieldVisibility("amount"));

    expect(mockGetDerivedValues).toHaveBeenCalled();
  });
});
