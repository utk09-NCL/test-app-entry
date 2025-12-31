/**
 * Web Popup Adapter
 *
 * This module provides the standard web browser implementation for the popup
 * system. It uses an iframe inside a modal overlay for maximum compatibility
 * and security isolation.
 *
 * Features:
 * - Iframe-based popup with modal overlay
 * - React Portal rendering for component content
 * - Full theme synchronization
 * - Escape key and backdrop click handling
 * - Focus management
 *
 * @module popup/utils/webAdapter
 */

import React from "react";
import { createRoot, Root } from "react-dom/client";

import {
  DEFAULT_ANIMATION_DURATION,
  DEFAULT_IFRAME_SANDBOX,
  DEFAULT_OVERLAY_Z_INDEX,
  DEFAULT_POPUP_HEIGHT,
  DEFAULT_POPUP_MAX_HEIGHT,
  DEFAULT_POPUP_MIN_HEIGHT,
  DEFAULT_POPUP_MIN_WIDTH,
  DEFAULT_POPUP_WIDTH,
  DEFAULT_VIEWPORT_PADDING,
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
  applyTheme,
  createPopupChannel,
  generateChannelId,
  getCurrentTheme,
  observeThemeChanges,
} from "./communication";
import {
  calculateCenterPosition,
  calculatePopupPosition,
  constrainSize,
  getElementRect,
  getViewportSize,
} from "./positioning";

// =============================================================================
// CSS STYLES
// =============================================================================

/**
 * Inline styles for the popup container elements.
 * Using inline styles to avoid CSS module dependencies.
 */
const createStyles = () => {
  const styleId = "popup-web-adapter-styles";

  // Check if styles already exist
  if (document.getElementById(styleId)) {
    return;
  }

  const styleSheet = document.createElement("style");
  styleSheet.id = styleId;
  styleSheet.textContent = `
    .popup-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: ${DEFAULT_OVERLAY_Z_INDEX};
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .popup-overlay--with-backdrop {
      background-color: rgba(0, 0, 0, 0.5);
    }

    .popup-overlay--transparent {
      background-color: transparent;
      pointer-events: none;
    }

    .popup-overlay--transparent-clickable {
      background-color: transparent;
      pointer-events: auto;
    }

    .popup-container {
      position: absolute;
      background: var(--oe-color-surface, #fff);
      border: 1px solid var(--oe-color-border, #e0e0e0);
      border-radius: var(--oe-radius-lg, 8px);
      box-shadow: var(--oe-shadow-lg, 0 10px 25px rgba(0, 0, 0, 0.15));
      overflow: hidden;
      pointer-events: auto;
      animation: popup-enter ${DEFAULT_ANIMATION_DURATION}ms ease-out;
    }

    .popup-container--closing {
      animation: popup-exit ${DEFAULT_ANIMATION_DURATION}ms ease-in forwards;
    }

    .popup-iframe {
      width: 100%;
      height: 100%;
      border: none;
      display: block;
    }

    .popup-react-content {
      overflow: auto;
    }

    @keyframes popup-enter {
      from {
        opacity: 0;
        transform: scale(0.95);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    @keyframes popup-exit {
      from {
        opacity: 1;
        transform: scale(1);
      }
      to {
        opacity: 0;
        transform: scale(0.95);
      }
    }
  `;

  document.head.appendChild(styleSheet);
};

// =============================================================================
// IFRAME CONTENT BUILDERS
// =============================================================================

/**
 * Build HTML content for an iframe with proper theme and structure.
 *
 * @param content - The popup content configuration
 * @param theme - Current theme
 * @param popupId - Popup instance ID
 * @param channelId - Communication channel ID
 * @returns HTML string to use as iframe srcdoc
 */
