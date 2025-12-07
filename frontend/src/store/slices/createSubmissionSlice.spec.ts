/**
 * Tests for createSubmissionSlice
 *
 * Tests the submission slice which handles:
 * - Order validation before submission
 * - GraphQL mutations (create/amend)
 * - Success/error handling
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import type { OrderStateData } from "../../types/domain";
import { OrderSide, OrderType } from "../../types/domain";
import type { BoundState, SubmissionSlice } from "../../types/store";

// Mock the GraphQL client
vi.mock("../../graphql/client", () => ({
  graphqlClient: {
    mutate: vi.fn(),
  },
}));

// Mock the validation module
vi.mock("../../config/validation", () => ({
  validateOrderForSubmission: vi.fn(),
}));

// Import after mocks are set up
import { validateOrderForSubmission } from "../../config/validation";
import { graphqlClient } from "../../graphql/client";

import { createSubmissionSlice } from "./createSubmissionSlice";

describe("createSubmissionSlice", () => {
  let mockState: Partial<BoundState>;
  let slice: SubmissionSlice;
  let set: ReturnType<typeof vi.fn>;
  let get: ReturnType<typeof vi.fn>;

  const mockOrderValues: OrderStateData = {
    currencyPair: "GBPUSD",
    side: OrderSide.BUY,
    orderType: OrderType.FLOAT,
    amount: { amount: 1000000, ccy: "GBP" },
    level: 1.27,
    account: { name: "ACC-123", sdsId: 42 },
    liquidityPool: "POOL1",
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockState = {
      instanceId: "test-instance-1",
      status: "READY",
      editMode: "creating",
      currentOrderId: null,
      errors: {},
      serverErrors: {},
      warnings: {},
      refDataErrors: {},
      toastMessage: null,
    };

    set = vi.fn((fn: (state: Partial<BoundState>) => void) => {
      fn(mockState);
    }) as never;

    get = vi.fn(() => ({
      ...mockState,
      getDerivedValues: () => mockOrderValues,
    })) as never;

    slice = createSubmissionSlice(set, get, {} as never);
  });

  describe("submitOrder", () => {
    describe("guard conditions", () => {
      it("expect submitOrder to return early when status is SUBMITTING", async () => {
        mockState.status = "SUBMITTING";
        const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

        await slice.submitOrder();

        expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining("Already submitting"));
        expect(set).not.toHaveBeenCalled();

        consoleWarnSpy.mockRestore();
      });
    });

    describe("validation failure", () => {
      it("expect submitOrder to set errors when validation fails", async () => {
        vi.mocked(validateOrderForSubmission).mockReturnValue({
          valid: false,
          errors: { notional: "Notional is required" },
        });

        await slice.submitOrder();

        // Check that status was set to SUBMITTING first
        expect(set).toHaveBeenCalledWith(expect.any(Function));

        // Check that errors were set
        expect(mockState.errors).toEqual({ notional: "Notional is required" });
        expect(mockState.status).toBe("READY");
        expect(mockState.toastMessage).toEqual({
          type: "error",
          text: "Please fix validation errors.",
        });
      });

      it("expect submitOrder to clear previous errors before setting new ones", async () => {
        mockState.errors = { currencyPair: "Previous error" };

        vi.mocked(validateOrderForSubmission).mockReturnValue({
          valid: false,
          errors: { notional: "Notional is required" },
        });

        await slice.submitOrder();

        expect(mockState.errors).toEqual({ notional: "Notional is required" });
        expect(mockState.errors).not.toHaveProperty("currencyPair");
      });
    });

    describe("successful order creation", () => {
      beforeEach(() => {
        vi.mocked(validateOrderForSubmission).mockReturnValue({
          valid: true,
          errors: {},
        });
      });

      it("expect submitOrder to call GraphQL mutation when validation passes", async () => {
        vi.mocked(graphqlClient.mutate).mockResolvedValue({
          data: {
            createOrder: {
              result: "SUCCESS",
              orderId: "ORDER-123",
            },
          },
        });

        await slice.submitOrder();

        expect(graphqlClient.mutate).toHaveBeenCalledWith(
          expect.objectContaining({
            variables: expect.objectContaining({
              orderEntry: expect.objectContaining({
                currencyPair: "GBPUSD",
                side: "BUY",
                orderType: OrderType.FLOAT,
                amount: { amount: 1000000, ccy: "GBP" },
                level: 1.27,
              }),
            }),
          })
        );
      });

      it("expect submitOrder to set success toast when order is created", async () => {
        vi.mocked(graphqlClient.mutate).mockResolvedValue({
          data: {
            createOrder: {
              result: "SUCCESS",
              orderId: "ORDER-456",
            },
          },
        });

        await slice.submitOrder();

        expect(mockState.toastMessage).toEqual({
          type: "success",
          text: expect.stringContaining("BUY"),
        });
        expect(mockState.status).toBe("READY");
        expect(mockState.editMode).toBe("viewing");
        expect(mockState.currentOrderId).toBe("ORDER-456");
      });

      it("expect submitOrder to clear serverErrors and warnings on success", async () => {
        mockState.serverErrors = { notional: "Server error" };
        mockState.warnings = { currencyPair: "Warning" };

        vi.mocked(graphqlClient.mutate).mockResolvedValue({
          data: {
            createOrder: {
              result: "SUCCESS",
              orderId: "ORDER-789",
            },
          },
        });

        await slice.submitOrder();

        expect(mockState.serverErrors).toEqual({});
        expect(mockState.warnings).toEqual({});
      });
    });

    describe("order creation failure", () => {
      beforeEach(() => {
        vi.mocked(validateOrderForSubmission).mockReturnValue({
          valid: true,
          errors: {},
        });
      });

      it("expect submitOrder to show error toast when server rejects order", async () => {
        const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        vi.mocked(graphqlClient.mutate).mockResolvedValue({
          data: {
            createOrder: {
              result: "FAILURE",
              failureReason: "Insufficient funds",
            },
          },
        });

        await slice.submitOrder();

        expect(mockState.toastMessage).toEqual({
          type: "error",
          text: "Insufficient funds",
        });
        expect(mockState.status).toBe("READY");
        expect(consoleErrorSpy).toHaveBeenCalled();

        consoleErrorSpy.mockRestore();
      });

      it("expect submitOrder to show default message when no failure reason provided", async () => {
        vi.spyOn(console, "error").mockImplementation(() => {});

        vi.mocked(graphqlClient.mutate).mockResolvedValue({
          data: {
            createOrder: {
              result: "FAILURE",
            },
          },
        });

        await slice.submitOrder();

        expect(mockState.toastMessage).toEqual({
          type: "error",
          text: "Order submission failed",
        });
      });
    });

    describe("mutation error handling", () => {
      beforeEach(() => {
        vi.mocked(validateOrderForSubmission).mockReturnValue({
          valid: true,
          errors: {},
        });
      });

      it("expect submitOrder to handle network errors gracefully", async () => {
        const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        vi.mocked(graphqlClient.mutate).mockRejectedValue(new Error("Network error"));

        await slice.submitOrder();

        expect(mockState.toastMessage).toEqual({
          type: "error",
          text: "Submission Failed",
        });
        expect(mockState.status).toBe("READY");
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining("Submission Error"),
          expect.any(Error)
        );

        consoleErrorSpy.mockRestore();
      });

      it("expect submitOrder to set editMode to viewing when error occurs with existing orderId", async () => {
        mockState.currentOrderId = "EXISTING-ORDER";
        vi.spyOn(console, "error").mockImplementation(() => {});

        // Need to update get() to return the currentOrderId
        const newGet = vi.fn(() => ({
          ...mockState,
          getDerivedValues: () => mockOrderValues,
          currentOrderId: "EXISTING-ORDER",
        })) as never;

        const newSlice = createSubmissionSlice(set as never, newGet, {} as never);

        vi.mocked(graphqlClient.mutate).mockRejectedValue(new Error("Network error"));

        await newSlice.submitOrder();

        expect(mockState.editMode).toBe("viewing");
        expect(mockState.toastMessage).toEqual({
          type: "error",
          text: "Error tracking order status",
        });
      });
    });

    describe("order amendment", () => {
      beforeEach(() => {
        mockState.editMode = "amending";

        vi.mocked(validateOrderForSubmission).mockReturnValue({
          valid: true,
          errors: {},
        });

        // Update mockOrderValues to include orderId
        get = vi.fn(() => ({
          ...mockState,
          getDerivedValues: () => ({
            ...mockOrderValues,
            orderId: "ORDER-TO-AMEND",
          }),
        })) as never;

        slice = createSubmissionSlice(set as never, get, {} as never);
      });

      it("expect submitOrder to call amend mutation when in amending mode", async () => {
        vi.mocked(graphqlClient.mutate).mockResolvedValue({
          data: {
            amendOrder: {
              result: "SUCCESS",
              orderId: "ORDER-TO-AMEND",
            },
          },
        });

        await slice.submitOrder();

        expect(graphqlClient.mutate).toHaveBeenCalledWith(
          expect.objectContaining({
            variables: expect.objectContaining({
              amendOrder: expect.objectContaining({
                orderId: "ORDER-TO-AMEND",
                amount: { amount: 1000000, ccy: "GBP" },
                level: 1.27,
              }),
            }),
          })
        );
      });

      it("expect submitOrder to show amended success message", async () => {
        vi.mocked(graphqlClient.mutate).mockResolvedValue({
          data: {
            amendOrder: {
              result: "SUCCESS",
              orderId: "ORDER-TO-AMEND",
            },
          },
        });

        await slice.submitOrder();

        expect(mockState.toastMessage).toEqual({
          type: "success",
          text: expect.stringContaining("Amended"),
        });
      });

      it("expect submitOrder to go to viewing mode when amendment fails", async () => {
        vi.spyOn(console, "error").mockImplementation(() => {});

        vi.mocked(graphqlClient.mutate).mockResolvedValue({
          data: {
            amendOrder: {
              result: "FAILURE",
              failureReason: "Cannot amend filled order",
            },
          },
        });

        await slice.submitOrder();

        expect(mockState.editMode).toBe("viewing");
        expect(mockState.toastMessage).toEqual({
          type: "error",
          text: "Cannot amend filled order",
        });
      });

      it("expect submitOrder to handle network error during amendment", async () => {
        const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        vi.mocked(graphqlClient.mutate).mockRejectedValue(new Error("Amendment network error"));

        await slice.submitOrder();

        expect(mockState.status).toBe("READY");
        expect(mockState.toastMessage).toEqual({
          type: "error",
          text: "Submission Failed",
        });
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining("Submission Error"),
          expect.any(Error)
        );

        consoleErrorSpy.mockRestore();
      });
    });
  });

  describe("amendOrder", () => {
    it("expect amendOrder to set editMode to amending when no refDataErrors", () => {
      mockState.refDataErrors = {};

      slice.amendOrder();

      expect(mockState.editMode).toBe("amending");
    });

    it("expect amendOrder to show error toast when refDataErrors exist", () => {
      mockState.refDataErrors = { account: "Account not available" };

      slice.amendOrder();

      expect(mockState.toastMessage).toEqual({
        type: "error",
        text: "Cannot amend order with unavailable data",
      });
      expect(mockState.editMode).not.toBe("amending");
    });

    it("expect amendOrder to not change editMode when refDataErrors exist", () => {
      mockState.editMode = "viewing";
      mockState.refDataErrors = { currencyPair: "Symbol not available" };

      slice.amendOrder();

      expect(mockState.editMode).toBe("viewing");
    });
  });
});
