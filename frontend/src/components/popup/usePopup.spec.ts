/**
 * Unit tests for usePopup hook
 */

import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { act, renderHook } from "@testing-library/react";

import { DEFAULT_POPUP_SYSTEM_CONFIG } from "./constants";
import { PopupContext, PopupContextValueWithConfig } from "./context";
import type { PopupHandle, PopupOptions, PopupResult } from "./types";
import { useDialog, useDropdown, usePopup, useTooltip } from "./usePopup";

// Helper to create mock popup handle
const createMockHandle = <T = unknown>(overrides?: Partial<PopupHandle<T>>): PopupHandle<T> => ({
  id: "popup-123",
  isOpen: true,
  close: vi.fn(),
  send: vi.fn(),
  updatePosition: vi.fn(),
  result: Promise.resolve({ confirmed: false, closeReason: "programmatic" }),
  ...overrides,
});

// Helper to create mock context
const createMockContext = (openReturnValue?: PopupHandle): PopupContextValueWithConfig => ({
  environment: "web",
  config: DEFAULT_POPUP_SYSTEM_CONFIG,
  open: vi.fn(() => openReturnValue ?? createMockHandle()) as PopupContextValueWithConfig["open"],
  close: vi.fn(),
  closeAll: vi.fn(),
  getTheme: vi.fn(() => "dark" as const),
  getOpenPopups: vi.fn(() => new Map()),
});

// Wrapper component for providing context
const createWrapper = (contextValue: PopupContextValueWithConfig) => {
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) =>
    React.createElement(PopupContext.Provider, { value: contextValue }, children);
  return Wrapper;
};