const buildIframeContent = (
  content: PopupContent,
  theme: "light" | "dark",
  popupId: string,
  channelId: string
): string => {
  let bodyContent = "";
  let additionalStyles = "";
  let additionalScript = "";

  switch (content.type) {
    case "url":
      // For URL content, we'll load it via src, not srcdoc
      // Note: This branch is unreachable - URL content uses iframe.src directly
      return "";

    case "html":
      bodyContent = content.html;
      additionalStyles = content.styles || "";
      break;

    case "component":
      // For component content, we render it via React Portal
      // Note: This branch is unreachable - component content renders via createRoot
      bodyContent = '<div id="popup-root"></div>';
      break;
  }

  return `
    <!DOCTYPE html>
    <html data-theme="${theme}">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          :root {
            color-scheme: ${theme};
          }

          [data-theme="dark"] {
            --oe-color-bg: #0f172a;
            --oe-color-surface: #1e293b;
            --oe-color-border: #334155;
            --oe-color-text: #f8fafc;
            --oe-color-text-secondary: #cbd5e1;
          }

          [data-theme="light"] {
            --oe-color-bg: #ffffff;
            --oe-color-surface: #f8fafc;
            --oe-color-border: #e2e8f0;
            --oe-color-text: #1e293b;
            --oe-color-text-secondary: #64748b;
          }

          body {
            margin: 0;
            padding: 8px;
            font-family: system-ui, -apple-system, sans-serif;
            font-size: 14px;
            background: var(--oe-color-surface);
            color: var(--oe-color-text);
          }

          ${additionalStyles}
        </style>
      </head>
      <body>
        ${bodyContent}
        <script>
          // Popup communication setup
          const POPUP_ID = '${popupId}';
          const CHANNEL_ID = '${channelId}';

          // Send ready signal
          window.parent.postMessage({
            popupId: POPUP_ID,
            channelId: CHANNEL_ID,
            type: 'POPUP_READY',
            timestamp: Date.now()
          }, '*');

          // Listen for theme changes
          window.addEventListener('message', function(event) {
            const data = event.data;
            if (data && data.popupId === POPUP_ID && data.type === 'THEME_CHANGE') {
              document.documentElement.setAttribute('data-theme', data.payload.theme);
            }
          });

          // Helper to close popup with result
          window.closePopup = function(result) {
            window.parent.postMessage({
              popupId: POPUP_ID,
              channelId: CHANNEL_ID,
              type: 'RESULT',
              payload: result,
              timestamp: Date.now()
            }, '*');
          };

          // Helper to send data to parent
          window.sendToParent = function(data) {
            window.parent.postMessage({
              popupId: POPUP_ID,
              channelId: CHANNEL_ID,
              type: 'DATA_RESPONSE',
              payload: data,
              timestamp: Date.now()
            }, '*');
          };

          ${additionalScript}
        </script>
      </body>
    </html>
  `;
};

// =============================================================================
// WEB ADAPTER IMPLEMENTATION
// =============================================================================

/**
 * Store for active popup handles and their DOM elements.
 * Using 'any' type parameter since handles can have different result types at runtime.
 */
interface PopupState {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Handle stores varying result types; type safety is enforced at call sites
  handle: PopupHandle<any>;
  overlay: HTMLDivElement;
  container: HTMLDivElement;
  iframe: HTMLIFrameElement | undefined;
  reactRoot: Root | undefined;
  cleanup: (() => void)[];
}

const activePopups = new Map<string, PopupState>();

/**
 * Create a web popup adapter.
 *
 * @returns The web popup adapter
 */
