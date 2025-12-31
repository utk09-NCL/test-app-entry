/**
 * Popup Module - Cross-Platform Popup System
 *
 * This module provides a unified popup system that works seamlessly
 * in both OpenFin and standard web browser environments.
 *
 * Features:
 * - Cross-platform support (OpenFin native popups, web iframe modals)
 * - Parent-child communication (BroadcastChannel + postMessage)
 * - Theme synchronization (light/dark mode via data-theme attribute)
 * - Custom positioning with viewport boundary handling
 * - Both declarative (component) and imperative (hook) APIs
 *
 * ## Quick Start
 *
 * 1. Wrap your app with PopupProvider:
 * ```tsx
 * import { PopupProvider } from '@/components/popup';
 *
 * function App() {
 *   return (
 *     <PopupProvider>
 *       <YourApp />
 *     </PopupProvider>
 *   );
 * }
 * ```
 *
 * 2. Use the Popup component (declarative):
 * ```tsx
 * import { Popup } from '@/components/popup';
 *
 * function MyComponent() {
 *   return (
 *     <Popup
 *       content={{ type: 'component', component: MenuContent }}
 *       position={{ placement: 'bottom-start' }}
 *     >
 *       <button>Open Menu</button>
 *     </Popup>
 *   );
 * }
 * ```
 *
 * 3. Or use the usePopup hook (imperative):
 * ```tsx
 * import { usePopup } from '@/components/popup';
 *
 * function MyComponent() {
 *   const { isOpen, toggle, triggerRef, triggerProps } = usePopup({
 *     content: { type: 'component', component: MenuContent },
 *   });
 *
 *   return (
 *     <button ref={triggerRef} {...triggerProps}>
 *       Open Menu {isOpen ? '▲' : '▼'}
 *     </button>
 *   );
 * }
 * ```
 *
 * ## Content Types
 *
 * - **URL**: Load a web page in the popup
 *   `{ type: 'url', url: '/popup/calendar', params: { date: '2024-01-15' } }`
 *
 * - **Component**: Render a React component
 *   `{ type: 'component', component: CalendarPicker, props: { onSelect } }`
 *
 * - **HTML**: Render raw HTML content
 *   `{ type: 'html', html: '<p>Hello World</p>', styles: 'p { color: blue; }' }`
 *
 * ## Popup Child Communication
 *
 * Inside a popup component, use the usePopupChild hook:
 * ```tsx
 * import { usePopupChild } from '@/components/popup';
 *
 * function PopupContent() {
 *   const { close, sendToParent, theme } = usePopupChild();
 *
 *   return (
 *     <button onClick={() => close({ data: selectedValue })}>
 *       Confirm
 *     </button>
 *   );
 * }
 * ```
 *
 * @module popup
 */

// =============================================================================
// TYPES
// =============================================================================

export type {
  // Config
  PartialPopupSystemConfig,
  PopupAdapter,
  // Options and Results
  PopupBlurBehavior,
  PopupChannel,
  PopupChildContext,
  // Content
  PopupContent,
  PopupContentComponent,
  PopupContentHtml,
  PopupContentProps,
  PopupContentUrl,
  PopupContextValue,
  // Environment
  PopupEnvironment,
  // Handle and Context
  PopupHandle,
  PopupMessage,
  PopupMessageHandler,
  // Communication
  PopupMessageType,
  PopupOptions,
  // Positioning
  PopupPlacement,
  PopupPosition,
  PopupPositionConfig,
  // Component Props
  PopupProps,
  PopupRect,
  PopupResult,
  PopupSize,
  PopupSystemConfig,
  PopupTheme,
  // Theme
  PopupThemeConfig,
  PopupTriggerProps,
  // Hook Types
  UsePopupOptions,
  UsePopupReturn,
} from "./types";

// =============================================================================
// PROVIDER
// =============================================================================

export { usePopupConfig, usePopupContext, usePopupEnvironment, usePopupTheme } from "./hooks";
export type { PopupProviderProps } from "./PopupProvider";
export { PopupProvider } from "./PopupProvider";

// =============================================================================
// HOOKS (Imperative API)
// =============================================================================

export { useDialog, useDropdown, usePopup, useTooltip } from "./usePopup";

// =============================================================================
// COMPONENTS (Declarative API)
// =============================================================================

export { DialogPopup, DropdownPopup, Popup, PopupTrigger, TooltipPopup } from "./Popup";

// =============================================================================
// CHILD UTILITIES
// =============================================================================

export { initOpenFinPopupChild, isOpenFinAvailable } from "./utils/openfinAdapter";
export { initWebPopupChild, usePopupChild } from "./utils/webAdapter";

// =============================================================================
// POSITIONING UTILITIES
// =============================================================================

export {
  calculateCenterPosition,
  calculatePopupPosition,
  constrainSize,
  getElementRect,
  getViewportSize,
} from "./utils/positioning";

// =============================================================================
// COMMUNICATION UTILITIES
// =============================================================================

export {
  applyTheme,
  buildPopupUrl,
  createPopupChannel,
  getCurrentTheme,
  observeThemeChanges,
} from "./utils/communication";

// =============================================================================
// CONSTANTS
// =============================================================================

export { DEFAULT_POPUP_SYSTEM_CONFIG, mergeConfig } from "./constants";
