/**
 * Popup Positioning Utility
 *
 * This module handles calculating the optimal position for popups relative
 * to their trigger elements, with automatic handling of viewport boundaries.
 *
 * Features:
 * - Automatic flip to opposite side when not enough space
 * - Shift along the edge to stay within viewport
 * - Customizable offset and padding
 * - Support for all 12 placement positions
 *
 * @module popup/utils/positioning
 */

import { DEFAULT_POSITION_CONFIG } from "../constants";
import type {
  PopupPlacement,
  PopupPosition,
  PopupPositionConfig,
  PopupRect,
  PopupSize,
} from "../types";

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get the bounding rectangle of an HTML element.
 *
 * @param element - The HTML element to measure
 * @returns The bounding rectangle with x, y, width, height
 */
export const getElementRect = (element: HTMLElement): PopupRect => {
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left,
    y: rect.top,
    width: rect.width,
    height: rect.height,
  };
};

/**
 * Get the viewport dimensions.
 *
 * @returns The viewport width and height
 */
export const getViewportSize = (): PopupSize => ({
  width: window.innerWidth,
  height: window.innerHeight,
});

/**
 * Parse a placement string into its side and alignment components.
 *
 * @example
 * parsePlacement('bottom-start') // { side: 'bottom', alignment: 'start' }
 * parsePlacement('left')         // { side: 'left', alignment: 'center' }
 *
 * @param placement - The placement string to parse
 * @returns Object containing side and alignment
 */
export const parsePlacement = (
  placement: PopupPlacement
): { side: "top" | "bottom" | "left" | "right"; alignment: "start" | "center" | "end" } => {
  const parts = placement.split("-") as [string, string?];
  const side = parts[0] as "top" | "bottom" | "left" | "right";
  const alignment = (parts[1] as "start" | "end" | undefined) ?? "center";
  return { side, alignment };
};

/**
 * Get the opposite side for flipping.
 *
 * @param side - The current side
 * @returns The opposite side
 */
export const getOppositeSide = (
  side: "top" | "bottom" | "left" | "right"
): "top" | "bottom" | "left" | "right" => {
  const opposites = {
    top: "bottom",
    bottom: "top",
    left: "right",
    right: "left",
  } as const;
  return opposites[side];
};

/**
 * Reconstruct a placement string from side and alignment.
 *
 * @param side - The side component
 * @param alignment - The alignment component
 * @returns The full placement string
 */
export const buildPlacement = (
  side: "top" | "bottom" | "left" | "right",
  alignment: "start" | "center" | "end"
): PopupPlacement => {
  if (alignment === "center") {
    return side as PopupPlacement;
  }
  return `${side}-${alignment}` as PopupPlacement;
};

// =============================================================================
// MAIN POSITIONING LOGIC
// =============================================================================

/**
 * Calculate the base position for a popup based on placement.
 *
 * This function calculates where the popup should be positioned relative
 * to the anchor element, without considering viewport boundaries.
 *
 * @param anchorRect - The anchor element's bounding rectangle
 * @param popupSize - The popup's dimensions
 * @param placement - The desired placement
 * @param offset - Distance from the anchor in pixels
 * @returns The calculated position (x, y)
 */
export const calculateBasePosition = (
  anchorRect: PopupRect,
  popupSize: PopupSize,
  placement: PopupPlacement,
  offset: number
): PopupPosition => {
  const { side, alignment } = parsePlacement(placement);

  let x: number;
  let y: number;

  // -------------------------------------------------------------------------
  // Calculate position based on side (which edge of anchor to attach to)
  // -------------------------------------------------------------------------

  switch (side) {
    case "top":
      // Popup appears above the anchor
      y = anchorRect.y - popupSize.height - offset;
      break;
    case "bottom":
      // Popup appears below the anchor
      y = anchorRect.y + anchorRect.height + offset;
      break;
    case "left":
      // Popup appears to the left of the anchor
      x = anchorRect.x - popupSize.width - offset;
      break;
    case "right":
      // Popup appears to the right of the anchor
      x = anchorRect.x + anchorRect.width + offset;
      break;
  }

  // -------------------------------------------------------------------------
  // Calculate alignment along the perpendicular axis
  // -------------------------------------------------------------------------

  if (side === "top" || side === "bottom") {
    // Horizontal alignment for top/bottom placements
    switch (alignment) {
      case "start":
        x = anchorRect.x;
        break;
      case "center":
        x = anchorRect.x + anchorRect.width / 2 - popupSize.width / 2;
        break;
      case "end":
        x = anchorRect.x + anchorRect.width - popupSize.width;
        break;
    }
  } else {
    // Vertical alignment for left/right placements
    switch (alignment) {
      case "start":
        y = anchorRect.y;
        break;
      case "center":
        y = anchorRect.y + anchorRect.height / 2 - popupSize.height / 2;
        break;
      case "end":
        y = anchorRect.y + anchorRect.height - popupSize.height;
        break;
    }
  }

  // TypeScript needs help understanding that x and y are always assigned
  return { x: x!, y: y! };
};

