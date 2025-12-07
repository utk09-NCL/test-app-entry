import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppSlice } from "../../types/store";

import { createAppSlice } from "./createAppSlice";

// Mock idGenerator
vi.mock("../../utils/idGenerator", () => ({
  generateId: vi.fn(() => "mock-instance-id-12345"),
}));

describe("createAppSlice", () => {
  let mockState: Record<string, unknown>;
  let slice: AppSlice;
  let set: ReturnType<typeof vi.fn>;
  let get: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockState = {
      instanceId: "mock-instance-id-12345",
      status: "INITIALIZING",
      editMode: "creating",
      currentOrderId: null,
      orderStatus: null,
      toastMessage: null,
    };

    set = vi.fn((fn: (state: Record<string, unknown>) => void) => {
      fn(mockState);
    }) as never;

    get = vi.fn(() => mockState) as never;

    slice = createAppSlice(set, get, {} as never);
  });

  describe("initial state", () => {
    it("expect instanceId to be generated", () => {
      expect(slice.instanceId).toBe("mock-instance-id-12345");
    });

    it("expect status to be INITIALIZING", () => {
      expect(slice.status).toBe("INITIALIZING");
    });

    it("expect editMode to be creating", () => {
      expect(slice.editMode).toBe("creating");
    });

    it("expect currentOrderId to be null", () => {
      expect(slice.currentOrderId).toBeNull();
    });

    it("expect orderStatus to be null", () => {
      expect(slice.orderStatus).toBeNull();
    });

    it("expect toastMessage to be null", () => {
      expect(slice.toastMessage).toBeNull();
    });
  });

  describe("setStatus", () => {
    it("expect status to be updated to READY", () => {
      slice.setStatus("READY");

      expect(mockState.status).toBe("READY");
    });

    it("expect status to be updated to SUBMITTING", () => {
      slice.setStatus("SUBMITTING");

      expect(mockState.status).toBe("SUBMITTING");
    });

    it("expect status to be updated to ERROR", () => {
      slice.setStatus("ERROR");

      expect(mockState.status).toBe("ERROR");
    });
  });

  describe("setEditMode", () => {
    it("expect editMode to be updated to viewing", () => {
      slice.setEditMode("viewing");

      expect(mockState.editMode).toBe("viewing");
    });

    it("expect editMode to be updated to amending", () => {
      slice.setEditMode("amending");

      expect(mockState.editMode).toBe("amending");
    });

    it("expect editMode to be updated back to creating", () => {
      mockState.editMode = "viewing";
      slice.setEditMode("creating");

      expect(mockState.editMode).toBe("creating");
    });
  });

  describe("setCurrentOrderId", () => {
    it("expect currentOrderId to be set", () => {
      slice.setCurrentOrderId("ORDER-12345");

      expect(mockState.currentOrderId).toBe("ORDER-12345");
    });

    it("expect currentOrderId to be cleared with null", () => {
      mockState.currentOrderId = "ORDER-12345";
      slice.setCurrentOrderId(null);

      expect(mockState.currentOrderId).toBeNull();
    });
  });

  describe("setOrderStatus", () => {
    it("expect orderStatus to be set to WORKING", () => {
      slice.setOrderStatus("WORKING");

      expect(mockState.orderStatus).toBe("WORKING");
    });

    it("expect orderStatus to be set to FILLED", () => {
      slice.setOrderStatus("FILLED");

      expect(mockState.orderStatus).toBe("FILLED");
    });

    it("expect orderStatus to be set to CANCELLED", () => {
      slice.setOrderStatus("CANCELLED");

      expect(mockState.orderStatus).toBe("CANCELLED");
    });

    it("expect orderStatus to be set to REJECTED", () => {
      slice.setOrderStatus("REJECTED");

      expect(mockState.orderStatus).toBe("REJECTED");
    });
  });

  describe("setToast", () => {
    it("expect toast to be set with success message", () => {
      slice.setToast({ type: "success", text: "Order submitted successfully" });

      expect(mockState.toastMessage).toEqual({
        type: "success",
        text: "Order submitted successfully",
      });
    });

    it("expect toast to be set with error message", () => {
      slice.setToast({ type: "error", text: "Submission failed" });

      expect(mockState.toastMessage).toEqual({
        type: "error",
        text: "Submission failed",
      });
    });

    it("expect toast to be set with info message", () => {
      slice.setToast({ type: "info", text: "Order cancelled" });

      expect(mockState.toastMessage).toEqual({
        type: "info",
        text: "Order cancelled",
      });
    });

    it("expect toast to be cleared with null", () => {
      mockState.toastMessage = { type: "success", text: "Test" };
      slice.setToast(null);

      expect(mockState.toastMessage).toBeNull();
    });
  });
});