export const createWebAdapter = (): PopupAdapter => {
  // Ensure styles are injected
  createStyles();

  return {
    environment: "web",

    isAvailable: () => true, // Always available in web

    open: <T = unknown>(options: PopupOptions): PopupHandle<T> => {
      // Generate unique identifiers
      const popupId = `popup-${generateChannelId()}`;
      const channelId = generateChannelId();
      const cleanup: (() => void)[] = [];

      // Get current theme
      const theme = getCurrentTheme(options.theme?.themeSelector, options.theme?.themeAttribute);

      // Create communication channel
      const channel = createPopupChannel({
        popupId,
        channelId,
        forcePostMessage: true, // Use postMessage for iframe communication
      });
      cleanup.push(() => channel.destroy());

      // Create result promise
      let resolveResult: (result: PopupResult<T>) => void;
      const resultPromise = new Promise<PopupResult<T>>((resolve) => {
        resolveResult = resolve;
      });

      // Calculate dimensions
      const viewport = getViewportSize();
      const isAutoWidth = options.width === "auto";
      const isAutoHeight = options.height === "auto";

      // For component content, default to auto sizing
      const defaultWidth = options.content.type === "component" ? "auto" : DEFAULT_POPUP_WIDTH;
      const defaultHeight = options.content.type === "component" ? "auto" : DEFAULT_POPUP_HEIGHT;

      const requestedWidth = options.width !== undefined ? options.width : defaultWidth;
      const requestedHeight = options.height !== undefined ? options.height : defaultHeight;

      // Use sensible defaults for auto-sizing calculations (used for positioning)
      const numericWidth =
        requestedWidth === "auto"
          ? (options.minWidth ?? DEFAULT_POPUP_MIN_WIDTH * 2)
          : requestedWidth;
      const numericHeight =
        requestedHeight === "auto"
          ? (options.minHeight ?? DEFAULT_POPUP_MIN_HEIGHT * 2)
          : requestedHeight;

      const constrainedSize = constrainSize(
        { width: numericWidth, height: numericHeight },
        viewport,
        options.position?.viewportPadding ?? DEFAULT_VIEWPORT_PADDING
      );

      const width = Math.max(
        options.minWidth ?? DEFAULT_POPUP_MIN_WIDTH,
        Math.min(
          constrainedSize.width,
          options.maxWidth ?? viewport.width - DEFAULT_VIEWPORT_PADDING * 2
        )
      );
      const height = Math.max(
        options.minHeight ?? DEFAULT_POPUP_MIN_HEIGHT,
        Math.min(constrainedSize.height, options.maxHeight ?? DEFAULT_POPUP_MAX_HEIGHT)
      );

      // Determine if we should use auto sizing
      const useAutoWidth = isAutoWidth || requestedWidth === "auto";
      const useAutoHeight = isAutoHeight || requestedHeight === "auto";

      // Calculate position
      let position: { x: number; y: number };

      if (options.anchor) {
        const anchorRect: PopupRect =
          options.anchor instanceof HTMLElement ? getElementRect(options.anchor) : options.anchor;

        // If anchor has zero dimensions (hidden element), center the popup instead
        const isHiddenAnchor = anchorRect.width === 0 && anchorRect.height === 0;

        if (isHiddenAnchor) {
          // Center in viewport for hidden anchors (e.g., programmatic dialogs)
          position = calculateCenterPosition({ width, height });
        } else {
          const calculated = calculatePopupPosition(
            anchorRect,
            { width, height },
            options.position
          );
          position = calculated;
        }
      } else {
        // Center in viewport
        position = calculateCenterPosition({ width, height });
      }

      // -----------------------------------------------------------------------
      // Create DOM Elements
      // -----------------------------------------------------------------------

      // Create overlay
      // Use clickable transparent overlay when blur should close (for dropdowns)
      const overlay = document.createElement("div");
      let overlayClass = "popup-overlay";
      if (options.showBackdrop) {
        overlayClass += " popup-overlay--with-backdrop";
      } else if (options.blurBehavior !== "none") {
        // Transparent but clickable - for dropdowns that close on outside click
        overlayClass += " popup-overlay--transparent-clickable";
      } else {
        // Fully transparent and non-interactive - for tooltips
        overlayClass += " popup-overlay--transparent";
      }
      overlay.className = overlayClass;
      overlay.setAttribute("role", "presentation");
      overlay.setAttribute("data-popup-id", popupId);

      // Create container
      const container = document.createElement("div");
      container.className = "popup-container";

      // Check if we should use flexbox centering (for modals with hidden anchors)
      const shouldUseCssCentering =
        options.anchor instanceof HTMLElement &&
        options.anchor.offsetWidth === 0 &&
        options.anchor.offsetHeight === 0;

      if (shouldUseCssCentering) {
        // Use position: static to let the overlay's flexbox centering take effect
        container.style.position = "static";
      } else {
        // Use absolute positioning relative to anchor
        container.style.left = `${position.x}px`;
        container.style.top = `${position.y}px`;
      }

      // Apply width: use fit-content for auto, otherwise use calculated width
      if (useAutoWidth) {
        container.style.width = "fit-content";
        container.style.minWidth = `${options.minWidth ?? DEFAULT_POPUP_MIN_WIDTH}px`;
        container.style.maxWidth = `${options.maxWidth ?? viewport.width - DEFAULT_VIEWPORT_PADDING * 2}px`;
      } else {
        container.style.width = `${width}px`;
      }

      // Apply height: use auto/fit-content for auto, otherwise use calculated height
      if (useAutoHeight) {
        container.style.height = "auto";
        container.style.maxHeight = `${options.maxHeight ?? DEFAULT_POPUP_MAX_HEIGHT}px`;
      } else {
        container.style.height = `${height}px`;
      }

      container.setAttribute("role", options.modal ? "dialog" : "menu");
      container.setAttribute("aria-modal", options.modal ? "true" : "false");

      // Store previous active element for focus restoration
      const previousActiveElement = document.activeElement as HTMLElement | null;

      // -----------------------------------------------------------------------
      // Handle Content Types
      // -----------------------------------------------------------------------

      let iframe: HTMLIFrameElement | undefined;
      let reactRoot: Root | undefined;

      if (options.content.type === "url") {
        // URL content: load in iframe via src
        iframe = document.createElement("iframe");
        iframe.className = "popup-iframe";
        iframe.setAttribute("sandbox", options.webOptions?.sandbox ?? DEFAULT_IFRAME_SANDBOX);

        if (options.webOptions?.allowFullscreen) {
          iframe.setAttribute("allowfullscreen", "true");
        }

        // Build URL with popup parameters
        const url = new URL(options.content.url, window.location.origin);
        url.searchParams.set("popupId", popupId);
        url.searchParams.set("channelId", channelId);
        url.searchParams.set("theme", theme);

        if (options.content.params) {
          Object.entries(options.content.params).forEach(([key, value]) => {
            url.searchParams.set(key, value);
          });
        }

        iframe.src = url.toString();
        container.appendChild(iframe);
      } else if (options.content.type === "html") {
        // HTML content: use srcdoc
        iframe = document.createElement("iframe");
        iframe.className = "popup-iframe";
        iframe.setAttribute("sandbox", options.webOptions?.sandbox ?? DEFAULT_IFRAME_SANDBOX);
        iframe.srcdoc = buildIframeContent(options.content, theme, popupId, channelId);
        container.appendChild(iframe);
      } else if (options.content.type === "component") {
        // React component: render via portal
        const contentWrapper = document.createElement("div");
        contentWrapper.className = "popup-react-content";
        contentWrapper.setAttribute("data-theme", theme);
        container.appendChild(contentWrapper);

        // Create React root and render component
        reactRoot = createRoot(contentWrapper);
        const Component = options.content.component;
        const componentProps = options.content.props || {};

        // Create context for the popup child
        const popupChildContext = {
          popupId,
          theme,
          initialData: componentProps,
          close: <R = unknown>(result?: Partial<PopupResult<R>>) => {
            handle.close({
              confirmed: result?.confirmed ?? true,
              data: result?.data as T,
              closeReason: result?.closeReason ?? "submit",
            });
          },
          sendToParent: <D = unknown>(data: D) => {
            channel.send("DATA_RESPONSE", data);
          },
          onParentMessage: (handler: (message: unknown) => void) => {
            channel.subscribe(handler as () => void);
            return () => {}; // Return noop - subscription lasts until popup closes
          },
        };

        // Render with context - pass children as third argument to createElement
        reactRoot.render(
          React.createElement(
            PopupChildContextProvider,
            { value: popupChildContext },
            React.createElement(
              Component as React.ComponentType<Record<string, unknown>>,
              componentProps as Record<string, unknown>
            )
          )
        );
      }

      // Add container to overlay
      overlay.appendChild(container);

      // Add to DOM
      document.body.appendChild(overlay);

      // -----------------------------------------------------------------------
      // Create Handle
      // -----------------------------------------------------------------------

      const handle: PopupHandle<T> = {
        id: popupId,
        isOpen: true,

        close: (result?: Partial<PopupResult<T>>) => {
          if (!handle.isOpen) return;
          handle.isOpen = false;

          // Animate out
          container.classList.add("popup-container--closing");

          setTimeout(() => {
            // Cleanup React root
            if (reactRoot) {
              reactRoot.unmount();
            }

            // Remove from DOM
            overlay.remove();

            // Run cleanup functions
            cleanup.forEach((fn) => fn());

            // Remove from active popups
            activePopups.delete(popupId);

            // Restore focus
            if (options.restoreFocus !== false && previousActiveElement) {
              previousActiveElement.focus();
            }

            // Resolve promise - build result object, only including data if defined
            const finalResult: PopupResult<T> = {
              confirmed: result?.confirmed ?? false,
              closeReason: result?.closeReason ?? "programmatic",
            };
            if (result?.data !== undefined) {
              finalResult.data = result.data;
            }
            resolveResult(finalResult);

            // Call user callback with the same result object
            options.onClose?.(finalResult);
          }, DEFAULT_ANIMATION_DURATION);
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
          // For iframe content, post message directly
          if (iframe?.contentWindow) {
            iframe.contentWindow.postMessage(
              {
                popupId,
                channelId,
                type,
                payload: data,
                timestamp: Date.now(),
              },
              "*"
            );
          }

          // Also use channel for React content
          channel.send(type, data);
        },

        updatePosition: (anchor?: HTMLElement | PopupRect) => {
          if (!handle.isOpen) return;

          let newPosition: { x: number; y: number };

          if (anchor) {
            const anchorRect: PopupRect =
              anchor instanceof HTMLElement ? getElementRect(anchor) : anchor;

            const calculated = calculatePopupPosition(
              anchorRect,
              { width, height },
              options.position
            );
            newPosition = calculated;
          } else {
            newPosition = calculateCenterPosition({ width, height });
          }

          container.style.left = `${newPosition.x}px`;
          container.style.top = `${newPosition.y}px`;
        },

        result: resultPromise,
      };

      // Store state
      activePopups.set(popupId, {
        handle,
        overlay,
        container,
        iframe,
        reactRoot,
        cleanup,
      });

      // -----------------------------------------------------------------------
      // Event Handlers
      // -----------------------------------------------------------------------

      // Backdrop click handler
      if (options.blurBehavior !== "none") {
        const backdropClickHandler = (event: MouseEvent) => {
          if (event.target === overlay) {
            handle.close({ closeReason: "blur" });
          }
        };
        overlay.addEventListener("click", backdropClickHandler);
        cleanup.push(() => overlay.removeEventListener("click", backdropClickHandler));
      }

      // Escape key handler
      if (options.closeOnEscape !== false) {
        const escapeHandler = (event: KeyboardEvent) => {
          if (event.key === "Escape") {
            handle.close({ closeReason: "escape" });
          }
        };
        document.addEventListener("keydown", escapeHandler);
        cleanup.push(() => document.removeEventListener("keydown", escapeHandler));
      }

      // Theme sync
      if (options.theme?.syncWithParent !== false) {
        const themeUnsubscribe = observeThemeChanges(
          (newTheme) => {
            // Update iframe content
            if (iframe?.contentWindow) {
              handle.send("THEME_CHANGE", { theme: newTheme });
            }

            // Update React content wrapper
            const contentWrapper = container.querySelector(".popup-react-content");
            if (contentWrapper) {
              contentWrapper.setAttribute("data-theme", newTheme);
            }
          },
          options.theme?.themeSelector,
          options.theme?.themeAttribute
        );
        cleanup.push(themeUnsubscribe);
      }

      // Listen for messages from iframe
      const messageHandler = (event: MessageEvent) => {
        const data = event.data;
        if (!data || data.popupId !== popupId) return;

        if (data.type === "POPUP_READY") {
          options.onOpen?.();
        } else if (data.type === "RESULT") {
          handle.close({
            confirmed: true,
            data: data.payload as T,
            closeReason: "submit",
          });
        } else if (data.type === "POPUP_CLOSE") {
          handle.close({ closeReason: "programmatic" });
        }

        // Forward to user handler
        options.onMessage?.({
          popupId,
          type: data.type,
          payload: data.payload,
          timestamp: data.timestamp || Date.now(),
        });
      };
      window.addEventListener("message", messageHandler);
      cleanup.push(() => window.removeEventListener("message", messageHandler));

      // Channel message handler
      channel.subscribe((message) => {
        if (message.type === "POPUP_CLOSE") {
          handle.close({ closeReason: "programmatic" });
        } else if (message.type === "RESULT") {
          handle.close({
            confirmed: true,
            data: message.payload as T,
            closeReason: "submit",
          });
        }

        options.onMessage?.(message);
      });

      // Auto-focus
      if (options.autoFocus !== false) {
        setTimeout(() => {
          // Try to focus first focusable element in container
          const focusable = container.querySelector<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusable) {
            focusable.focus();
          } else {
            container.focus();
          }
        }, DEFAULT_ANIMATION_DURATION);
      }

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
      activePopups.forEach((state) => {
        state.handle.close({ closeReason: "programmatic" });
      });
      activePopups.clear();
    },
  };
};

