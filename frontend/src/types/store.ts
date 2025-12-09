/**
 * Store Types - Zustand State Structure
 *
 * This file defines the shape of the global Zustand store.
 * The store is composed of multiple "slices" using the slice pattern:
 *
 * Priority-Based Layered Slices (for form state):
 * - DefaultsSlice: Hardcoded defaults (Priority 1 - lowest)
 * - UserPrefsSlice: User preferences from server (Priority 2)
 * - Fdc3IntentSlice: FDC3 intent data (Priority 3)
 * - UserInteractionSlice: User manual input (Priority 4 - highest)
 *
 * Other Slices:
 * - AppSlice: Lifecycle and UI mode
 * - RefDataSlice: Server-loaded dropdown options
 * - DerivedSlice: Computed form values from all layers
 * - ValidationSlice: Field and form validation
 * - SubmissionSlice: Order submission and amendment
 * - PriceSlice: Current market prices
 * - FieldOrderSlice: Field ordering preferences
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

import { DefaultsSlice } from "../store/slices/createDefaultsSlice";
import { Fdc3IntentSlice } from "../store/slices/createFdc3IntentSlice";
import { FieldOrderSlice } from "../store/slices/createFieldOrderSlice";
import { UserPrefsSlice } from "../store/slices/createUserPrefsSlice";

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
  /** Current order ID (set after order submission, used for tracking) */
  currentOrderId: string | null;
  /** Current order status (from ORDER_SUBSCRIPTION) */
  orderStatus: string | null;
  /** Update application status */
  setStatus: (status: AppSlice["status"]) => void;
  /** Update UI edit mode */
  setEditMode: (mode: AppSlice["editMode"]) => void;
  /** Set current order ID (after submission) */
  setCurrentOrderId: (orderId: string | null) => void;
  /** Set order status (from subscription) */
  setOrderStatus: (status: string | null) => void;
  /** Global toast notification (null = no toast) */
  toastMessage: { type: "success" | "error" | "info" | "warning"; text: string } | null;
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
  /** Order types user is entitled to (from server) */
  entitledOrderTypes: string[];
  /** Loading state for reference data fetch */
  isLoadingRefData: boolean;
  /** Set all reference data at once (called after API fetch) */
  setRefData: (data: {
    accounts: Account[];
    pools: LiquidityPool[];
    currencyPairs: CurrencyPair[];
    entitledOrderTypes: string[];
  }) => void;
}

/**
 * User Interaction Slice - User manual input (Priority 4 - highest).
 * Stores fields the user has manually edited.
 */
export interface UserInteractionSlice {
  /** User-modified field values (overlay on baseValues) */
  dirtyValues: Partial<OrderStateData>;
  /** Update a single field value */
  setFieldValue: <K extends keyof OrderStateData>(
    field: K,
    value: OrderStateData[K] | undefined
  ) => void;
  /** Reset all user interactions (for "New Order" flow) */
  resetFormInteractions: () => void;
}

/**
 * Derived Slice - Computed form values from all layers.
 * Merges defaults, user prefs, FDC3 intent, and user input.
 */
export interface DerivedSlice {
  /** Get final merged order state (all layers combined) */
  getDerivedValues: () => OrderStateData;
  /** Check if form is valid (no errors in any validation slice) */
  isFormValid: () => boolean;
  /** Check if user has made any edits */
  isDirty: () => boolean;
}

/**
 * Validation Slice - Field and form validation state.
 */
export interface ValidationSlice {
  /** Client-side validation errors (Valibot) */
  errors: Record<string, string>;
  /** Advisory warnings (non-blocking) */
  warnings: Record<string, string>;
  /** Server-side validation errors (async checks) */
  serverErrors: Record<string, string>;
  /** Reference data validation errors (unavailable accounts/pools/etc) */
  refDataErrors: Record<string, string>;
  /** Global error message (shown above submit button) */
  globalError: string | null;
  /** Fields currently being validated (for loading indicators) */
  isValidating: Record<string, boolean>;
  /** Validation request tracking (prevents race conditions) */
  validationRequestIds: Record<string, number>;

  /** Validate a single field (called on user input, debounced) */
  validateField: <K extends keyof OrderStateData>(
    field: K,
    value: OrderStateData[K] | undefined
  ) => Promise<void>;
  /** Validate reference data (check if field values exist in server response) */
  validateRefData: () => void;
  /** Clear validation state for all fields */
  cancelAllValidations: () => void;
  /** Set global error message */
  setGlobalError: (error: string | null) => void;
  /** Clear all validation state */
  clearValidationState: () => void;
}

/**
 * Submission Slice - Order submission and amendment.
 */
export interface SubmissionSlice {
  /** Submit the order (final validation + API call) */
  submitOrder: () => Promise<void>;
  /** Enter amend mode (make submitted order editable again) */
  amendOrder: () => void;
}

/**
 * @deprecated Use DerivedSlice, ValidationSlice, and SubmissionSlice instead.
 * Kept for backward compatibility during migration.
 */
export type ComputedSlice = DerivedSlice & ValidationSlice & SubmissionSlice;

/**
 * Price Slice - Current market prices.
 */
export interface PriceSlice {
  /** Current buy price (ask) */
  currentBuyPrice: number;
  /** Current sell price (bid) */
  currentSellPrice: number;
  /** Auto-grab checkbox state (for FLOAT order type) */
  autoGrabPrice: boolean;
  /** Update both buy and sell prices atomically */
  setCurrentPrices: (buyPrice: number, sellPrice: number) => void;
  /** Toggle auto-grab price checkbox */
  setAutoGrabPrice: (enabled: boolean) => void;
}

/**
 * Combined Store Type - All slices merged together.
 * This is the type of the final Zustand store.
 *
 * Priority-based layers for form state:
 * 1. DefaultsSlice (Priority 1 - lowest)
 * 2. UserPrefsSlice (Priority 2)
 * 3. Fdc3IntentSlice (Priority 3)
 * 4. UserInteractionSlice (Priority 4 - highest)
 */
export type BoundState = AppSlice &
  RefDataSlice &
  DefaultsSlice &
  UserPrefsSlice &
  Fdc3IntentSlice &
  UserInteractionSlice &
  DerivedSlice &
  ValidationSlice &
  SubmissionSlice &
  PriceSlice &
  FieldOrderSlice;
