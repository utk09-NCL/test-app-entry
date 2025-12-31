/**
 * OrderTypePopup Component
 *
 * A dropdown-style popup for selecting order types, using the Popup system.
 * This demonstrates integrating the cross-platform popup component with the
 * order entry form.
 *
 * Features:
 * - Displays current order type in a button trigger
 * - Opens popup with list of available order types
 * - Supports keyboard navigation (Enter to select, Escape to close)
 * - Automatically closes on selection
 * - Handles disabled state for view/amend modes
 *
 * @module molecules/OrderTypePopup
 */

import React, { useCallback, useMemo, useState } from "react";

import { DropdownPopup } from "../popup";

import styles from "./OrderTypePopup.module.scss";

// =============================================================================
// TYPES
// =============================================================================

interface OrderTypeOption {
  label: string;
  value: string;
}

interface OrderTypePopupProps {
  /** Currently selected order type value */
  value: string;
  /** Callback when order type is selected */
  onChange: (value: string) => void;
  /** Available order type options */
  options: OrderTypeOption[];
  /** Whether the selector is disabled */
  disabled?: boolean;
  /** Test ID for the component */
  "data-testid"?: string;
}

// =============================================================================
// POPUP CONTENT COMPONENT
// =============================================================================

/**
 * Content component rendered inside the popup.
 * Displays a list of order type options with keyboard navigation.
 */
interface OrderTypeListProps {
  options: OrderTypeOption[];
  currentValue: string;
  onSelect: (value: string) => void;
}

const OrderTypeList: React.FC<OrderTypeListProps> = ({ options, currentValue, onSelect }) => {
  const [focusedIndex, setFocusedIndex] = useState(() =>
    options.findIndex((opt) => opt.value === currentValue)
  );

  /**
   * Handle keyboard navigation within the list.
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setFocusedIndex((prev) => Math.min(prev + 1, options.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < options.length) {
            onSelect(options[focusedIndex].value);
          }
          break;
        case "Home":
          e.preventDefault();
          setFocusedIndex(0);
          break;
        case "End":
          e.preventDefault();
          setFocusedIndex(options.length - 1);
          break;
      }
    },
    [focusedIndex, options, onSelect]
  );

  return (
    <div
      className={styles.list}
      role="listbox"
      aria-activedescendant={`order-type-option-${focusedIndex}`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {options.map((option, index) => (
        <button
          type="button"
          key={option.value}
          id={`order-type-option-${index}`}
          role="option"
          aria-selected={option.value === currentValue}
          className={`${styles.option} ${option.value === currentValue ? styles.selected : ""} ${index === focusedIndex ? styles.focused : ""}`}
          onClick={() => onSelect(option.value)}
          onMouseEnter={() => setFocusedIndex(index)}
          tabIndex={-1}
        >
          {option.label}
          {option.value === currentValue && <span className={styles.checkmark}>✓</span>}
        </button>
      ))}
    </div>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * OrderTypePopup - Popup-based order type selector.
 *
 * Replaces the native Select dropdown with a custom popup implementation
 * that works consistently across OpenFin and web environments.
 *
 * @example
 * ```tsx
 * <OrderTypePopup
 *   value={orderType}
 *   onChange={(value) => setOrderType(value as OrderType)}
 *   options={[
 *     { label: "FLOAT", value: "FLOAT" },
 *     { label: "TAKE_PROFIT", value: "TAKE_PROFIT" },
 *   ]}
 * />
 * ```
 */
export const OrderTypePopup: React.FC<OrderTypePopupProps> = ({
  value,
  onChange,
  options,
  disabled = false,
  "data-testid": testId,
}) => {
  // Track popup open state for controlled mode
  const [isOpen, setIsOpen] = useState(false);

  // Find the label for the current value
  const currentLabel = useMemo(() => {
    const option = options.find((opt) => opt.value === value);
    return option?.label ?? value;
  }, [options, value]);

  /**
   * Handle option selection.
   * Closes popup and calls onChange with new value.
   */
  const handleSelect = useCallback(
    (newValue: string) => {
      onChange(newValue);
      setIsOpen(false);
    },
    [onChange]
  );

  /**
   * Popup content component.
   * Wraps OrderTypeList with current props for rendering inside the popup.
   */
  const PopupContent = useCallback(
    () => <OrderTypeList options={options} currentValue={value} onSelect={handleSelect} />,
    [options, value, handleSelect]
  );

  return (
    <DropdownPopup
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      content={{ type: "component", component: PopupContent }}
      position={{ placement: "bottom-start", offset: 4 }}
      minWidth={200}
      maxHeight={300}
    >
      <button
        type="button"
        className={`${styles.trigger} ${disabled ? styles.disabled : ""} ${isOpen ? styles.open : ""}`}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        data-testid={testId}
      >
        <span className={styles.value}>{currentLabel}</span>
        <svg className={styles.chevron} viewBox="0 0 20 20" aria-hidden="true">
          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
        </svg>
      </button>
    </DropdownPopup>
  );
};

// Display name for React DevTools
OrderTypePopup.displayName = "OrderTypePopup";
