/**
 * Popup Context
 *
 * This file creates the React context for popup functionality.
 * Separated from components to satisfy react-refresh requirements.
 *
 * @module popup/context
 */

import { createContext } from "react";

import { DEFAULT_POPUP_SYSTEM_CONFIG } from "./constants";
import type { PopupContextValue, PopupSystemConfig } from "./types";

/**
 * Extended context value that includes system configuration.
 */
export interface PopupContextValueWithConfig extends PopupContextValue {
  /** The merged popup system configuration */
  config: PopupSystemConfig;
}

/**
 * React context for popup functionality.
 * Use usePopupContext() hook to access this in components.
 */
export const PopupContext = createContext<PopupContextValueWithConfig | null>(null);

/**
 * React context for accessing popup configuration.
 * Use usePopupConfig() hook to access this in components.
 */
export const PopupConfigContext = createContext<PopupSystemConfig>(DEFAULT_POPUP_SYSTEM_CONFIG);
