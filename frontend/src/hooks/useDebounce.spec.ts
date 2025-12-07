/**
 * Unit Tests for useDebounce Hook
 *
 * Tests the debouncing hook that delays value updates.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { act, renderHook } from "@testing-library/react";

import { useDebounce } from "./useDebounce";

describe("useDebounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return initial value immediately", () => {
    const { result } = renderHook(() => useDebounce("initial", 500));
    expect(result.current).toBe("initial");
  });

  it("should debounce value changes", () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: "initial", delay: 500 },
    });

    expect(result.current).toBe("initial");

    // Update value
    rerender({ value: "updated", delay: 500 });

    // Value should not change immediately
    expect(result.current).toBe("initial");

    // Fast-forward time by 500ms
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Now value should be updated
    expect(result.current).toBe("updated");
  });

  it("should reset timer on rapid value changes", () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: "initial", delay: 500 },
    });

    // Update value multiple times rapidly
    rerender({ value: "change1", delay: 500 });
    act(() => {
      vi.advanceTimersByTime(200);
    });

    rerender({ value: "change2", delay: 500 });
    act(() => {
      vi.advanceTimersByTime(200);
    });

    rerender({ value: "change3", delay: 500 });

    // Value should still be initial (timer keeps resetting)
    expect(result.current).toBe("initial");

    // Fast-forward past the debounce delay
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Should now have the last value
    expect(result.current).toBe("change3");
  });

  it("should handle different delay values", () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: "initial", delay: 100 },
    });

    rerender({ value: "updated", delay: 100 });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current).toBe("updated");
  });

  it("should cleanup timer on unmount", () => {
    const { unmount } = renderHook(() => useDebounce("test", 500));

    // Should not throw error on unmount
    expect(() => unmount()).not.toThrow();
  });

  it("should handle undefined values", () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: undefined as string | undefined, delay: 300 },
    });

    expect(result.current).toBeUndefined();

    rerender({ value: "defined", delay: 300 });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current).toBe("defined");
  });

  it("should handle numeric values", () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 0, delay: 200 },
    });

    expect(result.current).toBe(0);

    rerender({ value: 42, delay: 200 });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current).toBe(42);
  });
});
