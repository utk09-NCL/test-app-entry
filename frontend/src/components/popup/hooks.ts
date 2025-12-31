/**
 * Popup Context Hooks
 *
 * This file contains hooks for accessing popup context.
 * Separated from PopupProvider.tsx to satisfy react-refresh requirements.
 *
 * @module popup/hooks
 */

import { useContext, useEffect, useState } from "react";

import { PopupConfigContext, PopupContext, PopupContextValueWithConfig } from "./context";
import type { PopupEnvironment, PopupSystemConfig, PopupTheme } from "./types";

// =============================================================================
// CONTEXT HOOK
// =============================================================================

/**
 * Hook to access the popup context.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { open, close, getTheme, environment } = usePopupContext();
 *
 *   const handleOpenPopup = () => {
 *     const handle = open({
 *       content: { type: 'url', url: '/popup/calendar' },
 *       anchor: buttonRef.current,
 *       position: { placement: 'bottom-start' },
 *     });
 *
 *     handle.result.then((result) => {
 *       if (result.confirmed) {
 *         console.log('Selected:', result.data);
 *       }
 *     });
 *   };
 *
 *   return (
 *     <button ref={buttonRef} onClick={handleOpenPopup}>
 *       Open Calendar
 *     </button>
 *   );
 * }
 * ```
 *
 * @returns The popup context value
 * @throws Error if used outside PopupProvider
 */
export const usePopupContext = (): PopupContextValueWithConfig => {
  const context = useContext(PopupContext);
  if (!context) {
    throw new Error("usePopupContext must be used within a PopupProvider");
  }
  return context;
};

// =============================================================================
// UTILITY HOOKS
// =============================================================================

/**
 * Hook to get the current popup environment.
 *
 * @returns 'openfin' or 'web'
 */
export const usePopupEnvironment = (): PopupEnvironment => {
  const { environment } = usePopupContext();
  return environment;
};

/**
 * Hook to get the current theme for popups.
 *
 * @returns 'light' or 'dark'
 */
export const usePopupTheme = (): PopupTheme => {
  const { getTheme } = usePopupContext();
  const [currentTheme, setCurrentTheme] = useState(getTheme);

  useEffect(() => {
    // Update theme when it changes
    const observer = new MutationObserver(() => {
      setCurrentTheme(getTheme());
    });

    const element = document.querySelector("html");
    if (element) {
      observer.observe(element, {
        attributes: true,
        attributeFilter: ["data-theme"],
      });
    }

    return () => observer.disconnect();
  }, [getTheme]);

  return currentTheme;
};

/**
 * Hook to get the popup system configuration.
 * Can be used outside of PopupProvider (will return defaults).
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const config = usePopupConfig();
 *   console.log('Animation duration:', config.animation.duration);
 * }
 * ```
 *
 * @returns The popup system configuration
 */
export const usePopupConfig = (): PopupSystemConfig => {
  return useContext(PopupConfigContext);
};
