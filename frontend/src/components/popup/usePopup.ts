/**
 * usePopup Hook - Imperative API for Popup Management
 *
 * This hook provides a convenient imperative API for managing popups.
 * It's ideal for scenarios where you need programmatic control over
 * popup lifecycle.
 *
 * @example
 * ```tsx
 * // Basic dropdown usage
 * function DropdownButton() {
 *   const { isOpen, toggle, triggerProps, triggerRef } = usePopup({
 *     content: { type: 'component', component: DropdownMenu },
 *     position: { placement: 'bottom-start' },
 *   });
 *
 *   return (
 *     <button {...triggerProps}>
 *       Menu {isOpen ? '▲' : '▼'}
 *     </button>
 *   );
 * }
 *
 * // Dialog with result
 * function ConfirmButton() {
 *   const { open } = usePopup({
 *     content: { type: 'component', component: ConfirmDialog },
 *     showBackdrop: true,
 *     modal: true,
 *   });
 *
 *   const handleClick = async () => {
 *     const result = await open();
 *     if (result.confirmed) {
 *       // User confirmed
 *     }
 *   };
 *
 *   return <button onClick={handleClick}>Delete</button>;
 * }
 * ```
 *
 * @module popup/usePopup
 */

import { useCallback, useRef, useState } from "react";

import { usePopupContext } from "./hooks";
import type {
  PopupHandle,
  PopupOptions,
  PopupResult,
  UsePopupOptions,
  UsePopupReturn,
} from "./types";

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

/**
 * Hook for imperative popup management.
 *
 * This hook provides:
 * - `isOpen`: Boolean indicating if popup is currently open
 * - `open()`: Function to open the popup
 * - `close()`: Function to close the popup
 * - `toggle()`: Function to toggle popup open/closed
 * - `triggerRef`: Ref to attach to the trigger element for positioning
 * - `triggerProps`: Props to spread on the trigger element
 * - `handle`: Current popup handle (null when closed)
 *
 * @example
 * ```tsx
 * // Simple toggle dropdown
 * function Dropdown() {
 *   const { isOpen, toggle, triggerRef, triggerProps } = usePopup({
 *     content: { type: 'component', component: DropdownContent },
 *   });
 *
 *   return (
 *     <>
 *       <button ref={triggerRef} {...triggerProps}>
 *         Toggle Menu
 *       </button>
 *     </>
 *   );
 * }
 *
 * // Programmatic open with result
 * function DatePicker({ onSelect }: { onSelect: (date: Date) => void }) {
 *   const { open } = usePopup<Date>({
 *     content: { type: 'component', component: CalendarPopup },
 *   });
 *
 *   const handleClick = async () => {
 *     const result = await open();
 *     if (result.confirmed && result.data) {
 *       onSelect(result.data);
 *     }
 *   };
 *
 *   return <button onClick={handleClick}>Pick Date</button>;
 * }
 *
 * // With custom options on open
 * function DynamicPopup() {
 *   const { open, triggerRef } = usePopup({
 *     position: { placement: 'bottom' },
 *   });
 *
 *   const handleClick = () => {
 *     open({
 *       content: { type: 'html', html: '<p>Dynamic content!</p>' },
 *       anchor: triggerRef.current,
 *     });
 *   };
 *
 *   return <button ref={triggerRef} onClick={handleClick}>Open</button>;
 * }
 * ```
 *
 * @param options - Default options for the popup
 * @returns UsePopupReturn object with popup controls
 */
