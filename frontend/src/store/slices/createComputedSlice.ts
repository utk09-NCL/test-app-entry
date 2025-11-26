/**
 * Computed Slice - Validation, Derived State, and Order Submission
 *
 * This is the "brain" of the order entry system. It handles:
 * - Derived values: Merging baseValues + dirtyValues
 * - Validation: Sync (Valibot) + async (server checks)
 * - Submission: Final validation + GraphQL mutations + state transitions
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
 * Used by: FieldController (validateField), OrderFooter (submitOrder, isFormValid).
 */

import * as v from "valibot";
import { StateCreator } from "zustand";

import { SCHEMA_MAP } from "../../config/validation";
import { graphqlClient } from "../../graphql/client";
import { AMEND_ORDER_MUTATION, CREATE_ORDER_MUTATION } from "../../graphql/mutations";
import { VALIDATE_FIELD_SUBSCRIPTION } from "../../graphql/subscriptions";
import type {
  AmendOrderResponse,
  CreateOrderResponse,
  ValidateFieldSubscriptionResponse,
} from "../../graphql/types";
import { OrderStateData } from "../../types/domain";
import { BoundState, ComputedSlice } from "../../types/store";

// ============================================================================
// HELPER TYPES
// ============================================================================

interface MutationResult {
  success: boolean;
  orderId?: string;
  failureReason?: string;
}

// ============================================================================
// EXTRACTED HELPER FUNCTIONS
// ============================================================================

/**
 * Validates the order against the schema.
 * Returns validation issues if invalid, null if valid.
 */
const validateOrderSchema = (values: OrderStateData): { issues: v.BaseIssue<unknown>[] } | null => {
  const schema = SCHEMA_MAP[values.orderType];
  const result = v.safeParse(schema, values);
  return result.success ? null : { issues: result.issues };
};

/**
 * Builds the CREATE order mutation variables.
 */
const buildCreateOrderVariables = (values: OrderStateData) => ({
  orderEntry: {
    currencyPair: values.symbol,
    side: values.direction,
    orderType: values.orderType,
    amount: values.notional,
    ccy: values.symbol.substring(0, 3), // Extract base currency (e.g., "GBP" from "GBPUSD")
    limitPrice: values.limitPrice,
    stopPrice: values.stopPrice,
    liquidityPool: values.liquidityPool,
    account: values.account,
    timeInForce: values.timeInForce,
    startTime: values.startTime,
  },
});

/**
 * Builds the AMEND order mutation variables.
 */
const buildAmendOrderVariables = (values: OrderStateData) => ({
  amendOrder: {
    orderId: values.orderId,
    amount: values.notional,
    limitPrice: values.limitPrice,
    stopPrice: values.stopPrice,
    timeInForce: values.timeInForce,
  },
});

/**
 * Executes the CREATE order mutation.
 * Uses observable pattern instead of direct mutate() for flexibility.
 */
const executeCreateOrder = async (values: OrderStateData): Promise<MutationResult> => {
  return new Promise((resolve, reject) => {
    const variables = buildCreateOrderVariables(values);

    // Using observable subscription pattern as alternative to graphqlClient.mutate()
    // This allows for more control and works in non-React contexts
    const observable = graphqlClient.mutate<CreateOrderResponse>({
      mutation: CREATE_ORDER_MUTATION,
      variables,
    });

    observable
      .then((result) => {
        const response = result.data?.createOrder;
        if (response?.result === "SUCCESS" && response.orderId) {
          resolve({
            success: true,
            orderId: response.orderId,
          });
        } else {
          resolve({
            success: false,
            failureReason: response?.failureReason || "Order submission failed",
          });
        }
      })
      .catch((error) => {
        reject(error);
      });
  });
};

/**
 * Executes the AMEND order mutation.
 * Uses observable pattern instead of direct mutate() for flexibility.
 */
