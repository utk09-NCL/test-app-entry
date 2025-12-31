/**
 * Popup Types and Interfaces
 *
 * This file defines all TypeScript types for the cross-platform popup system.
 * The popup system works in both OpenFin and standard web environments.
 *
 * @module popup/types
 */

import React from "react";

// =============================================================================
// ENVIRONMENT DETECTION
// =============================================================================

/**
 * The environment the popup is running in.
 * - 'openfin': Running in OpenFin container (uses native popup windows)
 * - 'web': Running in standard browser (uses iframe modal)
 */
export type PopupEnvironment = "openfin" | "web";

// =============================================================================
// POSITIONING TYPES
// =============================================================================

/**
 * Predefined anchor positions relative to the trigger element.
 *
 * Format: `{side}` or `{side}-{alignment}`
 * - Side: top, bottom, left, right (where popup appears relative to trigger)
 * - Alignment: start, end (alignment along the side)
 *
 * Examples:
 * - 'bottom': Centered below the trigger
 * - 'bottom-start': Below, aligned to the left edge
 * - 'right-end': To the right, aligned to the bottom edge
 */
export type PopupPlacement =
  | "top"
  | "top-start"
  | "top-end"
  | "bottom"
  | "bottom-start"
  | "bottom-end"
  | "left"
  | "left-start"
  | "left-end"
  | "right"
  | "right-start"
  | "right-end";

/**
 * Coordinates representing a position on screen.
 */
export interface PopupPosition {
  /** X coordinate (pixels from left of viewport/screen) */
  x: number;
  /** Y coordinate (pixels from top of viewport/screen) */
  y: number;
}

/**
 * Size dimensions for the popup window.
 */
export interface PopupSize {
  /** Width in pixels */
  width: number;
  /** Height in pixels */
  height: number;
}

/**
 * Bounding rectangle with position and dimensions.
 * Used for trigger element measurements and viewport calculations.
 */
export interface PopupRect extends PopupPosition, PopupSize {}

/**
 * Configuration for popup positioning behavior.
 */
export interface PopupPositionConfig {
  /**
   * Preferred placement relative to the trigger element.
   * @default 'bottom-start'
   */
  placement?: PopupPlacement;

  /**
   * Offset from the trigger element in pixels.
   * @default 4
   */
  offset?: number;

  /**
   * Whether to flip to opposite side if there's not enough space.
   * @default true
   */
  flip?: boolean;

  /**
   * Whether to shift along the side to stay within viewport.
   * @default true
   */
  shift?: boolean;

  /**
   * Minimum padding from viewport edges in pixels.
   * @default 8
   */
  viewportPadding?: number;
}

// =============================================================================
// CONTENT TYPES
// =============================================================================

/**
 * URL-based content - loads a web page in the popup.
 * Works seamlessly in both OpenFin and web environments.
 *
 * @example
 * ```ts
 * const content: PopupContentUrl = {
 *   type: 'url',
 *   url: '/popup/calendar?date=2024-01-15',
 *   // Query params will be appended to the URL
 *   params: { theme: 'dark', locale: 'en-US' }
 * };
 * ```
 */
export interface PopupContentUrl {
  type: "url";
  /** The URL to load in the popup */
  url: string;
  /** Optional query parameters to append to the URL */
  params?: Record<string, string>;
}

/**
 * React component-based content - renders a React component in the popup.
 *
 * In web environment: Renders via React Portal in the iframe.
 * In OpenFin: Serializes props to URL params and loads a component route.
 *
 * @example
 * ```ts
 * const content: PopupContentComponent = {
 *   type: 'component',
 *   component: CalendarPicker,
 *   props: { selectedDate: new Date(), onSelect: handleSelect }
 * };
 * ```
 */
export interface PopupContentComponent<P = Record<string, unknown>> {
  type: "component";
  /** The React component to render */
  component: React.ComponentType<P>;
  /** Props to pass to the component */
  props?: P;
}

/**
 * HTML string content - renders raw HTML in the popup.
 * Useful for simple content or when you need full control over the markup.
 *
 * ⚠️ Security Note: Be careful with user-generated content to avoid XSS.
 *
 * @example
 * ```ts
 * const content: PopupContentHtml = {
 *   type: 'html',
 *   html: '<div class="menu"><button>Option 1</button></div>',
 *   // Optional CSS to inject
 *   styles: '.menu { padding: 8px; }'
 * };
 * ```
 */
