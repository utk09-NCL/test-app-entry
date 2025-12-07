import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { act, renderHook } from "@testing-library/react";

import { useFieldState } from "./useFieldState";

// Mock the store
vi.mock("../../store", () => ({
  useOrderEntryStore: vi.fn(),
}));

// Mock useDebounce to return value immediately for simpler tests
vi.mock("../useDebounce", () => ({
  useDebounce: vi.fn((value) => value),
}));

import { useOrderEntryStore } from "../../store";

describe("useFieldState", () => {
  const mockValidateField = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const createMockStore = (
    overrides: {
      error?: string;
      serverError?: string;
      refDataError?: string;
      warning?: string;
      isValidating?: boolean;
      value?: unknown;
    } = {}
  ) => {
    return vi.mocked(useOrderEntryStore).mockImplementation((selector) => {
      const state = {
        errors: overrides.error ? { level: overrides.error } : {},
        serverErrors: overrides.serverError ? { level: overrides.serverError } : {},
        refDataErrors: overrides.refDataError ? { level: overrides.refDataError } : {},
        warnings: overrides.warning ? { level: overrides.warning } : {},
        isValidating: overrides.isValidating ? { level: true } : {},
        getDerivedValues: () => ({ level: overrides.value ?? 1.2345 }),
        validateField: mockValidateField,
      };
      return selector(state as never);
    });
  };

  describe("error state", () => {
    it("expect error to be returned when client-side validation fails", () => {
      createMockStore({ error: "Level is required" });

      const { result } = renderHook(() => useFieldState("level"));

      expect(result.current.error).toBe("Level is required");
    });

    it("expect error to be undefined when no client-side error exists", () => {
      createMockStore({});

      const { result } = renderHook(() => useFieldState("level"));

      expect(result.current.error).toBeUndefined();
    });
  });

  describe("serverError state", () => {
    it("expect serverError to be returned when server validation fails", () => {
      createMockStore({ serverError: "Exceeds firm limit" });

      const { result } = renderHook(() => useFieldState("level"));

      expect(result.current.serverError).toBe("Exceeds firm limit");
    });

    it("expect serverError to be undefined when no server error exists", () => {
      createMockStore({});

      const { result } = renderHook(() => useFieldState("level"));

      expect(result.current.serverError).toBeUndefined();
    });
  });

  describe("refDataError state", () => {
    it("expect refDataError to be returned when ref data is unavailable", () => {
      createMockStore({ refDataError: "Account not available" });

      const { result } = renderHook(() => useFieldState("level"));

      expect(result.current.refDataError).toBe("Account not available");
    });
  });

  describe("warning state", () => {
    it("expect warning to be returned when advisory warning exists", () => {
      createMockStore({ warning: "Large trade - additional approval may be needed" });

      const { result } = renderHook(() => useFieldState("level"));

      expect(result.current.warning).toBe("Large trade - additional approval may be needed");
    });
  });

  describe("isValidating state", () => {
    it("expect isValidating to be true when async validation is running", () => {
      createMockStore({ isValidating: true });

      const { result } = renderHook(() => useFieldState("level"));

      expect(result.current.isValidating).toBe(true);
    });

    it("expect isValidating to be false when no validation is running", () => {
      createMockStore({ isValidating: false });

      const { result } = renderHook(() => useFieldState("level"));

      expect(result.current.isValidating).toBe(false);
    });
  });

  describe("hasError computed", () => {
    it("expect hasError to be true when client error exists", () => {
      createMockStore({ error: "Invalid" });

      const { result } = renderHook(() => useFieldState("level"));

      expect(result.current.hasError).toBe(true);
    });

    it("expect hasError to be true when server error exists", () => {
      createMockStore({ serverError: "Invalid" });

      const { result } = renderHook(() => useFieldState("level"));

      expect(result.current.hasError).toBe(true);
    });

    it("expect hasError to be true when ref data error exists", () => {
      createMockStore({ refDataError: "Unavailable" });

      const { result } = renderHook(() => useFieldState("level"));

      expect(result.current.hasError).toBe(true);
    });

    it("expect hasError to be false when no errors exist", () => {
      createMockStore({});

      const { result } = renderHook(() => useFieldState("level"));

      expect(result.current.hasError).toBe(false);
    });
  });

  describe("combinedError computed", () => {
    it("expect combinedError to prefer serverError over client error", () => {
      createMockStore({ error: "Client error", serverError: "Server error" });

      const { result } = renderHook(() => useFieldState("level"));

      expect(result.current.combinedError).toBe("Server error");
    });

    it("expect combinedError to use client error when no server error", () => {
      createMockStore({ error: "Client error" });

      const { result } = renderHook(() => useFieldState("level"));

      expect(result.current.combinedError).toBe("Client error");
    });

    it("expect combinedError to use refDataError as last resort", () => {
      createMockStore({ refDataError: "Ref data error" });

      const { result } = renderHook(() => useFieldState("level"));

      expect(result.current.combinedError).toBe("Ref data error");
    });

    it("expect combinedError to be undefined when no errors exist", () => {
      createMockStore({});

      const { result } = renderHook(() => useFieldState("level"));

      expect(result.current.combinedError).toBeUndefined();
    });
  });

  describe("validation triggering", () => {
    it("expect validateField to be called on mount", () => {
      createMockStore({ value: 1.2345 });

      renderHook(() => useFieldState("level"));

      // Allow useEffect to run
      act(() => {
        vi.runAllTimers();
      });

      expect(mockValidateField).toHaveBeenCalledWith("level", 1.2345);
    });

    it("expect validateField to be called with field value when field has value", () => {
      createMockStore({ value: 1.5678 });

      renderHook(() => useFieldState("level"));

      act(() => {
        vi.runAllTimers();
      });

      expect(mockValidateField).toHaveBeenCalledWith("level", 1.5678);
    });
  });
});