export function usePopup<T = unknown>(options: UsePopupOptions = {}): UsePopupReturn<T> {
  // Get popup context
  const context = usePopupContext();

  // Track open state
  const [isOpen, setIsOpen] = useState(false);

  // Track current handle in state (for returning to consumers)
  const [handle, setHandle] = useState<PopupHandle<T> | null>(null);

  // Also keep a ref for internal use (to avoid stale closures in callbacks)
  const handleRef = useRef<PopupHandle<T> | null>(null);

  // Ref for trigger element (used for positioning)
  const triggerRef = useRef<HTMLElement>(null);

  // -------------------------------------------------------------------------
  // Popup Control Functions
  // -------------------------------------------------------------------------

  /**
   * Open the popup.
   *
   * @param overrideOptions - Options to merge with/override defaults
   * @returns The popup handle
   */
  const open = useCallback(
    (overrideOptions?: Partial<PopupOptions>): PopupHandle<T> => {
      // Close existing popup if open
      if (handleRef.current?.isOpen) {
        handleRef.current.close({ closeReason: "programmatic" });
      }

      // Merge options
      const mergedOptions: PopupOptions = {
        ...options,
        ...overrideOptions,
        // Use trigger ref as anchor if not specified
        anchor: overrideOptions?.anchor ?? options.anchor ?? triggerRef.current,
        // Merge position config
        position: {
          ...options.position,
          ...overrideOptions?.position,
        },
        // Merge theme config
        theme: {
          ...options.theme,
          ...overrideOptions?.theme,
        },
        // Merge callbacks
        onOpen: () => {
          setIsOpen(true);
          options.onOpen?.();
          overrideOptions?.onOpen?.();
        },
        onClose: (result) => {
          setIsOpen(false);
          handleRef.current = null;
          setHandle(null);
          options.onClose?.(result);
          overrideOptions?.onClose?.(result);
        },
      } as PopupOptions;

      // Ensure content is provided
      if (!mergedOptions.content) {
        throw new Error("Popup content is required");
      }

      // Open the popup
      const newHandle = context.open<T>(mergedOptions);
      handleRef.current = newHandle;
      setHandle(newHandle);

      return newHandle;
    },
    [context, options]
  );

  /**
   * Close the popup.
   *
   * @param result - Optional result data
   */
  const close = useCallback((result?: Partial<PopupResult<T>>) => {
    if (handleRef.current?.isOpen) {
      handleRef.current.close(result);
    }
  }, []);

  /**
   * Toggle popup open/closed.
   *
   * @param overrideOptions - Options to use when opening
   */
  const toggle = useCallback(
    (overrideOptions?: Partial<PopupOptions>) => {
      if (isOpen) {
        close();
      } else {
        open(overrideOptions);
      }
    },
    [isOpen, open, close]
  );

  // -------------------------------------------------------------------------
  // Trigger Props
  // -------------------------------------------------------------------------

  /**
   * Props to spread on the trigger element.
   * Includes ref, click handler, and ARIA attributes.
   */
  const triggerProps = {
    ref: triggerRef,
    onClick: () => toggle(),
    "aria-haspopup": true as const,
    "aria-expanded": isOpen,
  };

  // -------------------------------------------------------------------------
  // Return Value
  // -------------------------------------------------------------------------

  return {
    isOpen,
    open,
    close,
    toggle,
    triggerRef,
    triggerProps,
    handle,
  };
}

// =============================================================================
// SPECIALIZED HOOKS
// =============================================================================

/**
 * Hook for dropdown menus.
 * Pre-configured for typical dropdown behavior.
 *
 * @example
 * ```tsx
 * function MenuButton() {
 *   const { isOpen, triggerProps, triggerRef } = useDropdown({
 *     content: { type: 'component', component: MenuItems },
 *   });
 *
 *   return (
 *     <button ref={triggerRef} {...triggerProps}>
 *       Options {isOpen && '▼'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useDropdown<T = unknown>(
  options: Omit<UsePopupOptions, "modal" | "showBackdrop"> = {}
): UsePopupReturn<T> {
  return usePopup<T>({
    ...options,
    blurBehavior: options.blurBehavior ?? "close",
    closeOnEscape: options.closeOnEscape ?? true,
    showBackdrop: false,
    modal: false,
    position: {
      placement: "bottom-start",
      offset: 4,
      flip: true,
      shift: true,
      ...options.position,
    },
  });
}

/**
 * Hook for modal dialogs.
 * Pre-configured for typical modal behavior.
 *
 * @example
 * ```tsx
 * function DeleteButton() {
 *   const { open } = useDialog<boolean>({
 *     content: { type: 'component', component: ConfirmDeleteDialog },
 *   });
 *
 *   const handleDelete = async () => {
 *     const result = await open();
 *     if (result.data === true) {
 *       // Proceed with deletion
 *     }
 *   };
 *
 *   return <button onClick={handleDelete}>Delete</button>;
 * }
 * ```
 */
export function useDialog<T = unknown>(
  options: Omit<UsePopupOptions, "anchor"> = {}
): UsePopupReturn<T> {
  return usePopup<T>({
    ...options,
    anchor: null, // Center in viewport
    blurBehavior: options.blurBehavior ?? "none",
    closeOnEscape: options.closeOnEscape ?? true,
    showBackdrop: true,
    modal: true,
    autoFocus: options.autoFocus ?? true,
    restoreFocus: options.restoreFocus ?? true,
  });
}

/**
 * Hook for tooltip-like popups.
 * Pre-configured for hover/focus behavior (simplified version).
 *
 * Note: For full tooltip functionality with hover delays, consider
 * a dedicated tooltip library.
 *
 * @example
 * ```tsx
 * function InfoIcon() {
 *   const { isOpen, open, close, triggerRef } = useTooltip({
 *     content: { type: 'html', html: '<p>Helpful information</p>' },
 *   });
 *
 *   return (
 *     <span
 *       ref={triggerRef}
 *       onMouseEnter={() => open()}
 *       onMouseLeave={() => close()}
 *     >
 *       ℹ️
 *     </span>
 *   );
 * }
 * ```
 */
export function useTooltip<T = unknown>(
  options: Omit<UsePopupOptions, "modal" | "showBackdrop" | "blurBehavior"> = {}
): UsePopupReturn<T> {
  return usePopup<T>({
    ...options,
    blurBehavior: "none",
    closeOnEscape: false,
    showBackdrop: false,
    modal: false,
    autoFocus: false,
    position: {
      placement: "top",
      offset: 8,
      flip: true,
      shift: true,
      ...options.position,
    },
  });
}

export default usePopup;
