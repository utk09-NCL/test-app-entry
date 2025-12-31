/**
 * Popup Component - Declarative API for Popup Management
 *
 * This component provides a declarative approach to creating popups.
 * It's ideal for scenarios where popup state is managed externally
 * or when you prefer a component-based API.
 *
 * @example
 * ```tsx
 * // Basic controlled popup
 * function MyComponent() {
 *   const [isOpen, setIsOpen] = useState(false);
 *
 *   return (
 *     <Popup
 *       isOpen={isOpen}
 *       onOpenChange={setIsOpen}
 *       content={{ type: 'component', component: MyPopupContent }}
 *     >
 *       <button>Open Popup</button>
 *     </Popup>
 *   );
 * }
 *
 * // Uncontrolled popup (manages its own state)
 * function SimpleDropdown() {
 *   return (
 *     <Popup
 *       content={{ type: 'component', component: DropdownMenu }}
 *       position={{ placement: 'bottom-start' }}
 *     >
 *       <button>Toggle Menu</button>
 *     </Popup>
 *   );
 * }
 * ```
 *
 * @module popup/Popup
 */

import React, {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { setRef } from "./utils/refUtils";
import { usePopupContext } from "./hooks";
import type { PopupHandle, PopupOptions, PopupProps, PopupResult } from "./types";

// =============================================================================
// POPUP COMPONENT
// =============================================================================

/**
 * Popup component for declarative popup management.
 *
 * This component wraps a trigger element and manages the popup lifecycle.
 * It supports both controlled (isOpen prop) and uncontrolled modes.
 *
 * Features:
 * - Controlled and uncontrolled modes
 * - Automatic positioning relative to trigger
 * - Theme synchronization
 * - Keyboard navigation (Escape to close)
 * - Focus management
 *
 * @example
 * ```tsx
 * // Uncontrolled dropdown menu
 * <Popup
 *   content={{ type: 'component', component: MenuItems }}
 *   position={{ placement: 'bottom-start' }}
 *   blurBehavior="close"
 * >
 *   <button>Open Menu</button>
 * </Popup>
 *
 * // Controlled modal dialog
 * const [isConfirmOpen, setIsConfirmOpen] = useState(false);
 *
 * <Popup
 *   isOpen={isConfirmOpen}
 *   onOpenChange={setIsConfirmOpen}
 *   content={{ type: 'component', component: ConfirmDialog }}
 *   showBackdrop
 *   modal
 *   onClose={(result) => {
 *     if (result.confirmed) {
 *       // Handle confirmation
 *     }
 *   }}
 * >
 *   <button>Delete Item</button>
 * </Popup>
 *
 * // Calendar picker with result handling
 * <Popup
 *   content={{ type: 'url', url: '/popup/calendar' }}
 *   onClose={(result) => {
 *     if (result.data) {
 *       setSelectedDate(result.data);
 *     }
 *   }}
 * >
 *   <button>{selectedDate || 'Pick Date'}</button>
 * </Popup>
 * ```
 *
 * @param props - Component props
 * @returns The trigger element with popup behavior attached
 */
export const Popup: React.FC<PopupProps> = ({
  // Popup control
  isOpen: controlledIsOpen,
  onOpenChange,
  onClose,

  // Content and positioning
  content,
  position,

  // Behavior
  blurBehavior = "close",
  closeOnEscape = true,
  showBackdrop = false,
  modal = false,
  autoFocus = true,
  restoreFocus = true,

  // Sizing
  width,
  height,
  minWidth,
  maxWidth,
  minHeight,
  maxHeight,

  // Theme
  theme,

  // Callbacks
  onOpen,
  onMessage,
  onError,

  // Platform-specific
  openfinOptions,
  webOptions,

  // Trigger element
  children,
}) => {
  // Get popup context
  const context = usePopupContext();

  // Track internal open state (for uncontrolled mode)
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  // Determine if controlled or uncontrolled
  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  // Ref for trigger element
  const triggerRef = useRef<HTMLElement>(null);

  // Ref for current popup handle
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Generic type T is determined at call site, ref needs flexible typing
  const handleRef = useRef<PopupHandle<any> | null>(null);

  // -------------------------------------------------------------------------
  // Open/Close Handlers
  // -------------------------------------------------------------------------

  /**
   * Handle popup state changes.
   */
  const setIsOpen = useCallback(
    (newIsOpen: boolean) => {
      if (isControlled) {
        onOpenChange?.(newIsOpen);
      } else {
        setInternalIsOpen(newIsOpen);
      }
    },
    [isControlled, onOpenChange]
  );

  /**
   * Open the popup.
   */
  const openPopup = useCallback(() => {
    if (handleRef.current?.isOpen) {
      return; // Already open
    }

    // Build options object, only including defined values
    const options: PopupOptions = {
      content,
      anchor: triggerRef.current,
      blurBehavior,
      closeOnEscape,
      showBackdrop,
      modal,
      autoFocus,
      restoreFocus,
      onOpen: () => {
        setIsOpen(true);
        onOpen?.();
      },
      onClose: (result: PopupResult) => {
        setIsOpen(false);
        handleRef.current = null;
        onClose?.(result);
      },
    };

    // Add optional properties only if defined
    if (position !== undefined) options.position = position;
    if (width !== undefined) options.width = width;
    if (height !== undefined) options.height = height;
    if (minWidth !== undefined) options.minWidth = minWidth;
    if (maxWidth !== undefined) options.maxWidth = maxWidth;
    if (minHeight !== undefined) options.minHeight = minHeight;
    if (maxHeight !== undefined) options.maxHeight = maxHeight;
    if (theme !== undefined) options.theme = theme;
    if (openfinOptions !== undefined) options.openfinOptions = openfinOptions;
    if (webOptions !== undefined) options.webOptions = webOptions;
    if (onMessage !== undefined) options.onMessage = onMessage;
    if (onError !== undefined) options.onError = onError;

    const handle = context.open(options);

    handleRef.current = handle;
  }, [
    context,
    content,
    position,
    blurBehavior,
    closeOnEscape,
    showBackdrop,
    modal,
    autoFocus,
    restoreFocus,
    width,
    height,
    minWidth,
    maxWidth,
    minHeight,
    maxHeight,
    theme,
    openfinOptions,
    webOptions,
    onOpen,
    onClose,
    onMessage,
    onError,
    setIsOpen,
  ]);

  /**
   * Close the popup.
   */
  const closePopup = useCallback(() => {
    if (handleRef.current?.isOpen) {
      handleRef.current.close({ closeReason: "programmatic" });
    }
  }, []);

  /**
   * Toggle popup state.
   */
  const togglePopup = useCallback(() => {
    if (isOpen) {
      closePopup();
    } else {
      openPopup();
    }
  }, [isOpen, openPopup, closePopup]);

  // -------------------------------------------------------------------------
  // Effect: Sync controlled state
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (isControlled) {
      if (controlledIsOpen && !handleRef.current?.isOpen) {
        openPopup();
      } else if (!controlledIsOpen && handleRef.current?.isOpen) {
        closePopup();
      }
    }
  }, [isControlled, controlledIsOpen, openPopup, closePopup]);

  // -------------------------------------------------------------------------
  // Effect: Cleanup on unmount
  // -------------------------------------------------------------------------

  useEffect(() => {
    return () => {
      if (handleRef.current?.isOpen) {
        handleRef.current.close({ closeReason: "programmatic" });
      }
    };
  }, []);

  // -------------------------------------------------------------------------
  // Render Trigger Element
  // -------------------------------------------------------------------------

  // Validate children
  if (!isValidElement(children)) {
    console.error("[Popup] children must be a valid React element");
    return null;
  }

  // Clone the trigger element with popup behavior
  // eslint-disable-next-line react-hooks/refs -- Ref callback is valid for cloneElement ref forwarding
  return cloneElement(children, {
    // Merge refs using helper function - extract childRef inside callback to avoid accessing during render
    ref: (node: HTMLElement | null) => {
      // Store in our ref
      setRef(triggerRef, node);
      // Forward to child's ref if it has one
      const childElementRef = (children as React.ReactElement<{ ref?: React.Ref<HTMLElement> }>)
        .props.ref;
      setRef(childElementRef, node);
    },

    // Add click handler (merge with existing)
    onClick: (event: React.MouseEvent) => {
      // Call original onClick if present
      const originalOnClick = (
        children as React.ReactElement<{ onClick?: (e: React.MouseEvent) => void }>
      ).props.onClick;
      originalOnClick?.(event);

      // Toggle popup state
      // In controlled mode, this calls onOpenChange; in uncontrolled, updates internal state
      togglePopup();
    },

    // Add ARIA attributes
    "aria-haspopup": true,
    "aria-expanded": isOpen,
  } as Partial<React.HTMLAttributes<HTMLElement>>);
};

