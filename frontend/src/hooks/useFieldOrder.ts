/**
 * useFieldOrder Hook - Manages Custom Field Order per Order Type
 *
 * Handles persisting and retrieving user-customized field order from localStorage.
 * Supports per-order-type customization with intelligent merging when config changes.
 *
 * Features:
 * - Per order type field ordering
 * - Intelligent merge with orderConfig (preserves user order, appends new fields)
 * - Auto-save to localStorage on changes
 * - Reset to default functionality
 * - Reorder mode detection
 *
 * LocalStorage Keys:
 * - `fx-order-reorder-mode`: "true" | "false" - enables drag handles and banner
 * - `fx-order-field-order`: { "LIMIT": [...], "MARKET": [...] } - custom orders
 *
 * Used by: OrderForm, ReorderableFieldList
 */

import { useCallback, useEffect, useState } from "react";

import { ORDER_TYPES } from "../config/orderConfig";
import { OrderStateData, OrderType } from "../types/domain";

// LocalStorage keys
const FIELD_ORDER_KEY = "fx-order-field-order";
const REORDER_MODE_KEY = "fx-order-reorder-mode";

// Type for stored field orders
type FieldOrderMap = Partial<Record<OrderType, (keyof OrderStateData)[]>>;

/**
 * Get stored field orders from localStorage
 */
const getStoredFieldOrders = (): FieldOrderMap => {
  try {
    const stored = localStorage.getItem(FIELD_ORDER_KEY);
    if (stored) {
      return JSON.parse(stored) as FieldOrderMap;
    }
  } catch (e) {
    console.error("[useFieldOrder] Failed to parse stored field orders:", e);
  }
  return {};
};

/**
 * Save field orders to localStorage
 */
const saveFieldOrders = (orders: FieldOrderMap): void => {
  try {
    localStorage.setItem(FIELD_ORDER_KEY, JSON.stringify(orders));
  } catch (e) {
    console.error("[useFieldOrder] Failed to save field orders:", e);
  }
};

/**
 * Check if reorder mode is enabled
 */
const getReorderModeEnabled = (): boolean => {
  try {
    return localStorage.getItem(REORDER_MODE_KEY) === "true";
  } catch {
    return false;
  }
};

/**
 * Intelligently merge saved field order with config field order.
 *
 * Logic:
 * 1. Keep fields from savedOrder that still exist in configOrder
 * 2. Find new fields in configOrder that weren't in savedOrder
 * 3. Append new fields at the end
 *
 * @param savedOrder - User's saved field order
 * @param configOrder - Current config field order
 * @returns Merged field order
 */
const mergeFieldOrders = (
  savedOrder: (keyof OrderStateData)[],
  configOrder: (keyof OrderStateData)[]
): (keyof OrderStateData)[] => {
  // Step 1: Keep fields from savedOrder that still exist in config
  const validSavedFields = savedOrder.filter((f) => configOrder.includes(f));

  // Step 2: Find new fields in config that weren't in saved
  const newFields = configOrder.filter((f) => !savedOrder.includes(f));

  // Step 3: Append new fields at the end
  return [...validSavedFields, ...newFields];
};

/**
 * Hook for managing field order with localStorage persistence.
 *
 * @returns Field order utilities and state
 */
export const useFieldOrder = () => {
  // State for stored field orders (all order types)
  const [fieldOrders, setFieldOrders] = useState<FieldOrderMap>(getStoredFieldOrders);

  // State for reorder mode
  const [isReorderMode, setIsReorderMode] = useState<boolean>(getReorderModeEnabled);

  // Listen for localStorage changes (in case another tab changes it)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === FIELD_ORDER_KEY) {
        setFieldOrders(getStoredFieldOrders());
      }
      if (e.key === REORDER_MODE_KEY) {
        setIsReorderMode(getReorderModeEnabled());
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  /**
   * Get the field order for a specific order type.
   * Applies intelligent merging if stored order exists.
   * Filters out 'status' field (handled separately in viewing mode).
   */
  const getFieldOrder = useCallback(
    (orderType: OrderType, isViewMode: boolean = false): (keyof OrderStateData)[] => {
      const config = ORDER_TYPES[orderType];
      if (!config) return [];

      // Get the appropriate fields based on view mode
      const configFields = isViewMode ? config.viewFields : config.fields;

      // Separate 'status' field (always pinned at top in view mode)
      const statusField = isViewMode ? configFields.filter((f) => f === "status") : [];
      const orderableConfigFields = configFields.filter((f) => f !== "status");

      // Check if user has custom order for this order type
      const savedOrder = fieldOrders[orderType];

      let orderedFields: (keyof OrderStateData)[];

      if (savedOrder && savedOrder.length > 0) {
        // Merge saved order with config (handles added/removed fields)
        orderedFields = mergeFieldOrders(savedOrder, orderableConfigFields);
      } else {
        // Use config order
        orderedFields = orderableConfigFields;
      }

      // In view mode, prepend status field
      return [...statusField, ...orderedFields];
    },
    [fieldOrders]
  );

  /**
   * Update field order for a specific order type.
   * Auto-saves to localStorage.
   */
  const updateFieldOrder = useCallback(
    (orderType: OrderType, newOrder: (keyof OrderStateData)[]): void => {
      // Filter out 'status' before saving (it's always pinned)
      const orderToSave = newOrder.filter((f) => f !== "status");

      setFieldOrders((prev) => {
        const updated = { ...prev, [orderType]: orderToSave };
        saveFieldOrders(updated);
        return updated;
      });
    },
    []
  );

  /**
   * Reset field order for a specific order type to default.
   * Removes the custom order from localStorage.
   */
  const resetToDefault = useCallback((orderType: OrderType): void => {
    setFieldOrders((prev) => {
      const updated = { ...prev };
      delete updated[orderType];
      saveFieldOrders(updated);
      return updated;
    });
  }, []);

  /**
   * Reset all field orders to default.
   */
  const resetAllToDefault = useCallback((): void => {
    setFieldOrders({});
    localStorage.removeItem(FIELD_ORDER_KEY);
  }, []);

  /**
   * Check if a specific order type has a custom order.
   */
  const hasCustomOrder = useCallback(
    (orderType: OrderType): boolean => {
      const saved = fieldOrders[orderType];
      return !!(saved && saved.length > 0);
    },
    [fieldOrders]
  );

  /**
   * Toggle reorder mode (for future use with UI button)
   */
  const toggleReorderMode = useCallback((): void => {
    setIsReorderMode((prev) => {
      const newValue = !prev;
      localStorage.setItem(REORDER_MODE_KEY, String(newValue));
      return newValue;
    });
  }, []);

  return {
    // State
    isReorderMode,
    fieldOrders,

    // Getters
    getFieldOrder,
    hasCustomOrder,

    // Actions
    updateFieldOrder,
    resetToDefault,
    resetAllToDefault,
    toggleReorderMode,
  };
};