// =============================================================================
// POPUP CHILD CONTEXT
// =============================================================================

/**
 * Context type for popup child components.
 */
interface PopupChildContextType {
  popupId: string;
  theme: "light" | "dark";
  initialData?: unknown;
  close: <T = unknown>(result?: Partial<PopupResult<T>>) => void;
  sendToParent: <T = unknown>(data: T) => void;
  onParentMessage: (handler: (message: unknown) => void) => () => void;
}

/**
 * React context for popup children.
 */
const PopupChildContext = React.createContext<PopupChildContextType | null>(null);

/**
 * Provider component for popup child context.
 * Using PropsWithChildren to properly type the children prop for React.createElement usage.
 * Note: Function body only executes during actual React render, not in mocked tests
 */
const PopupChildContextProvider = ({
  value,
  children,
}: {
  value: PopupChildContextType;
  children?: React.ReactNode;
}): React.ReactElement => {
  return React.createElement(PopupChildContext.Provider, { value }, children);
};

/**
 * Hook to access popup child context.
 * Use this in components that are rendered inside a popup.
 *
 * @example
 * ```tsx
 * const MyPopupContent = () => {
 *   const { close, sendToParent, theme } = usePopupChild();
 *
 *   return (
 *     <div>
 *       <button onClick={() => close({ data: 'selected' })}>
 *         Confirm
 *       </button>
 *     </div>
 *   );
 * };
 * ```
 *
 * @returns The popup child context
 * @throws Error if used outside a popup
 */