export interface PopupContentHtml {
  type: "html";
  /** Raw HTML string to render */
  html: string;
  /** Optional CSS styles to inject */
  styles?: string;
}

/**
 * Union type for all supported popup content types.
 */
export type PopupContent = PopupContentUrl | PopupContentComponent | PopupContentHtml;

// =============================================================================
// THEME TYPES
// =============================================================================

/**
 * Theme mode for the popup.
 * The popup will sync its theme with the parent window.
 */
export type PopupTheme = "light" | "dark";

/**
 * Configuration for theme synchronization.
 */
export interface PopupThemeConfig {
  /**
   * Initial theme to use.
   * If not specified, inherits from parent window's data-theme attribute.
   */
  initialTheme?: PopupTheme;

  /**
   * Whether to automatically sync theme changes from parent.
   * @default true
   */
  syncWithParent?: boolean;

  /**
   * CSS selector for the element that has the data-theme attribute.
   * @default 'html'
   */
  themeSelector?: string;

  /**
   * Attribute name that holds the theme value.
   * @default 'data-theme'
   */
  themeAttribute?: string;
}

// =============================================================================
// COMMUNICATION TYPES
// =============================================================================

/**
 * Message types for parent-child communication.
 */
export type PopupMessageType =
  | "POPUP_READY" // Child signals it's ready to receive data
  | "POPUP_CLOSE" // Request to close the popup
  | "POPUP_CLOSED" // Confirmation that popup was closed
  | "THEME_CHANGE" // Theme update from parent
  | "DATA_UPDATE" // Custom data from parent to child
  | "DATA_RESPONSE" // Custom data from child to parent
  | "RESULT" // Final result from child before closing
  | "ERROR"; // Error occurred in child

/**
 * Structure of messages sent between parent and child.
 */
export interface PopupMessage<T = unknown> {
  /** Unique identifier for this popup instance */
  popupId: string;
  /** Type of message being sent */
  type: PopupMessageType;
  /** Payload data (varies by message type) */
  payload?: T;
  /** Timestamp when message was created */
  timestamp: number;
}

/**
 * Callback for handling messages from the popup.
 */
export type PopupMessageHandler<T = unknown> = (message: PopupMessage<T>) => void;

/**
 * Communication channel between parent and popup.
 */
export interface PopupChannel {
  /** Unique channel identifier (shared between parent and child) */
  channelId: string;
  /** Send a message to the other side */
  send: <T>(type: PopupMessageType, payload?: T) => void;
  /** Subscribe to incoming messages */
  subscribe: (handler: PopupMessageHandler) => void;
  /** Unsubscribe and cleanup */
  destroy: () => void;
}

// =============================================================================
// POPUP OPTIONS
// =============================================================================

/**
 * Behavior when clicking outside the popup.
 * - 'close': Close the popup
 * - 'none': Do nothing
 */
export type PopupBlurBehavior = "close" | "none";

/**
 * Result of a popup interaction.
 * Generic type T represents the data returned by the popup.
 */
export interface PopupResult<T = unknown> {
  /** Whether the popup was closed normally (not dismissed) */
  confirmed: boolean;
  /** Data returned from the popup (undefined if dismissed) */
  data?: T;
  /** Reason for closing: 'submit', 'cancel', 'blur', 'escape' */
  closeReason: "submit" | "cancel" | "blur" | "escape" | "programmatic";
}

/**
 * Configuration options for opening a popup.
 */
export interface PopupOptions {
  // -------------------------------------------------------------------------
  // Content
  // -------------------------------------------------------------------------

  /** Content to display in the popup */
  content: PopupContent;

  // -------------------------------------------------------------------------
  // Sizing
  // -------------------------------------------------------------------------

  /**
   * Width of the popup in pixels, or "auto" for fit-content.
   * @default 300 for URL/HTML content, 'auto' for component content
   */
  width?: number | "auto";

  /**
   * Height of the popup in pixels.
   * @default 'auto' (fit content, up to maxHeight)
   */
  height?: number | "auto";

  /**
   * Minimum width in pixels.
   * @default 100
   */
  minWidth?: number;

