/**
 * Unit tests for popup communication utilities
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  applyTheme,
  buildPopupUrl,
  createMessage,
  createPopupChannel,
  generateChannelId,
  getCurrentTheme,
  isBroadcastChannelSupported,
  observeThemeChanges,
  parsePopupParams,
} from "./communication";

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

// Mock BroadcastChannel
const mockBcPostMessage = vi.fn();
const mockBcClose = vi.fn();

class MockBroadcastChannel {
  name: string;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onmessageerror: ((event: MessageEvent) => void) | null = null;

  constructor(name: string) {
    this.name = name;
  }

  postMessage = mockBcPostMessage;
  close = mockBcClose;
}

describe("popup/utils/communication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("BroadcastChannel", MockBroadcastChannel);
  });

  describe("generateChannelId", () => {
    it("expect to return a unique string", () => {
      const id1 = generateChannelId();
      const id2 = generateChannelId();

      expect(typeof id1).toBe("string");
      expect(id1.length).toBeGreaterThan(0);
      expect(id1).not.toBe(id2);
    });

    it("expect to return string containing timestamp and random parts", () => {
      const id = generateChannelId();

      // Should have format: timestamp-random
      expect(id).toMatch(/^[a-z0-9]+-[a-z0-9]+$/);
    });
  });

  describe("isBroadcastChannelSupported", () => {
    it("expect to return true when BroadcastChannel is available", () => {
      vi.stubGlobal("BroadcastChannel", MockBroadcastChannel);

      expect(isBroadcastChannelSupported()).toBe(true);
    });

    it("expect to return false when BroadcastChannel is undefined", () => {
      vi.stubGlobal("BroadcastChannel", undefined);

      expect(isBroadcastChannelSupported()).toBe(false);
    });
  });

  describe("createMessage", () => {
    it("expect to create message with required fields", () => {
      const message = createMessage("popup-123", "POPUP_READY");

      expect(message.popupId).toBe("popup-123");
      expect(message.type).toBe("POPUP_READY");
      expect(message.timestamp).toBeDefined();
      expect(typeof message.timestamp).toBe("number");
    });

    it("expect to include payload when provided", () => {
      const payload = { data: "test" };
      const message = createMessage("popup-123", "DATA_UPDATE", payload);

      expect(message.payload).toEqual(payload);
    });

    it("expect to not include payload when undefined", () => {
      const message = createMessage("popup-123", "POPUP_CLOSE");

      expect(message).not.toHaveProperty("payload");
    });

    it("expect to work with different message types", () => {
      const types = [
        "POPUP_READY",
        "POPUP_CLOSE",
        "POPUP_CLOSED",
        "THEME_CHANGE",
        "DATA_UPDATE",
        "DATA_RESPONSE",
        "RESULT",
        "ERROR",
      ] as const;

      types.forEach((type) => {
        const message = createMessage("popup-123", type);
        expect(message.type).toBe(type);
      });
    });
  });

  describe("createPopupChannel", () => {
    it("expect to create channel with generated channelId", () => {
      const channel = createPopupChannel({ popupId: "popup-123" });

      expect(channel.channelId).toBeDefined();
      expect(channel.channelId.length).toBeGreaterThan(0);

      channel.destroy();
    });

    it("expect to use provided channelId", () => {
      const channel = createPopupChannel({
        popupId: "popup-123",
        channelId: "custom-channel",
      });

      expect(channel.channelId).toBe("custom-channel");

      channel.destroy();
    });

    it("expect to use BroadcastChannel when available", () => {
      vi.stubGlobal("BroadcastChannel", MockBroadcastChannel);

      const channel = createPopupChannel({ popupId: "popup-123" });

      channel.send("POPUP_READY");
      expect(mockBcPostMessage).toHaveBeenCalled();

      channel.destroy();
      expect(mockBcClose).toHaveBeenCalled();
    });

    it("expect to fall back to postMessage when BroadcastChannel unavailable", () => {
      vi.stubGlobal("BroadcastChannel", undefined);

      const mockPostMessage = vi.fn();
      vi.stubGlobal("postMessage", mockPostMessage);

      const channel = createPopupChannel({ popupId: "popup-123" });

      expect(channel.channelId).toBeDefined();

      channel.destroy();
    });

    it("expect to force postMessage when forcePostMessage is true", () => {
      vi.stubGlobal("BroadcastChannel", MockBroadcastChannel);

      const channel = createPopupChannel({
        popupId: "popup-123",
        forcePostMessage: true,
      });

      channel.send("POPUP_READY");
      // Should NOT use BroadcastChannel
      expect(mockBcPostMessage).not.toHaveBeenCalled();

      channel.destroy();
    });

    it("expect subscribe to add handler", () => {
      const channel = createPopupChannel({ popupId: "popup-123" });
      const handler = vi.fn();

      channel.subscribe(handler);

      channel.destroy();
    });

    it("expect destroy to clean up resources", () => {
      vi.stubGlobal("BroadcastChannel", MockBroadcastChannel);

      const channel = createPopupChannel({ popupId: "popup-123" });
      channel.destroy();

      expect(mockBcClose).toHaveBeenCalled();
    });

    it("expect BroadcastChannel onmessage to filter by popupId", () => {
      // Use ref object to avoid TypeScript narrowing issues
      const instanceRef: { current: MockBroadcastChannel | null } = { current: null };

      class TrackingBroadcastChannel extends MockBroadcastChannel {
        constructor(name: string) {
          super(name);
          instanceRef.current = this;
        }
      }

      vi.stubGlobal("BroadcastChannel", TrackingBroadcastChannel);

      const channel = createPopupChannel({ popupId: "popup-123" });
      const handler = vi.fn();
      channel.subscribe(handler);

      // Trigger onmessage with wrong popupId - should be ignored
      instanceRef.current?.onmessage?.(
        new MessageEvent("message", {
          data: { popupId: "wrong-popup", type: "POPUP_READY", timestamp: Date.now() },
        })
      );

      expect(handler).not.toHaveBeenCalled();

      // Trigger onmessage with correct popupId - should call handler
      instanceRef.current?.onmessage?.(
        new MessageEvent("message", {
          data: { popupId: "popup-123", type: "POPUP_READY", timestamp: Date.now() },
        })
      );

      expect(handler).toHaveBeenCalled();

      channel.destroy();
    });

    it("expect BroadcastChannel onmessage handler to catch errors", () => {
      const instanceRef: { current: MockBroadcastChannel | null } = { current: null };

      class TrackingBroadcastChannel extends MockBroadcastChannel {
        constructor(name: string) {
          super(name);
          instanceRef.current = this;
        }
      }

      vi.stubGlobal("BroadcastChannel", TrackingBroadcastChannel);

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const channel = createPopupChannel({ popupId: "popup-123" });
      const errorHandler = vi.fn(() => {
        throw new Error("Handler error");
      });
      channel.subscribe(errorHandler);

      // Trigger onmessage with correct popupId
      instanceRef.current?.onmessage?.(
        new MessageEvent("message", {
          data: { popupId: "popup-123", type: "POPUP_READY", timestamp: Date.now() },
        })
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[PopupChannel] Error in message handler:",
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
      channel.destroy();
    });

    it("expect BroadcastChannel onmessageerror to log error", () => {
      const instanceRef: { current: MockBroadcastChannel | null } = { current: null };

      class TrackingBroadcastChannel extends MockBroadcastChannel {
        constructor(name: string) {
          super(name);
          instanceRef.current = this;
        }
      }

      vi.stubGlobal("BroadcastChannel", TrackingBroadcastChannel);

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const channel = createPopupChannel({ popupId: "popup-123" });

      // Trigger onmessageerror
      instanceRef.current?.onmessageerror?.(new MessageEvent("messageerror"));

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[PopupChannel] Message error:",
        expect.any(MessageEvent)
      );

      consoleErrorSpy.mockRestore();
      channel.destroy();
    });

    it("expect postMessage channel to filter by popupId and channelId", () => {
      vi.stubGlobal("BroadcastChannel", undefined);

      const channel = createPopupChannel({
        popupId: "popup-123",
        channelId: "channel-456",
      });
      const handler = vi.fn();
      channel.subscribe(handler);

      // Message with wrong popupId - should be ignored
      window.dispatchEvent(
        new MessageEvent("message", {
          data: {
            popupId: "wrong-popup",
            channelId: "channel-456",
            type: "POPUP_READY",
            timestamp: Date.now(),
          },
        })
      );

      expect(handler).not.toHaveBeenCalled();

      // Message with wrong channelId - should be ignored
      window.dispatchEvent(
        new MessageEvent("message", {
          data: {
            popupId: "popup-123",
            channelId: "wrong-channel",
            type: "POPUP_READY",
            timestamp: Date.now(),
          },
        })
      );

      expect(handler).not.toHaveBeenCalled();

      // Correct message - should be processed
      window.dispatchEvent(
        new MessageEvent("message", {
          data: {
            popupId: "popup-123",
            channelId: "channel-456",
            type: "POPUP_READY",
            timestamp: Date.now(),
          },
        })
      );

      expect(handler).toHaveBeenCalled();

      channel.destroy();
    });

    it("expect postMessage channel to ignore invalid message formats", () => {
      vi.stubGlobal("BroadcastChannel", undefined);

      const channel = createPopupChannel({ popupId: "popup-123" });
      const handler = vi.fn();
      channel.subscribe(handler);

      // Invalid messages
      window.dispatchEvent(new MessageEvent("message", { data: null }));
      window.dispatchEvent(new MessageEvent("message", { data: "string" }));
      window.dispatchEvent(new MessageEvent("message", { data: { noPopupId: true } }));
      window.dispatchEvent(new MessageEvent("message", { data: { popupId: "p", noType: true } }));

      expect(handler).not.toHaveBeenCalled();

      channel.destroy();
    });

    it("expect postMessage channel handler to catch errors", () => {
      vi.stubGlobal("BroadcastChannel", undefined);

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const channel = createPopupChannel({
        popupId: "popup-123",
        channelId: "channel-456",
      });
      const errorHandler = vi.fn(() => {
        throw new Error("Handler error");
      });
      channel.subscribe(errorHandler);

      window.dispatchEvent(
        new MessageEvent("message", {
          data: {
            popupId: "popup-123",
            channelId: "channel-456",
            type: "POPUP_READY",
            timestamp: Date.now(),
          },
        })
      );

      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
      channel.destroy();
    });

    it("expect postMessage send to post to target window", () => {
      vi.stubGlobal("BroadcastChannel", undefined);

      const mockTargetPostMessage = vi.fn();
      const mockTargetWindow = {
        closed: false,
        postMessage: mockTargetPostMessage,
      } as unknown as Window;

      const channel = createPopupChannel({
        popupId: "popup-123",
        targetWindow: mockTargetWindow,
      });

      channel.send("POPUP_READY");

      expect(mockTargetPostMessage).toHaveBeenCalled();

      channel.destroy();
    });

    it("expect postMessage send to post to parent window", () => {
      vi.stubGlobal("BroadcastChannel", undefined);

      const mockParentPostMessage = vi.fn();
      const originalParent = window.parent;

      Object.defineProperty(window, "parent", {
        value: { postMessage: mockParentPostMessage },
        configurable: true,
      });

      const channel = createPopupChannel({ popupId: "popup-123" });
      channel.send("POPUP_READY");

      expect(mockParentPostMessage).toHaveBeenCalled();

      Object.defineProperty(window, "parent", {
        value: originalParent,
        configurable: true,
      });

      channel.destroy();
    });

    it("expect postMessage send to post to opener window", () => {
      vi.stubGlobal("BroadcastChannel", undefined);

      const mockOpenerPostMessage = vi.fn();
      const originalOpener = window.opener;

      Object.defineProperty(window, "opener", {
        value: { closed: false, postMessage: mockOpenerPostMessage },
        configurable: true,
      });

      const channel = createPopupChannel({ popupId: "popup-123" });
      channel.send("POPUP_READY");

      expect(mockOpenerPostMessage).toHaveBeenCalled();

      Object.defineProperty(window, "opener", {
        value: originalOpener,
        configurable: true,
      });

      channel.destroy();
    });
  });

  describe("getCurrentTheme", () => {
    beforeEach(() => {
      // Reset document state
      document.documentElement.removeAttribute("data-theme");
    });

    it("expect to return light when no theme set", () => {
      const theme = getCurrentTheme();

      expect(theme).toBe("light");
    });

    it("expect to return dark when data-theme is dark", () => {
      document.documentElement.setAttribute("data-theme", "dark");

      const theme = getCurrentTheme();

      expect(theme).toBe("dark");
    });

    it("expect to return light when data-theme is light", () => {
      document.documentElement.setAttribute("data-theme", "light");

      const theme = getCurrentTheme();

      expect(theme).toBe("light");
    });

    it("expect to use custom selector", () => {
      const div = document.createElement("div");
      div.id = "theme-container";
      div.setAttribute("data-theme", "dark");
      document.body.appendChild(div);

      const theme = getCurrentTheme("#theme-container");

      expect(theme).toBe("dark");

      document.body.removeChild(div);
    });

    it("expect to use custom attribute", () => {
      document.documentElement.setAttribute("theme", "dark");

      const theme = getCurrentTheme("html", "theme");

      expect(theme).toBe("dark");

      document.documentElement.removeAttribute("theme");
    });

    it("expect to return light for unknown theme values", () => {
      document.documentElement.setAttribute("data-theme", "custom");

      const theme = getCurrentTheme();

      expect(theme).toBe("light");
    });
  });

  describe("applyTheme", () => {
    beforeEach(() => {
      document.documentElement.removeAttribute("data-theme");
    });

    it("expect to set data-theme attribute", () => {
      applyTheme("dark");

      expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    });

    it("expect to set light theme", () => {
      applyTheme("light");

      expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    });

    it("expect to use custom selector", () => {
      const div = document.createElement("div");
      div.id = "theme-container";
      document.body.appendChild(div);

      applyTheme("dark", "#theme-container");

      expect(div.getAttribute("data-theme")).toBe("dark");

      document.body.removeChild(div);
    });

    it("expect to use custom attribute", () => {
      applyTheme("dark", "html", "theme");

      expect(document.documentElement.getAttribute("theme")).toBe("dark");

      document.documentElement.removeAttribute("theme");
    });

    it("expect to handle missing element gracefully", () => {
      // Should not throw
      expect(() => {
        applyTheme("dark", "#non-existent");
      }).not.toThrow();
    });
  });

  describe("observeThemeChanges", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("expect to return cleanup function", () => {
      const callback = vi.fn();
      const cleanup = observeThemeChanges(callback);

      expect(typeof cleanup).toBe("function");

      cleanup();
    });

    it("expect to observe html element by default", () => {
      const callback = vi.fn();
      observeThemeChanges(callback);

      expect(mockObserve).toHaveBeenCalledWith(
        expect.any(Element),
        expect.objectContaining({
          attributes: true,
          attributeFilter: ["data-theme"],
        })
      );
    });

    it("expect to disconnect on cleanup", () => {
      const callback = vi.fn();
      const cleanup = observeThemeChanges(callback);

      cleanup();

      expect(mockDisconnect).toHaveBeenCalled();
    });

    it("expect to return noop when element not found", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const callback = vi.fn();

      const cleanup = observeThemeChanges(callback, "#non-existent");

      expect(warnSpy).toHaveBeenCalledWith(
        "[PopupChannel] Theme element not found:",
        "#non-existent"
      );
      expect(typeof cleanup).toBe("function");

      warnSpy.mockRestore();
    });

    it("expect to use custom selector", () => {
      const div = document.createElement("div");
      div.id = "theme-el";
      document.body.appendChild(div);

      const callback = vi.fn();
      observeThemeChanges(callback, "#theme-el");

      expect(mockObserve).toHaveBeenCalledWith(
        div,
        expect.objectContaining({
          attributes: true,
          attributeFilter: ["data-theme"],
        })
      );

      document.body.removeChild(div);
    });

    it("expect to use custom attribute", () => {
      const callback = vi.fn();
      observeThemeChanges(callback, "html", "theme");

      expect(mockObserve).toHaveBeenCalledWith(
        expect.any(Element),
        expect.objectContaining({
          attributes: true,
          attributeFilter: ["theme"],
        })
      );
    });

    it("expect to call callback when theme attribute changes", () => {
      const callbackRef: { current: MutationCallback | null } = { current: null };

      // Capture the MutationObserver callback
      vi.stubGlobal(
        "MutationObserver",
        class {
          constructor(callback: MutationCallback) {
            callbackRef.current = callback;
          }
          observe = mockObserve;
          disconnect = mockDisconnect;
          takeRecords = vi.fn(() => []);
        }
      );

      document.documentElement.setAttribute("data-theme", "light");

      const callback = vi.fn();
      observeThemeChanges(callback);

      // Change theme
      document.documentElement.setAttribute("data-theme", "dark");

      // Trigger mutation callback
      if (callbackRef.current) {
        callbackRef.current(
          [
            {
              type: "attributes",
              attributeName: "data-theme",
            } as MutationRecord,
          ],
          {} as MutationObserver
        );
      }

      expect(callback).toHaveBeenCalledWith("dark");
    });

    it("expect to ignore mutations for non-theme attributes", () => {
      const callbackRef: { current: MutationCallback | null } = { current: null };

      vi.stubGlobal(
        "MutationObserver",
        class {
          constructor(callback: MutationCallback) {
            callbackRef.current = callback;
          }
          observe = mockObserve;
          disconnect = mockDisconnect;
          takeRecords = vi.fn(() => []);
        }
      );

      const callback = vi.fn();
      observeThemeChanges(callback);

      // Trigger mutation for different attribute
      if (callbackRef.current) {
        callbackRef.current(
          [
            {
              type: "attributes",
              attributeName: "class",
            } as MutationRecord,
          ],
          {} as MutationObserver
        );
      }

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("parsePopupParams", () => {
    const originalLocation = window.location;

    beforeEach(() => {
      // Mock window.location
      Object.defineProperty(window, "location", {
        value: {
          search: "",
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

    it("expect to return empty values when no params", () => {
      window.location.search = "";

      const params = parsePopupParams();

      expect(params.popupId).toBe("");
      expect(params.channelId).toBe("");
      expect(params.theme).toBe("light");
      expect(params.data).toBeUndefined();
    });

    it("expect to parse popupId and channelId", () => {
      window.location.search = "?popupId=popup-123&channelId=channel-456";

      const params = parsePopupParams();

      expect(params.popupId).toBe("popup-123");
      expect(params.channelId).toBe("channel-456");
    });

    it("expect to parse theme", () => {
      window.location.search = "?popupId=p&channelId=c&theme=dark";

      const params = parsePopupParams();

      expect(params.theme).toBe("dark");
    });

    it("expect to parse and decode data", () => {
      const data = { key: "value" };
      const encoded = encodeURIComponent(JSON.stringify(data));
      window.location.search = `?popupId=p&channelId=c&data=${encoded}`;

      const params = parsePopupParams();

      expect(params.data).toEqual(data);
    });
  });

  describe("buildPopupUrl", () => {
    const originalLocation = window.location;

    beforeEach(() => {
      Object.defineProperty(window, "location", {
        value: {
          origin: "http://localhost:3000",
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

    it("expect to build URL with required params", () => {
      const url = buildPopupUrl("/popup", {
        popupId: "popup-123",
        channelId: "channel-456",
        theme: "dark",
      });

      expect(url).toContain("popupId=popup-123");
      expect(url).toContain("channelId=channel-456");
      expect(url).toContain("theme=dark");
    });

    it("expect to handle absolute URLs", () => {
      const url = buildPopupUrl("http://example.com/popup", {
        popupId: "p",
        channelId: "c",
        theme: "light",
      });

      expect(url).toMatch(/^http:\/\/example\.com\/popup/);
    });

    it("expect to encode data parameter", () => {
      const data = { nested: { value: "test" } };
      const url = buildPopupUrl("/popup", {
        popupId: "p",
        channelId: "c",
        theme: "light",
        data,
      });

      expect(url).toContain("data=");
      // Verify it's properly encoded
      const urlObj = new URL(url);
      const encodedData = urlObj.searchParams.get("data");
      expect(JSON.parse(decodeURIComponent(encodedData!))).toEqual(data);
    });

    it("expect to not include data when undefined", () => {
      const url = buildPopupUrl("/popup", {
        popupId: "p",
        channelId: "c",
        theme: "light",
        data: undefined,
      });

      expect(url).not.toContain("data=");
    });
  });
});
