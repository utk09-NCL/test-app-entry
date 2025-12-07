import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderHook } from "@testing-library/react";

import { useFieldValue } from "./useFieldValue";

// Mock the store
vi.mock("../../store", () => ({
  useOrderEntryStore: vi.fn(),
}));

import { useOrderEntryStore } from "../../store";

describe("useFieldValue", () => {
  const mockSetFieldValue = vi.fn();
  const mockValidateRefData = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockStore = (fieldKey: string, value: string | number | undefined) => {
    return vi.mocked(useOrderEntryStore).mockImplementation((selector) => {
      const state = {
        getDerivedValues: () => ({ [fieldKey]: value }),
        setFieldValue: mockSetFieldValue,
        validateRefData: mockValidateRefData,
      };
      return selector(state as never);
    });
  };

  it("expect value to be returned from getDerivedValues when reading", () => {
    createMockStore("level", 1.2345);

    const { result } = renderHook(() => useFieldValue("level"));

    expect(result.current.value).toBe(1.2345);
  });

  it("expect string value to be returned correctly when reading", () => {
    createMockStore("currencyPair", "GBPUSD");

    const { result } = renderHook(() => useFieldValue("currencyPair"));

    expect(result.current.value).toBe("GBPUSD");
  });

  it("expect undefined value to be returned when field is not set", () => {
    createMockStore("level", undefined);

    const { result } = renderHook(() => useFieldValue("level"));

    expect(result.current.value).toBeUndefined();
  });

  it("expect setValue to call setFieldValue when updating", () => {
    createMockStore("level", 1.2345);

    const { result } = renderHook(() => useFieldValue("level"));
    result.current.setValue(1.5678);

    expect(mockSetFieldValue).toHaveBeenCalledWith("level", 1.5678);
  });

  it("expect setValue to call validateRefData after updating field", () => {
    createMockStore("account", "ACC001");

    const { result } = renderHook(() => useFieldValue("account"));
    result.current.setValue("ACC002");

    expect(mockValidateRefData).toHaveBeenCalled();
  });

  it("expect setValue to be called with correct field key when updating different fields", () => {
    createMockStore("level", 1.27345);

    const { result } = renderHook(() => useFieldValue("level"));
    result.current.setValue(1.28);

    expect(mockSetFieldValue).toHaveBeenCalledWith("level", 1.28);
  });

  it("expect setValue to allow setting undefined value when clearing field", () => {
    createMockStore("level", 1.27345);

    const { result } = renderHook(() => useFieldValue("level"));
    result.current.setValue(undefined);

    expect(mockSetFieldValue).toHaveBeenCalledWith("level", undefined);
  });

  it("expect setValue to be stable across renders when field key is same", () => {
    createMockStore("level", 1.2345);

    const { result, rerender } = renderHook(() => useFieldValue("level"));
    const firstSetValue = result.current.setValue;

    rerender();
    const secondSetValue = result.current.setValue;

    expect(firstSetValue).toBe(secondSetValue);
  });

  it("expect setFieldValue and validateRefData to be called in order when setting value", () => {
    const callOrder: string[] = [];
    mockSetFieldValue.mockImplementation(() => callOrder.push("setFieldValue"));
    mockValidateRefData.mockImplementation(() => callOrder.push("validateRefData"));

    createMockStore("currencyPair", "EURUSD");

    const { result } = renderHook(() => useFieldValue("currencyPair"));
    result.current.setValue("USDJPY");

    expect(callOrder).toEqual(["setFieldValue", "validateRefData"]);
  });
});
