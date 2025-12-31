/**
 * OpenFin Popup Adapter
 *
 * This module provides the OpenFin-specific implementation for the popup system.
 * It uses OpenFin's native showPopupWindow API for creating popups.
 *
 * Features:
 * - Native OpenFin popup windows
 * - Automatic theme synchronization
 * - Parent-child communication via OpenFin channels
 * - Proper cleanup on close
 *
 * @see https://developer.openfin.co/docs/javascript/stable/classes/OpenFin.Window.html#showPopupWindow
 * @module popup/utils/openfinAdapter
 */

import {
  DEFAULT_OPENFIN_BACKGROUND_COLOR,
  DEFAULT_OPENFIN_FRAME,
  DEFAULT_POPUP_HEIGHT,
  DEFAULT_POPUP_MAX_HEIGHT,
  DEFAULT_POPUP_WIDTH,
} from "../constants";
import type {
  PopupAdapter,
  PopupContent,
  PopupHandle,
  PopupOptions,
  PopupRect,
  PopupResult,
} from "../types";

import {
  buildPopupUrl,
  createPopupChannel,
  generateChannelId,
  getCurrentTheme,
  observeThemeChanges,
} from "./communication";
import { calculatePopupPosition, getElementRect, toScreenCoordinates } from "./positioning";

// =============================================================================
// TYPE DECLARATIONS FOR OPENFIN
// =============================================================================

/**
 * Minimal type declarations for OpenFin API.
 * These are the parts we actually use from the OpenFin runtime.
 *
 * In a real project, you'd install @openfin/core or @openfin/node types.
 */

interface OpenFinPopupOptions {
  url?: string;
  name?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  blurBehavior?: "close" | "hide" | "modal";
  resultDispatchBehavior?: "close" | "hide" | "none";
  focus?: boolean;
  hideOnClose?: boolean;
  onPopupReady?: (window: OpenFinWindow) => void;
  onPopupResult?: (result: unknown) => void;
  initialOptions?: {
    frame?: boolean;
    backgroundColor?: string;
    autoShow?: boolean;
    saveWindowState?: boolean;
    contextMenu?: boolean;
    [key: string]: unknown;
  };
  additionalOptions?: {
    customData?: unknown;
    [key: string]: unknown;
  };
}

interface OpenFinPopupResult {
  result: "clicked" | "dismissed";
  data?: unknown;
}

interface OpenFinWindow {
  getOptions: () => Promise<{ customData?: unknown }>;
  close: () => Promise<void>;
  hide: () => Promise<void>;
  show: () => Promise<void>;
  dispatchPopupResult: (data: unknown) => Promise<void>;
}

interface OpenFinView {
  showPopupWindow: (options: OpenFinPopupOptions) => Promise<OpenFinPopupResult>;
}

