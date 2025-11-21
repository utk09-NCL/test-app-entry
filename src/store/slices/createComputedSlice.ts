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
  errors: {},
  warnings: {},
  serverErrors: {},
  isValidating: {},
  validationRequestIds: {},

  getDerivedValues: () => {
    const base = get().baseValues;
    const dirty = get().dirtyValues;
    // User interaction (dirty) always wins over base
    return { ...base, ...dirty } as OrderStateData;
  },

  isDirty: () => {
    return Object.keys(get().dirtyValues).length > 0;
  },

  isFormValid: () => {
    const s = get();
    return Object.keys(s.errors).length === 0 && Object.keys(s.serverErrors).length === 0;
  },

  validateField: async (field, value) => {
    const currentId = (get().validationRequestIds[field] || 0) + 1;

    set((state) => {
      state.validationRequestIds[field] = currentId;
      state.isValidating[field] = true;
      delete state.errors[field]; // Clear previous
    });

    // 1. Sync Validation (Valibot)
    try {
      const derived = get().getDerivedValues();
      const schema = SCHEMA_MAP[derived.orderType];

      if (schema) {
        // Build partial object with only the field being validated
        const partialData = { ...derived, [field]: value };

        // Parse the entire object to get field-specific errors
        const result = v.safeParse(schema, partialData);

        if (!result.success) {
          const fieldIssue = result.issues.find((i) => {
            const path = i.path;
            return path && path.length > 0 && path[0].key === field;
          });

          if (fieldIssue) {
            set((state) => {
              if (state.validationRequestIds[field] === currentId) {
                state.errors[field] = fieldIssue.message;
                state.isValidating[field] = false;
              }
            });
            return;
          }
        }
      }
    } catch (e) {
      // Log ValiError for debugging but don't show to user (they see field-level errors)
      if (e && typeof e === "object" && "name" in e && e.name === "ValiError") {
        console.error("[Validation] ValiError caught during field validation:", e);
      } else if (e) {
        // Log unexpected errors
        console.error("[Validation] Unexpected error during validation:", e);
      }
    }

    // 2. Async Validation (Simulated Server Check)
    // Example: Check if price is within bands
    if (field === "limitPrice" || field === "notional") {
      await new Promise((resolve) =>
        setTimeout(resolve, VALIDATION_CONFIG.SERVER_VALIDATION_DELAY_MS)
      );

      // Check Race Condition
      if (get().validationRequestIds[field] !== currentId) return;

      if (field === "notional" && value && Number(value) > AMOUNT_CONFIG.MAX_FIRM_LIMIT) {
        set((state) => {
          if (state.validationRequestIds[field] === currentId) {
            state.errors[field] = "Exceeds firm trading limit (Server)";
          }
        });
      }
    }

    set((state) => {
      if (state.validationRequestIds[field] === currentId) {
        state.isValidating[field] = false;
      }
    });
  },

  submitOrder: async () => {
    const values = get().getDerivedValues();

    set((state) => {
      state.status = "SUBMITTING";
    });

    // Final Full Validation
    const schema = SCHEMA_MAP[values.orderType];
    const result = v.safeParse(schema, values);

    if (!result.success) {
      set((state) => {
        state.status = "READY";
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
      return;
    }

    try {
      // Mock Server Submit
      await new Promise((resolve) => setTimeout(resolve, 1200));

      console.log("Order Submitted Payload:", values);

      set((state) => {
        state.status = "READY";
        state.editMode = "viewing";
        state.toastMessage = {
          type: "success",
          text: `Order ${values.direction} ${values.symbol} Placed!`,
        };
        state.serverErrors = {};
      });
    } catch (e) {
      console.error("Submission Failed", e);
      set((state) => {
        state.status = "ERROR";
        state.toastMessage = { type: "error", text: "Submission Failed" };
      });
    }
  },

  amendOrder: () => {
    set((state) => {
      state.editMode = "amending";
      // dirtyValues are kept so user continues where they left off,
      // or we could reset them. Requirement says "make editable again".
    });
  },
});
