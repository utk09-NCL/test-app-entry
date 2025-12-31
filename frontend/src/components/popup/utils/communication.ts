/**
 * Popup Communication Utility
 *
 * This module provides a unified communication layer between parent and
 * child popup windows. It uses BroadcastChannel API when available (modern
 * browsers) with a fallback to postMessage for broader compatibility.
 *
 * Features:
 * - Automatic channel management with unique IDs
 * - Type-safe message passing
 * - Theme synchronization support
 * - Cleanup on disconnect
 *
 * @module popup/utils/communication
 */

import type { PopupChannel, PopupMessage, PopupMessageHandler, PopupMessageType } from "../types";

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Prefix for broadcast channel names to avoid collisions with other apps.
 */
const CHANNEL_PREFIX = "popup-channel-";

/**
 * Origin for postMessage communication.
 * Using '*' for development; in production, specify your domain.
 */
const MESSAGE_ORIGIN = "*";

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * Generate a unique channel ID.
 *
 * @returns A unique identifier string
 */
export const generateChannelId = (): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return `${timestamp}-${random}`;
};

/**
 * Check if BroadcastChannel API is available.
 *
 * @returns True if BroadcastChannel is supported
 */
export const isBroadcastChannelSupported = (): boolean => {
  return typeof BroadcastChannel !== "undefined";
};

/**
 * Create a popup message object.
 *
 * @param popupId - The popup instance ID
 * @param type - The message type
 * @param payload - Optional message payload
 * @returns A formatted popup message
 */
export const createMessage = <T>(
  popupId: string,
  type: PopupMessageType,
  payload?: T
): PopupMessage<T> => {
  const message: PopupMessage<T> = {
    popupId,
    type,
    timestamp: Date.now(),
  };

  // Only add payload if provided (satisfies exactOptionalPropertyTypes)
  if (payload !== undefined) {
    message.payload = payload;
  }

  return message;
};

// =============================================================================
// BROADCAST CHANNEL IMPLEMENTATION
// =============================================================================

/**
 * Create a communication channel using BroadcastChannel API.
 *
 * BroadcastChannel provides true bidirectional communication between
 * different windows/tabs/iframes of the same origin.
 *
 * @param channelId - Unique identifier for this channel
 * @param popupId - The popup instance ID for message filtering
 * @returns A PopupChannel instance
 */
const createBroadcastChannel = (channelId: string, popupId: string): PopupChannel => {
  const channel = new BroadcastChannel(`${CHANNEL_PREFIX}${channelId}`);
  const handlers: Set<PopupMessageHandler> = new Set();

  // -------------------------------------------------------------------------
  // Message Reception
  // -------------------------------------------------------------------------

  channel.onmessage = (event: MessageEvent) => {
    const message = event.data as PopupMessage;

    // Only process messages for our popup instance
    if (message.popupId !== popupId) {
      return;
    }

    // Notify all subscribers
    handlers.forEach((handler) => {
      try {
        handler(message);
      } catch (error) {
        console.error("[PopupChannel] Error in message handler:", error);
      }
    });
  };

  channel.onmessageerror = (event) => {
    console.error("[PopupChannel] Message error:", event);
  };

  // -------------------------------------------------------------------------
  // Channel Interface
  // -------------------------------------------------------------------------

  return {
    channelId,

    send: <T>(type: PopupMessageType, payload?: T) => {
      const message = createMessage(popupId, type, payload);
      channel.postMessage(message);
    },

    subscribe: (handler: PopupMessageHandler) => {
      handlers.add(handler);
    },

    destroy: () => {
      handlers.clear();
      channel.close();
    },
  };
};

// =============================================================================
// POSTMESSAGE FALLBACK IMPLEMENTATION
// =============================================================================

/**
 * Create a communication channel using window.postMessage.
 *
 * This is a fallback for environments where BroadcastChannel is not available.
 * It uses a specific message format to identify popup-related messages.
 *
 * @param channelId - Unique identifier for this channel
 * @param popupId - The popup instance ID for message filtering
 * @param targetWindow - The target window to communicate with
 * @returns A PopupChannel instance
 */
const createPostMessageChannel = (
  channelId: string,
  popupId: string,
  targetWindow?: Window | null
): PopupChannel => {
  const handlers: Set<PopupMessageHandler> = new Set();

  // -------------------------------------------------------------------------
  // Message Reception
  // -------------------------------------------------------------------------

  const messageListener = (event: MessageEvent) => {
    // Basic validation - check if it's our message format
    const data = event.data;
    if (!data || typeof data !== "object" || !data.popupId || !data.type) {
      return;
    }

    const message = data as PopupMessage;

    // Only process messages for our popup and channel
    if (message.popupId !== popupId) {
      return;
    }

    // Additional check: verify the message contains our channel marker
    if ((message as PopupMessage & { channelId?: string }).channelId !== channelId) {
      return;
    }

    // Notify all subscribers
    handlers.forEach((handler) => {
      try {
        handler(message);
      } catch (error) {
        console.error("[PopupChannel] Error in message handler:", error);
      }
    });
  };

  // Listen on current window (parent listens for child messages)
  window.addEventListener("message", messageListener);

  // -------------------------------------------------------------------------
  // Channel Interface
  // -------------------------------------------------------------------------

  return {
    channelId,

    send: <T>(type: PopupMessageType, payload?: T) => {
      const message = {
        ...createMessage(popupId, type, payload),
        channelId, // Add channel ID for identification
      };

      // Try to send to target window if available
      if (targetWindow && !targetWindow.closed) {
        targetWindow.postMessage(message, MESSAGE_ORIGIN);
      }

      // Also try parent window (for child-to-parent communication)
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(message, MESSAGE_ORIGIN);
      }

      // Also try opener (for popup windows)
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(message, MESSAGE_ORIGIN);
      }
    },

    subscribe: (handler: PopupMessageHandler) => {
      handlers.add(handler);
    },

    destroy: () => {
      handlers.clear();
      window.removeEventListener("message", messageListener);
    },
  };
};