interface OpenFinFin {
  me: OpenFinView;
  Window: {
    getCurrent: () => Promise<OpenFinWindow>;
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Check if we're running in an OpenFin environment.
 *
 * @returns True if OpenFin runtime is available
 */
export const isOpenFinAvailable = (): boolean => {
  return typeof globalThis !== "undefined" && (globalThis as { fin?: unknown }).fin !== undefined;
};

/**
 * Get the OpenFin fin object.
 *
 * @returns The fin object or undefined
 */
const getFin = (): OpenFinFin | undefined => {
  if (isOpenFinAvailable()) {
    return (globalThis as unknown as { fin: OpenFinFin }).fin;
  }
  return undefined;
};

/**
 * Build the URL for popup content.
 *
 * @param content - The popup content configuration
 * @param channelId - The communication channel ID
 * @param popupId - The popup instance ID
 * @returns The URL to load in the popup
 */
const buildContentUrl = (content: PopupContent, channelId: string, popupId: string): string => {
  const theme = getCurrentTheme();

  switch (content.type) {
    case "url": {
      // Build URL with popup parameters
      let url = content.url;

      // Append existing params if any
      if (content.params) {
        const existingParams = new URLSearchParams(content.params);
        const separator = url.includes("?") ? "&" : "?";
        url = `${url}${separator}${existingParams.toString()}`;
      }

      return buildPopupUrl(url, { popupId, channelId, theme });
    }

    case "component": {
      // For components in OpenFin, we need a route that can render them
      // This assumes you have a /popup route that can handle component names
      const componentName = content.component.displayName || content.component.name || "Unknown";
      const propsJson = content.props ? encodeURIComponent(JSON.stringify(content.props)) : "";

      return buildPopupUrl("/popup", {
        popupId,
        channelId,
        theme,
        data: { component: componentName, props: propsJson },
      });
    }

    case "html": {
      // For HTML content, create a blob URL
      const fullHtml = `
        <!DOCTYPE html>
        <html data-theme="${theme}">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { margin: 0; padding: 8px; font-family: system-ui, sans-serif; }
              ${content.styles || ""}
            </style>
          </head>
          <body>
            ${content.html}
            <script>
              // Send ready signal to parent
              if (window.fin) {
                window.fin.Window.getCurrent().then(w => {
                  w.dispatchPopupResult({ type: 'POPUP_READY', popupId: '${popupId}' });
                });
              }
            </script>
          </body>
        </html>
      `;
      const blob = new Blob([fullHtml], { type: "text/html" });
      return URL.createObjectURL(blob);
    }
  }
};

// =============================================================================
// OPENFIN ADAPTER IMPLEMENTATION
// =============================================================================

/**
 * Store for active popup handles.
 * Maps popup ID to its handle.
 * Using 'any' type parameter since handles can have different result types at runtime.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Map stores handles with varying result types; type safety is enforced at call sites
const activePopups = new Map<string, PopupHandle<any>>();

/**
 * Create an OpenFin popup adapter.
 *
 * @returns The OpenFin popup adapter
 */
export const createOpenFinAdapter = (): PopupAdapter => {
  return {
    environment: "openfin",

    isAvailable: isOpenFinAvailable,

    open: <T = unknown>(options: PopupOptions): PopupHandle<T> => {
      const openFinApi = getFin();
      if (!openFinApi) {
        throw new Error("OpenFin is not available");
      }

      // Generate unique identifiers
      const popupId = `popup-${generateChannelId()}`;
      const channelId = generateChannelId();

      // Create communication channel
      const channel = createPopupChannel({ popupId, channelId });

      // Create result promise
      let resolveResult: (result: PopupResult<T>) => void;
      const resultPromise = new Promise<PopupResult<T>>((resolve) => {
        resolveResult = resolve;
      });

      // Build the popup URL
      const url = buildContentUrl(options.content, channelId, popupId);

      // Calculate position
      let position: { x: number; y: number };
      // OpenFin requires numeric dimensions - use defaults for "auto"
      const width =
        options.width === "auto" ? DEFAULT_POPUP_WIDTH : (options.width ?? DEFAULT_POPUP_WIDTH);
      const height =
        options.height === "auto"
          ? DEFAULT_POPUP_MAX_HEIGHT
          : (options.height ?? DEFAULT_POPUP_HEIGHT);

      if (options.anchor) {
        const anchorRect: PopupRect =
          options.anchor instanceof HTMLElement ? getElementRect(options.anchor) : options.anchor;

        const calculated = calculatePopupPosition(anchorRect, { width, height }, options.position);

        // Convert to screen coordinates for OpenFin
        position = toScreenCoordinates(calculated);
      } else {
        // Center in viewport, then convert to screen
        position = toScreenCoordinates({
          x: (window.innerWidth - width) / 2,
          y: (window.innerHeight - height) / 2,
        });
      }

      // Build OpenFin popup options
      const openfinOptions: OpenFinPopupOptions = {
        url,
        name: popupId,
        x: Math.round(position.x),
        y: Math.round(position.y),
        width,
        height,
        blurBehavior: options.blurBehavior === "none" ? "modal" : "close",
        resultDispatchBehavior: "close",
        focus: options.autoFocus !== false,
        hideOnClose: false,
        initialOptions: {
          frame: options.openfinOptions?.frame ?? DEFAULT_OPENFIN_FRAME,
          backgroundColor:
            options.openfinOptions?.backgroundColor ?? DEFAULT_OPENFIN_BACKGROUND_COLOR,
          autoShow: true,
          saveWindowState: false,
          contextMenu: true,
          ...options.openfinOptions?.additionalOptions,
        },
        additionalOptions: {
          customData: {
            popupId,
            channelId,
            theme: getCurrentTheme(),
            initialData: options.content.type === "component" ? options.content.props : undefined,
          },
        },
        onPopupReady: (popupWindow: OpenFinWindow) => {
          // Store window reference for later
          (handle as { _window?: OpenFinWindow })._window = popupWindow;

          // Call user callback
          options.onOpen?.();
        },
        onPopupResult: (result: unknown) => {
          // Handle result from popup
          const typedResult = result as { type?: string; data?: unknown };

          if (typedResult.type === "RESULT") {
            resolveResult({
              confirmed: true,
              data: typedResult.data as T,
              closeReason: "submit",
            });
          }

          // Forward to message handler
          options.onMessage?.({
            popupId,
            type: (typedResult.type as "RESULT") || "DATA_RESPONSE",
            payload: typedResult.data,
            timestamp: Date.now(),
          });
        },
      };

      // Create handle
      const handle: PopupHandle<T> = {
        id: popupId,
        isOpen: true,

        close: (result?: Partial<PopupResult<T>>) => {
          handle.isOpen = false;

          // Build result object, only including data if defined
          const finalResult: PopupResult<T> = {
            confirmed: result?.confirmed ?? false,
            closeReason: result?.closeReason ?? "programmatic",
          };
          if (result?.data !== undefined) {
            finalResult.data = result.data;
          }

          // Resolve the promise
          resolveResult(finalResult);

          // Cleanup
          channel.destroy();
          activePopups.delete(popupId);
          themeUnsubscribe();

          // Call user callback
          options.onClose?.(finalResult);
        },

        send: <D>(
          type:
            | "POPUP_READY"
            | "POPUP_CLOSE"
            | "POPUP_CLOSED"
            | "THEME_CHANGE"
            | "DATA_UPDATE"
            | "DATA_RESPONSE"
            | "RESULT"
            | "ERROR",
          data?: D
        ) => {
          channel.send(type, data);
        },

        updatePosition: (anchor?: HTMLElement | PopupRect) => {
          // OpenFin popup position is set at creation time
          // For dynamic repositioning, you'd need to close and reopen
          console.warn("[OpenFin Popup] Position update not supported for open popups");
          void anchor; // Suppress unused warning
        },

        result: resultPromise,
      };

      // Subscribe to theme changes
      const themeUnsubscribe = observeThemeChanges((theme) => {
        channel.send("THEME_CHANGE", { theme });
      });

      // Subscribe to channel messages
      channel.subscribe((message) => {
        if (message.type === "POPUP_CLOSE") {
          handle.close({ closeReason: "programmatic" });
        } else if (message.type === "RESULT") {
          resolveResult({
            confirmed: true,
            data: message.payload as T,
            closeReason: "submit",
          });
        }

        // Forward all messages to user handler
        options.onMessage?.(message);
      });

      // Store handle
      activePopups.set(popupId, handle);

      // Open the popup
      openFinApi.me
        .showPopupWindow(openfinOptions)
        .then((result) => {
          if (result.result === "dismissed") {
            handle.close({ closeReason: "blur" });
          }
        })
        .catch((error) => {
          console.error("[OpenFin Popup] Error opening popup:", error);
          options.onError?.(error instanceof Error ? error : new Error(String(error)));
          handle.close({ closeReason: "programmatic" });
        });

      return handle;
    },

    close: (handle: PopupHandle, result?: PopupResult) => {
      if (handle.isOpen) {
        handle.close(result);
      }
    },

    updatePosition: (handle: PopupHandle, anchor?: HTMLElement | PopupRect) => {
      handle.updatePosition(anchor);
    },

    destroy: () => {
      // Close all active popups
      activePopups.forEach((handle) => {
        handle.close({ closeReason: "programmatic" });
      });
      activePopups.clear();
    },
  };
};

// =============================================================================
// CHILD POPUP UTILITIES
// =============================================================================

/**
 * Initialize a popup from within the child window.
 * Call this in your popup content component.
 *
 * @returns Context for the child popup
 */
export const initOpenFinPopupChild = async (): Promise<{
  popupId: string;
  channelId: string;
  theme: "light" | "dark";
  initialData?: unknown;
  close: <T>(result?: Partial<PopupResult<T>>) => Promise<void>;
  sendToParent: <T>(data: T) => Promise<void>;
}> => {
  const openFinApi = getFin();
  if (!openFinApi) {
    throw new Error("OpenFin is not available");
  }

  // Get current window
  const currentWindow = await openFinApi.Window.getCurrent();

  // Get custom data passed from parent
  const options = await currentWindow.getOptions();
  const customData = options.customData as {
    popupId: string;
    channelId: string;
    theme: "light" | "dark";
    initialData?: unknown;
  };

  return {
    ...customData,

    close: async <T>(result?: Partial<PopupResult<T>>) => {
      await currentWindow.dispatchPopupResult({
        type: "RESULT",
        data: result?.data,
        closeReason: result?.closeReason ?? "submit",
      });
    },

    sendToParent: async <T>(data: T) => {
      await currentWindow.dispatchPopupResult({
        type: "DATA_RESPONSE",
        data,
      });
    },
  };
};