export const usePopupChild = (): PopupChildContextType => {
  const context = React.useContext(PopupChildContext);
  if (!context) {
    throw new Error("usePopupChild must be used within a popup");
  }
  return context;
};

// =============================================================================
// CHILD POPUP INITIALIZATION
// =============================================================================

/**
 * Initialize popup from within an iframe child.
 * Use this when loading a URL in the popup iframe.
 *
 * @returns Context for the child popup
 */
export const initWebPopupChild = (): {
  popupId: string;
  channelId: string;
  theme: "light" | "dark";
  params: Record<string, string>;
  close: <T>(result?: Partial<PopupResult<T>>) => void;
  sendToParent: <T>(data: T) => void;
  onThemeChange: (callback: (theme: "light" | "dark") => void) => () => void;
} => {
  // Parse URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const popupId = urlParams.get("popupId") || "";
  const channelId = urlParams.get("channelId") || "";
  const theme = (urlParams.get("theme") as "light" | "dark") || "light";

  // Collect all other params
  const params: Record<string, string> = {};
  urlParams.forEach((value, key) => {
    if (!["popupId", "channelId", "theme"].includes(key)) {
      params[key] = value;
    }
  });

  // Apply initial theme
  applyTheme(theme);

  // Send ready signal
  window.parent.postMessage(
    {
      popupId,
      channelId,
      type: "POPUP_READY",
      timestamp: Date.now(),
    },
    "*"
  );

  return {
    popupId,
    channelId,
    theme,
    params,

    close: <T>(result?: Partial<PopupResult<T>>) => {
      window.parent.postMessage(
        {
          popupId,
          channelId,
          type: "RESULT",
          payload: result?.data,
          timestamp: Date.now(),
        },
        "*"
      );
    },

    sendToParent: <T>(data: T) => {
      window.parent.postMessage(
        {
          popupId,
          channelId,
          type: "DATA_RESPONSE",
          payload: data,
          timestamp: Date.now(),
        },
        "*"
      );
    },

    onThemeChange: (callback: (theme: "light" | "dark") => void): (() => void) => {
      const handler = (event: MessageEvent) => {
        const data = event.data;
        if (data && data.popupId === popupId && data.type === "THEME_CHANGE") {
          const newTheme = data.payload.theme as "light" | "dark";
          applyTheme(newTheme);
          callback(newTheme);
        }
      };

      window.addEventListener("message", handler);
      return () => window.removeEventListener("message", handler);
    },
  };
};
