/**
 * Popup System Constants
 *
 * This file contains all configurable default values for the popup system.
 * These can be overridden via PopupProvider props or individual popup options.
 *
 * @module popup/constants
 */

// =============================================================================
// DIMENSION DEFAULTS
// =============================================================================

/** Default popup width in pixels */
export const DEFAULT_POPUP_WIDTH = 300;

/** Default popup height in pixels */
export const DEFAULT_POPUP_HEIGHT = 300;

/** Default maximum popup height in pixels */
export const DEFAULT_POPUP_MAX_HEIGHT = 400;

/** Default minimum popup width in pixels */
export const DEFAULT_POPUP_MIN_WIDTH = 100;

/** Default minimum popup height in pixels */
export const DEFAULT_POPUP_MIN_HEIGHT = 50;

// =============================================================================
// POSITIONING DEFAULTS
// =============================================================================

/** Default offset from anchor element in pixels */
export const DEFAULT_POSITION_OFFSET = 4;

/** Default padding from viewport edges in pixels */
export const DEFAULT_VIEWPORT_PADDING = 8;

/** Default placement relative to anchor */
export const DEFAULT_PLACEMENT = "bottom-start" as const;

/** Whether to flip to opposite side when overflow detected */
export const DEFAULT_FLIP_ENABLED = true;

/** Whether to shift along edge to stay within viewport */
export const DEFAULT_SHIFT_ENABLED = true;

// =============================================================================
// ANIMATION DEFAULTS
// =============================================================================

/** Animation duration in milliseconds */
export const DEFAULT_ANIMATION_DURATION = 150;

// =============================================================================
// Z-INDEX DEFAULTS
// =============================================================================

/** Z-index for popup overlay layer */
export const DEFAULT_OVERLAY_Z_INDEX = 9999;

// =============================================================================
// BEHAVIOR DEFAULTS
// =============================================================================

/** Default blur behavior for popups */
export const DEFAULT_BLUR_BEHAVIOR = "close" as const;

/** Default close on escape behavior */
export const DEFAULT_CLOSE_ON_ESCAPE = true;

/** Default auto focus behavior */
export const DEFAULT_AUTO_FOCUS = true;

/** Default restore focus behavior */
export const DEFAULT_RESTORE_FOCUS = true;

/** Default show backdrop behavior */
export const DEFAULT_SHOW_BACKDROP = false;

/** Default modal behavior */
export const DEFAULT_MODAL = false;

// =============================================================================
// OPENFIN DEFAULTS
// =============================================================================

/** Default OpenFin popup frame visibility */
export const DEFAULT_OPENFIN_FRAME = false;

/** Default OpenFin background color */
export const DEFAULT_OPENFIN_BACKGROUND_COLOR = "#ffffff";

// =============================================================================
// IFRAME DEFAULTS
// =============================================================================

/** Default iframe sandbox attributes */
export const DEFAULT_IFRAME_SANDBOX = "allow-scripts allow-same-origin allow-forms";

// =============================================================================
// THEME DEFAULTS
// =============================================================================

/** Default theme */
export const DEFAULT_THEME = "dark" as const;

/** Default theme attribute name on HTML element */
export const DEFAULT_THEME_ATTRIBUTE = "data-theme";

/** Default theme selector */
export const DEFAULT_THEME_SELECTOR = "html";

// =============================================================================
// COMBINED CONFIG OBJECTS
// =============================================================================

/**
 * Default positioning configuration.
 * Used by calculatePopupPosition when no config provided.
 */
export const DEFAULT_POSITION_CONFIG = {
  placement: DEFAULT_PLACEMENT,
  offset: DEFAULT_POSITION_OFFSET,
  flip: DEFAULT_FLIP_ENABLED,
  shift: DEFAULT_SHIFT_ENABLED,
  viewportPadding: DEFAULT_VIEWPORT_PADDING,
} as const;

/**
 * Default popup dimensions configuration.
 */
export const DEFAULT_DIMENSIONS_CONFIG = {
  width: DEFAULT_POPUP_WIDTH,
  height: DEFAULT_POPUP_HEIGHT,
  minWidth: DEFAULT_POPUP_MIN_WIDTH,
  minHeight: DEFAULT_POPUP_MIN_HEIGHT,
  maxHeight: DEFAULT_POPUP_MAX_HEIGHT,
} as const;

/**
 * Default animation configuration.
 */
export const DEFAULT_ANIMATION_CONFIG = {
  duration: DEFAULT_ANIMATION_DURATION,
} as const;

/**
 * Default behavior configuration.
 */