describe("popup/usePopup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("usePopup", () => {
    it("expect to throw when used outside PopupProvider", () => {
      expect(() => {
        renderHook(() => usePopup());
      }).toThrow("usePopupContext must be used within a PopupProvider");
    });

    it("expect to return initial state with isOpen false", () => {
      const mockContext = createMockContext();
      const wrapper = createWrapper(mockContext);

      const { result } = renderHook(() => usePopup(), { wrapper });

      expect(result.current.isOpen).toBe(false);
      expect(result.current.handle).toBeNull();
    });

    it("expect to return trigger ref and props", () => {
      const mockContext = createMockContext();
      const wrapper = createWrapper(mockContext);

      const { result } = renderHook(() => usePopup(), { wrapper });

      expect(result.current.triggerRef).toBeDefined();
      expect(result.current.triggerProps).toBeDefined();
      expect(result.current.triggerProps["aria-haspopup"]).toBe(true);
      expect(result.current.triggerProps["aria-expanded"]).toBe(false);
    });

    it("expect open to call context.open with merged options", () => {
      const mockHandle = createMockHandle();
      const mockContext = createMockContext(mockHandle);
      const wrapper = createWrapper(mockContext);

      const { result } = renderHook(
        () =>
          usePopup({
            content: { type: "html", html: "<p>Test</p>" },
            position: { placement: "bottom" },
          }),
        { wrapper }
      );

      act(() => {
        result.current.open();
      });

      expect(mockContext.open).toHaveBeenCalled();
      const callArgs = vi.mocked(mockContext.open).mock.calls[0][0] as PopupOptions;
      expect(callArgs.content).toEqual({ type: "html", html: "<p>Test</p>" });
    });

    it("expect open to update isOpen state", () => {
      const mockHandle = createMockHandle();
      const mockContext = createMockContext(mockHandle);
      const wrapper = createWrapper(mockContext);

      const { result } = renderHook(
        () =>
          usePopup({
            content: { type: "html", html: "<p>Test</p>" },
          }),
        { wrapper }
      );

      act(() => {
        result.current.open();
        // Manually trigger onOpen callback
        const callArgs = vi.mocked(mockContext.open).mock.calls[0][0] as PopupOptions;
        callArgs.onOpen?.();
      });

      expect(result.current.isOpen).toBe(true);
    });

    it("expect open to return popup handle", () => {
      const mockHandle = createMockHandle();
      const mockContext = createMockContext(mockHandle);
      const wrapper = createWrapper(mockContext);

      const { result } = renderHook(
        () =>
          usePopup({
            content: { type: "html", html: "<p>Test</p>" },
          }),
        { wrapper }
      );

      let returnedHandle: PopupHandle | undefined;
      act(() => {
        returnedHandle = result.current.open();
      });

      expect(returnedHandle).toBe(mockHandle);
    });

    it("expect open with override options to merge correctly", () => {
      const mockHandle = createMockHandle();
      const mockContext = createMockContext(mockHandle);
      const wrapper = createWrapper(mockContext);

      const { result } = renderHook(
        () =>
          usePopup({
            content: { type: "html", html: "<p>Default</p>" },
            position: { placement: "bottom" },
          }),
        { wrapper }
      );

      act(() => {
        result.current.open({
          content: { type: "html", html: "<p>Override</p>" },
          position: { offset: 10 },
        });
      });

      const callArgs = vi.mocked(mockContext.open).mock.calls[0][0] as PopupOptions;
      expect(callArgs.content).toEqual({ type: "html", html: "<p>Override</p>" });
      expect(callArgs.position?.offset).toBe(10);
    });

    it("expect open to throw when content is not provided", () => {
      const mockContext = createMockContext();
      const wrapper = createWrapper(mockContext);

      const { result } = renderHook(() => usePopup(), { wrapper });

      expect(() => {
        result.current.open();
      }).toThrow("Popup content is required");
    });

    it("expect close to call handle.close", () => {
      const mockClose = vi.fn();
      const mockHandle = createMockHandle({ close: mockClose, isOpen: true });
      const mockContext = createMockContext(mockHandle);
      const wrapper = createWrapper(mockContext);

      const { result } = renderHook(
        () =>
          usePopup({
            content: { type: "html", html: "<p>Test</p>" },
          }),
        { wrapper }
      );

      act(() => {
        result.current.open();
      });

      act(() => {
        result.current.close();
      });

      expect(mockClose).toHaveBeenCalled();
    });

    it("expect close with result to pass result to handle", () => {
      const mockClose = vi.fn();
      const mockHandle = createMockHandle({ close: mockClose, isOpen: true });
      const mockContext = createMockContext(mockHandle);
      const wrapper = createWrapper(mockContext);

      const { result } = renderHook(
        () =>
          usePopup({
            content: { type: "html", html: "<p>Test</p>" },
          }),
        { wrapper }
      );

      act(() => {
        result.current.open();
      });

      const customResult: Partial<PopupResult<string>> = {
        confirmed: true,
        data: "test-data",
      };

      act(() => {
        result.current.close(customResult);
      });

      expect(mockClose).toHaveBeenCalledWith(customResult);
    });

    it("expect toggle to open when closed", () => {
      const mockHandle = createMockHandle();
      const mockContext = createMockContext(mockHandle);
      const wrapper = createWrapper(mockContext);

      const { result } = renderHook(
        () =>
          usePopup({
            content: { type: "html", html: "<p>Test</p>" },
          }),
        { wrapper }
      );

      act(() => {
        result.current.toggle();
      });

      expect(mockContext.open).toHaveBeenCalled();
    });

    it("expect toggle to close when open", () => {
      const mockClose = vi.fn();
      const mockHandle = createMockHandle({ close: mockClose, isOpen: true });
      const mockContext = createMockContext(mockHandle);
      const wrapper = createWrapper(mockContext);

      const { result } = renderHook(
        () =>
          usePopup({
            content: { type: "html", html: "<p>Test</p>" },
          }),
        { wrapper }
      );

      // Open first
      act(() => {
        result.current.open();
        const callArgs = vi.mocked(mockContext.open).mock.calls[0][0] as PopupOptions;
        callArgs.onOpen?.();
      });

      // Then toggle (should close)
      act(() => {
        result.current.toggle();
      });

      expect(mockClose).toHaveBeenCalled();
    });

    it("expect triggerProps onClick to toggle popup", () => {
      const mockHandle = createMockHandle();
      const mockContext = createMockContext(mockHandle);
      const wrapper = createWrapper(mockContext);

      const { result } = renderHook(
        () =>
          usePopup({
            content: { type: "html", html: "<p>Test</p>" },
          }),
        { wrapper }
      );

      act(() => {
        result.current.triggerProps.onClick();
      });

      expect(mockContext.open).toHaveBeenCalled();
    });

    it("expect aria-expanded to update when isOpen changes", () => {
      const mockHandle = createMockHandle();
      const mockContext = createMockContext(mockHandle);
      const wrapper = createWrapper(mockContext);

      const { result } = renderHook(
        () =>
          usePopup({
            content: { type: "html", html: "<p>Test</p>" },
          }),
        { wrapper }
      );

      expect(result.current.triggerProps["aria-expanded"]).toBe(false);

      act(() => {
        result.current.open();
        const callArgs = vi.mocked(mockContext.open).mock.calls[0][0] as PopupOptions;
        callArgs.onOpen?.();
      });

      expect(result.current.triggerProps["aria-expanded"]).toBe(true);
    });

    it("expect onClose callback to reset state", () => {
      const mockHandle = createMockHandle();
      const mockContext = createMockContext(mockHandle);
      const wrapper = createWrapper(mockContext);

      const { result } = renderHook(
        () =>
          usePopup({
            content: { type: "html", html: "<p>Test</p>" },
          }),
        { wrapper }
      );

      act(() => {
        result.current.open();
        const callArgs = vi.mocked(mockContext.open).mock.calls[0][0] as PopupOptions;
        callArgs.onOpen?.();
      });

      expect(result.current.isOpen).toBe(true);

      act(() => {
        const callArgs = vi.mocked(mockContext.open).mock.calls[0][0] as PopupOptions;
        callArgs.onClose?.({ confirmed: false, closeReason: "escape" });
      });

      expect(result.current.isOpen).toBe(false);
      expect(result.current.handle).toBeNull();
    });

    it("expect to close existing popup before opening new one", () => {
      const mockClose = vi.fn();
      const mockHandle = createMockHandle({ close: mockClose, isOpen: true });
      const mockContext = createMockContext(mockHandle);
      const wrapper = createWrapper(mockContext);

      const { result } = renderHook(
        () =>
          usePopup({
            content: { type: "html", html: "<p>Test</p>" },
          }),
        { wrapper }
      );

      // Open first popup
      act(() => {
        result.current.open();
      });

      // Open second popup (should close first)
      act(() => {
        result.current.open();
      });

      expect(mockClose).toHaveBeenCalledWith({ closeReason: "programmatic" });
    });

    it("expect user callbacks to be invoked", () => {
      const onOpen = vi.fn();
      const onClose = vi.fn();
      const mockHandle = createMockHandle();
      const mockContext = createMockContext(mockHandle);
      const wrapper = createWrapper(mockContext);

      const { result } = renderHook(
        () =>
          usePopup({
            content: { type: "html", html: "<p>Test</p>" },
            onOpen,
            onClose,
          }),
        { wrapper }
      );

      act(() => {
        result.current.open();
        const callArgs = vi.mocked(mockContext.open).mock.calls[0][0] as PopupOptions;
        callArgs.onOpen?.();
      });

      expect(onOpen).toHaveBeenCalled();

      act(() => {
        const callArgs = vi.mocked(mockContext.open).mock.calls[0][0] as PopupOptions;
        callArgs.onClose?.({ confirmed: true, closeReason: "submit" });
      });

      expect(onClose).toHaveBeenCalledWith({ confirmed: true, closeReason: "submit" });
    });
  });

  describe("useDropdown", () => {
    it("expect to return usePopup result with dropdown defaults", () => {
      const mockContext = createMockContext();
      const wrapper = createWrapper(mockContext);

      const { result } = renderHook(() => useDropdown(), { wrapper });

      expect(result.current.isOpen).toBe(false);
      expect(result.current.triggerProps).toBeDefined();
    });

    it("expect to configure dropdown behavior", () => {
      const mockHandle = createMockHandle();
      const mockContext = createMockContext(mockHandle);
      const wrapper = createWrapper(mockContext);

      const { result } = renderHook(
        () =>
          useDropdown({
            content: { type: "html", html: "<p>Menu</p>" },
          }),
        { wrapper }
      );

      act(() => {
        result.current.open();
      });

      const callArgs = vi.mocked(mockContext.open).mock.calls[0][0] as PopupOptions;
      expect(callArgs.blurBehavior).toBe("close");
      expect(callArgs.closeOnEscape).toBe(true);
      expect(callArgs.showBackdrop).toBe(false);
      expect(callArgs.modal).toBe(false);
      expect(callArgs.position?.placement).toBe("bottom-start");
    });
  });

  describe("useDialog", () => {
    it("expect to return usePopup result with dialog defaults", () => {
      const mockContext = createMockContext();
      const wrapper = createWrapper(mockContext);

      const { result } = renderHook(() => useDialog(), { wrapper });

      expect(result.current.isOpen).toBe(false);
    });

    it("expect to configure modal behavior", () => {
      const mockHandle = createMockHandle();
      const mockContext = createMockContext(mockHandle);
      const wrapper = createWrapper(mockContext);

      const { result } = renderHook(
        () =>
          useDialog({
            content: { type: "html", html: "<p>Dialog</p>" },
          }),
        { wrapper }
      );

      act(() => {
        result.current.open();
      });

      const callArgs = vi.mocked(mockContext.open).mock.calls[0][0] as PopupOptions;
      expect(callArgs.blurBehavior).toBe("none");
      expect(callArgs.closeOnEscape).toBe(true);
      expect(callArgs.showBackdrop).toBe(true);
      expect(callArgs.modal).toBe(true);
      expect(callArgs.autoFocus).toBe(true);
      expect(callArgs.restoreFocus).toBe(true);
    });
  });

  describe("useTooltip", () => {
    it("expect to return usePopup result with tooltip defaults", () => {
      const mockContext = createMockContext();
      const wrapper = createWrapper(mockContext);

      const { result } = renderHook(() => useTooltip(), { wrapper });

      expect(result.current.isOpen).toBe(false);
    });

    it("expect to configure tooltip behavior", () => {
      const mockHandle = createMockHandle();
      const mockContext = createMockContext(mockHandle);
      const wrapper = createWrapper(mockContext);

      const { result } = renderHook(
        () =>
          useTooltip({
            content: { type: "html", html: "<p>Tooltip</p>" },
          }),
        { wrapper }
      );

      act(() => {
        result.current.open();
      });

      const callArgs = vi.mocked(mockContext.open).mock.calls[0][0] as PopupOptions;
      expect(callArgs.blurBehavior).toBe("none");
      expect(callArgs.closeOnEscape).toBe(false);
      expect(callArgs.showBackdrop).toBe(false);
      expect(callArgs.modal).toBe(false);
      expect(callArgs.autoFocus).toBe(false);
      expect(callArgs.position?.placement).toBe("top");
      expect(callArgs.position?.offset).toBe(8);
    });
  });
});
