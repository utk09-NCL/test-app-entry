import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderHook } from "@testing-library/react";

import { useOrderTracking } from "./useOrderTracking";

// Mock the store
vi.mock("../store", () => ({
  useOrderEntryStore: vi.fn(),
}));

// Mock Apollo client
vi.mock("@apollo/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@apollo/client")>();
  return {
    ...actual,
    useSubscription: vi.fn(),
  };
});

import { useSubscription } from "@apollo/client";

import { useOrderEntryStore } from "../store";

describe("useOrderTracking", () => {
  const mockSetOrderStatus = vi.fn();
  const mockSetToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useOrderEntryStore).mockImplementation((selector) => {
      const state = {
        currentOrderId: null,
        setOrderStatus: mockSetOrderStatus,
        setToast: mockSetToast,
      };
      return selector(state as never);
    });

    vi.mocked(useSubscription).mockReturnValue({
      data: undefined,
      loading: false,
      error: undefined,
    } as never);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("subscription initialization", () => {
    it("expect subscription to be skipped when no currentOrderId", () => {
      renderHook(() => useOrderTracking());

      // Verify useSubscription was called with skip: true
      expect(useSubscription).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          skip: true,
        })
      );
    });

    it("expect subscription to be active when currentOrderId is set", () => {
      vi.mocked(useOrderEntryStore).mockImplementation((selector) => {
        const state = {
          currentOrderId: "ORDER-123",
          setOrderStatus: mockSetOrderStatus,
          setToast: mockSetToast,
        };
        return selector(state as never);
      });

      renderHook(() => useOrderTracking());

      // Verify useSubscription was called with skip: false and correct variables
      expect(useSubscription).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          skip: false,
          variables: { orderId: "ORDER-123" },
        })
      );
    });

    it("expect fetchPolicy to be no-cache for order subscription", () => {
      vi.mocked(useOrderEntryStore).mockImplementation((selector) => {
        const state = {
          currentOrderId: "ORDER-123",
          setOrderStatus: mockSetOrderStatus,
          setToast: mockSetToast,
        };
        return selector(state as never);
      });

      renderHook(() => useOrderTracking());

      expect(useSubscription).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          fetchPolicy: "no-cache",
        })
      );
    });
  });

  describe("order status updates", () => {
    it("expect setOrderStatus to be called when orderData updates with WORKING status", () => {
      vi.mocked(useOrderEntryStore).mockImplementation((selector) => {
        const state = {
          currentOrderId: "ORDER-123",
          setOrderStatus: mockSetOrderStatus,
          setToast: mockSetToast,
        };
        return selector(state as never);
      });

      // First call is ORDER_SUBSCRIPTION, second is ORDER_FAILURE_SUBSCRIPTION
      let callCount = 0;
      vi.mocked(useSubscription).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            data: {
              orderData: {
                execution: {
                  status: "WORKING",
                },
              },
            },
            loading: false,
            error: undefined,
          } as never;
        }
        return {
          data: undefined,
          loading: false,
          error: undefined,
        } as never;
      });

      renderHook(() => useOrderTracking());

      expect(mockSetOrderStatus).toHaveBeenCalledWith("WORKING");
    });

    it("expect success toast when order status is FILLED", () => {
      vi.mocked(useOrderEntryStore).mockImplementation((selector) => {
        const state = {
          currentOrderId: "ORDER-123",
          setOrderStatus: mockSetOrderStatus,
          setToast: mockSetToast,
        };
        return selector(state as never);
      });

      let callCount = 0;
      vi.mocked(useSubscription).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            data: {
              orderData: {
                execution: {
                  status: "FILLED",
                },
              },
            },
            loading: false,
            error: undefined,
          } as never;
        }
        return {
          data: undefined,
          loading: false,
          error: undefined,
        } as never;
      });

      renderHook(() => useOrderTracking());

      expect(mockSetOrderStatus).toHaveBeenCalledWith("FILLED");
      expect(mockSetToast).toHaveBeenCalledWith({
        type: "success",
        text: "Order Filled Successfully!",
      });
    });

    it("expect info toast when order status is CANCELLED", () => {
      vi.mocked(useOrderEntryStore).mockImplementation((selector) => {
        const state = {
          currentOrderId: "ORDER-123",
          setOrderStatus: mockSetOrderStatus,
          setToast: mockSetToast,
        };
        return selector(state as never);
      });

      let callCount = 0;
      vi.mocked(useSubscription).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            data: {
              orderData: {
                execution: {
                  status: "CANCELLED",
                },
              },
            },
            loading: false,
            error: undefined,
          } as never;
        }
        return {
          data: undefined,
          loading: false,
          error: undefined,
        } as never;
      });

      renderHook(() => useOrderTracking());

      expect(mockSetOrderStatus).toHaveBeenCalledWith("CANCELLED");
      expect(mockSetToast).toHaveBeenCalledWith({
        type: "info",
        text: "Order Cancelled",
      });
    });

    it("expect error toast when order status is REJECTED", () => {
      vi.mocked(useOrderEntryStore).mockImplementation((selector) => {
        const state = {
          currentOrderId: "ORDER-123",
          setOrderStatus: mockSetOrderStatus,
          setToast: mockSetToast,
        };
        return selector(state as never);
      });

      let callCount = 0;
      vi.mocked(useSubscription).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            data: {
              orderData: {
                execution: {
                  status: "REJECTED",
                  rejectReason: "Insufficient funds",
                },
              },
            },
            loading: false,
            error: undefined,
          } as never;
        }
        return {
          data: undefined,
          loading: false,
          error: undefined,
        } as never;
      });

      renderHook(() => useOrderTracking());

      expect(mockSetOrderStatus).toHaveBeenCalledWith("REJECTED");
      expect(mockSetToast).toHaveBeenCalledWith({
        type: "error",
        text: "Order Rejected: Insufficient funds",
      });
    });

    it("expect error toast with unknown reason when rejected without reason", () => {
      vi.mocked(useOrderEntryStore).mockImplementation((selector) => {
        const state = {
          currentOrderId: "ORDER-123",
          setOrderStatus: mockSetOrderStatus,
          setToast: mockSetToast,
        };
        return selector(state as never);
      });

      let callCount = 0;
      vi.mocked(useSubscription).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            data: {
              orderData: {
                execution: {
                  status: "REJECTED",
                },
              },
            },
            loading: false,
            error: undefined,
          } as never;
        }
        return {
          data: undefined,
          loading: false,
          error: undefined,
        } as never;
      });

      renderHook(() => useOrderTracking());

      expect(mockSetToast).toHaveBeenCalledWith({
        type: "error",
        text: "Order Rejected: Unknown reason",
      });
    });
  });

  describe("order failure handling", () => {
    it("expect error toast when order failure subscription returns data", () => {
      vi.mocked(useOrderEntryStore).mockImplementation((selector) => {
        const state = {
          currentOrderId: "ORDER-123",
          setOrderStatus: mockSetOrderStatus,
          setToast: mockSetToast,
        };
        return selector(state as never);
      });

      let callCount = 0;
      vi.mocked(useSubscription).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // ORDER_SUBSCRIPTION
          return {
            data: undefined,
            loading: false,
            error: undefined,
          } as never;
        }
        // ORDER_FAILURE_SUBSCRIPTION
        return {
          data: {
            orderFailure: {
              description: "Order rejected by exchange",
              errorCode: "ERR_001",
              reason: "Limit exceeded",
            },
          },
          loading: false,
          error: undefined,
        } as never;
      });

      renderHook(() => useOrderTracking());

      expect(mockSetToast).toHaveBeenCalledWith({
        type: "error",
        text: "Order rejected by exchange (ERR_001)",
      });
    });
  });

  describe("no data scenarios", () => {
    it("expect no action when orderData is undefined", () => {
      vi.mocked(useOrderEntryStore).mockImplementation((selector) => {
        const state = {
          currentOrderId: "ORDER-123",
          setOrderStatus: mockSetOrderStatus,
          setToast: mockSetToast,
        };
        return selector(state as never);
      });

      vi.mocked(useSubscription).mockReturnValue({
        data: undefined,
        loading: true,
        error: undefined,
      } as never);

      renderHook(() => useOrderTracking());

      expect(mockSetOrderStatus).not.toHaveBeenCalled();
      expect(mockSetToast).not.toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("expect error toast when ORDER_SUBSCRIPTION onError is triggered", () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      vi.mocked(useOrderEntryStore).mockImplementation((selector) => {
        const state = {
          currentOrderId: "ORDER-123",
          setOrderStatus: mockSetOrderStatus,
          setToast: mockSetToast,
        };
        return selector(state as never);
      });

      let callCount = 0;
      let orderSubOnError: ((err: unknown) => void) | undefined;

      vi.mocked(useSubscription).mockImplementation((_query, options) => {
        callCount++;
        // First call is ORDER_SUBSCRIPTION
        if (callCount === 1 && options && "onError" in options) {
          orderSubOnError = options.onError as (err: unknown) => void;
        }
        return {
          data: undefined,
          loading: false,
          error: undefined,
        } as never;
      });

      renderHook(() => useOrderTracking());

      // Trigger the ORDER_SUBSCRIPTION onError callback
      if (orderSubOnError) {
        orderSubOnError(new Error("Subscription failed"));
      }

      expect(mockSetToast).toHaveBeenCalledWith({
        type: "error",
        text: "Failed to track order status",
      });

      consoleErrorSpy.mockRestore();
    });

    it("expect console error when ORDER_FAILURE_SUBSCRIPTION onError is triggered", () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      vi.mocked(useOrderEntryStore).mockImplementation((selector) => {
        const state = {
          currentOrderId: "ORDER-123",
          setOrderStatus: mockSetOrderStatus,
          setToast: mockSetToast,
        };
        return selector(state as never);
      });

      let callCount = 0;
      let failureSubOnError: ((err: unknown) => void) | undefined;

      vi.mocked(useSubscription).mockImplementation((_query, options) => {
        callCount++;
        // Second call is ORDER_FAILURE_SUBSCRIPTION
        if (callCount === 2 && options && "onError" in options) {
          failureSubOnError = options.onError as (err: unknown) => void;
        }
        return {
          data: undefined,
          loading: false,
          error: undefined,
        } as never;
      });

      renderHook(() => useOrderTracking());

      // Trigger the ORDER_FAILURE_SUBSCRIPTION onError callback
      if (failureSubOnError) {
        failureSubOnError(new Error("Failure subscription error"));
      }

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[useOrderTracking] Order failure subscription error:",
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });
});
