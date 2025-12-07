/**
 * Submission Slice - Order submission and amendment actions.
 *
 * Handles:
 * - Final validation before submission
 * - GraphQL mutations (create/amend)
 * - State transitions during submission flow
 * - Success/error handling and toasts
 *
 * Flow:
 * 1. Set status to SUBMITTING (shows loading, disables buttons)
 * 2. Run full form validation (all fields)
 * 3. If invalid, show errors and return to READY
 * 4. If valid, call CREATE_ORDER_MUTATION or AMEND_ORDER_MUTATION
 * 5. On success: Set orderId, editMode = viewing
 * 6. On error: Show error toast, stay in current mode
 *
 * Used by: OrderFooter (submit button), OrderForm (amend double-click).
 */

import { StateCreator } from "zustand";

import { validateOrderForSubmission } from "../../config/validation";
import { graphqlClient } from "../../graphql/client";
import { AMEND_ORDER_MUTATION, CREATE_ORDER_MUTATION } from "../../graphql/mutations";
import type { AmendOrderResponse, CreateOrderResponse } from "../../graphql/types";
import { OrderStateData } from "../../types/domain";
import { BoundState, SubmissionSlice } from "../../types/store";

// ============================================================================
// HELPER TYPES
// ============================================================================

interface MutationResult {
  success: boolean;
  orderId?: string;
  failureReason?: string;
}

// ============================================================================
// MUTATION HELPERS
// ============================================================================

/**
 * Validates the order against the schema using GraphQL-aligned validation.
 * Returns validation result with field-keyed errors if invalid.
 */
const validateOrderForSubmit = (
  values: OrderStateData
): { valid: boolean; errors: Record<string, string> } => {
  return validateOrderForSubmission(values as unknown as Record<string, unknown>);
};

/**
 * Builds the CREATE order mutation variables.
 * Maps OrderStateData (with nested objects) to GraphQL OrderEntry input.
 */
const buildCreateOrderVariables = (values: OrderStateData) => ({
  orderEntry: {
    currencyPair: values.currencyPair,
    side: values.side,
    orderType: values.orderType,
    amount: values.amount, // Already in { amount, ccy } format
    level: values.level,
    liquidityPool: values.liquidityPool,
    account: values.account, // Already in { name, sdsId } format
    expiry: values.expiry, // Already in { strategy, endTime?, endTimeZone? } format
    startTime: values.startTime,
    timeZone: values.timeZone,
    iceberg: values.iceberg,
    triggerSide: values.triggerSide,
    targetExecutionRate: values.targetExecutionRate,
    participationRate: values.participationRate,
    executionStyle: values.executionStyle,
    discretionFactor: values.discretionFactor,
    delayBehaviour: values.delayBehaviour,
    skew: values.skew,
    franchiseExposure: values.franchiseExposure,
    twapTargetEndTime: values.twapTargetEndTime,
    twapTimeZone: values.twapTimeZone,
    fixingId: values.fixingId,
    fixingDate: values.fixingDate,
    tenor: values.tenor,
    ndf: values.ndf,
    onshore: values.onshore,
    orderOtherComments: values.orderOtherComments,
    rollInfo: values.rollInfo,
  },
});

/**
 * Builds the AMEND order mutation variables.
 */
const buildAmendOrderVariables = (values: OrderStateData) => ({
  amendOrder: {
    orderId: values.orderId,
    orderType: values.orderType,
    amount: values.amount,
    level: values.level,
    expiry: values.expiry,
    iceberg: values.iceberg,
    triggerSide: values.triggerSide,
    liquidityPool: values.liquidityPool,
    startTime: values.startTime,
    timeZone: values.timeZone,
    targetExecutionRate: values.targetExecutionRate,
    participationRate: values.participationRate,
    skew: values.skew,
    franchiseExposure: values.franchiseExposure,
    discretionFactor: values.discretionFactor,
    delayBehaviour: values.delayBehaviour,
    twapTargetEndTime: values.twapTargetEndTime,
    fixingId: values.fixingId,
    fixingDate: values.fixingDate,
  },
});

/**
 * Executes the CREATE order mutation.
 */
const executeCreateOrder = async (values: OrderStateData): Promise<MutationResult> => {
  return new Promise((resolve, reject) => {
    const variables = buildCreateOrderVariables(values);

    graphqlClient
      .mutate<CreateOrderResponse>({
        mutation: CREATE_ORDER_MUTATION,
        variables,
      })
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
 */
const executeAmendOrder = async (values: OrderStateData): Promise<MutationResult> => {
  return new Promise((resolve, reject) => {
    const variables = buildAmendOrderVariables(values);

    graphqlClient
      .mutate<AmendOrderResponse>({
        mutation: AMEND_ORDER_MUTATION,
        variables,
      })
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
          ? `Order ${values.currencyPair} Amended!`
          : `Order ${values.side} ${values.currencyPair} Placed!`,
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

// ============================================================================
// SLICE IMPLEMENTATION
// ============================================================================

export const createSubmissionSlice: StateCreator<
  BoundState,
  [["zustand/immer", never]],
  [],
  SubmissionSlice
> = (set, get) => ({
  /**
   * Submit the order (final validation + GraphQL mutation).
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
    // Step 1: Validate Order (GraphQL-aligned validation)
    // ========================================
    const validationResult = validateOrderForSubmit(values);

    if (!validationResult.valid) {
      // Validation failed - apply field errors from validation
      const errorCount = Object.keys(validationResult.errors).length;
      const firstError = Object.entries(validationResult.errors)[0];
      const errorSummary =
        errorCount === 1
          ? `${firstError[0]}: ${firstError[1]}`
          : `${errorCount} validation errors found`;

      set((state) => {
        state.status = "READY";
        // Clear previous errors and apply new ones
        state.errors = {};
        Object.entries(validationResult.errors).forEach(([fieldKey, errorMessage]) => {
          state.errors[fieldKey] = errorMessage;
        });
        state.toastMessage = {
          type: "error",
          text: errorSummary,
        };
      });

      // Log validation errors for debugging
      console.error(
        `[${appInstanceId}] [Validation] Order validation failed:`,
        validationResult.errors
      );
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
    });
  },
});
