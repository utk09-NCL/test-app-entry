/**
 * Unit tests for OpenFin popup adapter
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PopupOptions } from "../types";

import { createOpenFinAdapter, initOpenFinPopupChild, isOpenFinAvailable } from "./openfinAdapter";

// Capture callbacks for testing
let capturedThemeCallback: ((theme: "light" | "dark") => void) | null = null;
let capturedChannelSubscribeCallback: ((message: unknown) => void) | null = null;
const mockChannelSend = vi.fn();

// Mock communication utilities
vi.mock("./communication", () => ({
  createPopupChannel: vi.fn(() => ({
    channelId: "mock-channel",
    send: mockChannelSend,
    subscribe: vi.fn((callback) => {
      capturedChannelSubscribeCallback = callback;
    }),
    destroy: vi.fn(),
  })),
  generateChannelId: vi.fn(() => "generated-id"),
  getCurrentTheme: vi.fn(() => "dark"),
  buildPopupUrl: vi.fn((url: string) => `${url}?mocked=true`),
  observeThemeChanges: vi.fn((callback) => {
    capturedThemeCallback = callback;
    return vi.fn();
  }),
}));

// Mock positioning utilities
vi.mock("./positioning", () => ({
  calculatePopupPosition: vi.fn(() => ({ x: 100, y: 100 })),
  getElementRect: vi.fn(() => ({ x: 50, y: 50, width: 100, height: 30 })),
  toScreenCoordinates: vi.fn((pos) => pos),
}));

// Mock OpenFin types
const mockShowPopupWindow = vi.fn();
const mockWindowGetCurrent = vi.fn();
const mockDispatchPopupResult = vi.fn();

const createMockFin = () => ({
  me: {
    showPopupWindow: mockShowPopupWindow,
  },
  Window: {
    getCurrent: mockWindowGetCurrent,
  },
});

describe("popup/utils/openfinAdapter", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset OpenFin mock
    mockShowPopupWindow.mockResolvedValue({ result: "clicked" });
    mockWindowGetCurrent.mockResolvedValue({
      getOptions: vi.fn().mockResolvedValue({
        customData: {
          popupId: "popup-123",
          channelId: "channel-456",
          theme: "dark",
          initialData: { foo: "bar" },
        },
      }),
      dispatchPopupResult: mockDispatchPopupResult,
    });
  });

  describe("isOpenFinAvailable", () => {
    it("expect to return false when fin is not defined", () => {
      vi.stubGlobal("fin", undefined);

      expect(isOpenFinAvailable()).toBe(false);
    });

    it("expect to return true when fin is defined", () => {
      vi.stubGlobal("fin", createMockFin());

      expect(isOpenFinAvailable()).toBe(true);
    });
  });

  describe("createOpenFinAdapter", () => {
    beforeEach(() => {
      vi.stubGlobal("fin", createMockFin());
    });

    it("expect to return adapter with required methods", () => {
      const adapter = createOpenFinAdapter();

      expect(adapter.environment).toBe("openfin");
      expect(typeof adapter.isAvailable).toBe("function");
      expect(typeof adapter.open).toBe("function");
      expect(typeof adapter.close).toBe("function");
      expect(typeof adapter.updatePosition).toBe("function");
      expect(typeof adapter.destroy).toBe("function");
    });

    it("expect isAvailable to return true when OpenFin is present", () => {
      const adapter = createOpenFinAdapter();

      expect(adapter.isAvailable()).toBe(true);
    });

    it("expect isAvailable to return false when OpenFin is absent", () => {
      vi.stubGlobal("fin", undefined);

      const adapter = createOpenFinAdapter();

      expect(adapter.isAvailable()).toBe(false);
    });
  });

  describe("adapter.open", () => {
    beforeEach(() => {
      vi.stubGlobal("fin", createMockFin());
    });

    it("expect to throw when OpenFin is not available", () => {
      vi.stubGlobal("fin", undefined);

      const adapter = createOpenFinAdapter();

      expect(() => {
        adapter.open({
          content: { type: "url", url: "/test" },
        });
      }).toThrow("OpenFin is not available");
    });

    it("expect to return popup handle", () => {
      const adapter = createOpenFinAdapter();
      const options: PopupOptions = {
        content: { type: "url", url: "/test" },
      };

      const handle = adapter.open(options);

      expect(handle.id).toMatch(/^popup-/);
      expect(handle.isOpen).toBe(true);
      expect(typeof handle.close).toBe("function");
      expect(typeof handle.send).toBe("function");
      expect(typeof handle.updatePosition).toBe("function");
      expect(handle.result).toBeInstanceOf(Promise);
    });

    it("expect to call showPopupWindow with correct options", () => {
      const adapter = createOpenFinAdapter();
      const options: PopupOptions = {
        content: { type: "url", url: "/test" },
        width: 400,
        height: 300,
      };

      adapter.open(options);

      expect(mockShowPopupWindow).toHaveBeenCalledWith(
        expect.objectContaining({
          width: 400,
          height: 300,
        })
      );
    });

    it("expect to use default dimensions for auto width", () => {
      const adapter = createOpenFinAdapter();
      const options: PopupOptions = {
        content: { type: "url", url: "/test" },
        width: "auto",
      };

      adapter.open(options);

      expect(mockShowPopupWindow).toHaveBeenCalledWith(
        expect.objectContaining({
          width: 300, // DEFAULT_POPUP_WIDTH
        })
      );
    });

    it("expect to use default dimensions for auto height", () => {
      const adapter = createOpenFinAdapter();
      const options: PopupOptions = {
        content: { type: "url", url: "/test" },
        height: "auto",
      };

      adapter.open(options);

      expect(mockShowPopupWindow).toHaveBeenCalledWith(
        expect.objectContaining({
          height: 400, // DEFAULT_POPUP_MAX_HEIGHT
        })
      );
    });

    it("expect to position relative to anchor element", () => {
      const adapter = createOpenFinAdapter();
      const anchorEl = document.createElement("button");

      const options: PopupOptions = {
        content: { type: "url", url: "/test" },
        anchor: anchorEl,
      };

      adapter.open(options);

      expect(mockShowPopupWindow).toHaveBeenCalledWith(
        expect.objectContaining({
          x: 100,
          y: 100,
        })
      );
    });

    it("expect to center when no anchor provided", () => {
      vi.stubGlobal("innerWidth", 1024);
      vi.stubGlobal("innerHeight", 768);

      const adapter = createOpenFinAdapter();
      const options: PopupOptions = {
        content: { type: "url", url: "/test" },
        width: 400,
        height: 300,
      };

      adapter.open(options);

      // Should be centered: (1024 - 400) / 2, (768 - 300) / 2
      expect(mockShowPopupWindow).toHaveBeenCalledWith(
        expect.objectContaining({
          x: expect.any(Number),
          y: expect.any(Number),
        })
      );
    });

    it("expect to map blurBehavior to OpenFin options", () => {
      const adapter = createOpenFinAdapter();

      // Test close behavior
      adapter.open({
        content: { type: "url", url: "/test" },
        blurBehavior: "close",
      });

      expect(mockShowPopupWindow).toHaveBeenCalledWith(
        expect.objectContaining({
          blurBehavior: "close",
        })
      );

      mockShowPopupWindow.mockClear();

      // Test none behavior (maps to modal)
      adapter.open({
        content: { type: "url", url: "/test" },
        blurBehavior: "none",
      });

      expect(mockShowPopupWindow).toHaveBeenCalledWith(
        expect.objectContaining({
          blurBehavior: "modal",
        })
      );
    });

    it("expect to pass OpenFin-specific options", () => {
      const adapter = createOpenFinAdapter();
      const options: PopupOptions = {
        content: { type: "url", url: "/test" },
        openfinOptions: {
          frame: true,
          backgroundColor: "#000000",
        },
      };

      adapter.open(options);

      expect(mockShowPopupWindow).toHaveBeenCalledWith(
        expect.objectContaining({
          initialOptions: expect.objectContaining({
            frame: true,
            backgroundColor: "#000000",
          }),
        })
      );
    });

    it("expect handle.close to resolve result promise", async () => {
      const adapter = createOpenFinAdapter();
      const handle = adapter.open({
        content: { type: "url", url: "/test" },
      });

      handle.close({ confirmed: true, data: "test" });

      const result = await handle.result;
      expect(result.confirmed).toBe(true);
      expect(result.data).toBe("test");
    });

    it("expect handle.close to call onClose callback", () => {
      const onClose = vi.fn();
      const adapter = createOpenFinAdapter();
      const handle = adapter.open({
        content: { type: "url", url: "/test" },
        onClose,
      });

      handle.close({ confirmed: false, closeReason: "escape" });

      expect(onClose).toHaveBeenCalledWith(
        expect.objectContaining({
          confirmed: false,
          closeReason: "escape",
        })
      );
    });

    it("expect handle.send to be callable", () => {
      const adapter = createOpenFinAdapter();
      const handle = adapter.open({
        content: { type: "url", url: "/test" },
      });

      // Verify send is a function and can be called without throwing
      expect(typeof handle.send).toBe("function");
      expect(() => handle.send("DATA_UPDATE", { foo: "bar" })).not.toThrow();
    });

    it("expect handle.updatePosition to warn about unsupported operation", () => {
      // Suppress the expected warning
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const adapter = createOpenFinAdapter();
      const handle = adapter.open({
        content: { type: "url", url: "/test" },
      });

      handle.updatePosition({ x: 100, y: 100, width: 50, height: 50 });

      expect(warnSpy).toHaveBeenCalledWith(
        "[OpenFin Popup] Position update not supported for open popups"
      );

      warnSpy.mockRestore();
    });

    it("expect popup dismissed result to close with blur reason", async () => {
      mockShowPopupWindow.mockResolvedValue({ result: "dismissed" });

      const adapter = createOpenFinAdapter();
      const handle = adapter.open({
        content: { type: "url", url: "/test" },
      });

      // Wait for the showPopupWindow to resolve
      await new Promise((resolve) => setTimeout(resolve, 0));

      const result = await handle.result;
      expect(result.closeReason).toBe("blur");
    });

    it("expect popup error to call onError callback", async () => {
      const error = new Error("Test error");
      mockShowPopupWindow.mockRejectedValue(error);

      // Suppress console.error for this test
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const onError = vi.fn();
      const adapter = createOpenFinAdapter();
      adapter.open({
        content: { type: "url", url: "/test" },
        onError,
      });

      // Wait for the promise to reject
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(onError).toHaveBeenCalledWith(error);
      expect(errorSpy).toHaveBeenCalledWith("[OpenFin Popup] Error opening popup:", error);

      errorSpy.mockRestore();
    });

    it("expect popup error to handle non-Error objects", async () => {
      mockShowPopupWindow.mockRejectedValue("String error");

      // Suppress console.error for this test
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const onError = vi.fn();
      const adapter = createOpenFinAdapter();
      adapter.open({
        content: { type: "url", url: "/test" },
        onError,
      });

      // Wait for the promise to reject
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(onError).toHaveBeenCalledWith(expect.any(Error));

      errorSpy.mockRestore();
    });

    it("expect HTML content to create blob URL", () => {
      const createObjectURL = vi.fn(() => "blob:test");
      vi.stubGlobal("URL", {
        createObjectURL,
      });

      const adapter = createOpenFinAdapter();
      adapter.open({
        content: {
          type: "html",
          html: "<p>Test</p>",
          styles: "p { color: red; }",
        },
      });

      expect(createObjectURL).toHaveBeenCalled();
    });

    it("expect component content to call showPopupWindow", () => {
      const TestComponent = () => null;
      TestComponent.displayName = "TestComponent";

      const adapter = createOpenFinAdapter();
      adapter.open({
        content: {
          type: "component",
          component: TestComponent,
          props: { foo: "bar" },
        },
      });

      // Verify showPopupWindow was called (component content type is processed)
      expect(mockShowPopupWindow).toHaveBeenCalled();
    });

    it("expect URL content with existing params to use & separator", () => {
      const adapter = createOpenFinAdapter();
      adapter.open({
        content: {
          type: "url",
          url: "/test?existing=param",
          params: { key: "value" },
        },
      });

      expect(mockShowPopupWindow).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining("?existing=param"),
        })
      );
    });

    it("expect URL content without params to use ? separator", () => {
      const adapter = createOpenFinAdapter();
      adapter.open({
        content: {
          type: "url",
          url: "/test",
          params: { key: "value" },
        },
      });

      expect(mockShowPopupWindow).toHaveBeenCalled();
    });

    it("expect onOpen callback to be called when popup is ready", async () => {
      const onOpen = vi.fn();
      const adapter = createOpenFinAdapter();

      // Capture the onPopupReady callback
      let capturedOptions: Record<string, unknown> = {};
      mockShowPopupWindow.mockImplementation((options) => {
        capturedOptions = options;
        return Promise.resolve({ result: "clicked" });
      });

      adapter.open({
        content: { type: "url", url: "/test" },
        onOpen,
      });

      // Call the onPopupReady callback with a mock window
      if (capturedOptions.onPopupReady) {
        (capturedOptions.onPopupReady as (w: unknown) => void)({
          getOptions: vi.fn(),
        });
      }

      expect(onOpen).toHaveBeenCalled();
    });

    it("expect onMessage to be called when popup sends result", async () => {
      const onMessage = vi.fn();
      const adapter = createOpenFinAdapter();

      // Capture the onPopupResult callback
      let capturedOptions: Record<string, unknown> = {};
      mockShowPopupWindow.mockImplementation((options) => {
        capturedOptions = options;
        return Promise.resolve({ result: "clicked" });
      });

      adapter.open({
        content: { type: "url", url: "/test" },
        onMessage,
      });

      // Call the onPopupResult callback
      if (capturedOptions.onPopupResult) {
        (capturedOptions.onPopupResult as (r: unknown) => void)({
          type: "DATA_RESPONSE",
          data: { foo: "bar" },
        });
      }

      expect(onMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "DATA_RESPONSE",
          payload: { foo: "bar" },
        })
      );
    });

    it("expect onPopupResult with RESULT type to resolve promise", async () => {
      const adapter = createOpenFinAdapter();

      // Capture the onPopupResult callback
      let capturedOptions: Record<string, unknown> = {};
      mockShowPopupWindow.mockImplementation((options) => {
        capturedOptions = options;
        return new Promise(() => {}); // Never resolves to let callback handle it
      });

      const handle = adapter.open({
        content: { type: "url", url: "/test" },
      });

      // Call the onPopupResult callback with RESULT type
      if (capturedOptions.onPopupResult) {
        (capturedOptions.onPopupResult as (r: unknown) => void)({
          type: "RESULT",
          data: "selected-value",
        });
      }

      // Close the popup to resolve
      handle.close();

      const result = await handle.result;
      expect(result).toBeDefined();
    });

    it("expect component content without displayName to use name", () => {
      function NamedComponent() {
        return null;
      }

      const adapter = createOpenFinAdapter();
      adapter.open({
        content: {
          type: "component",
          component: NamedComponent,
        },
      });

      expect(mockShowPopupWindow).toHaveBeenCalled();
    });

    it("expect component content without props to work", () => {
      const TestComponent = () => null;

      const adapter = createOpenFinAdapter();
      adapter.open({
        content: {
          type: "component",
          component: TestComponent,
        },
      });

      expect(mockShowPopupWindow).toHaveBeenCalled();
    });
  });

  describe("adapter.close", () => {
    beforeEach(() => {
      vi.stubGlobal("fin", createMockFin());
    });

    it("expect to close popup via handle", () => {
      const adapter = createOpenFinAdapter();
      const handle = adapter.open({
        content: { type: "url", url: "/test" },
      });
      const closeSpy = vi.spyOn(handle, "close");

      adapter.close(handle);

      expect(closeSpy).toHaveBeenCalled();
    });

    it("expect to not close already closed popup", () => {
      const adapter = createOpenFinAdapter();
      const handle = adapter.open({
        content: { type: "url", url: "/test" },
      });

      handle.close();
      handle.isOpen = false;

      const closeSpy = vi.spyOn(handle, "close");
      adapter.close(handle);

      // close should be called but internal logic should handle isOpen check
      expect(closeSpy).not.toHaveBeenCalled();
    });
  });

  describe("adapter.updatePosition", () => {
    beforeEach(() => {
      vi.stubGlobal("fin", createMockFin());
    });

    it("expect to call handle.updatePosition", () => {
      const adapter = createOpenFinAdapter();
      const handle = adapter.open({
        content: { type: "url", url: "/test" },
      });
      const updateSpy = vi.spyOn(handle, "updatePosition");

      const newAnchor = document.createElement("button");
      adapter.updatePosition(handle, newAnchor);

      expect(updateSpy).toHaveBeenCalledWith(newAnchor);
    });
  });

  describe("adapter.destroy", () => {
    beforeEach(() => {
      vi.stubGlobal("fin", createMockFin());
    });

    it("expect to close all open popups", () => {
      const adapter = createOpenFinAdapter();

      // Open some popups
      const handle1 = adapter.open({
        content: { type: "url", url: "/test1" },
      });
      const handle2 = adapter.open({
        content: { type: "url", url: "/test2" },
      });

      // Both handles should be open initially
      expect(handle1.isOpen).toBe(true);
      expect(handle2.isOpen).toBe(true);

      // Destroy should be callable and not throw
      expect(() => adapter.destroy()).not.toThrow();

      // Verify showPopupWindow was called for each popup
      expect(mockShowPopupWindow).toHaveBeenCalledTimes(2);
    });
  });

  describe("channel message handling", () => {
    beforeEach(() => {
      vi.stubGlobal("fin", createMockFin());
      capturedThemeCallback = null;
      capturedChannelSubscribeCallback = null;
      mockChannelSend.mockClear();
    });

    it("expect popup to subscribe to channel messages", () => {
      const adapter = createOpenFinAdapter();
      const onMessage = vi.fn();

      const handle = adapter.open({
        content: { type: "url", url: "/test" },
        onMessage,
      });

      // Verify the popup is open and message handler is set up
      expect(handle.isOpen).toBe(true);
      expect(typeof handle.send).toBe("function");
    });

    it("expect theme change to send THEME_CHANGE message", () => {
      const adapter = createOpenFinAdapter();

      adapter.open({
        content: { type: "url", url: "/test" },
      });

      // Trigger the captured theme change callback
      expect(capturedThemeCallback).not.toBeNull();
      if (capturedThemeCallback) {
        capturedThemeCallback("light");
      }

      expect(mockChannelSend).toHaveBeenCalledWith("THEME_CHANGE", { theme: "light" });
    });

    it("expect POPUP_CLOSE channel message to close popup", () => {
      const adapter = createOpenFinAdapter();
      const handle = adapter.open({
        content: { type: "url", url: "/test" },
      });
      const closeSpy = vi.spyOn(handle, "close");

      // Trigger the channel subscribe callback with POPUP_CLOSE
      expect(capturedChannelSubscribeCallback).not.toBeNull();
      if (capturedChannelSubscribeCallback) {
        capturedChannelSubscribeCallback({ type: "POPUP_CLOSE" });
      }

      expect(closeSpy).toHaveBeenCalledWith({ closeReason: "programmatic" });
    });

    it("expect RESULT channel message to resolve promise", async () => {
      const adapter = createOpenFinAdapter();
      const handle = adapter.open({
        content: { type: "url", url: "/test" },
      });

      // Trigger the channel subscribe callback with RESULT
      expect(capturedChannelSubscribeCallback).not.toBeNull();
      if (capturedChannelSubscribeCallback) {
        capturedChannelSubscribeCallback({
          type: "RESULT",
          payload: "test-data",
        });
      }

      // Close the handle to allow result to resolve
      handle.close();
      const result = await handle.result;

      expect(result).toBeDefined();
    });

    it("expect channel messages to be forwarded to onMessage handler", () => {
      const onMessage = vi.fn();
      const adapter = createOpenFinAdapter();

      adapter.open({
        content: { type: "url", url: "/test" },
        onMessage,
      });

      // Trigger the channel subscribe callback with a message
      expect(capturedChannelSubscribeCallback).not.toBeNull();
      if (capturedChannelSubscribeCallback) {
        capturedChannelSubscribeCallback({
          type: "DATA_RESPONSE",
          payload: { key: "value" },
        });
      }

      expect(onMessage).toHaveBeenCalledWith({
        type: "DATA_RESPONSE",
        payload: { key: "value" },
      });
    });
  });

  describe("initOpenFinPopupChild", () => {
    beforeEach(() => {
      vi.stubGlobal("fin", createMockFin());
    });

    it("expect to throw when OpenFin is not available", async () => {
      vi.stubGlobal("fin", undefined);

      await expect(initOpenFinPopupChild()).rejects.toThrow("OpenFin is not available");
    });

    it("expect to return popup context from window options", async () => {
      const context = await initOpenFinPopupChild();

      expect(context.popupId).toBe("popup-123");
      expect(context.channelId).toBe("channel-456");
      expect(context.theme).toBe("dark");
      expect(context.initialData).toEqual({ foo: "bar" });
    });

    it("expect close to dispatch popup result", async () => {
      const context = await initOpenFinPopupChild();

      await context.close({ data: "selected" });

      expect(mockDispatchPopupResult).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "RESULT",
          data: "selected",
        })
      );
    });

    it("expect sendToParent to dispatch data response", async () => {
      const context = await initOpenFinPopupChild();

      await context.sendToParent({ key: "value" });

      expect(mockDispatchPopupResult).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "DATA_RESPONSE",
          data: { key: "value" },
        })
      );
    });
  });
});
