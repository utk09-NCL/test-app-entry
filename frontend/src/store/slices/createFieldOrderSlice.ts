/**
 * Field Order Slice - User's Custom Field Order Preferences
 *
 * Manages per-order-type field ordering with localStorage persistence.
 * State is stored in Zustand for cross-component synchronization.
 *
 * Features:
 * - Per order type field ordering
 * - Intelligent merge with orderConfig (preserves user order, appends new fields)
 * - Draft state during reorder mode (changes not persisted until Save)
 * - Save button persists draft to localStorage and exits reorder mode
 * - Reset to default resets draft state (requires Save to persist)
 * - Reorder mode toggle
 *
 * LocalStorage Keys:
 * - `fx-order-reorder-mode`: "true" | "false" - enables drag handles and banner
 * - `fx-order-field-order`: { "LIMIT": [...], "MARKET": [...] } - persisted orders
 *
 * State Architecture:
 * - `fieldOrders`: Persisted state (from localStorage)
 * - `draftFieldOrders`: Pending changes during reorder mode (not persisted until Save)
 *
 * Future: This slice can be extended to sync with server-side storage.
 */

import { StateCreator } from "zustand";

import { ORDER_TYPES } from "../../config/orderConfig";
import { OrderStateData, OrderType } from "../../types/domain";
import { BoundState } from "../../types/store";

// LocalStorage keys
const FIELD_ORDER_KEY = "fx-order-field-order";
const REORDER_MODE_KEY = "fx-order-reorder-mode";

// Type for stored field orders
export type FieldOrderMap = Partial<Record<OrderType, (keyof OrderStateData)[]>>;

/**
 * Field Order Slice Interface
 */
export interface FieldOrderSlice {
  /** Persisted field orders per order type (from localStorage) */
  fieldOrders: FieldOrderMap;
  /** Draft field orders during reorder mode (not persisted until Save) */
  draftFieldOrders: FieldOrderMap;
  /** Whether reorder mode is enabled */
  isReorderMode: boolean;

  /** Get ordered fields for a specific order type (uses draft in reorder mode) */
  getFieldOrder: (orderType: OrderType, isViewMode?: boolean) => (keyof OrderStateData)[];
  /** Check if a specific order type has a custom order (persisted) */
  hasCustomOrder: (orderType: OrderType) => boolean;
  /** Update field order for a specific order type (updates draft only, no persist) */
  updateFieldOrder: (orderType: OrderType, newOrder: (keyof OrderStateData)[]) => void;
  /** Reset draft field order for a specific order type to config default */
  resetFieldOrderToDefault: (orderType: OrderType) => void;
  /** Save draft to localStorage and exit reorder mode */
  saveFieldOrderAndExit: () => void;
  /** Cancel reorder mode without saving (discard draft) */
  cancelReorderMode: () => void;
  /** Toggle reorder mode (initializes draft from persisted state) */
  toggleReorderMode: () => void;
  /** Initialize field order state from localStorage */
  initFieldOrderFromStorage: () => void;
}

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
    console.error("[FieldOrderSlice] Failed to parse stored field orders:", e);
  }
  return {};
};

/**
 * Save field orders to localStorage and dispatch StorageEvent for same-tab sync
 */
