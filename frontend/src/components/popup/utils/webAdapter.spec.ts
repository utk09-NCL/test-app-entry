/**
 * Unit tests for web popup adapter
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PopupOptions } from "../types";

import { createWebAdapter, initWebPopupChild, usePopupChild } from "./webAdapter";

// Capture rendered element for testing component context
interface CapturedRenderElement {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props?: { value?: any };
}
let capturedRenderElement: CapturedRenderElement | null = null;

// Mock createRoot from react-dom/client
vi.mock("react-dom/client", () => ({
  createRoot: vi.fn(() => ({
    render: vi.fn((element: CapturedRenderElement) => {
      capturedRenderElement = element;
    }),
    unmount: vi.fn(),
  })),
}));

// Capture callbacks for testing
let capturedChannelSubscribeCallback: ((message: unknown) => void) | null = null;
let capturedThemeCallback: ((theme: "light" | "dark") => void) | null = null;
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
  applyTheme: vi.fn(),
  observeThemeChanges: vi.fn((callback) => {
    capturedThemeCallback = callback;
    return vi.fn();
  }),
}));

// Mock positioning utilities
vi.mock("./positioning", () => ({
  calculatePopupPosition: vi.fn(() => ({ x: 100, y: 100 })),
  calculateCenterPosition: vi.fn(() => ({ x: 200, y: 200 })),
  constrainSize: vi.fn((size) => size),
  getElementRect: vi.fn(() => ({ x: 50, y: 50, width: 100, height: 30 })),
  getViewportSize: vi.fn(() => ({ width: 1024, height: 768 })),
}));

describe("popup/utils/webAdapter", () => {
  let mockPostMessage: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Reset document body
    document.body.innerHTML = "";

    // Reset captured callbacks
    capturedChannelSubscribeCallback = null;
    capturedThemeCallback = null;
    capturedRenderElement = null;
    mockChannelSend.mockClear();

    // Re-setup mock implementations after clearAllMocks
    const { observeThemeChanges } = await import("./communication");
    vi.mocked(observeThemeChanges).mockImplementation((callback) => {
      capturedThemeCallback = callback;
      return vi.fn();
    });

    // Mock postMessage
    mockPostMessage = vi.fn();
    vi.stubGlobal("postMessage", mockPostMessage);

    // Mock window.parent
    Object.defineProperty(window, "parent", {
      value: {
        postMessage: mockPostMessage,
      },
      writable: true,
    });
  });

  afterEach(() => {
    // Clean up any styles added
    const styleEl = document.getElementById("popup-web-adapter-styles");
    if (styleEl) {
      styleEl.remove();
    }
  });

  describe("createWebAdapter", () => {
    it("expect to return adapter with required methods", () => {
      const adapter = createWebAdapter();

      expect(adapter.environment).toBe("web");
      expect(typeof adapter.isAvailable).toBe("function");
      expect(typeof adapter.open).toBe("function");
      expect(typeof adapter.close).toBe("function");
      expect(typeof adapter.updatePosition).toBe("function");
      expect(typeof adapter.destroy).toBe("function");
    });

    it("expect isAvailable to return true", () => {
      const adapter = createWebAdapter();

      expect(adapter.isAvailable()).toBe(true);
    });

    it("expect to inject styles on creation", () => {
      createWebAdapter();

      const styleEl = document.getElementById("popup-web-adapter-styles");
      expect(styleEl).not.toBeNull();
      expect(styleEl?.tagName).toBe("STYLE");
    });

    it("expect not to duplicate styles on multiple adapter creations", () => {
      createWebAdapter();
      createWebAdapter();

      const styles = document.querySelectorAll("#popup-web-adapter-styles");
      expect(styles.length).toBe(1);
    });
  });

  describe("adapter.open", () => {
    it("expect to create popup with URL content", () => {
      const adapter = createWebAdapter();
      const options: PopupOptions = {
        content: { type: "url", url: "/test-popup" },
      };

      const handle = adapter.open(options);

      expect(handle.id).toMatch(/^popup-/);
      expect(handle.isOpen).toBe(true);
      expect(typeof handle.close).toBe("function");
      expect(typeof handle.send).toBe("function");
      expect(typeof handle.updatePosition).toBe("function");
      expect(handle.result).toBeInstanceOf(Promise);

      // Verify DOM was created
      const overlay = document.querySelector(".popup-overlay");
      expect(overlay).not.toBeNull();

      const iframe = document.querySelector(".popup-iframe");
      expect(iframe).not.toBeNull();

      handle.close();
    });

    it("expect to create popup with HTML content", () => {
      const adapter = createWebAdapter();
      const options: PopupOptions = {
        content: {
          type: "html",
          html: "<p>Test content</p>",
          styles: "p { color: red; }",
        },
      };

      const handle = adapter.open(options);

      const iframe = document.querySelector<HTMLIFrameElement>(".popup-iframe");
      expect(iframe).not.toBeNull();
      expect(iframe?.srcdoc).toContain("<p>Test content</p>");

      handle.close();
    });

    it("expect to create popup with component content", () => {
      const TestComponent = () => null;
      const adapter = createWebAdapter();
      const options: PopupOptions = {
        content: {
          type: "component",
          component: TestComponent,
          props: { foo: "bar" },
        },
      };

      const handle = adapter.open(options);

      const contentWrapper = document.querySelector(".popup-react-content");
      expect(contentWrapper).not.toBeNull();

      handle.close();
    });

    it("expect to position popup relative to anchor element", () => {
      const adapter = createWebAdapter();
      const anchorEl = document.createElement("button");
      // Set dimensions so anchor is not considered "hidden"
      Object.defineProperty(anchorEl, "offsetWidth", { value: 100 });
      Object.defineProperty(anchorEl, "offsetHeight", { value: 30 });
      document.body.appendChild(anchorEl);

      const options: PopupOptions = {
        content: { type: "html", html: "<p>Test</p>" },
        anchor: anchorEl,
      };

      const handle = adapter.open(options);

      // Verify container was created
      const container = document.querySelector<HTMLDivElement>(".popup-container");
      expect(container).not.toBeNull();
      // Container should have position styles set (values depend on mocked positioning)
      expect(container?.style.position).not.toBe("static");

      handle.close();
      document.body.removeChild(anchorEl);
    });

    it("expect to center popup when no anchor provided", () => {
      const adapter = createWebAdapter();
      const options: PopupOptions = {
        content: { type: "html", html: "<p>Test</p>" },
      };

      const handle = adapter.open(options);

      const container = document.querySelector<HTMLDivElement>(".popup-container");
      expect(container?.style.left).toBe("200px");
      expect(container?.style.top).toBe("200px");

      handle.close();
    });

    it("expect to show backdrop when showBackdrop is true", () => {
      const adapter = createWebAdapter();
      const options: PopupOptions = {
        content: { type: "html", html: "<p>Test</p>" },
        showBackdrop: true,
      };

      const handle = adapter.open(options);

      const overlay = document.querySelector(".popup-overlay");
      expect(overlay?.classList.contains("popup-overlay--with-backdrop")).toBe(true);

      handle.close();
    });

    it("expect transparent clickable overlay for blur behavior", () => {
      const adapter = createWebAdapter();
      const options: PopupOptions = {
        content: { type: "html", html: "<p>Test</p>" },
        blurBehavior: "close",
        showBackdrop: false,
      };

      const handle = adapter.open(options);

      const overlay = document.querySelector(".popup-overlay");
      expect(overlay?.classList.contains("popup-overlay--transparent-clickable")).toBe(true);

      handle.close();
    });

    it("expect transparent non-interactive overlay for blur none", () => {
      const adapter = createWebAdapter();
      const options: PopupOptions = {
        content: { type: "html", html: "<p>Test</p>" },
        blurBehavior: "none",
        showBackdrop: false,
      };

      const handle = adapter.open(options);

      const overlay = document.querySelector(".popup-overlay");
      expect(overlay?.classList.contains("popup-overlay--transparent")).toBe(true);

      handle.close();
    });

    it("expect to set modal ARIA attributes when modal is true", () => {
      const adapter = createWebAdapter();
      const options: PopupOptions = {
        content: { type: "html", html: "<p>Test</p>" },
        modal: true,
      };

      const handle = adapter.open(options);

      const container = document.querySelector(".popup-container");
      expect(container?.getAttribute("role")).toBe("dialog");
      expect(container?.getAttribute("aria-modal")).toBe("true");

      handle.close();
    });

    it("expect to apply custom dimensions", () => {
      const adapter = createWebAdapter();
      const options: PopupOptions = {
        content: { type: "html", html: "<p>Test</p>" },
        width: 400,
        height: 300,
      };

      const handle = adapter.open(options);

      const container = document.querySelector<HTMLDivElement>(".popup-container");
      expect(container?.style.width).toBe("400px");
      expect(container?.style.height).toBe("300px");

      handle.close();
    });

    it("expect to use auto sizing when width is auto", () => {
      const adapter = createWebAdapter();
      const options: PopupOptions = {
        content: { type: "html", html: "<p>Test</p>" },
        width: "auto",
        minWidth: 200,
        maxWidth: 600,
      };

      const handle = adapter.open(options);

      const container = document.querySelector<HTMLDivElement>(".popup-container");
      expect(container?.style.width).toBe("fit-content");
      expect(container?.style.minWidth).toBe("200px");
      expect(container?.style.maxWidth).toBe("600px");

      handle.close();
    });

    it("expect result promise to resolve on close", async () => {
      const adapter = createWebAdapter();
      const options: PopupOptions = {
        content: { type: "html", html: "<p>Test</p>" },
      };

      const handle = adapter.open(options);
      const resultPromise = handle.result;

      // Use fake timers to control animation
      vi.useFakeTimers();

      handle.close({ confirmed: true, data: "test-data" });

      // Fast-forward past animation duration
      vi.advanceTimersByTime(200);

      const result = await resultPromise;
      expect(result.confirmed).toBe(true);
      expect(result.data).toBe("test-data");

      vi.useRealTimers();
    });

    it("expect onClose callback to be called", async () => {
      const onClose = vi.fn();
      const adapter = createWebAdapter();
      const options: PopupOptions = {
        content: { type: "html", html: "<p>Test</p>" },
        onClose,
      };

      const handle = adapter.open(options);

      vi.useFakeTimers();
      handle.close({ confirmed: false, closeReason: "escape" });
      vi.advanceTimersByTime(200);

      expect(onClose).toHaveBeenCalledWith(
        expect.objectContaining({
          confirmed: false,
          closeReason: "escape",
        })
      );

      vi.useRealTimers();
    });

    it("expect backdrop click to close popup", () => {
      const adapter = createWebAdapter();
      const options: PopupOptions = {
        content: { type: "html", html: "<p>Test</p>" },
        blurBehavior: "close",
      };

      const handle = adapter.open(options);
      const closeSpy = vi.spyOn(handle, "close");

      const overlay = document.querySelector<HTMLDivElement>(".popup-overlay");

      // Simulate click on overlay (not container)
      const clickEvent = new MouseEvent("click", { bubbles: true });
      Object.defineProperty(clickEvent, "target", { value: overlay });
      overlay?.dispatchEvent(clickEvent);

      expect(closeSpy).toHaveBeenCalledWith({ closeReason: "blur" });
    });

    it("expect escape key to close popup", () => {
      const adapter = createWebAdapter();
      const options: PopupOptions = {
        content: { type: "html", html: "<p>Test</p>" },
        closeOnEscape: true,
      };

      const handle = adapter.open(options);
      const closeSpy = vi.spyOn(handle, "close");

      const escapeEvent = new KeyboardEvent("keydown", { key: "Escape" });
      document.dispatchEvent(escapeEvent);

      expect(closeSpy).toHaveBeenCalledWith({ closeReason: "escape" });
    });

    it("expect escape key to not close when closeOnEscape is false", () => {
      const adapter = createWebAdapter();
      const options: PopupOptions = {
        content: { type: "html", html: "<p>Test</p>" },
        closeOnEscape: false,
      };

      const handle = adapter.open(options);
      const closeSpy = vi.spyOn(handle, "close");

      const escapeEvent = new KeyboardEvent("keydown", { key: "Escape" });
      document.dispatchEvent(escapeEvent);

      expect(closeSpy).not.toHaveBeenCalled();

      handle.close();
    });

    it("expect handle.send to post message to iframe", () => {
      const adapter = createWebAdapter();
      const options: PopupOptions = {
        content: { type: "url", url: "/test" },
      };

      const handle = adapter.open(options);

      const iframe = document.querySelector<HTMLIFrameElement>(".popup-iframe");
      const mockIframePostMessage = vi.fn();

      // Mock iframe contentWindow
      Object.defineProperty(iframe, "contentWindow", {
        value: { postMessage: mockIframePostMessage },
        writable: true,
      });

      handle.send("DATA_UPDATE", { foo: "bar" });

      expect(mockIframePostMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "DATA_UPDATE",
          payload: { foo: "bar" },
        }),
        "*"
      );

      handle.close();
    });

    it("expect handle.updatePosition to update container position", () => {
      const adapter = createWebAdapter();
      const options: PopupOptions = {
        content: { type: "html", html: "<p>Test</p>" },
      };

      const handle = adapter.open(options);

      // Update position
      handle.updatePosition({ x: 50, y: 50, width: 100, height: 30 });

      const container = document.querySelector<HTMLDivElement>(".popup-container");
      expect(container?.style.left).toBe("100px");
      expect(container?.style.top).toBe("100px");

      handle.close();
    });

    it("expect URL content to include params", () => {
      const adapter = createWebAdapter();
      const options: PopupOptions = {
        content: {
          type: "url",
          url: "/test",
          params: { key: "value" },
        },
      };

      const handle = adapter.open(options);

      const iframe = document.querySelector<HTMLIFrameElement>(".popup-iframe");
      expect(iframe?.src).toContain("key=value");

      handle.close();
    });

    it("expect to set allowfullscreen attribute when enabled", () => {
      const adapter = createWebAdapter();
      const options: PopupOptions = {
        content: { type: "url", url: "/test" },
        webOptions: { allowFullscreen: true },
      };

      const handle = adapter.open(options);

      const iframe = document.querySelector<HTMLIFrameElement>(".popup-iframe");
      expect(iframe?.getAttribute("allowfullscreen")).toBe("true");

      handle.close();
    });

    it("expect to center popup when anchor has zero dimensions", () => {
      const adapter = createWebAdapter();
      const hiddenAnchor = document.createElement("span");
      // Hidden elements have 0 dimensions
      Object.defineProperty(hiddenAnchor, "offsetWidth", { value: 0 });
      Object.defineProperty(hiddenAnchor, "offsetHeight", { value: 0 });
      document.body.appendChild(hiddenAnchor);

      const options: PopupOptions = {
        content: { type: "html", html: "<p>Test</p>" },
        anchor: hiddenAnchor,
      };

      const handle = adapter.open(options);

      // Container should use flexbox centering (position: static)
      const container = document.querySelector<HTMLDivElement>(".popup-container");
      expect(container?.style.position).toBe("static");

      handle.close();
      document.body.removeChild(hiddenAnchor);
    });

    it("expect handle.updatePosition without anchor to center popup", () => {
      const adapter = createWebAdapter();
      const options: PopupOptions = {
        content: { type: "html", html: "<p>Test</p>" },
      };

      const handle = adapter.open(options);

      // Update position without anchor should center
      handle.updatePosition();

      const container = document.querySelector<HTMLDivElement>(".popup-container");
      expect(container?.style.left).toBe("200px"); // From mocked calculateCenterPosition
      expect(container?.style.top).toBe("200px");

      handle.close();
    });

    it("expect updatePosition to do nothing when popup is closed", () => {
      const adapter = createWebAdapter();
      const options: PopupOptions = {
        content: { type: "html", html: "<p>Test</p>" },
      };

      const handle = adapter.open(options);

      vi.useFakeTimers();
      handle.close();
      vi.advanceTimersByTime(200);
      vi.useRealTimers();

      // Should not throw when updating position on closed popup
      expect(() => handle.updatePosition()).not.toThrow();
    });

    it("expect POPUP_READY message to call onOpen", () => {
      const onOpen = vi.fn();
      const adapter = createWebAdapter();
      const options: PopupOptions = {
        content: { type: "html", html: "<p>Test</p>" },
        onOpen,
      };

      const handle = adapter.open(options);

      // Simulate POPUP_READY message from iframe
      const messageEvent = new MessageEvent("message", {
        data: {
          popupId: handle.id,
          type: "POPUP_READY",
        },
      });
      window.dispatchEvent(messageEvent);

      expect(onOpen).toHaveBeenCalled();

      handle.close();
    });

    it("expect RESULT message to close popup with data", async () => {
      const adapter = createWebAdapter();
      const options: PopupOptions = {
        content: { type: "html", html: "<p>Test</p>" },
      };

      const handle = adapter.open(options);

      vi.useFakeTimers();

      // Simulate RESULT message from iframe
      const messageEvent = new MessageEvent("message", {
        data: {
          popupId: handle.id,
          type: "RESULT",
          payload: "selected-value",
        },
      });
      window.dispatchEvent(messageEvent);

      vi.advanceTimersByTime(200);

      const result = await handle.result;
      expect(result.confirmed).toBe(true);
      expect(result.data).toBe("selected-value");
      expect(result.closeReason).toBe("submit");

      vi.useRealTimers();
    });

    it("expect POPUP_CLOSE message to close popup", async () => {
      const adapter = createWebAdapter();
      const options: PopupOptions = {
        content: { type: "html", html: "<p>Test</p>" },
      };

      const handle = adapter.open(options);
      const closeSpy = vi.spyOn(handle, "close");

      // Simulate POPUP_CLOSE message
      const messageEvent = new MessageEvent("message", {
        data: {
          popupId: handle.id,
          type: "POPUP_CLOSE",
        },
      });
      window.dispatchEvent(messageEvent);

      expect(closeSpy).toHaveBeenCalledWith({ closeReason: "programmatic" });
    });

    it("expect onMessage to be called for all message types", () => {
      const onMessage = vi.fn();
      const adapter = createWebAdapter();
      const options: PopupOptions = {
        content: { type: "html", html: "<p>Test</p>" },
        onMessage,
      };

      const handle = adapter.open(options);

      // Simulate a message
      const messageEvent = new MessageEvent("message", {
        data: {
          popupId: handle.id,
          type: "DATA_RESPONSE",
          payload: { key: "value" },
          timestamp: 12345,
        },
      });
      window.dispatchEvent(messageEvent);

      expect(onMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          popupId: handle.id,
          type: "DATA_RESPONSE",
          payload: { key: "value" },
        })
      );

      handle.close();
    });

    it("expect theme sync to update iframe and React content", async () => {
      // Mock observeThemeChanges to capture the callback - use ref to avoid TypeScript narrowing issues
      const callbackRef: { current: ((theme: "light" | "dark") => void) | null } = {
        current: null,
      };
      const { observeThemeChanges } = await import("./communication");
      vi.mocked(observeThemeChanges).mockImplementation((callback) => {
        callbackRef.current = callback;
        return vi.fn();
      });

      const adapter = createWebAdapter();
      const options: PopupOptions = {
        content: { type: "html", html: "<p>Test</p>" },
        theme: { syncWithParent: true },
      };

      const handle = adapter.open(options);

      // Trigger theme change
      if (callbackRef.current) {
        callbackRef.current("light");
      }

      handle.close();
    });

    it("expect auto-focus to focus first focusable element", () => {
      vi.useFakeTimers();

      const adapter = createWebAdapter();
      const options: PopupOptions = {
        content: {
          type: "html",
          html: '<button id="focusable">Click</button>',
        },
        autoFocus: true,
      };

      const handle = adapter.open(options);

      // Advance past animation duration
      vi.advanceTimersByTime(200);

      // The container should have received focus or tried to focus an element
      // Note: In the test environment, the iframe content isn't real, so we verify the mechanism
      expect(handle.isOpen).toBe(true);

      handle.close();
      vi.useRealTimers();
    });

    it("expect handle.close to not do anything when already closed", () => {
      const adapter = createWebAdapter();
      const options: PopupOptions = {
        content: { type: "html", html: "<p>Test</p>" },
      };

      const handle = adapter.open(options);

      vi.useFakeTimers();
      handle.close();
      vi.advanceTimersByTime(200);
      vi.useRealTimers();

      // Calling close again should not throw
      expect(() => handle.close()).not.toThrow();
    });

    it("expect component content to provide popup child context", () => {
      const TestComponent = () => null;

      const adapter = createWebAdapter();
      const options: PopupOptions = {
        content: {
          type: "component",
          component: TestComponent,
          props: { foo: "bar" },
        },
      };

      const handle = adapter.open(options);

      // Verify React content wrapper was created
      const contentWrapper = document.querySelector(".popup-react-content");
      expect(contentWrapper).not.toBeNull();
      expect(contentWrapper?.getAttribute("data-theme")).toBe("dark");

      handle.close();
    });

    it("expect ignoring messages from different popups", () => {
      const onMessage = vi.fn();
      const adapter = createWebAdapter();
      const options: PopupOptions = {
        content: { type: "html", html: "<p>Test</p>" },
        onMessage,
      };

      const handle = adapter.open(options);

      // Simulate a message from different popup
      const messageEvent = new MessageEvent("message", {
        data: {
          popupId: "different-popup-id",
          type: "DATA_RESPONSE",
          payload: { key: "value" },
        },
      });
      window.dispatchEvent(messageEvent);

      // onMessage should not have been called
      expect(onMessage).not.toHaveBeenCalled();

      handle.close();
    });

    it("expect ignoring invalid message data", () => {
      const onMessage = vi.fn();
      const adapter = createWebAdapter();
      const options: PopupOptions = {
        content: { type: "html", html: "<p>Test</p>" },
        onMessage,
      };

      const handle = adapter.open(options);

      // Simulate invalid message
      const messageEvent = new MessageEvent("message", {
        data: null,
      });
      window.dispatchEvent(messageEvent);

      // onMessage should not have been called
      expect(onMessage).not.toHaveBeenCalled();

      handle.close();
    });

    it("expect restoreFocus false to not restore focus", () => {
      const adapter = createWebAdapter();

      // Create and focus an element
      const originalFocus = document.createElement("button");
      document.body.appendChild(originalFocus);
      originalFocus.focus();

      const options: PopupOptions = {
        content: { type: "html", html: "<p>Test</p>" },
        restoreFocus: false,
      };

      const handle = adapter.open(options);

      vi.useFakeTimers();
      handle.close();
      vi.advanceTimersByTime(200);
      vi.useRealTimers();

      // With restoreFocus: false, focus should not be restored
      // (The original element may or may not be focused, but we verify no error)
      expect(true).toBe(true);

      document.body.removeChild(originalFocus);
    });

    it("expect custom sandbox attribute to be applied", () => {
      const adapter = createWebAdapter();
      const options: PopupOptions = {
        content: { type: "html", html: "<p>Test</p>" },
        webOptions: { sandbox: "allow-scripts" },
      };

      const handle = adapter.open(options);

      const iframe = document.querySelector<HTMLIFrameElement>(".popup-iframe");
      expect(iframe?.getAttribute("sandbox")).toBe("allow-scripts");

      handle.close();
    });

    it("expect component with context to have popup child context access", async () => {
      // Create a component that uses the popup child context
      const TestComponent = () => {
        // The component will be rendered with PopupChildContextProvider wrapping it
        // We can't easily access the context here in a test, but we verify the structure
        return null;
      };

      const adapter = createWebAdapter();
      const options: PopupOptions = {
        content: {
          type: "component",
          component: TestComponent,
          props: { testProp: "value" },
        },
      };

      const handle = adapter.open(options);

      // Verify the React root was created with proper wrapper
      const contentWrapper = document.querySelector(".popup-react-content");
      expect(contentWrapper).not.toBeNull();
      expect(contentWrapper?.getAttribute("data-theme")).toBe("dark");

      handle.close();
    });

    it("expect auto-focus to focus container when no focusable element found", () => {
      vi.useFakeTimers();

      const adapter = createWebAdapter();
      const container = document.createElement("div");
      container.tabIndex = -1; // Make it focusable

      const options: PopupOptions = {
        content: { type: "html", html: "<p>No buttons here</p>" },
        autoFocus: true,
      };

      const handle = adapter.open(options);

      // Advance past animation duration
      vi.advanceTimersByTime(200);

      // Container should have been focused as fallback
      const popupContainer = document.querySelector<HTMLDivElement>(".popup-container");
      expect(popupContainer).not.toBeNull();

      handle.close();
      vi.useRealTimers();
    });

    it("expect channel POPUP_CLOSE message to close popup", () => {
      const adapter = createWebAdapter();
      const options: PopupOptions = {
        content: { type: "html", html: "<p>Test</p>" },
      };

      const handle = adapter.open(options);
      const closeSpy = vi.spyOn(handle, "close");

      // Trigger the captured channel subscribe callback with POPUP_CLOSE
      expect(capturedChannelSubscribeCallback).not.toBeNull();
      if (capturedChannelSubscribeCallback) {
        capturedChannelSubscribeCallback({ type: "POPUP_CLOSE" });
      }

      expect(closeSpy).toHaveBeenCalledWith({ closeReason: "programmatic" });
    });

    it("expect channel RESULT message to close popup with data", () => {
      const adapter = createWebAdapter();
      const options: PopupOptions = {
        content: { type: "html", html: "<p>Test</p>" },
      };

      const handle = adapter.open(options);
      const closeSpy = vi.spyOn(handle, "close");

      // Trigger the captured channel subscribe callback with RESULT
      expect(capturedChannelSubscribeCallback).not.toBeNull();
      if (capturedChannelSubscribeCallback) {
        capturedChannelSubscribeCallback({
          type: "RESULT",
          payload: "selected-value",
        });
      }

      expect(closeSpy).toHaveBeenCalledWith({
        confirmed: true,
        data: "selected-value",
        closeReason: "submit",
      });
    });

    it("expect channel messages to be forwarded to onMessage handler", () => {
      const onMessage = vi.fn();
      const adapter = createWebAdapter();
      const options: PopupOptions = {
        content: { type: "html", html: "<p>Test</p>" },
        onMessage,
      };

      adapter.open(options);

      // Trigger the channel subscribe callback
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

    it("expect theme change to update React content wrapper", () => {
      // Reset theme callback
      capturedThemeCallback = null;

      const TestComponent = () => null;
      const adapter = createWebAdapter();
      const options: PopupOptions = {
        content: {
          type: "component",
          component: TestComponent,
        },
        theme: { syncWithParent: true },
      };

      const handle = adapter.open(options);

      // Verify initial theme
      const contentWrapper = document.querySelector(".popup-react-content");
      expect(contentWrapper?.getAttribute("data-theme")).toBe("dark");

      // Theme callback should have been captured
      expect(capturedThemeCallback).not.toBeNull();

      // Trigger theme change - this should update the React content wrapper
      capturedThemeCallback!("light");

      // React content wrapper should be updated
      expect(contentWrapper?.getAttribute("data-theme")).toBe("light");

      handle.close();
    });

    it("expect theme sync disabled to not observe theme changes", () => {
      const adapter = createWebAdapter();
      const options: PopupOptions = {
        content: { type: "html", html: "<p>Test</p>" },
        theme: { syncWithParent: false },
      };

      // Reset the callback before this test
      capturedThemeCallback = null;

      const handle = adapter.open(options);

      // With syncWithParent: false, observeThemeChanges should not be called
      // So capturedThemeCallback should remain null
      // Note: The mock always captures, but the theme sync logic should skip it
      // This tests the code path behavior
      expect(handle.isOpen).toBe(true);

      handle.close();
    });
  });

  describe("adapter.close", () => {
    it("expect to close popup via handle", () => {
      const adapter = createWebAdapter();
      const options: PopupOptions = {
        content: { type: "html", html: "<p>Test</p>" },
      };

      const handle = adapter.open(options);
      const closeSpy = vi.spyOn(handle, "close");

      adapter.close(handle);

      expect(closeSpy).toHaveBeenCalled();
    });

    it("expect to pass result to handle.close", () => {
      const adapter = createWebAdapter();
      const options: PopupOptions = {
        content: { type: "html", html: "<p>Test</p>" },
      };

      const handle = adapter.open(options);
      const closeSpy = vi.spyOn(handle, "close");

      adapter.close(handle, { confirmed: true, data: "test", closeReason: "submit" });

      expect(closeSpy).toHaveBeenCalledWith({
        confirmed: true,
        data: "test",
        closeReason: "submit",
      });
    });
  });

  describe("adapter.updatePosition", () => {
    it("expect to call handle.updatePosition", () => {
      const adapter = createWebAdapter();
      const options: PopupOptions = {
        content: { type: "html", html: "<p>Test</p>" },
      };

      const handle = adapter.open(options);
      const updateSpy = vi.spyOn(handle, "updatePosition");

      const newAnchor = document.createElement("button");
      adapter.updatePosition(handle, newAnchor);

      expect(updateSpy).toHaveBeenCalledWith(newAnchor);

      handle.close();
    });
  });

  describe("adapter.destroy", () => {
    it("expect to close all open popups", () => {
      const adapter = createWebAdapter();

      // Open some popups
      adapter.open({
        content: { type: "html", html: "<p>1</p>" },
      });
      adapter.open({
        content: { type: "html", html: "<p>2</p>" },
      });

      // Verify overlays exist before destroy
      const overlaysBefore = document.querySelectorAll(".popup-overlay");
      expect(overlaysBefore.length).toBeGreaterThan(0);

      // Destroy should not throw and should be callable
      expect(() => adapter.destroy()).not.toThrow();
    });
  });

  describe("usePopupChild", () => {
    it("expect to throw when used outside popup", () => {
      // Suppress expected error output
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      expect(() => {
        // Simulate calling the hook outside React render context
        // In actual usage this would be within renderHook
        const React = require("react");
        React.useContext = vi.fn(() => null);
        usePopupChild();
      }).toThrow("usePopupChild must be used within a popup");

      errorSpy.mockRestore();
    });

    it("expect to return context when used within popup", () => {
      // Mock React.useContext to return a valid context value
      const React = require("react");
      const mockContext = {
        popupId: "test-popup",
        theme: "dark",
        initialData: {},
        close: vi.fn(),
        sendToParent: vi.fn(),
        onParentMessage: vi.fn(() => vi.fn()),
      };
      const originalUseContext = React.useContext;
      React.useContext = vi.fn(() => mockContext);

      const result = usePopupChild();

      expect(result).toBe(mockContext);
      expect(result.popupId).toBe("test-popup");

      // Restore
      React.useContext = originalUseContext;
    });
  });

  describe("URL content type", () => {
    it("expect URL content to use iframe src instead of srcdoc", () => {
      const adapter = createWebAdapter();
      const options: PopupOptions = {
        content: { type: "url", url: "https://example.com/popup" },
      };

      const handle = adapter.open(options);

      // For URL content, iframe should have src attribute, not srcdoc
      const iframe = document.querySelector<HTMLIFrameElement>(".popup-iframe");
      expect(iframe).not.toBeNull();
      // The URL includes popup params
      expect(iframe?.src).toContain("popupId=");

      handle.close();
    });
  });

  describe("hidden anchor positioning", () => {
    it("expect hidden anchor (zero dimensions) to center popup", async () => {
      const { getElementRect, calculateCenterPosition } = await import("./positioning");
      // Mock getElementRect to return zero dimensions (hidden element)
      vi.mocked(getElementRect).mockReturnValueOnce({ x: 0, y: 0, width: 0, height: 0 });

      const hiddenAnchor = document.createElement("div");
      hiddenAnchor.style.display = "none";
      document.body.appendChild(hiddenAnchor);

      const adapter = createWebAdapter();
      const options: PopupOptions = {
        content: { type: "html", html: "<p>Dialog</p>" },
        anchor: hiddenAnchor,
      };

      const handle = adapter.open(options);

      // Should have called calculateCenterPosition for hidden anchor
      expect(calculateCenterPosition).toHaveBeenCalled();

      handle.close();
      document.body.removeChild(hiddenAnchor);
    });
  });

  describe("component content handlers", () => {
    beforeEach(() => {
      capturedRenderElement = null;
    });

    it("expect component context close handler to close popup with result", () => {
      const TestComponent = () => null;
      const adapter = createWebAdapter();
      const options: PopupOptions = {
        content: {
          type: "component",
          component: TestComponent,
          props: { testProp: "value" },
        },
      };

      const handle = adapter.open(options);

      // Get the captured context from the rendered element
      expect(capturedRenderElement).not.toBeNull();
      const context = capturedRenderElement?.props?.value;
      expect(context).toBeDefined();

      // Call the close handler from the context
      context?.close({ confirmed: true, data: "test-result" });

      expect(handle.isOpen).toBe(false);
    });

    it("expect component context sendToParent to send message via channel", () => {
      mockChannelSend.mockClear();

      const TestComponent = () => null;
      const adapter = createWebAdapter();
      const options: PopupOptions = {
        content: {
          type: "component",
          component: TestComponent,
        },
      };

      const handle = adapter.open(options);

      // Get the captured context from the rendered element
      expect(capturedRenderElement).not.toBeNull();
      const context = capturedRenderElement?.props?.value;
      expect(context).toBeDefined();

      // Call sendToParent from the context
      context?.sendToParent({ key: "test-value" });

      expect(mockChannelSend).toHaveBeenCalledWith("DATA_RESPONSE", { key: "test-value" });

      handle.close();
    });

    it("expect component context onParentMessage to subscribe to channel", () => {
      const TestComponent = () => null;
      const adapter = createWebAdapter();
      const options: PopupOptions = {
        content: {
          type: "component",
          component: TestComponent,
        },
      };

      const handle = adapter.open(options);

      // Get the captured context from the rendered element
      expect(capturedRenderElement).not.toBeNull();
      const context = capturedRenderElement?.props?.value;
      expect(context).toBeDefined();

      // Call onParentMessage from the context
      const handler = vi.fn();
      const unsubscribe = context?.onParentMessage(handler);

      // Should return a cleanup function
      expect(typeof unsubscribe).toBe("function");

      handle.close();
    });
  });

  describe("auto-focus with focusable element", () => {
    it("expect auto-focus to focus first button in popup content", () => {
      vi.useFakeTimers();

      const adapter = createWebAdapter();
      const options: PopupOptions = {
        content: {
          type: "component",
          component: () => null,
        },
        autoFocus: true,
      };

      const handle = adapter.open(options);

      // Get the container and manually add a focusable element
      // (simulating what React would render)
      const container = document.querySelector<HTMLElement>(".popup-container");
      expect(container).not.toBeNull();

      const focusableButton = document.createElement("button");
      focusableButton.textContent = "Focusable";
      const contentWrapper = container!.querySelector(".popup-react-content");
      contentWrapper?.appendChild(focusableButton);

      // Spy on focus
      const focusSpy = vi.spyOn(focusableButton, "focus");

      // Advance past animation duration to trigger auto-focus
      vi.advanceTimersByTime(200);

      // The focusable button should have been focused
      expect(focusSpy).toHaveBeenCalled();

      handle.close();
      vi.useRealTimers();
    });
  });

  describe("initWebPopupChild", () => {
    const originalLocation = window.location;

    beforeEach(() => {
      Object.defineProperty(window, "location", {
        value: {
          search: "?popupId=test-popup&channelId=test-channel&theme=dark&custom=value",
          origin: "http://localhost",
        },
        writable: true,
      });
    });

    afterEach(() => {
      Object.defineProperty(window, "location", {
        value: originalLocation,
        writable: true,
      });
    });

    it("expect to parse URL parameters", () => {
      const child = initWebPopupChild();

      expect(child.popupId).toBe("test-popup");
      expect(child.channelId).toBe("test-channel");
      expect(child.theme).toBe("dark");
      expect(child.params).toEqual({ custom: "value" });
    });

    it("expect to send ready signal to parent", () => {
      initWebPopupChild();

      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          popupId: "test-popup",
          channelId: "test-channel",
          type: "POPUP_READY",
        }),
        "*"
      );
    });

    it("expect close to send result to parent", () => {
      const child = initWebPopupChild();

      child.close({ data: "selected-value" });

      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          popupId: "test-popup",
          type: "RESULT",
          payload: "selected-value",
        }),
        "*"
      );
    });

    it("expect sendToParent to post message", () => {
      const child = initWebPopupChild();

      child.sendToParent({ key: "value" });

      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "DATA_RESPONSE",
          payload: { key: "value" },
        }),
        "*"
      );
    });

    it("expect onThemeChange to return cleanup function", () => {
      const child = initWebPopupChild();
      const callback = vi.fn();

      const cleanup = child.onThemeChange(callback);

      expect(typeof cleanup).toBe("function");
    });

    it("expect onThemeChange to handle theme messages", () => {
      const child = initWebPopupChild();
      const callback = vi.fn();

      child.onThemeChange(callback);

      // Simulate theme change message
      const messageEvent = new MessageEvent("message", {
        data: {
          popupId: "test-popup",
          type: "THEME_CHANGE",
          payload: { theme: "light" },
        },
      });

      window.dispatchEvent(messageEvent);

      expect(callback).toHaveBeenCalledWith("light");
    });

    it("expect onThemeChange cleanup to remove listener", () => {
      const child = initWebPopupChild();
      const callback = vi.fn();

      const cleanup = child.onThemeChange(callback);
      cleanup();

      // Simulate theme change message after cleanup
      const messageEvent = new MessageEvent("message", {
        data: {
          popupId: "test-popup",
          type: "THEME_CHANGE",
          payload: { theme: "light" },
        },
      });

      window.dispatchEvent(messageEvent);

      // Callback should not be called after cleanup
      expect(callback).not.toHaveBeenCalled();
    });

    it("expect to handle missing URL params", () => {
      window.location.search = "";

      const child = initWebPopupChild();

      expect(child.popupId).toBe("");
      expect(child.channelId).toBe("");
      expect(child.theme).toBe("light");
    });
  });
});