const executeAmendOrder = async (values: OrderStateData): Promise<MutationResult> => {
  return new Promise((resolve, reject) => {
    const variables = buildAmendOrderVariables(values);

    const observable = graphqlClient.mutate<AmendOrderResponse>({
      mutation: AMEND_ORDER_MUTATION,
      variables,
    });

    observable
      .then((result) => {
        const response = result.data?.amendOrder;
        if (response?.result === "SUCCESS") {
          resolve({
            success: true,
            orderId: response.orderId,
          });
        } else {
          resolve({
            success: false,
            failureReason: response?.failureReason || "Amendment failed",
          });
        }
      })
      .catch((error) => {
        reject(error);
      });
  });
};

// ============================================================================
// STATE UPDATE HANDLERS
// ============================================================================

/** Type for Zustand set function */
type SetState = (fn: (state: BoundState) => void) => void;
/** Type for Zustand get function */
type GetState = () => BoundState;

interface MutationSuccessContext {
  appInstanceId: string;
  values: OrderStateData;
  isAmending: boolean;
  mutationResult: MutationResult;
}

interface MutationErrorContext {
  appInstanceId: string;
  error: unknown;
}

/**
 * Handles successful mutation response (both create and amend).
 * Updates store state based on the result.
 */
const handleMutationSuccess = (
  set: SetState,
  _get: GetState,
  context: MutationSuccessContext
): void => {
  const { appInstanceId, values, isAmending, mutationResult } = context;

  if (mutationResult.success) {
    // SUCCESS: Order created/amended
    console.log(
      `[${appInstanceId}] Order ${mutationResult.orderId} ${isAmending ? "amended" : "created"} successfully`
    );

    set((state) => {
      state.status = "READY";
      state.editMode = "viewing";

      // Only set currentOrderId for new orders (amend keeps existing)
      if (!isAmending && mutationResult.orderId) {
        state.currentOrderId = mutationResult.orderId;
      }

      state.toastMessage = {
        type: "success",
        text: isAmending
          ? `Order ${values.symbol} Amended!`
          : `Order ${values.direction} ${values.symbol} Placed!`,
      };

      // Clear validation state on success
      state.serverErrors = {};
      state.warnings = {};
    });
  } else {
    // FAILURE: Server rejected the order
    console.error(
      `[${appInstanceId}] ${isAmending ? "Amendment" : "Order creation"} failed:`,
      mutationResult.failureReason
    );

    set((state) => {
      state.status = "READY";

      // If amending, go back to viewing mode since order exists
      if (isAmending) {
        state.editMode = "viewing";
      }

      state.toastMessage = {
        type: "error",
        text: mutationResult.failureReason || "Submission failed",
      };
    });
  }
};

/**
 * Handles mutation errors (network failures, GraphQL errors).
 * Gracefully recovers state and shows appropriate error message.
 */