// =============================================================================
// MAIN EXPORTS
// =============================================================================

/**
 * Options for creating a popup channel.
 */
export interface CreateChannelOptions {
  /** Unique channel identifier (generated if not provided) */
  channelId?: string;
  /** The popup instance ID */
  popupId: string;
  /** Target window for postMessage fallback */
  targetWindow?: Window | null;
  /** Force use of postMessage even if BroadcastChannel is available */
  forcePostMessage?: boolean;
}

/**
 * Create a popup communication channel.
 *
 * Automatically selects the best available communication method:
 * - BroadcastChannel for same-origin communication (preferred)
 * - postMessage for cross-origin or fallback scenarios
 *
 * @example
 * ```ts
 * // In parent window
 * const channel = createPopupChannel({
 *   popupId: 'popup-123',
 *   targetWindow: popupWindow
 * });
 *
 * channel.subscribe((message) => {
 *   if (message.type === 'RESULT') {
 *     console.log('Popup result:', message.payload);
 *   }
 * });
 *
 * channel.send('DATA_UPDATE', { theme: 'dark' });
 *
 * // Cleanup when done
 * channel.destroy();
 * ```
 *
 * @param options - Channel creation options
 * @returns A PopupChannel instance
 */
export const createPopupChannel = (options: CreateChannelOptions): PopupChannel => {
  const channelId = options.channelId ?? generateChannelId();

  // Use BroadcastChannel if available and not forced to use postMessage
  if (isBroadcastChannelSupported() && !options.forcePostMessage) {
    return createBroadcastChannel(channelId, options.popupId);
  }

  // Fall back to postMessage
  return createPostMessageChannel(channelId, options.popupId, options.targetWindow);
};

// =============================================================================
// THEME SYNCHRONIZATION
// =============================================================================

/**
 * Get the current theme from the document.
 *
 * @param selector - CSS selector for the element with theme attribute
 * @param attribute - The attribute name containing the theme value
 * @returns The current theme ('light' or 'dark')
 */
export const getCurrentTheme = (
  selector: string = "html",
  attribute: string = "data-theme"
): "light" | "dark" => {
  const element = document.querySelector(selector);
  const theme = element?.getAttribute(attribute);
  return theme === "dark" ? "dark" : "light";
};

/**
 * Apply a theme to the document.
 *
 * @param theme - The theme to apply
 * @param selector - CSS selector for the element to update
 * @param attribute - The attribute name to set
 */
export const applyTheme = (
  theme: "light" | "dark",
  selector: string = "html",
  attribute: string = "data-theme"
): void => {
  const element = document.querySelector(selector);
  if (element) {
    element.setAttribute(attribute, theme);
  }
};

/**
 * Create a MutationObserver to watch for theme changes.
 *
 * @param callback - Function to call when theme changes
 * @param selector - CSS selector for the element to observe
 * @param attribute - The attribute name to watch
 * @returns A cleanup function to stop observing
 */
export const observeThemeChanges = (
  callback: (theme: "light" | "dark") => void,
  selector: string = "html",
  attribute: string = "data-theme"
): (() => void) => {
  const element = document.querySelector(selector);
  if (!element) {
    console.warn("[PopupChannel] Theme element not found:", selector);
    return () => {};
  }

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "attributes" && mutation.attributeName === attribute) {
        const newTheme = getCurrentTheme(selector, attribute);
        callback(newTheme);
      }
    }
  });

  observer.observe(element, {
    attributes: true,
    attributeFilter: [attribute],
  });

  return () => observer.disconnect();
};

// =============================================================================
// CHILD WINDOW HELPERS
// =============================================================================

/**
 * Parse popup parameters from URL.
 * Used by child windows to get initial configuration.
 *
 * @returns Parsed parameters object
 */
export const parsePopupParams = (): {
  popupId: string;
  channelId: string;
  theme: "light" | "dark";
  data?: unknown;
} => {
  const params = new URLSearchParams(window.location.search);

  return {
    popupId: params.get("popupId") || "",
    channelId: params.get("channelId") || "",
    theme: (params.get("theme") as "light" | "dark") || "light",
    data: params.get("data") ? JSON.parse(decodeURIComponent(params.get("data")!)) : undefined,
  };
};

/**
 * Build URL with popup parameters.
 * Used by parent to create the popup URL.
 *
 * @param baseUrl - The base URL for the popup
 * @param params - Parameters to include in the URL
 * @returns The complete URL with query parameters
 */
export const buildPopupUrl = (
  baseUrl: string,
  params: {
    popupId: string;
    channelId: string;
    theme: "light" | "dark";
    data?: unknown;
  }
): string => {
  const url = new URL(baseUrl, window.location.origin);

  url.searchParams.set("popupId", params.popupId);
  url.searchParams.set("channelId", params.channelId);
  url.searchParams.set("theme", params.theme);

  if (params.data !== undefined) {
    url.searchParams.set("data", encodeURIComponent(JSON.stringify(params.data)));
  }

  return url.toString();
};
