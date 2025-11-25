/**
 * useFieldOrder Hook - Custom Hook for Field Order Management
 *
 * Thin wrapper around the Zustand store's FieldOrderSlice.
 * Provides convenient access to field order state and actions.
 *
 * Features:
 * - Per order type field ordering
 * - Draft state during reorder mode (changes not persisted until Save)
 * - Save button persists draft to localStorage and exits reorder mode
 * - Reset to default resets draft state (requires Save to persist)
 * - Reorder mode detection
 *
 * LocalStorage Keys:
 * - `fx-order-reorder-mode`: "true" | "false" - enables drag handles and banner
 * - `fx-order-field-order`: { "LIMIT": [...], "MARKET": [...] } - persisted orders
 *
 * Used by: OrderForm (passed as props to child components)
 */

import { useOrderEntryStore } from "../store";
import { FieldOrderMap } from "../store/slices/createFieldOrderSlice";
import { OrderStateData, OrderType } from "../types/domain";

/**
 * Return type for useFieldOrder hook (for prop passing)
 */
export interface FieldOrderHookReturn {
  isReorderMode: boolean;
  fieldOrders: FieldOrderMap;
  draftFieldOrders: FieldOrderMap;
  getFieldOrder: (orderType: OrderType, isViewMode?: boolean) => (keyof OrderStateData)[];
  hasCustomOrder: (orderType: OrderType) => boolean;
  updateFieldOrder: (orderType: OrderType, newOrder: (keyof OrderStateData)[]) => void;
  resetToDefault: (orderType: OrderType) => void;
  saveAndExit: () => void;
  cancelReorder: () => void;
  toggleReorderMode: () => void;
}

/**
 * Hook for managing field order with localStorage persistence.
 * Wraps the Zustand store's FieldOrderSlice for convenient component access.
 *
 * @returns Field order utilities and state
 */
export const useFieldOrder = (): FieldOrderHookReturn => {
  // Select state from store - MUST subscribe to these to trigger re-renders
  const isReorderMode = useOrderEntryStore((s) => s.isReorderMode);
  const fieldOrders = useOrderEntryStore((s) => s.fieldOrders);
  const draftFieldOrders = useOrderEntryStore((s) => s.draftFieldOrders);

  // Get actions from store (these don't cause re-renders)
  const getFieldOrder = useOrderEntryStore((s) => s.getFieldOrder);
  const hasCustomOrder = useOrderEntryStore((s) => s.hasCustomOrder);
  const updateFieldOrder = useOrderEntryStore((s) => s.updateFieldOrder);
  const resetFieldOrderToDefault = useOrderEntryStore((s) => s.resetFieldOrderToDefault);
  const saveFieldOrderAndExit = useOrderEntryStore((s) => s.saveFieldOrderAndExit);
  const cancelReorderMode = useOrderEntryStore((s) => s.cancelReorderMode);
  const toggleReorderMode = useOrderEntryStore((s) => s.toggleReorderMode);

  return {
    // State - subscribing ensures re-render when they change
    isReorderMode,
    fieldOrders,
    draftFieldOrders,

    // Getters
    getFieldOrder,
    hasCustomOrder,

    // Actions
    updateFieldOrder,
    resetToDefault: resetFieldOrderToDefault,
    saveAndExit: saveFieldOrderAndExit,
    cancelReorder: cancelReorderMode,
    toggleReorderMode,
  };
};
