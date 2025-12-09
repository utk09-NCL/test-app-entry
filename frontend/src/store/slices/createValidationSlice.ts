/**
 * Validation Slice - Field and form validation state and actions.
 *
 * Handles:
 * - Client-side validation (Valibot schemas)
 * - Server-side async validation (GraphQL subscription)
 * - Reference data validation (accounts, pools availability)
 * - Race condition handling for async validation
 *
 * Error Types:
 * - errors: Client-side validation (Valibot schemas)
 * - serverErrors: Async server-side checks (e.g., firm limits)
 * - warnings: Non-blocking hints (e.g., "large trade")
 * - refDataErrors: Reference data unavailable
 *
 * Used by: FieldRenderer (display errors), SubmissionSlice (pre-submit validation).
 */

import * as v from "valibot";
import { StateCreator } from "zustand";

import { SCHEMA_MAP } from "../../config/validation";
import { graphqlClient } from "../../graphql/client";
import { VALIDATE_FIELD_QUERY } from "../../graphql/queries";
import type { ValidateFieldSubscriptionResponse } from "../../graphql/types";
import { BoundState, ValidationSlice } from "../../types/store";

export const createValidationSlice: StateCreator<
  BoundState,
  [["zustand/immer", never]],
  [],
  ValidationSlice
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
    // Each new validation increments the request ID
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
            // Only update if this is still the latest validation request
            if (get().validationRequestIds[field] === currentId) {
              set((state) => {
                state.errors[field] = fieldIssue.message;
                state.isValidating[field] = false;
              });
            }
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
          symbol: derived.currencyPair,
          account: derived.account?.sdsId?.toString(),
          liquidityPool: derived.liquidityPool,
        },
      } as const;

      const result = await graphqlClient.query<ValidateFieldSubscriptionResponse>({
        query: VALIDATE_FIELD_QUERY,
        variables,
      });

      // Check if this validation is still relevant (race condition guard)
      if (get().validationRequestIds[field] !== currentId) return;

      const payload = result?.data?.validateField;

      set((state) => {
        // Clear previous server errors/warnings for this field
        delete state.serverErrors[field];
        delete state.warnings[field];

        if (payload && !payload.ok) {
          if (payload.type === "HARD") {
            state.serverErrors[field] = payload.message || "Invalid";
          } else if (payload.type === "SOFT") {
            state.warnings[field] = payload.message || "Check value";
          }
        }
      });
    } catch (e) {
      const appInstanceId = get().instanceId;
      console.error(`[${appInstanceId}] [Validation] Server validation error:`, e);
    }

    // Mark validation as complete (only if still the latest request)
    if (get().validationRequestIds[field] === currentId) {
      set((state) => {
        state.isValidating[field] = false;
      });
    }
  },

  /**
   * Clear validation state for all fields.
   * The request ID tracking ensures any in-flight validations are ignored when they complete.
   */
  cancelAllValidations: () => {
    set((state) => {
      state.errors = {};
      state.serverErrors = {};
      state.warnings = {};
      state.refDataErrors = {};
      state.isValidating = {};
      // Keep validationRequestIds - they prevent stale validations from applying
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
      const accountExists = accounts.some((a) => a.sdsId === values.account?.sdsId);
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
    if (values.currencyPair) {
      const currencyPairExists = currencyPairs.some((cp) => cp.symbol === values.currencyPair);
      if (!currencyPairExists) {
        newRefDataErrors.currencyPair = "Currency pair not available for this order type";
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
   * Clear all validation state (errors, warnings, serverErrors).
   * Called when resetting the form or starting a new order.
   */
  clearValidationState: () => {
    set((state) => {
      state.errors = {};
      state.warnings = {};
      state.serverErrors = {};
      state.refDataErrors = {};
      state.globalError = null;
      state.isValidating = {};
      state.validationRequestIds = {};
    });
  },
});