// =============================================================================
// COMPOUND COMPONENTS
// =============================================================================

/**
 * PopupTrigger - Explicit trigger wrapper component.
 *
 * Use this when you need more control over the trigger element
 * or when using a non-clickable trigger.
 *
 * @example
 * ```tsx
 * <Popup.Root content={...}>
 *   <Popup.Trigger>
 *     <button>Open</button>
 *   </Popup.Trigger>
 * </Popup.Root>
 * ```
 */
export const PopupTrigger: React.FC<{
  children: React.ReactElement;
  asChild?: boolean;
}> = ({ children }) => {
  // This is a placeholder for compound component pattern
  // The actual logic is handled by the parent Popup component
  return children;
};

// =============================================================================
// CONVENIENCE COMPONENTS
// =============================================================================

/**
 * DropdownPopup - Pre-configured popup for dropdown menus.
 *
 * @example
 * ```tsx
 * <DropdownPopup content={{ type: 'component', component: MenuItems }}>
 *   <button>Menu</button>
 * </DropdownPopup>
 * ```
 */
export const DropdownPopup: React.FC<Omit<PopupProps, "showBackdrop" | "modal">> = (props) => (
  <Popup
    {...props}
    showBackdrop={false}
    modal={false}
    blurBehavior={props.blurBehavior ?? "close"}
    position={{
      placement: "bottom-start",
      offset: 4,
      flip: true,
      shift: true,
      ...props.position,
    }}
  />
);

