/**
 * Unit tests for PopupProvider component
 */

import React, { useContext } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { act, render, screen } from "@testing-library/react";

import { DEFAULT_POPUP_SYSTEM_CONFIG } from "./constants";
import { PopupConfigContext, PopupContext, PopupContextValueWithConfig } from "./context";
import { PopupProvider } from "./PopupProvider";
import type { PopupHandle, PopupOptions, PopupResult, PopupSystemConfig } from "./types";

// Mock communication utilities
vi.mock("./utils/communication", () => ({
  getCurrentTheme: vi.fn(() => "dark"),
}));

// Mock OpenFin adapter
const mockOpenFinOpen = vi.fn();
const mockOpenFinDestroy = vi.fn();
vi.mock("./utils/openfinAdapter", () => ({
  isOpenFinAvailable: vi.fn(() => false),
  createOpenFinAdapter: vi.fn(() => ({
    environment: "openfin",
    isAvailable: () => true,
    open: mockOpenFinOpen,
    close: vi.fn(),
    updatePosition: vi.fn(),
    destroy: mockOpenFinDestroy,
  })),
}));

// Mock web adapter
const mockWebOpen = vi.fn();
const mockWebDestroy = vi.fn();
vi.mock("./utils/webAdapter", () => ({
  createWebAdapter: vi.fn(() => ({
    environment: "web",
    isAvailable: () => true,
    open: mockWebOpen,
    close: vi.fn(),
    updatePosition: vi.fn(),
    destroy: mockWebDestroy,
  })),
}));

// Helper to create mock popup handle
const createMockHandle = <T = unknown,>(overrides?: Partial<PopupHandle<T>>): PopupHandle<T> => {
  const resolvers: { resolve?: (result: PopupResult<T>) => void } = {};
  const resultPromise = new Promise<PopupResult<T>>((resolve) => {
    resolvers.resolve = resolve;
  });

  return {
    id: "popup-123",
    isOpen: true,
    close: vi.fn((result?: Partial<PopupResult<T>>) => {
      const popupResult: PopupResult<T> = {
        confirmed: result?.confirmed ?? false,
        closeReason: result?.closeReason ?? "programmatic",
      };
      if (result?.data !== undefined) {
        popupResult.data = result.data;
      }
      resolvers.resolve?.(popupResult);
    }),
    send: vi.fn(),
    updatePosition: vi.fn(),
    result: resultPromise,
    ...overrides,
  };
};

// Test component that uses context
const ContextConsumer: React.FC<{
  onContext: (context: PopupContextValueWithConfig | null) => void;
}> = ({ onContext }) => {
  const context = useContext(PopupContext);
  React.useEffect(() => {
    onContext(context);
  }, [context, onContext]);
  return null;
};

// Test component that uses config context
const ConfigConsumer: React.FC<{
  onConfig: (config: PopupSystemConfig) => void;
}> = ({ onConfig }) => {
  const config = useContext(PopupConfigContext);
  React.useEffect(() => {
    onConfig(config);
  }, [config, onConfig]);
  return null;
};