const handleMutationError = (set: SetState, get: GetState, context: MutationErrorContext): void => {
  const { appInstanceId, error } = context;

  console.error(`[${appInstanceId}] Submission Error:`, error);

  // Check if we have an orderId (meaning order might have been submitted)
  const hasOrderId = get().currentOrderId !== null;

  set((state) => {
    state.status = "READY";

    if (hasOrderId) {
      // Order was submitted, but we got an error (maybe subscription issue)
      state.editMode = "viewing";
      state.toastMessage = {
        type: "error",
        text: "Error tracking order status",
      };
    } else {
      // Order submission failed
      state.toastMessage = {
        type: "error",
        text: "Submission Failed",
      };
    }
  });
};

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
   * Also includes orderStatus if available (for display in view/amend mode).
   */
  getDerivedValues: () => {
    const base = get().baseValues;
    const dirty = get().dirtyValues;
    const orderStatus = get().orderStatus;
    // User edits (dirty) always win over defaults (base)
    const merged = { ...base, ...dirty } as OrderStateData;
    if (orderStatus) merged.status = orderStatus;
    return merged;
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
      const appInstanceId = get().instanceId;
      if (e && typeof e === "object" && "name" in e && e.name === "ValiError") {
        console.error(
          `[${appInstanceId}] [Validation] ValiError caught during field validation:`,
          e
        );
      } else if (e) {
        console.error(`[${appInstanceId}] [Validation] Unexpected error during validation:`, e);
      }
    }

    // ========================================
    // 2. Asynchronous Validation (Server Subscription)
    // ========================================
    try {
      const derived = get().getDerivedValues();
      const variables = {
        input: {
          field,
          value: value == null ? null : String(value),
          orderType: derived.orderType,
          symbol: derived.symbol,
          account: derived.account,
          liquidityPool: derived.liquidityPool,
          timeInForce: derived.timeInForce,
        },
      } as const;

      const result = await new Promise<ValidateFieldSubscriptionResponse>((resolve, reject) => {
        const sub = graphqlClient
          .subscribe<ValidateFieldSubscriptionResponse>({
            query: VALIDATE_FIELD_SUBSCRIPTION,
            variables,
          })
          .subscribe({
            next: (event) => {
              resolve(event.data as ValidateFieldSubscriptionResponse);
              sub.unsubscribe();
            },
            error: (err) => {
              reject(err);
              sub.unsubscribe();
            },
          });
      });

      // Check if this validation is still relevant (race condition guard)
      if (get().validationRequestIds[field] !== currentId) return;

      const payload = result?.validateField;
      if (payload) {
        set((state) => {
          if (state.validationRequestIds[field] !== currentId) return;

          // Clear previous server errors/warnings for this field
          delete state.serverErrors[field];
          delete state.warnings[field];

          if (!payload.ok) {
            if (payload.type === "HARD") {
              state.serverErrors[field] = payload.message || "Invalid";
            } else if (payload.type === "SOFT") {
              state.warnings[field] = payload.message || "Check value";
            }
          }
        });
      }
    } catch (e) {
      const appInstanceId = get().instanceId;
      console.error(`[${appInstanceId}] [Validation] Server validation error:`, e);
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
   * Submit the order (final validation + GraphQL mutation).
   *
   * Flow:
   * 1. Set status to SUBMITTING (shows loading, disables buttons)
   * 2. Run full form validation (all fields)
   * 3. If invalid, show errors and return to READY
   * 4. If valid, call CREATE_ORDER_MUTATION or AMEND_ORDER_MUTATION
   * 5. On success: Set orderId, editMode = viewing, subscribe to ORDER_SUBSCRIPTION
   * 6. On error: Show error toast, stay in current mode (or go to viewing if orderId exists)
   */
  submitOrder: async () => {
    const appInstanceId = get().instanceId;
    const currentStatus = get().status;
    const currentEditMode = get().editMode;

    // GUARD: Prevent duplicate submissions
    if (currentStatus === "SUBMITTING") {
      console.warn(
        `[${appInstanceId}] submitOrder: Already submitting, ignoring duplicate request`
      );
      return;
    }

    const values = get().getDerivedValues();
    const isAmending = currentEditMode === "amending" && !!values.orderId;

    // Start submission (loading state)
    set((state) => {
      state.status = "SUBMITTING";
    });

    // ========================================
    // Step 1: Validate Order
    // ========================================
    const validationResult = validateOrderSchema(values);

    if (validationResult) {
      // Validation failed - collect all field errors
      set((state) => {
        state.status = "READY";
        validationResult.issues.forEach((issue) => {
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
      return;
    }

    // ========================================
    // Step 2: Execute Mutation
    // ========================================
    try {
      const mutationResult = isAmending
        ? await executeAmendOrder(values)
        : await executeCreateOrder(values);

      // ========================================
      // Step 3: Handle Response
      // ========================================
      handleMutationSuccess(set, get, {
        appInstanceId,
        values,
        isAmending,
        mutationResult,
      });
    } catch (error) {
      handleMutationError(set, get, {
        appInstanceId,
        error,
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