/**
 * Check if a position would overflow the viewport.
 *
 * @param position - The proposed position
 * @param popupSize - The popup's dimensions
 * @param viewport - The viewport dimensions
 * @param padding - Minimum distance from viewport edges
 * @returns Object indicating overflow on each side
 */
export const checkOverflow = (
  position: PopupPosition,
  popupSize: PopupSize,
  viewport: PopupSize,
  padding: number
): { top: number; right: number; bottom: number; left: number } => ({
  top: padding - position.y,
  right: position.x + popupSize.width - (viewport.width - padding),
  bottom: position.y + popupSize.height - (viewport.height - padding),
  left: padding - position.x,
});

/**
 * Determine if the popup should flip to the opposite side.
 *
 * @param overflow - Overflow amounts on each side
 * @param side - Current placement side
 * @returns True if flipping would improve the situation
 */
export const shouldFlip = (
  overflow: { top: number; right: number; bottom: number; left: number },
  side: "top" | "bottom" | "left" | "right"
): boolean => {
  switch (side) {
    case "top":
      return overflow.top > 0;
    case "bottom":
      return overflow.bottom > 0;
    case "left":
      return overflow.left > 0;
    case "right":
      return overflow.right > 0;
  }
};

/**
 * Apply shift to keep the popup within viewport bounds.
 *
 * @param position - Current position
 * @param overflow - Overflow amounts on each side
 * @param side - Current placement side
 * @returns Adjusted position after shifting
 */
export const applyShift = (
  position: PopupPosition,
  overflow: { top: number; right: number; bottom: number; left: number },
  side: "top" | "bottom" | "left" | "right"
): PopupPosition => {
  const result = { ...position };

  if (side === "top" || side === "bottom") {
    // For top/bottom placements, shift horizontally
    if (overflow.left > 0) {
      result.x += overflow.left;
    } else if (overflow.right > 0) {
      result.x -= overflow.right;
    }
  } else {
    // For left/right placements, shift vertically
    if (overflow.top > 0) {
      result.y += overflow.top;
    } else if (overflow.bottom > 0) {
      result.y -= overflow.bottom;
    }
  }

  return result;
};

// =============================================================================
// MAIN EXPORT
// =============================================================================

/**
 * Result of position calculation including final placement.
 */
export interface PositionResult {
  /** The calculated x position */
  x: number;
  /** The calculated y position */
  y: number;
  /** The actual placement after flip adjustments */
  placement: PopupPlacement;
  /** Whether the popup was flipped to the opposite side */
  flipped: boolean;
}

/**
 * Calculate the optimal position for a popup.
 *
 * This is the main function to call for positioning popups. It handles:
 * 1. Calculating base position from anchor and placement
 * 2. Checking viewport overflow
 * 3. Flipping to opposite side if needed
 * 4. Shifting along the edge to stay within bounds
 *
 * @example
 * ```ts
 * // Get position for a dropdown
 * const result = calculatePopupPosition(
 *   buttonElement.getBoundingClientRect(),
 *   { width: 200, height: 300 },
 *   { placement: 'bottom-start', offset: 4 }
 * );
 *
 * popupElement.style.left = `${result.x}px`;
 * popupElement.style.top = `${result.y}px`;
 * ```
 *
 * @param anchor - The anchor element's bounding rectangle or position
 * @param popupSize - The popup's dimensions (width, height)
 * @param config - Positioning configuration options
 * @returns The calculated position and final placement
 */