describe("popup/PopupProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset mock implementations
    mockWebOpen.mockImplementation(() => createMockHandle());
    mockOpenFinOpen.mockImplementation(() => createMockHandle());
  });

  describe("context provision", () => {
    it("expect to provide popup context to children", () => {
      let capturedContext: PopupContextValueWithConfig | null = null;

      render(
        <PopupProvider>
          <ContextConsumer onContext={(ctx) => (capturedContext = ctx)} />
        </PopupProvider>
      );

      expect(capturedContext).not.toBeNull();
      expect(capturedContext!.environment).toBe("web");
      expect(typeof capturedContext!.open).toBe("function");
      expect(typeof capturedContext!.close).toBe("function");
      expect(typeof capturedContext!.closeAll).toBe("function");
      expect(typeof capturedContext!.getTheme).toBe("function");
    });

    it("expect to provide config context to children", () => {
      let capturedConfig: PopupSystemConfig | null = null;

      render(
        <PopupProvider>
          <ConfigConsumer onConfig={(cfg) => (capturedConfig = cfg)} />
        </PopupProvider>
      );

      expect(capturedConfig).not.toBeNull();
      expect(capturedConfig!.dimensions).toBeDefined();
      expect(capturedConfig!.positioning).toBeDefined();
      expect(capturedConfig!.behavior).toBeDefined();
    });

    it("expect to render children", () => {
      render(
        <PopupProvider>
          <div data-testid="child">Child content</div>
        </PopupProvider>
      );

      expect(screen.getByTestId("child")).toBeInTheDocument();
    });
  });

  describe("environment detection", () => {
    it("expect to use web adapter by default", () => {
      // Default mock returns isOpenFinAvailable as false
      let capturedContext: PopupContextValueWithConfig | null = null;

      render(
        <PopupProvider>
          <ContextConsumer onContext={(ctx) => (capturedContext = ctx)} />
        </PopupProvider>
      );

      // Since isOpenFinAvailable is mocked to return false, should use web adapter
      expect(capturedContext!.environment).toBe("web");
    });

    it("expect context to have open function", () => {
      let capturedContext: PopupContextValueWithConfig | null = null;

      render(
        <PopupProvider>
          <ContextConsumer onContext={(ctx) => (capturedContext = ctx)} />
        </PopupProvider>
      );

      expect(typeof capturedContext!.open).toBe("function");
    });

    it("expect to respect forceEnvironment prop", () => {
      let capturedContext: PopupContextValueWithConfig | null = null;

      render(
        <PopupProvider forceEnvironment="openfin">
          <ContextConsumer onContext={(ctx) => (capturedContext = ctx)} />
        </PopupProvider>
      );

      // forceEnvironment should override the detection
      expect(capturedContext!.environment).toBe("openfin");
    });
  });

  describe("config merging", () => {
    it("expect to use default config when none provided", () => {
      let capturedConfig: PopupSystemConfig | null = null;

      render(
        <PopupProvider>
          <ConfigConsumer onConfig={(cfg) => (capturedConfig = cfg)} />
        </PopupProvider>
      );

      expect(capturedConfig).toEqual(DEFAULT_POPUP_SYSTEM_CONFIG);
    });

    it("expect to merge partial config with defaults", () => {
      let capturedConfig: PopupSystemConfig | null = null;

      render(
        <PopupProvider config={{ dimensions: { width: 500 } }}>
          <ConfigConsumer onConfig={(cfg) => (capturedConfig = cfg)} />
        </PopupProvider>
      );

      expect(capturedConfig!.dimensions.width).toBe(500);
      expect(capturedConfig!.dimensions.height).toBe(DEFAULT_POPUP_SYSTEM_CONFIG.dimensions.height);
    });
  });

  describe("popup management", () => {
    it("expect open to call adapter.open", () => {
      let capturedContext: PopupContextValueWithConfig | null = null;

      render(
        <PopupProvider>
          <ContextConsumer onContext={(ctx) => (capturedContext = ctx)} />
        </PopupProvider>
      );

      act(() => {
        capturedContext!.open({
          content: { type: "html", html: "<p>Test</p>" },
        });
      });

      expect(mockWebOpen).toHaveBeenCalled();
    });

    it("expect open to merge default options", () => {
      const defaultOptions: Partial<PopupOptions> = {
        blurBehavior: "close",
        showBackdrop: true,
      };

      let capturedContext: PopupContextValueWithConfig | null = null;

      render(
        <PopupProvider defaultOptions={defaultOptions}>
          <ContextConsumer onContext={(ctx) => (capturedContext = ctx)} />
        </PopupProvider>
      );

      act(() => {
        capturedContext!.open({
          content: { type: "html", html: "<p>Test</p>" },
        });
      });

      expect(mockWebOpen).toHaveBeenCalledWith(
        expect.objectContaining({
          blurBehavior: "close",
          showBackdrop: true,
        })
      );
    });

    it("expect open options to override default options", () => {
      let capturedContext: PopupContextValueWithConfig | null = null;

      render(
        <PopupProvider defaultOptions={{ blurBehavior: "close" }}>
          <ContextConsumer onContext={(ctx) => (capturedContext = ctx)} />
        </PopupProvider>
      );

      act(() => {
        capturedContext!.open({
          content: { type: "html", html: "<p>Test</p>" },
          blurBehavior: "none",
        });
      });

      expect(mockWebOpen).toHaveBeenCalledWith(
        expect.objectContaining({
          blurBehavior: "none",
        })
      );
    });

    it("expect open to return popup handle", () => {
      const mockHandle = createMockHandle();
      mockWebOpen.mockReturnValue(mockHandle);

      let capturedContext: PopupContextValueWithConfig | null = null;

      render(
        <PopupProvider>
          <ContextConsumer onContext={(ctx) => (capturedContext = ctx)} />
        </PopupProvider>
      );

      let returnedHandle: PopupHandle | undefined;

      act(() => {
        returnedHandle = capturedContext!.open({
          content: { type: "html", html: "<p>Test</p>" },
        });
      });

      expect(returnedHandle).toBe(mockHandle);
    });

    it("expect close to close popup by id", () => {
      const mockClose = vi.fn();
      const mockHandle = createMockHandle({ close: mockClose });
      mockWebOpen.mockReturnValue(mockHandle);

      let capturedContext: PopupContextValueWithConfig | null = null;

      render(
        <PopupProvider>
          <ContextConsumer onContext={(ctx) => (capturedContext = ctx)} />
        </PopupProvider>
      );

      act(() => {
        capturedContext!.open({
          content: { type: "html", html: "<p>Test</p>" },
        });
      });

      act(() => {
        capturedContext!.close(mockHandle.id);
      });

      expect(mockClose).toHaveBeenCalled();
    });

    it("expect closeAll to close all open popups", () => {
      const mockClose1 = vi.fn();
      const mockClose2 = vi.fn();

      let callCount = 0;
      mockWebOpen.mockImplementation(() => {
        callCount++;
        return createMockHandle({
          id: `popup-${callCount}`,
          close: callCount === 1 ? mockClose1 : mockClose2,
        });
      });

      let capturedContext: PopupContextValueWithConfig | null = null;

      render(
        <PopupProvider>
          <ContextConsumer onContext={(ctx) => (capturedContext = ctx)} />
        </PopupProvider>
      );

      act(() => {
        capturedContext!.open({ content: { type: "html", html: "<p>1</p>" } });
        capturedContext!.open({ content: { type: "html", html: "<p>2</p>" } });
      });

      act(() => {
        capturedContext!.closeAll();
      });

      expect(mockClose1).toHaveBeenCalledWith({ closeReason: "programmatic" });
      expect(mockClose2).toHaveBeenCalledWith({ closeReason: "programmatic" });
    });
  });

  describe("theme", () => {
    it("expect getTheme to return current theme", () => {
      // getCurrentTheme is mocked at the top to return "dark"
      let capturedContext: PopupContextValueWithConfig | null = null;

      render(
        <PopupProvider>
          <ContextConsumer onContext={(ctx) => (capturedContext = ctx)} />
        </PopupProvider>
      );

      expect(capturedContext!.getTheme()).toBe("dark");
    });

    it("expect getTheme to be callable", () => {
      let capturedContext: PopupContextValueWithConfig | null = null;

      render(
        <PopupProvider theme={{ selector: "#app", attribute: "data-mode" }}>
          <ContextConsumer onContext={(ctx) => (capturedContext = ctx)} />
        </PopupProvider>
      );

      // Should be able to call getTheme without errors
      expect(() => capturedContext!.getTheme()).not.toThrow();
    });

    it("expect deprecated theme prop to be merged with options", () => {
      let capturedContext: PopupContextValueWithConfig | null = null;

      render(
        <PopupProvider theme={{ selector: "#app" }}>
          <ContextConsumer onContext={(ctx) => (capturedContext = ctx)} />
        </PopupProvider>
      );

      act(() => {
        capturedContext!.open({
          content: { type: "html", html: "<p>Test</p>" },
        });
      });

      expect(mockWebOpen).toHaveBeenCalledWith(
        expect.objectContaining({
          theme: expect.objectContaining({
            selector: "#app",
          }),
        })
      );
    });
  });

  describe("cleanup", () => {
    it("expect to destroy adapter on unmount", () => {
      const { unmount } = render(
        <PopupProvider>
          <div>Content</div>
        </PopupProvider>
      );

      unmount();

      expect(mockWebDestroy).toHaveBeenCalled();
    });
  });

  describe("getOpenPopups", () => {
    it("expect to return map of open popups", () => {
      const mockHandle = createMockHandle();
      mockWebOpen.mockReturnValue(mockHandle);

      let capturedContext: PopupContextValueWithConfig | null = null;

      render(
        <PopupProvider>
          <ContextConsumer onContext={(ctx) => (capturedContext = ctx)} />
        </PopupProvider>
      );

      act(() => {
        capturedContext!.open({
          content: { type: "html", html: "<p>Test</p>" },
        });
      });

      const openPopups = capturedContext!.getOpenPopups();
      expect(openPopups).toBeInstanceOf(Map);
      expect(openPopups?.size).toBe(1);
    });

    it("expect popup to be removed from map when closed", async () => {
      const mockClose = vi.fn();
      let resultResolver: ((result: PopupResult) => void) | undefined;
      const resultPromise = new Promise<PopupResult>((resolve) => {
        resultResolver = resolve;
      });

      const mockHandle = createMockHandle({
        close: (result?: Partial<PopupResult>) => {
          mockClose(result);
          resultResolver?.({
            confirmed: result?.confirmed ?? false,
            closeReason: result?.closeReason ?? "programmatic",
          });
        },
        result: resultPromise,
      });

      mockWebOpen.mockReturnValue(mockHandle);

      let capturedContext: PopupContextValueWithConfig | null = null;

      render(
        <PopupProvider>
          <ContextConsumer onContext={(ctx) => (capturedContext = ctx)} />
        </PopupProvider>
      );

      act(() => {
        capturedContext!.open({
          content: { type: "html", html: "<p>Test</p>" },
        });
      });

      expect(capturedContext!.getOpenPopups()?.size).toBe(1);

      await act(async () => {
        mockHandle.close();
        await resultPromise;
      });

      // After promise resolves, popup should be removed
      expect(capturedContext!.getOpenPopups()?.size).toBe(0);
    });
  });

  describe("error handling", () => {
    it("expect open to be callable and return handle", () => {
      let capturedContext: PopupContextValueWithConfig | null = null;

      render(
        <PopupProvider>
          <ContextConsumer onContext={(ctx) => (capturedContext = ctx)} />
        </PopupProvider>
      );

      act(() => {
        const handle = capturedContext!.open({
          content: { type: "html", html: "<p>Test</p>" },
        });
        expect(handle).toBeDefined();
        expect(handle?.id).toBeDefined();
      });
    });

    it("expect open to throw error when adapter not initialized", async () => {
      // Mock createWebAdapter to return null to simulate uninitialized adapter
      const webAdapterModule = await import("./utils/webAdapter");
      vi.mocked(webAdapterModule.createWebAdapter).mockReturnValueOnce(
        null as unknown as ReturnType<typeof webAdapterModule.createWebAdapter>
      );

      let capturedContext: PopupContextValueWithConfig | null = null;

      render(
        <PopupProvider forceEnvironment="web">
          <ContextConsumer onContext={(ctx) => (capturedContext = ctx)} />
        </PopupProvider>
      );

      // The adapter is null, so calling open should throw
      expect(() => {
        capturedContext!.open({
          content: { type: "html", html: "<p>Test</p>" },
        });
      }).toThrow("Popup adapter not initialized");
    });
  });
});
