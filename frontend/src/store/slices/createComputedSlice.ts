/**
 * Computed Slice - Validation, Derived State, and Order Submission
 *
 * This is the "brain" of the order entry system. It handles:
 * - Derived values: Merging baseValues + dirtyValues
 * - Validation: Sync (Valibot) + async (server checks)
 * - Submission: Final validation + API call + state transitions
 *
 * Why "computed"?
 * - These are not raw state, but calculated from other slices
 * - getDerivedValues() computes final order from base + user edits
 * - isFormValid() computes validation status from error objects
 *
 * Validation Strategy:
 * - Field-level: Debounced validation as user types (300ms delay)
 * - Form-level: Full validation on submit (all fields checked)
 * - Race condition handling: Track validation request IDs to ignore stale results
 *
 * Error Types:
 * - errors: Client-side validation (Valibot schemas)
 * - serverErrors: Async server-side checks (e.g., firm limits)
 * - warnings: Non-blocking hints (e.g., "large trade")
 *
 * Used by: FieldController (validateField), OrderFooter (submitOrder, isFormValid).\n */

import * as v from "valibot";
import { StateCreator } from "zustand";

import { AMOUNT_CONFIG, VALIDATION_CONFIG } from "../../config/constants";
import { SCHEMA_MAP } from "../../config/validation";
import { OrderStateData } from "../../types/domain";
import { BoundState, ComputedSlice } from "../../types/store";

export const createComputedSlice: StateCreator<
  BoundState,
  [["zustand/immer", never]],
  [],
  ComputedSlice