const saveFieldOrders = (orders: FieldOrderMap): void => {
  try {
    const oldValue = localStorage.getItem(FIELD_ORDER_KEY);
    const newValue = JSON.stringify(orders);
    localStorage.setItem(FIELD_ORDER_KEY, newValue);

    // Dispatch StorageEvent for same-tab listeners (storage event only fires cross-tab)
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: FIELD_ORDER_KEY,
        oldValue,
        newValue,
        storageArea: localStorage,
      })
    );
  } catch (e) {
    console.error("[FieldOrderSlice] Failed to save field orders:", e);
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
 * Create Field Order Slice
 */
export const createFieldOrderSlice: StateCreator<
  BoundState,
  [["zustand/immer", never]],
  [],
  FieldOrderSlice
> = (set, get) => ({
  // Initial state (loaded from localStorage on init)
  fieldOrders: {},
  draftFieldOrders: {},
  isReorderMode: false,

  /**
   * Initialize state from localStorage.
   * Called during app initialization.
   */
  initFieldOrderFromStorage: () => {
    set((state) => {
      state.fieldOrders = getStoredFieldOrders();
      state.draftFieldOrders = {};
      state.isReorderMode = getReorderModeEnabled();
    });
  },

  /**
   * Get the field order for a specific order type.
   * Uses draft state when in reorder mode, otherwise uses persisted state.
   * Applies intelligent merging if stored order exists.
   */
  getFieldOrder: (orderType: OrderType, isViewMode: boolean = false): (keyof OrderStateData)[] => {
    const config = ORDER_TYPES[orderType];
    if (!config) return [];

    // Get the appropriate fields based on view mode
    const configFields = isViewMode ? config.viewFields : config.fields;

    // Separate 'status' field (always pinned at top in view mode)
    const statusField = isViewMode ? configFields.filter((f) => f === "status") : [];
    const orderableConfigFields = configFields.filter((f) => f !== "status");

    // In reorder mode, check draft first, then fall back to persisted
    // Outside reorder mode, only use persisted
    const { isReorderMode, draftFieldOrders, fieldOrders } = get();

    let savedOrder: (keyof OrderStateData)[] | undefined;

    if (isReorderMode) {
      // In reorder mode: use draft if exists, otherwise use persisted
      savedOrder = draftFieldOrders[orderType] ?? fieldOrders[orderType];
    } else {
      // Outside reorder mode: only use persisted
      savedOrder = fieldOrders[orderType];
    }

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

  /**
   * Check if a specific order type has a custom order (persisted).
   */
  hasCustomOrder: (orderType: OrderType): boolean => {
    const saved = get().fieldOrders[orderType];
    return !!(saved && saved.length > 0);
  },

  /**
   * Update field order for a specific order type.
   * Only updates draft state (not persisted until Save).
   */
  updateFieldOrder: (orderType: OrderType, newOrder: (keyof OrderStateData)[]): void => {
    // Filter out 'status' before saving (it's always pinned)
    const orderToSave = newOrder.filter((f) => f !== "status");

    set((state) => {
      state.draftFieldOrders[orderType] = orderToSave;
    });
  },

  /**
   * Reset draft field order for a specific order type to config default.
   * Does not persist - user must click Save.
   */
  resetFieldOrderToDefault: (orderType: OrderType): void => {
    set((state) => {
      // Set draft to empty array to indicate "use config default"
      // We use empty array instead of deleting to distinguish from "no draft"
      state.draftFieldOrders[orderType] = [];
    });
  },

  /**
   * Save draft to localStorage and exit reorder mode.
   */
  saveFieldOrderAndExit: (): void => {
    const { draftFieldOrders, fieldOrders } = get();

    // Merge draft into persisted state
    const newFieldOrders = { ...fieldOrders };

    for (const [orderType, draftOrder] of Object.entries(draftFieldOrders)) {
      if (draftOrder && draftOrder.length > 0) {
        // User has a custom order for this type
        newFieldOrders[orderType as OrderType] = draftOrder;
      } else if (draftOrder !== undefined) {
        // User reset to default (empty array in draft)
        delete newFieldOrders[orderType as OrderType];
      }
    }

    // Persist to localStorage
    saveFieldOrders(newFieldOrders);

    // Update state: persist changes, clear draft, exit reorder mode
    set((state) => {
      state.fieldOrders = newFieldOrders;
      state.draftFieldOrders = {};
      state.isReorderMode = false;
    });

    // Update reorder mode in localStorage
    localStorage.setItem(REORDER_MODE_KEY, "false");
  },

  /**
   * Cancel reorder mode without saving (discard draft).
   */
  cancelReorderMode: (): void => {
    set((state) => {
      state.draftFieldOrders = {};
      state.isReorderMode = false;
    });

    localStorage.setItem(REORDER_MODE_KEY, "false");
  },

  /**
   * Toggle reorder mode.
   * When entering, initializes draft from persisted state.
   * When exiting via toggle, discards draft (use saveFieldOrderAndExit to save).
   */
  toggleReorderMode: (): void => {
    const isCurrentlyInReorderMode = get().isReorderMode;

    if (isCurrentlyInReorderMode) {
      // Exiting via toggle = cancel (discard draft)
      set((state) => {
        state.draftFieldOrders = {};
        state.isReorderMode = false;
      });
    } else {
      // Entering reorder mode - start with empty draft
      set((state) => {
        state.draftFieldOrders = {};
        state.isReorderMode = true;
      });
    }

    const newValue = get().isReorderMode;
    localStorage.setItem(REORDER_MODE_KEY, String(newValue));
  },
});