export const calculatePopupPosition = (
  anchor: PopupRect | HTMLElement,
  popupSize: PopupSize,
  config: PopupPositionConfig = {}
): PositionResult => {
  // Merge with defaults
  const options: Required<PopupPositionConfig> = {
    ...DEFAULT_POSITION_CONFIG,
    ...config,
  };

  // Get anchor rect (handle both HTMLElement and PopupRect)
  const anchorRect: PopupRect = anchor instanceof HTMLElement ? getElementRect(anchor) : anchor;

  // Get viewport dimensions
  const viewport = getViewportSize();

  // Parse initial placement
  let { side, alignment } = parsePlacement(options.placement);
  let flipped = false;

  // Calculate initial position
  let position = calculateBasePosition(anchorRect, popupSize, options.placement, options.offset);

  // Check overflow
  let overflow = checkOverflow(position, popupSize, viewport, options.viewportPadding);

  // -------------------------------------------------------------------------
  // Flip Logic: Try opposite side if there's overflow
  // -------------------------------------------------------------------------

  if (options.flip && shouldFlip(overflow, side)) {
    const oppositeSide = getOppositeSide(side);
    const flippedPlacement = buildPlacement(oppositeSide, alignment);

    // Calculate position with flipped placement
    const flippedPosition = calculateBasePosition(
      anchorRect,
      popupSize,
      flippedPlacement,
      options.offset
    );

    // Check if flipped position has less overflow
    const flippedOverflow = checkOverflow(
      flippedPosition,
      popupSize,
      viewport,
      options.viewportPadding
    );

    // Determine if flip improves the situation
    // Compare the relevant overflow direction
    const currentOverflow =
      side === "top" || side === "bottom"
        ? Math.max(overflow.top, overflow.bottom)
        : Math.max(overflow.left, overflow.right);

    const newOverflow =
      oppositeSide === "top" || oppositeSide === "bottom"
        ? Math.max(flippedOverflow.top, flippedOverflow.bottom)
        : Math.max(flippedOverflow.left, flippedOverflow.right);

    if (newOverflow < currentOverflow) {
      // Use flipped position
      side = oppositeSide;
      position = flippedPosition;
      overflow = flippedOverflow;
      flipped = true;
    }
  }

  // -------------------------------------------------------------------------
  // Shift Logic: Adjust position to stay within viewport
  // -------------------------------------------------------------------------

  if (options.shift) {
    position = applyShift(position, overflow, side);
  }

  // Build final placement string
  const finalPlacement = buildPlacement(side, alignment);

  return {
    x: Math.round(position.x),
    y: Math.round(position.y),
    placement: finalPlacement,
    flipped,
  };
};

// =============================================================================
// ADDITIONAL UTILITIES
// =============================================================================

/**
 * Calculate center position in the viewport.
 * Used when no anchor is provided (dialog mode).
 *
 * @param popupSize - The popup's dimensions
 * @param viewport - Optional viewport size (defaults to window)
 * @returns The center position
 */
export const calculateCenterPosition = (
  popupSize: PopupSize,
  viewport: PopupSize = getViewportSize()
): PopupPosition => ({
  x: Math.round((viewport.width - popupSize.width) / 2),
  y: Math.round((viewport.height - popupSize.height) / 2),
});

/**
 * Convert viewport-relative coordinates to screen coordinates.
 * Used for OpenFin window positioning.
 *
 * @param position - Viewport-relative position
 * @returns Screen-absolute position
 */
export const toScreenCoordinates = (position: PopupPosition): PopupPosition => ({
  x: position.x + window.screenX,
  y: position.y + window.screenY,
});

/**
 * Constrain a popup size to viewport bounds.
 *
 * @param size - Requested popup size
 * @param maxSize - Maximum allowed size (defaults to viewport)
 * @param padding - Padding from edges
 * @returns Constrained size
 */
export const constrainSize = (
  size: PopupSize,
  maxSize: PopupSize = getViewportSize(),
  padding: number = DEFAULT_POSITION_CONFIG.viewportPadding
): PopupSize => ({
  width: Math.min(size.width, maxSize.width - padding * 2),
  height: Math.min(size.height, maxSize.height - padding * 2),
});
