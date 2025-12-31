/**
 * Popup Provider Component
 *
 * This component provides the popup context to the application.
 * It automatically detects the environment (OpenFin or web) and uses
 * the appropriate adapter for creating popups.
 *
 * Usage:
 * ```tsx
 * // Wrap your app with PopupProvider
 * function App() {
 *   return (
 *     <PopupProvider>
 *       <YourApp />
 *     </PopupProvider>
 *   );
 * }
 *
 * // Then use popups anywhere in your app
 * function MyComponent() {
 *   const { open } = usePopupContext();
 *
 *   const handleClick = () => {
 *     open({
 *       content: { type: 'url', url: '/calendar' },
 *       anchor: buttonRef.current,
 *     });
 *   };
 * }
 * ```
 *
 * @module popup/PopupProvider
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { getCurrentTheme } from "./utils/communication";
import { createOpenFinAdapter, isOpenFinAvailable } from "./utils/openfinAdapter";
import { createWebAdapter } from "./utils/webAdapter";
import { mergeConfig } from "./constants";
import { PopupConfigContext, PopupContext, PopupContextValueWithConfig } from "./context";
import type {
  PartialPopupSystemConfig,
  PopupAdapter,
  PopupEnvironment,
  PopupHandle,
  PopupOptions,
  PopupResult,
  PopupSystemConfig,
  PopupTheme,
} from "./types";

// =============================================================================
// TYPES
// =============================================================================

/**
 * Props for the PopupProvider component.
 */
export interface PopupProviderProps {
  /** Child components that will have access to popup context */
  children: React.ReactNode;

  /**
   * Force a specific environment adapter.
   * By default, the provider auto-detects the environment.
   */
  forceEnvironment?: PopupEnvironment;

  /**
   * System configuration for popups.
   * These values override the defaults from constants.ts.
   * Individual popup options will override these.
   */
  config?: PartialPopupSystemConfig;

  /**
   * Default options applied to all popups.
   * Individual popup options will override these.
   */
  defaultOptions?: Partial<PopupOptions>;

  /**
   * Theme configuration for popups.
   * @deprecated Use config.theme instead
   */
  theme?: {
    /** CSS selector for the element with theme attribute */
    selector?: string;
    /** Attribute name that holds the theme value */
    attribute?: string;
  };
}

// =============================================================================
// PROVIDER COMPONENT
// =============================================================================

/**
 * PopupProvider component that provides popup functionality to the app.
 *
 * This component:
 * - Detects the environment (OpenFin or web)
 * - Creates the appropriate popup adapter
 * - Manages active popups
 * - Provides theme synchronization
 *
 * @example
 * ```tsx
 * // Basic usage
 * <PopupProvider>
 *   <App />
 * </PopupProvider>
 *
 * // With default options
 * <PopupProvider
 *   defaultOptions={{
 *     blurBehavior: 'close',
 *     showBackdrop: false,
 *   }}
 * >
 *   <App />
 * </PopupProvider>
 *
 * // Force web environment (for testing)
 * <PopupProvider forceEnvironment="web">
 *   <App />
 * </PopupProvider>
 * ```
 */
export const PopupProvider: React.FC<PopupProviderProps> = ({
  children,
  forceEnvironment,
  config: configOverrides,
  defaultOptions,
  theme,
}) => {
  // -------------------------------------------------------------------------
  // Configuration
  // -------------------------------------------------------------------------

  // Merge config overrides with defaults
  const mergedConfig = useMemo<PopupSystemConfig>(() => {
    return mergeConfig(configOverrides);
  }, [configOverrides]);

  // -------------------------------------------------------------------------
  // State and Refs
  // -------------------------------------------------------------------------

  // Store for active popup handles
  // Using a ref to avoid re-renders when popups open/close
  const openPopupsRef = useRef<Map<string, PopupHandle>>(new Map());

  // Track popup count for re-render triggers when needed
  const [, setPopupCount] = useState(0);

  // Adapter instance
  const adapterRef = useRef<PopupAdapter | null>(null);

  // -------------------------------------------------------------------------
  // Environment Detection and Adapter Creation
  // -------------------------------------------------------------------------

  // Detect environment (only once on mount)
  const environment = useMemo<PopupEnvironment>(() => {
    if (forceEnvironment) {
      return forceEnvironment;
    }
    return isOpenFinAvailable() ? "openfin" : "web";
  }, [forceEnvironment]);

  // Create adapter (only once per environment)
  useEffect(() => {
    // Create the appropriate adapter
    adapterRef.current = environment === "openfin" ? createOpenFinAdapter() : createWebAdapter();

    // Cleanup on unmount
    return () => {
      adapterRef.current?.destroy();
      adapterRef.current = null;
    };
  }, [environment]);

  // -------------------------------------------------------------------------
  // Popup Management Functions
  // -------------------------------------------------------------------------

  /**
   * Open a new popup.
   */
  const open = useCallback(
    <T = unknown,>(options: PopupOptions): PopupHandle<T> => {
      const adapter = adapterRef.current;
      if (!adapter) {
        throw new Error("Popup adapter not initialized");
      }

      // Merge with default options
      const mergedOptions: PopupOptions = {
        ...defaultOptions,
        ...options,
        // Merge theme config
        theme: {
          ...defaultOptions?.theme,
          ...theme,
          ...options.theme,
        },
      };

      // Create the popup
      const handle = adapter.open<T>(mergedOptions);

      // Store the handle
      openPopupsRef.current.set(handle.id, handle as PopupHandle);
      setPopupCount((c) => c + 1);

      // Remove from store when popup closes
      handle.result.finally(() => {
        openPopupsRef.current.delete(handle.id);
        setPopupCount((c) => c - 1);
      });

      return handle;
    },
    [defaultOptions, theme]
  );

  /**
   * Close a popup by ID.
   */
  const close = useCallback((id: string, result?: PopupResult) => {
    const handle = openPopupsRef.current.get(id);
    if (handle) {
      handle.close(result);
    }
  }, []);

  /**
   * Close all open popups.
   */
  const closeAll = useCallback(() => {
    openPopupsRef.current.forEach((handle) => {
      handle.close({ closeReason: "programmatic" });
    });
  }, []);

  /**
   * Get current theme.
   */
  const getTheme = useCallback((): PopupTheme => {
    return getCurrentTheme(theme?.selector, theme?.attribute);
  }, [theme?.selector, theme?.attribute]);

  // -------------------------------------------------------------------------
  // Context Value
  // -------------------------------------------------------------------------

  /**
   * Get currently open popups.
   */
  const getOpenPopups = useCallback(() => {
    return openPopupsRef.current;
  }, []);

  const contextValue = useMemo<PopupContextValueWithConfig>(
    () => ({
      environment,
      config: mergedConfig,
      getOpenPopups,
      open,
      close,
      closeAll,
      getTheme,
    }),
    [environment, mergedConfig, getOpenPopups, open, close, closeAll, getTheme]
  );

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <PopupConfigContext.Provider value={mergedConfig}>
      <PopupContext.Provider value={contextValue}>{children}</PopupContext.Provider>
    </PopupConfigContext.Provider>
  );
};

export default PopupProvider;
