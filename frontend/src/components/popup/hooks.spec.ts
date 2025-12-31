/**
 * Unit tests for popup hooks
 */

import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { act, renderHook } from "@testing-library/react";

import { DEFAULT_POPUP_SYSTEM_CONFIG } from "./constants";
import { PopupConfigContext, PopupContext, PopupContextValueWithConfig } from "./context";
import { usePopupConfig, usePopupContext, usePopupEnvironment, usePopupTheme } from "./hooks";

// Mock MutationObserver
const mockObserve = vi.fn();
const mockDisconnect = vi.fn();

class MockMutationObserver {
  callback: MutationCallback;

  constructor(callback: MutationCallback) {
    this.callback = callback;
  }

  observe = mockObserve;
  disconnect = mockDisconnect;
  takeRecords = vi.fn(() => []);
}

vi.stubGlobal("MutationObserver", MockMutationObserver);

describe("popup/hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("usePopupContext", () => {
    it("expect to throw error when used outside PopupProvider", () => {
      // Suppress expected error output
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      expect(() => {
        renderHook(() => usePopupContext());
      }).toThrow("usePopupContext must be used within a PopupProvider");

      errorSpy.mockRestore();
    });

    it("expect to return context value when within PopupProvider", () => {
      const mockContextValue: PopupContextValueWithConfig = {
        environment: "web",
        config: DEFAULT_POPUP_SYSTEM_CONFIG,
        open: vi.fn() as PopupContextValueWithConfig["open"],
        close: vi.fn(),
        closeAll: vi.fn(),
        getTheme: vi.fn(() => "dark" as const),
        getOpenPopups: vi.fn(() => new Map()),
      };

      const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) =>
        React.createElement(PopupContext.Provider, { value: mockContextValue }, children);

      const { result } = renderHook(() => usePopupContext(), { wrapper });

      expect(result.current).toBe(mockContextValue);
      expect(result.current.environment).toBe("web");
    });
  });

  describe("usePopupEnvironment", () => {
    it("expect to return environment from context", () => {
      const mockContextValue: PopupContextValueWithConfig = {
        environment: "openfin",
        config: DEFAULT_POPUP_SYSTEM_CONFIG,
        open: vi.fn(),
        close: vi.fn(),
        closeAll: vi.fn(),
        getTheme: vi.fn(() => "dark" as const),
        getOpenPopups: vi.fn(() => new Map()),
      };

      const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) =>
        React.createElement(PopupContext.Provider, { value: mockContextValue }, children);

      const { result } = renderHook(() => usePopupEnvironment(), { wrapper });

      expect(result.current).toBe("openfin");
    });

    it("expect to return web environment", () => {
      const mockContextValue: PopupContextValueWithConfig = {
        environment: "web",
        config: DEFAULT_POPUP_SYSTEM_CONFIG,
        open: vi.fn(),
        close: vi.fn(),
        closeAll: vi.fn(),
        getTheme: vi.fn(() => "light" as const),
        getOpenPopups: vi.fn(() => new Map()),
      };

      const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) =>
        React.createElement(PopupContext.Provider, { value: mockContextValue }, children);

      const { result } = renderHook(() => usePopupEnvironment(), { wrapper });

      expect(result.current).toBe("web");
    });
  });

  describe("usePopupTheme", () => {
    it("expect to return current theme from context", () => {
      const mockContextValue: PopupContextValueWithConfig = {
        environment: "web",
        config: DEFAULT_POPUP_SYSTEM_CONFIG,
        open: vi.fn(),
        close: vi.fn(),
        closeAll: vi.fn(),
        getTheme: vi.fn(() => "dark" as const),
        getOpenPopups: vi.fn(() => new Map()),
      };

      const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) =>
        React.createElement(PopupContext.Provider, { value: mockContextValue }, children);

      const { result } = renderHook(() => usePopupTheme(), { wrapper });

      expect(result.current).toBe("dark");
    });

    it("expect to return light theme", () => {
      const mockContextValue: PopupContextValueWithConfig = {
        environment: "web",
        config: DEFAULT_POPUP_SYSTEM_CONFIG,
        open: vi.fn(),
        close: vi.fn(),
        closeAll: vi.fn(),
        getTheme: vi.fn(() => "light" as const),
        getOpenPopups: vi.fn(() => new Map()),
      };

      const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) =>
        React.createElement(PopupContext.Provider, { value: mockContextValue }, children);

      const { result } = renderHook(() => usePopupTheme(), { wrapper });

      expect(result.current).toBe("light");
    });

    it("expect to setup mutation observer for theme changes", () => {
      // Create a mock HTML element
      const mockHtmlElement = document.createElement("html");
      vi.spyOn(document, "querySelector").mockReturnValue(mockHtmlElement);

      const mockContextValue: PopupContextValueWithConfig = {
        environment: "web",
        config: DEFAULT_POPUP_SYSTEM_CONFIG,
        open: vi.fn(),
        close: vi.fn(),
        closeAll: vi.fn(),
        getTheme: vi.fn(() => "dark" as const),
        getOpenPopups: vi.fn(() => new Map()),
      };

      const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) =>
        React.createElement(PopupContext.Provider, { value: mockContextValue }, children);

      renderHook(() => usePopupTheme(), { wrapper });

      expect(mockObserve).toHaveBeenCalledWith(mockHtmlElement, {
        attributes: true,
        attributeFilter: ["data-theme"],
      });
    });

    it("expect to disconnect observer on unmount", () => {
      const mockHtmlElement = document.createElement("html");
      vi.spyOn(document, "querySelector").mockReturnValue(mockHtmlElement);

      const mockContextValue: PopupContextValueWithConfig = {
        environment: "web",
        config: DEFAULT_POPUP_SYSTEM_CONFIG,
        open: vi.fn() as PopupContextValueWithConfig["open"],
        close: vi.fn(),
        closeAll: vi.fn(),
        getTheme: vi.fn(() => "dark" as const),
        getOpenPopups: vi.fn(() => new Map()),
      };

      const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) =>
        React.createElement(PopupContext.Provider, { value: mockContextValue }, children);

      const { unmount } = renderHook(() => usePopupTheme(), { wrapper });
      unmount();

      expect(mockDisconnect).toHaveBeenCalled();
    });

    it("expect to update theme when MutationObserver callback fires", () => {
      let capturedCallback: MutationCallback | null = null;
      const mockHtmlElement = document.createElement("html");

      // Custom mock to capture the callback
      class CapturingMutationObserver {
        constructor(callback: MutationCallback) {
          capturedCallback = callback;
        }
        observe = mockObserve;
        disconnect = mockDisconnect;
        takeRecords = vi.fn(() => []);
      }

      vi.stubGlobal("MutationObserver", CapturingMutationObserver);
      vi.spyOn(document, "querySelector").mockReturnValue(mockHtmlElement);

      let currentTheme: "dark" | "light" = "dark";
      const mockContextValue: PopupContextValueWithConfig = {
        environment: "web",
        config: DEFAULT_POPUP_SYSTEM_CONFIG,
        open: vi.fn() as PopupContextValueWithConfig["open"],
        close: vi.fn(),
        closeAll: vi.fn(),
        getTheme: vi.fn(() => currentTheme),
        getOpenPopups: vi.fn(() => new Map()),
      };

      const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) =>
        React.createElement(PopupContext.Provider, { value: mockContextValue }, children);

      const { result } = renderHook(() => usePopupTheme(), { wrapper });

      // Initial theme
      expect(result.current).toBe("dark");

      // Change theme and trigger callback inside act()
      currentTheme = "light";
      act(() => {
        if (capturedCallback) {
          capturedCallback([], {} as MutationObserver);
        }
      });

      // Theme should have been updated
      expect(result.current).toBe("light");
    });
  });

  describe("usePopupConfig", () => {
    it("expect to return default config when used outside provider", () => {
      const { result } = renderHook(() => usePopupConfig());

      expect(result.current).toEqual(DEFAULT_POPUP_SYSTEM_CONFIG);
    });

    it("expect to return custom config when provided via context", () => {
      const customConfig = {
        ...DEFAULT_POPUP_SYSTEM_CONFIG,
        dimensions: {
          ...DEFAULT_POPUP_SYSTEM_CONFIG.dimensions,
          width: 500,
        },
      };

      const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) =>
        React.createElement(PopupConfigContext.Provider, { value: customConfig }, children);

      const { result } = renderHook(() => usePopupConfig(), { wrapper });

      expect(result.current.dimensions.width).toBe(500);
    });
  });
});