/**
 * DialogPopup - Pre-configured popup for modal dialogs.
 *
 * @example
 * ```tsx
 * <DialogPopup
 *   isOpen={isOpen}
 *   onOpenChange={setIsOpen}
 *   content={{ type: 'component', component: ConfirmDialog }}
 * >
 *   <button>Open Dialog</button>
 * </DialogPopup>
 * ```
 */
export const DialogPopup: React.FC<PopupProps> = (props) => (
  <Popup
    {...props}
    showBackdrop
    modal
    blurBehavior={props.blurBehavior ?? "none"}
    closeOnEscape={props.closeOnEscape ?? true}
    // eslint-disable-next-line jsx-a11y/no-autofocus -- Intentional for modal dialogs
    autoFocus={props.autoFocus ?? true}
    restoreFocus={props.restoreFocus ?? true}
  />
);

/**
 * TooltipPopup - Pre-configured popup for tooltips.
 *
 * Note: For full tooltip functionality with hover delays, consider
 * a dedicated tooltip library.
 *
 * @example
 * ```tsx
 * <TooltipPopup content={{ type: 'html', html: '<p>Help text</p>' }}>
 *   <span>ℹ️</span>
 * </TooltipPopup>
 * ```
 */
export const TooltipPopup: React.FC<Omit<PopupProps, "showBackdrop" | "modal" | "blurBehavior">> = (
  props
) => (
  <Popup
    {...props}
    showBackdrop={false}
    modal={false}
    blurBehavior="none"
    closeOnEscape={false}
    // eslint-disable-next-line jsx-a11y/no-autofocus -- Explicitly disabled for tooltips
    autoFocus={false}
    position={{
      placement: "top",
      offset: 8,
      flip: true,
      shift: true,
      ...props.position,
    }}
  />
);

export default Popup;