  /**
   * Maximum width in pixels.
   * @default viewport width - padding
   */
  maxWidth?: number;

  /**
   * Minimum height in pixels.
   * @default 50
   */
  minHeight?: number;

  /**
   * Maximum height in pixels.
   * @default 400
   */
  maxHeight?: number;

  // -------------------------------------------------------------------------
  // Positioning
  // -------------------------------------------------------------------------

  /**
   * Reference element to position the popup relative to.
   * If not provided, popup will be centered in the viewport.
   */
  anchor?: HTMLElement | PopupRect | null;

  /**
   * Positioning configuration.
   */
  position?: PopupPositionConfig;

  // -------------------------------------------------------------------------
  // Behavior
  // -------------------------------------------------------------------------

  /**
   * Whether clicking outside the popup should close it.
   * @default 'close'
   */
  blurBehavior?: PopupBlurBehavior;

  /**
   * Whether pressing Escape should close the popup.
   * @default true
   */
  closeOnEscape?: boolean;

  /**
   * Whether to show a backdrop/overlay behind the popup.
   * @default false (for dropdowns), true (for dialogs)
   */
  showBackdrop?: boolean;

  /**
   * Whether the popup should block interaction with the parent.
   * @default false
   */
  modal?: boolean;

  /**
   * Focus the first focusable element when popup opens.
   * @default true
   */
  autoFocus?: boolean;

  /**
   * Return focus to trigger element when popup closes.
   * @default true
   */
  restoreFocus?: boolean;

  // -------------------------------------------------------------------------
  // Theme
  // -------------------------------------------------------------------------

  /**
   * Theme configuration for the popup.
   */
  theme?: PopupThemeConfig;

  // -------------------------------------------------------------------------
  // Callbacks
  // -------------------------------------------------------------------------

  /**
   * Called when the popup is opened.
   */
  onOpen?: () => void;

  /**
   * Called when the popup is closed.
   */
  onClose?: (result: PopupResult) => void;

  /**
   * Called when the popup sends a message.
   */
  onMessage?: PopupMessageHandler;

  /**
   * Called when an error occurs in the popup.
   */
  onError?: (error: Error) => void;

  // -------------------------------------------------------------------------
  // OpenFin-specific options
  // -------------------------------------------------------------------------

  /**
   * OpenFin-specific popup options.
   * These are passed directly to OpenFin's showPopupWindow API.
   * @see https://developer.openfin.co/docs/javascript/stable/interfaces/OpenFin.PopupOptions.html
   */
  openfinOptions?: {
    /** Whether the popup should have a frame/title bar */
    frame?: boolean;
    /** Background color of the popup window */
    backgroundColor?: string;
    /** Additional window features */
    additionalOptions?: Record<string, unknown>;
  };

  // -------------------------------------------------------------------------
  // Web-specific options
  // -------------------------------------------------------------------------

  /**
   * Web-specific options for the iframe implementation.
   */
  webOptions?: {
    /** CSS class to apply to the iframe */
    iframeClass?: string;
    /** Sandbox attributes for the iframe */
    sandbox?: string;
    /** Whether to allow the iframe to go fullscreen */
    allowFullscreen?: boolean;
  };
}

// =============================================================================
// POPUP INSTANCE
// =============================================================================

/**
 * Handle for controlling an open popup instance.
 */
export interface PopupHandle<T = unknown> {
  /** Unique identifier for this popup */
  id: string;

  /** Whether the popup is currently open */
  isOpen: boolean;

  /** Close the popup programmatically */
  close: (result?: Partial<PopupResult<T>>) => void;

  /** Send data to the popup */
  send: <D>(type: PopupMessageType, data?: D) => void;

  /** Update the popup's position */
  updatePosition: (anchor?: HTMLElement | PopupRect) => void;

  /** Promise that resolves when the popup closes */
  result: Promise<PopupResult<T>>;
}

// =============================================================================
// POPUP CONTEXT
// =============================================================================

/**
 * Context value provided by PopupProvider.
 * Used internally by popup components.
 */
export interface PopupContextValue {
  /** Current environment (openfin or web) */
  environment: PopupEnvironment;

  /** Get currently open popups (returns a snapshot) */
  getOpenPopups: () => Map<string, PopupHandle>;

