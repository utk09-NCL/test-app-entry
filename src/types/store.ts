/**
 * Store Types - Zustand State Structure
 *
 * This file defines the shape of the global Zustand store.
 * The store is composed of multiple "slices" using the slice pattern:
 * - AppSlice: Lifecycle and UI mode
 * - RefDataSlice: Server-loaded dropdown options
 * - InitialOrderSlice: Default order values
 * - UserInteractionSlice: User edits and field state
 * - ComputedSlice: Derived values, validation, submission
 * - PriceSlice: Current market prices
 *
 * Why slices?
 * - Separation of concerns (each slice has one responsibility)
 * - Easier testing (test slices independently)
 * - Cleaner code organization (avoid 1000-line store file)
 *
 * The slices are combined into BoundState using TypeScript intersection (&).
 * All slices see each other (can call actions across slices).
 *
 * Used by: Store creation in src/store/index.ts, component selectors.
 */

import { Account, CurrencyPair, LiquidityPool, OrderStateData } from "./domain";

// --- Slice Interfaces ---

/**
 * App Slice - Application lifecycle and UI mode.
 */
export interface AppSlice {
  /** Unique ID for this app instance (debugging multi-window scenarios) */
  instanceId: string;
  /** Application lifecycle status (INITIALIZING → READY → SUBMITTING → ERROR) */
  status: "INITIALIZING" | "READY" | "SUBMITTING" | "ERROR";
  /** UI edit mode (creating → viewing → amending) */
  editMode: "creating" | "viewing" | "amending";
  /** Update application status */
  setStatus: (status: AppSlice["status"]) => void;
  /** Update UI edit mode */
  setEditMode: (mode: AppSlice["editMode"]) => void;
  /** Global toast notification (null = no toast) */
  toastMessage: { type: "success" | "error" | "info"; text: string } | null;
  /** Show toast message */
  setToast: (msg: { type: "success" | "error" | "info"; text: string } | null) => void;
}

/**
 * Reference Data Slice - Server-loaded dropdown options.
 */
export interface RefDataSlice {
  /** Trading accounts for order submission */
  accounts: Account[];
  /** Liquidity pools for order routing */
  pools: LiquidityPool[];
  /** Currency pairs available for trading */
  currencyPairs: CurrencyPair[];
  /** Loading state for reference data fetch */
  isLoadingRefData: boolean;
  /** Set all reference data at once (called after API fetch) */
  setRefData: (data: {
    accounts: Account[];
    pools: LiquidityPool[];
    currencyPairs: CurrencyPair[];
  }) => void;
}

/**
 * Initial Order Slice - Default order values.
 */
export interface InitialOrderSlice {
  /** Base order values (defaults or server presets) */
  baseValues: Partial<OrderStateData>;
  /** Update base values (for FDC3 context or presets) */
  setBaseValues: (values: Partial<OrderStateData>) => void;
}

/**
 * User Interaction Slice - User edits and field state.
 */
export interface UserInteractionSlice {
  /** User-modified field values (overlay on baseValues) */
  dirtyValues: Partial<OrderStateData>;
  /** Fields the user has interacted with (for error display) */
  touchedFields: Record<string, boolean>;
  /** Update a single field value */
  setFieldValue: <K extends keyof OrderStateData>(
    field: K,
    value: OrderStateData[K] | undefined
  ) => void;
  /** Reset all user interactions (for "New Order" flow) */
  resetFormInteractions: () => void;
  /** Mark all fields as touched (for submit validation) */
  setAllTouched: () => void;
}

/**
 * Computed Slice - Derived values, validation, and submission.
 * This is the "brain" of the order entry system.
 */
export interface ComputedSlice {
  // Getters
  /** Get final merged order state (base + user edits) */
  getDerivedValues: () => OrderStateData;

  // Validation & Async State
  /** Client-side validation errors (Valibot) */
  errors: Record<string, string>;
  /** Advisory warnings (non-blocking) */
  warnings: Record<string, string>;
  /** Server-side validation errors (async checks) */
  serverErrors: Record<string, string>;
  /** Fields currently being validated (for loading indicators) */
  isValidating: Record<string, boolean>;
  /** Validation request tracking (prevents race conditions) */
  validationRequestIds: Record<string, number>;

  // Flags
  /** Check if form is valid (no errors) */
  isFormValid: () => boolean;
  /** Check if user has made any edits */
  isDirty: () => boolean;

  // Actions
  /** Validate a single field (called on user input, debounced) */
  validateField: <K extends keyof OrderStateData>(
    field: K,
    value: OrderStateData[K] | undefined
  ) => Promise<void>;
  /** Submit the order (final validation + API call) */
  submitOrder: () => Promise<void>;
  /** Enter amend mode (make submitted order editable again) */
  amendOrder: () => void;
}

/**
 * Price Slice - Current market prices.
 */
export interface PriceSlice {
  /** Current buy price (ask) */
  currentBuyPrice: number;
  /** Current sell price (bid) */
  currentSellPrice: number;
  /** Update both buy and sell prices atomically */
  setCurrentPrices: (buyPrice: number, sellPrice: number) => void;
}

/**
 * Combined Store Type - All slices merged together.
 * This is the type of the final Zustand store.
 */
export type BoundState = AppSlice &
  RefDataSlice &
  InitialOrderSlice &
  UserInteractionSlice &
  ComputedSlice &
  PriceSlice;