export const DEFAULT_BEHAVIOR_CONFIG = {
  blurBehavior: DEFAULT_BLUR_BEHAVIOR,
  closeOnEscape: DEFAULT_CLOSE_ON_ESCAPE,
  autoFocus: DEFAULT_AUTO_FOCUS,
  restoreFocus: DEFAULT_RESTORE_FOCUS,
  showBackdrop: DEFAULT_SHOW_BACKDROP,
  modal: DEFAULT_MODAL,
} as const;

/**
 * Complete default popup system configuration.
 * Can be passed to PopupProvider to override all defaults.
 */
export const DEFAULT_POPUP_SYSTEM_CONFIG = {
  dimensions: DEFAULT_DIMENSIONS_CONFIG,
  positioning: DEFAULT_POSITION_CONFIG,
  animation: DEFAULT_ANIMATION_CONFIG,
  behavior: DEFAULT_BEHAVIOR_CONFIG,
  overlay: {
    zIndex: DEFAULT_OVERLAY_Z_INDEX,
  },
  theme: {
    default: DEFAULT_THEME,
    attribute: DEFAULT_THEME_ATTRIBUTE,
    selector: DEFAULT_THEME_SELECTOR,
  },
  openfin: {
    frame: DEFAULT_OPENFIN_FRAME,
    backgroundColor: DEFAULT_OPENFIN_BACKGROUND_COLOR,
  },
  iframe: {
    sandbox: DEFAULT_IFRAME_SANDBOX,
  },
} as const;

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/** Placement options for popup positioning */
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

/** Blur behavior options */
export type BlurBehavior = "close" | "none";

/** Theme options */
export type ThemeOption = "light" | "dark";

/** Dimensions configuration */
export interface DimensionsConfig {
  width: number;
  height: number;
  minWidth: number;
  minHeight: number;
  maxHeight: number;
}

/** Positioning configuration */
export interface PositioningConfig {
  placement: PopupPlacement;
  offset: number;
  flip: boolean;
  shift: boolean;
  viewportPadding: number;
}

/** Animation configuration */
export interface AnimationConfig {
  duration: number;
}

/** Behavior configuration */
export interface BehaviorConfig {
  blurBehavior: BlurBehavior;
  closeOnEscape: boolean;
  autoFocus: boolean;
  restoreFocus: boolean;
  showBackdrop: boolean;
  modal: boolean;
}

/** Overlay configuration */
export interface OverlayConfig {
  zIndex: number;
}

/** Theme configuration */
export interface ThemeConfig {
  default: ThemeOption;
  attribute: string;
  selector: string;
}

/** OpenFin configuration */
export interface OpenFinConfig {
  frame: boolean;
  backgroundColor: string;
}

/** Iframe configuration */
export interface IframeConfig {
  sandbox: string;
}

/**
 * Type for the complete popup system configuration.
 */
export interface PopupSystemConfig {
  dimensions: DimensionsConfig;
  positioning: PositioningConfig;
  animation: AnimationConfig;
  behavior: BehaviorConfig;
  overlay: OverlayConfig;
  theme: ThemeConfig;
  openfin: OpenFinConfig;
  iframe: IframeConfig;
}

/**
 * Type for partial popup system configuration (for overrides).
 * Uses widened types to allow any valid values, not just the defaults.
 */
export type PartialPopupSystemConfig = {
  dimensions?: Partial<DimensionsConfig>;
  positioning?: Partial<PositioningConfig>;
  animation?: Partial<AnimationConfig>;
  behavior?: Partial<BehaviorConfig>;
  overlay?: Partial<OverlayConfig>;
  theme?: Partial<ThemeConfig>;
  openfin?: Partial<OpenFinConfig>;
  iframe?: Partial<IframeConfig>;
};

/**
 * Merge partial config with defaults to create complete config.
 */
export const mergeConfig = (partial?: PartialPopupSystemConfig): PopupSystemConfig => {
  if (!partial) return DEFAULT_POPUP_SYSTEM_CONFIG;

  return {
    dimensions: { ...DEFAULT_DIMENSIONS_CONFIG, ...partial.dimensions },
    positioning: { ...DEFAULT_POSITION_CONFIG, ...partial.positioning },
    animation: { ...DEFAULT_ANIMATION_CONFIG, ...partial.animation },
    behavior: { ...DEFAULT_BEHAVIOR_CONFIG, ...partial.behavior },
    overlay: { ...DEFAULT_POPUP_SYSTEM_CONFIG.overlay, ...partial.overlay },
    theme: { ...DEFAULT_POPUP_SYSTEM_CONFIG.theme, ...partial.theme },
    openfin: { ...DEFAULT_POPUP_SYSTEM_CONFIG.openfin, ...partial.openfin },
    iframe: { ...DEFAULT_POPUP_SYSTEM_CONFIG.iframe, ...partial.iframe },
  };
};