  /** Open a new popup */
  open: <T = unknown>(options: PopupOptions) => PopupHandle<T>;

  /** Close a popup by ID */
  close: (id: string, result?: PopupResult) => void;

  /** Close all open popups */
  closeAll: () => void;

  /** Get current theme */
  getTheme: () => PopupTheme;
}

// =============================================================================
// CHILD POPUP CONTEXT
// =============================================================================

/**
 * Context available inside the popup content.
 * This is provided to components rendered within the popup.
 */
export interface PopupChildContext {
  /** ID of this popup instance */
  popupId: string;

  /** Current theme */
  theme: PopupTheme;

  /** Initial data passed to the popup */
  initialData?: unknown;

  /** Close this popup with a result */
  close: <T = unknown>(result?: Partial<PopupResult<T>>) => void;

  /** Send data to the parent window */
  sendToParent: <T = unknown>(data: T) => void;

  /** Subscribe to messages from the parent */
  onParentMessage: (handler: PopupMessageHandler) => () => void;
}

// =============================================================================
// ADAPTER INTERFACE
// =============================================================================

/**
 * Interface that both OpenFin and Web adapters must implement.
 * This abstraction allows the popup system to work identically in both environments.
 */
export interface PopupAdapter {
  /** The environment this adapter is for */
  environment: PopupEnvironment;

  /** Open a popup with the given options */
  open: <T = unknown>(options: PopupOptions) => PopupHandle<T>;

  /** Close a popup by its handle */
  close: (handle: PopupHandle, result?: PopupResult) => void;

  /** Update popup position */
  updatePosition: (handle: PopupHandle, anchor?: HTMLElement | PopupRect) => void;

  /** Check if this adapter should be used (environment detection) */
  isAvailable: () => boolean;

  /** Cleanup all resources */
  destroy: () => void;
}

// =============================================================================
// HOOK TYPES
// =============================================================================

/**
 * Options for the usePopup hook.
 */
export interface UsePopupOptions extends Omit<PopupOptions, "content"> {
  /**
   * Content is optional in hook options - can be provided when opening.
   */
  content?: PopupContent;

  /**
   * Whether the popup is controlled externally.
   * If true, you must provide isOpen and toggle props.
   */
  controlled?: boolean;
}

/**
 * Return value of the usePopup hook.
 */
export interface UsePopupReturn<T = unknown> {
  /** Whether the popup is currently open */
  isOpen: boolean;

  /** Open the popup */
  open: (options?: Partial<PopupOptions>) => PopupHandle<T>;

  /** Close the popup */
  close: (result?: Partial<PopupResult<T>>) => void;

  /** Toggle the popup open/closed */
  toggle: (options?: Partial<PopupOptions>) => void;

  /** Ref to attach to the trigger element for positioning */
  triggerRef: React.RefObject<HTMLElement>;

  /** Props to spread on the trigger element */
  triggerProps: {
    ref: React.RefObject<HTMLElement>;
    onClick: () => void;
    "aria-haspopup": true;
    "aria-expanded": boolean;
  };

  /** Current popup handle (null if closed) */
  handle: PopupHandle<T> | null;
}

// =============================================================================
// COMPONENT PROPS
// =============================================================================

/**
 * Props for the Popup component (declarative API).
 */
export interface PopupProps extends Omit<PopupOptions, "anchor" | "onClose"> {
  /** Whether the popup is open (controlled mode) */
  isOpen?: boolean;

  /** Callback when open state changes */
  onOpenChange?: (isOpen: boolean) => void;

  /** Callback when popup closes with result */
  onClose?: (result: PopupResult) => void;

  /** Trigger element that opens the popup */
  children: React.ReactElement;
}

/**
 * Props for the PopupTrigger component.
 */
export interface PopupTriggerProps {
  /** The trigger element */
  children: React.ReactElement;
  /** Whether clicking the trigger opens the popup */
  asChild?: boolean;
}

/**
 * Props for the PopupContent component.
 */
export interface PopupContentProps {
  /** Content to render in the popup */
  children: React.ReactNode;
  /** Additional class name */
  className?: string;
}

// =============================================================================
// CONFIGURATION TYPES (re-exported from constants.ts)
// =============================================================================

export type { PartialPopupSystemConfig, PopupSystemConfig } from "./constants";
