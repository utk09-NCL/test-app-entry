import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderHook } from "@testing-library/react";

import { useKeyboardHotkeys } from "./useKeyboardHotkeys";

// Mock the store
vi.mock("../store", () => ({
  useOrderEntryStore: vi.fn(),
}));

import { useOrderEntryStore } from "../store";

describe("useKeyboardHotkeys", () => {
  const mockSubmitOrder = vi.fn();
  const mockResetForm = vi.fn();
  const mockIsDirty = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockIsDirty.mockReturnValue(false);

    vi.mocked(useOrderEntryStore).mockImplementation((selector) => {
      const state = {
        submitOrder: mockSubmitOrder,
        resetFormInteractions: mockResetForm,
        isDirty: mockIsDirty,
      };
      return selector(state as never);
    });
  });

  afterEach(() => {
    // Clean up any event listeners
  });

  const dispatchKeyEvent = (key: string, modifiers: Partial<KeyboardEventInit> = {}) => {
    const event = new KeyboardEvent("keydown", {
      key,
      bubbles: true,
      cancelable: true,
      ...modifiers,
    });
    window.dispatchEvent(event);
    return event;
  };

  describe("Ctrl/Cmd + Enter shortcut", () => {
    it("expect submitOrder to be called when Ctrl+Enter is pressed", () => {
      renderHook(() => useKeyboardHotkeys());

      dispatchKeyEvent("Enter", { ctrlKey: true });

      expect(mockSubmitOrder).toHaveBeenCalledTimes(1);
    });

    it("expect submitOrder to be called when Cmd+Enter is pressed (Mac)", () => {
      renderHook(() => useKeyboardHotkeys());

      dispatchKeyEvent("Enter", { metaKey: true });

      expect(mockSubmitOrder).toHaveBeenCalledTimes(1);
    });

    it("expect submitOrder to not be called when Enter is pressed without modifier", () => {
      renderHook(() => useKeyboardHotkeys());

      dispatchKeyEvent("Enter");

      expect(mockSubmitOrder).not.toHaveBeenCalled();
    });
  });

  describe("Escape shortcut", () => {
    it("expect resetForm to be called when Escape is pressed and form is dirty", () => {
      mockIsDirty.mockReturnValue(true);
      renderHook(() => useKeyboardHotkeys());

      dispatchKeyEvent("Escape");

      expect(mockResetForm).toHaveBeenCalledTimes(1);
    });

    it("expect resetForm to not be called when Escape is pressed and form is clean", () => {
      mockIsDirty.mockReturnValue(false);
      renderHook(() => useKeyboardHotkeys());

      dispatchKeyEvent("Escape");

      expect(mockResetForm).not.toHaveBeenCalled();
    });
  });

  describe("Shift + F shortcut", () => {
    it("expect notional input to be focused when Shift+F is pressed", () => {
      // Create mock input element
      const mockInput = document.createElement("input");
      mockInput.setAttribute("name", "notional");
      mockInput.focus = vi.fn();
      mockInput.select = vi.fn();
      document.body.appendChild(mockInput);

      renderHook(() => useKeyboardHotkeys());

      dispatchKeyEvent("F", { shiftKey: true });

      expect(mockInput.focus).toHaveBeenCalled();
      expect(mockInput.select).toHaveBeenCalled();

      // Cleanup
      document.body.removeChild(mockInput);
    });

    it("expect no error when Shift+F is pressed and notional input does not exist", () => {
      renderHook(() => useKeyboardHotkeys());

      // Should not throw
      expect(() => dispatchKeyEvent("F", { shiftKey: true })).not.toThrow();
    });

    it("expect notional input to be focused when Shift+f (lowercase) is pressed", () => {
      const mockInput = document.createElement("input");
      mockInput.setAttribute("name", "notional");
      mockInput.focus = vi.fn();
      mockInput.select = vi.fn();
      document.body.appendChild(mockInput);

      renderHook(() => useKeyboardHotkeys());

      dispatchKeyEvent("f", { shiftKey: true });

      expect(mockInput.focus).toHaveBeenCalled();

      document.body.removeChild(mockInput);
    });
  });

  describe("event listener cleanup", () => {
    it("expect event listener to be removed on unmount", () => {
      const addEventListenerSpy = vi.spyOn(window, "addEventListener");
      const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

      const { unmount } = renderHook(() => useKeyboardHotkeys());

      expect(addEventListenerSpy).toHaveBeenCalledWith("keydown", expect.any(Function));

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith("keydown", expect.any(Function));

      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });
  });

  describe("unrelated keys", () => {
    it("expect no action when unrelated key is pressed", () => {
      renderHook(() => useKeyboardHotkeys());

      dispatchKeyEvent("a");
      dispatchKeyEvent("Tab");
      dispatchKeyEvent("Space");

      expect(mockSubmitOrder).not.toHaveBeenCalled();
      expect(mockResetForm).not.toHaveBeenCalled();
    });
  });
});