> = (set, get) => ({
  /** Client-side validation errors (Valibot) */
  errors: {},
  /** Advisory warnings (non-blocking) */
  warnings: {},
  /** Server-side validation errors (async checks) */
  serverErrors: {},
  /** Reference data validation errors (unavailable accounts/pools/etc) */
  refDataErrors: {},
  /** Global error message (shown above submit button) */
  globalError: null,
  /** Fields currently being validated (for loading indicators) */
  isValidating: {},
  /**
   * Validation request tracking (prevents race conditions).
   * Maps field name → request ID (increments per validation).
   * Only the latest request ID's result is applied.
   */
  validationRequestIds: {},

  /**
   * Get the final merged order state (base + user edits).
   * This is the "single source of truth" for current order values.
   */
  getDerivedValues: () => {
    const base = get().baseValues;
    const dirty = get().dirtyValues;
    // User edits (dirty) always win over defaults (base)
    return { ...base, ...dirty } as OrderStateData;
  },

  /**
   * Check if user has made any edits.
   * Used to enable "Reset" button or show unsaved changes warning.
   */
  isDirty: () => {
    return Object.keys(get().dirtyValues).length > 0;
  },

  /**
   * Check if form is valid (no errors).
   * Used to enable/disable Submit button.
   */
  isFormValid: () => {
    const s = get();
    return (
      Object.keys(s.errors).length === 0 &&
      Object.keys(s.serverErrors).length === 0 &&
      Object.keys(s.refDataErrors).length === 0
    );
  },

  /**
   * Validate a single field (called on user input, debounced).
   *
   * Flow:
   * 1. Generate unique request ID (prevents race conditions)
   * 2. Run sync validation (Valibot schema)
   * 3. Run async validation (simulated server check)
   * 4. Update errors only if this is still the latest request
   *
   * @param field - Field name to validate
   * @param value - Current field value
   */
  validateField: async (field, value) => {
    // Track this validation request (for race condition handling)
    const currentId = (get().validationRequestIds[field] || 0) + 1;

    set((state) => {
      state.validationRequestIds[field] = currentId;
      state.isValidating[field] = true; // Show loading indicator
      delete state.errors[field]; // Clear previous error
    });

    // ========================================
    // 1. Synchronous Validation (Valibot)
    // ========================================
    try {
      const derived = get().getDerivedValues();
      const schema = SCHEMA_MAP[derived.orderType];

      if (schema) {
        // Build partial object with only the field being validated
        // (We validate the whole object to catch cross-field dependencies)
        const partialData = { ...derived, [field]: value };

        // Parse with safeParse (doesn't throw, returns result object)
        const result = v.safeParse(schema, partialData);

        if (!result.success) {
          // Find error specific to this field (ignore errors for other fields)
          const fieldIssue = result.issues.find((i) => {
            const path = i.path;
            return path && path.length > 0 && path[0].key === field;
          });

          if (fieldIssue) {
            set((state) => {
              // Only update if this is still the latest validation request
              if (state.validationRequestIds[field] === currentId) {
                state.errors[field] = fieldIssue.message;
                state.isValidating[field] = false;
              }
            });
            return; // Stop here - field is invalid
          }
        }
      }
    } catch (e) {
      // Log ValiError for debugging (but don't crash)
      // User sees field-level errors, devs see console logs
      if (e && typeof e === "object" && "name" in e && e.name === "ValiError") {
        console.error("[Validation] ValiError caught during field validation:", e);
      } else if (e) {
        console.error("[Validation] Unexpected error during validation:", e);
      }
    }

    // ========================================
    // 2. Asynchronous Validation (Server Check)
    // ========================================
    // Example: Check if notional exceeds firm trading limit
    if (field === "limitPrice" || field === "notional") {
      // Simulate network delay
      await new Promise((resolve) =>
        setTimeout(resolve, VALIDATION_CONFIG.SERVER_VALIDATION_DELAY_MS)
      );

      // Check if this validation is still relevant (race condition guard)
      if (get().validationRequestIds[field] !== currentId) return;

      // Example server-side check: Firm limit exceeded
      if (field === "notional" && value && Number(value) > AMOUNT_CONFIG.MAX_FIRM_LIMIT) {
        set((state) => {
          if (state.validationRequestIds[field] === currentId) {
            state.errors[field] = "Exceeds firm trading limit (Server)";
          }
        });
      }
    }

    // Mark validation as complete
    set((state) => {
      if (state.validationRequestIds[field] === currentId) {
        state.isValidating[field] = false;
      }
    });
  },

  /**
   * Validate reference data (check if field values exist in server response).
   * Called after setFieldValue or when reference data changes.
   *
   * Checks:
   * - account: Must exist in accounts array
   * - orderType: Must exist in entitledOrderTypes array
   * - symbol: Must exist in currencyPairs array (for current orderType)
   * - liquidityPool: Must exist in pools array
   */
  validateRefData: () => {
    const values = get().getDerivedValues();
    const { accounts, entitledOrderTypes, currencyPairs, pools } = get();
    const newRefDataErrors: Record<string, string> = {};

    // Check account availability
    if (values.account) {
      const accountExists = accounts.some((a) => a.sdsId.toString() === values.account);
      if (!accountExists) {
        newRefDataErrors.account = "Account not available";
      }
    }

    // Check order type availability
    if (values.orderType) {
      const orderTypeExists = entitledOrderTypes.includes(values.orderType);
      if (!orderTypeExists) {
        newRefDataErrors.orderType = "Order type not supported";
      }
    }

    // Check currency pair availability
    if (values.symbol) {
      const currencyPairExists = currencyPairs.some((cp) => cp.symbol === values.symbol);
      if (!currencyPairExists) {
        newRefDataErrors.symbol = "Currency pair not available for this order type";
      }
    }

    // Check liquidity pool availability
    if (values.liquidityPool) {
      const poolExists = pools.some((p) => p.value === values.liquidityPool);
      if (!poolExists) {
        newRefDataErrors.liquidityPool = "Liquidity pool not available";
      }
    }

    // Update refDataErrors
    set((state) => {
      state.refDataErrors = newRefDataErrors;

      // Set global error if any refDataErrors exist
      if (Object.keys(newRefDataErrors).length > 0) {
        // Check if globalError is already set by server (don't override)
        if (!state.globalError || state.globalError === "Please contact support@example.com") {
          state.globalError = "Please contact support@example.com";
        }
      } else {
        // Clear global error only if it was the generic refData error
        if (state.globalError === "Please contact support@example.com") {
          state.globalError = null;
        }
      }
    });
  },

  /**
   * Set global error message (can be called from server response handlers).
   * Server errors take priority over local refData errors.
   */
  setGlobalError: (error) => {
    set((state) => {
      state.globalError = error;
    });
  },

  /**
   * Submit the order (final validation + API call).
   *
   * Flow:
   * 1. Set status to SUBMITTING (shows loading, disables buttons)
   * 2. Run full form validation (all fields)
   * 3. If invalid, show errors and return to READY
   * 4. If valid, simulate API call (1.2s delay)
   * 5. On success: editMode = viewing, show success toast
   * 6. On error: status = ERROR, show error toast
   */
  submitOrder: async () => {
    const values = get().getDerivedValues();

    // Start submission (loading state)
    set((state) => {
      state.status = "SUBMITTING";
    });

    // ========================================
    // Final Full Validation
    // ========================================
    const schema = SCHEMA_MAP[values.orderType];
    const result = v.safeParse(schema, values);

    if (!result.success) {
      // Validation failed - collect all field errors
      set((state) => {
        state.status = "READY"; // Back to ready state
        result.issues.forEach((issue) => {
          const path = issue.path;
          if (path && path.length > 0) {
            const key = path[0].key as string;
            if (key) state.errors[key] = issue.message;
          }
        });
        state.toastMessage = {
          type: "error",
          text: "Please fix validation errors.",
        };
      });
      return; // Don't submit invalid order
    }

    // ========================================
    // API Call (Mock)
    // ========================================
    try {
      // Simulate network delay (in prod, this would be fetch/axios)
      await new Promise((resolve) => setTimeout(resolve, 1200));

      console.log("Order Submitted Payload:", values);

      // Success! Transition to read-only view
      set((state) => {
        state.status = "READY";
        state.editMode = "viewing"; // Show read-only view
        state.toastMessage = {
          type: "success",
          text: `Order ${values.direction} ${values.symbol} Placed!`,
        };
        state.serverErrors = {}; // Clear any server errors
      });
    } catch (e) {
      // Network/server error
      console.error("Submission Failed", e);
      set((state) => {
        state.status = "ERROR"; // Fatal error state
        state.toastMessage = { type: "error", text: "Submission Failed" };
      });
    }
  },

  /**
   * Enter amend mode (make submitted order editable again).
   * Triggered by double-clicking order in read-only view.
   *
   * Note: Only fields in orderConfig.editableFields become editable.
   * dirtyValues are preserved so user can continue editing.
   *
   * IMPORTANT: Cannot amend if reference data errors exist.
   */
  amendOrder: () => {
    const refDataErrors = get().refDataErrors;

    // Prevent amending if reference data is unavailable
    if (Object.keys(refDataErrors).length > 0) {
      set((state) => {
        state.toastMessage = {
          type: "error",
          text: "Cannot amend order with unavailable data",
        };
      });
      return;
    }

    set((state) => {
      state.editMode = "amending";
      // Keep dirtyValues so user continues where they left off
      // Could reset them if requirement changes
    });
  },
});
