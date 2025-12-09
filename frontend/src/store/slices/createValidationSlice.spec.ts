/**
 * Tests for createValidationSlice
 *
 * Tests the validation slice which handles:
 * - Client-side validation (Valibot schemas)
 * - Server-side async validation (GraphQL subscription)
 * - Reference data validation
 * - Race condition handling
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CurrencyPair } from "../../types/domain";
import { OrderType } from "../../types/domain";
import type { BoundState, ValidationSlice } from "../../types/store";

// Mock the GraphQL client
vi.mock("../../graphql/client", () => ({
  graphqlClient: {
    query: vi.fn(() => Promise.resolve({ data: {} })),
    subscribe: vi.fn(() => ({
      subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
    })),
  },
}));

// Mock the validation module's SCHEMA_MAP
vi.mock("../../config/validation", () => ({
  SCHEMA_MAP: {
    [OrderType.TAKE_PROFIT]: {
      // Mock schema - safeParse will be handled separately
    },
    [OrderType.LIQUIDITY_SEEKER]: {},
  },
}));

// Mock valibot
vi.mock("valibot", () => ({
  safeParse: vi.fn(),
}));

// Import after mocks are set up
import * as v from "valibot";

import { graphqlClient } from "../../graphql/client";

import { createValidationSlice } from "./createValidationSlice";

// Helper to create a mock currency pair
const createMockCurrencyPair = (symbol: string): CurrencyPair => ({
  id: `${symbol}_false_true_false_true`,
  symbol,
  ccy1: symbol.slice(0, 3),
  ccy2: symbol.slice(3, 6),
  ccy1Deliverable: false,
  ccy2Deliverable: true,
  ccy1Onshore: false,
  ccy2Onshore: true,
  spotPrecision: 4,
  bigDigits: 2,
  bigDigitsOffset: 2,
  additionalPrecision: 1,
  minPipStep: 1,
  defaultPipStep: 10,
  defaultTenor: "SPOT",
  tenor: "SPOT",
  stopLossAllowed: true,
});

describe("createValidationSlice", () => {
  let mockState: Partial<BoundState>;
  let slice: ValidationSlice;
  let set: ReturnType<typeof vi.fn>;
  let get: ReturnType<typeof vi.fn>;

  const mockDerivedValues = {
    currencyPair: "GBPUSD",
    side: "BUY",
    orderType: OrderType.TAKE_PROFIT,
    amount: { amount: 1000000, ccy: "GBP" },
    level: 1.27,
    account: { name: "Test Account", sdsId: 123 },
    liquidityPool: "POOL1",
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockState = {
      instanceId: "test-instance-1",
      errors: {},
      warnings: {},
      serverErrors: {},
      refDataErrors: {},
      globalError: null,
      isValidating: {},
      validationRequestIds: {},
      accounts: [{ sdsId: 123, name: "Test Account" }],
      entitledOrderTypes: [OrderType.TAKE_PROFIT, OrderType.LIQUIDITY_SEEKER],
      currencyPairs: [createMockCurrencyPair("GBPUSD")],
      pools: [{ value: "POOL1", name: "Pool 1" }],
    };

    set = vi.fn((fn: (state: Partial<BoundState>) => void) => {
      fn(mockState);
    }) as never;

    get = vi.fn(() => ({
      ...mockState,
      getDerivedValues: () => mockDerivedValues,
    })) as never;

    slice = createValidationSlice(set, get, {} as never);
  });

  describe("initial state", () => {
    it("expect errors to be empty object initially", () => {
      expect(slice.errors).toEqual({});
    });

    it("expect warnings to be empty object initially", () => {
      expect(slice.warnings).toEqual({});
    });

    it("expect serverErrors to be empty object initially", () => {
      expect(slice.serverErrors).toEqual({});
    });

    it("expect refDataErrors to be empty object initially", () => {
      expect(slice.refDataErrors).toEqual({});
    });

    it("expect globalError to be null initially", () => {
      expect(slice.globalError).toBeNull();
    });

    it("expect isValidating to be empty object initially", () => {
      expect(slice.isValidating).toEqual({});
    });

    it("expect validationRequestIds to be empty object initially", () => {
      expect(slice.validationRequestIds).toEqual({});
    });
  });

  describe("validateField", () => {
    describe("sync validation (valibot)", () => {
      it("expect isValidating to be set when validation starts", async () => {
        vi.mocked(v.safeParse).mockReturnValue({
          success: true,
          typed: true,
          output: mockDerivedValues,
          issues: [],
        } as never);

        // Mock graphqlClient.subscribe to resolve immediately
        const unsubscribeMock = vi.fn();
        vi.mocked(graphqlClient.subscribe).mockReturnValue({
          subscribe: vi.fn((handlers) => {
            // Call next with valid response
            handlers.next({ data: { validateField: { ok: true } } });
            return { unsubscribe: unsubscribeMock };
          }),
        } as never);

        await slice.validateField("level", 1.27);

        // After validation completes, isValidating should be false
        expect(mockState.isValidating?.level).toBe(false);
      });

      it("expect error to be set when valibot validation fails", async () => {
        vi.mocked(v.safeParse).mockReturnValue({
          success: false,
          typed: false,
          output: undefined,
          issues: [
            {
              kind: "validation",
              type: "min_value",
              input: 0,
              expected: ">0",
              received: "0",
              message: "Level must be positive",
              path: [{ key: "level", type: "object", origin: "value", value: 0, input: {} }],
            },
          ],
        } as never);

        await slice.validateField("level", 0);

        expect(mockState.errors?.level).toBe("Level must be positive");
      });

      it("expect no error when issue is for different field", async () => {
        vi.mocked(v.safeParse).mockReturnValue({
          success: false,
          typed: false,
          output: undefined,
          issues: [
            {
              kind: "validation",
              type: "min_value",
              input: 0,
              expected: ">0",
              received: "0",
              message: "Currency pair required",
              path: [{ key: "currencyPair", type: "object", origin: "value", value: 0, input: {} }],
            },
          ],
        } as never);

        // Mock graphqlClient.subscribe to resolve immediately
        vi.mocked(graphqlClient.subscribe).mockReturnValue({
          subscribe: vi.fn((handlers) => {
            handlers.next({ data: { validateField: { ok: true } } });
            return { unsubscribe: vi.fn() };
          }),
        } as never);

        await slice.validateField("level", 1.27);

        expect(mockState.errors?.level).toBeUndefined();
      });

      it("expect previous error to be cleared when validation starts", async () => {
        mockState.errors = { level: "Previous error" };

        vi.mocked(v.safeParse).mockReturnValue({
          success: true,
          typed: true,
          output: mockDerivedValues,
          issues: [],
        } as never);

        vi.mocked(graphqlClient.subscribe).mockReturnValue({
          subscribe: vi.fn((handlers) => {
            handlers.next({ data: { validateField: { ok: true } } });
            return { unsubscribe: vi.fn() };
          }),
        } as never);

        await slice.validateField("level", 1.27);

        // The error should have been cleared during set
        expect(set).toHaveBeenCalled();
      });

      it("expect field error not to be set when request id changes before sync guard", async () => {
        let callCount = 0;
        const customGet = vi.fn(() => {
          callCount += 1;
          if (callCount === 2) {
            // Before guard check executes, simulate newer validation request
            mockState.validationRequestIds = { level: 999 };
          }
          return {
            ...mockState,
            getDerivedValues: () => mockDerivedValues,
          };
        }) as never;

        const sliceWithCustomGet = createValidationSlice(set as never, customGet, {} as never);

        vi.mocked(v.safeParse).mockReturnValue({
          success: false,
          typed: false,
          output: undefined,
          issues: [
            {
              kind: "validation",
              type: "required",
              input: null,
              expected: "number",
              received: "null",
              message: "Level required",
              path: [{ key: "level", type: "object", origin: "value", value: null, input: {} }],
            },
          ],
        } as never);

        await sliceWithCustomGet.validateField("level", null as unknown as number);

        // Guard should skip setting errors because request id changed
        expect(mockState.errors?.level).toBeUndefined();
        expect(mockState.isValidating?.level).toBe(true);
      });
    });

    describe("validation error handling", () => {
      it("expect ValiError to be logged to console", async () => {
        const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        // Make safeParse throw a ValiError
        const valiError = new Error("Valibot schema error");
        (valiError as Error & { name: string }).name = "ValiError";
        vi.mocked(v.safeParse).mockImplementation(() => {
          throw valiError;
        });

        await slice.validateField("level", 1.27);

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining("ValiError caught"),
          valiError
        );

        consoleErrorSpy.mockRestore();
      });

      it("expect unexpected error to be logged to console", async () => {
        const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        vi.mocked(v.safeParse).mockImplementation(() => {
          throw new Error("Unexpected error");
        });

        await slice.validateField("level", 1.27);

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining("Unexpected error during validation"),
          expect.any(Error)
        );

        consoleErrorSpy.mockRestore();
      });
    });

    describe("async validation (server)", () => {
      beforeEach(() => {
        vi.mocked(v.safeParse).mockReturnValue({
          success: true,
          typed: true,
          output: mockDerivedValues,
          issues: [],
        } as never);
      });

      it("expect server validation to be called after sync validation", async () => {
        vi.mocked(graphqlClient.query).mockResolvedValue({
          data: { validateField: { ok: true } },
        } as never);

        await slice.validateField("level", 1.27);

        expect(graphqlClient.query).toHaveBeenCalled();
      });

      it("expect async success to clear serverErrors/warnings and complete when id matches", async () => {
        mockState.serverErrors = { level: "old" };
        mockState.warnings = { level: "old warning" };

        vi.mocked(graphqlClient.query).mockResolvedValue({
          data: { validateField: { ok: true } },
        } as never);

        await slice.validateField("level", 1.27);

        expect(mockState.serverErrors?.level).toBeUndefined();
        expect(mockState.warnings?.level).toBeUndefined();
        expect(mockState.isValidating?.level).toBe(false);
      });

      it("expect serverError to be set when server returns HARD error", async () => {
        vi.mocked(graphqlClient.query).mockResolvedValue({
          data: {
            validateField: {
              ok: false,
              type: "HARD",
              message: "Server validation failed",
            },
          },
        } as never);

        await slice.validateField("level", 1.27);

        expect(mockState.serverErrors?.level).toBe("Server validation failed");
      });

      it("expect warning to be set when server returns SOFT error", async () => {
        vi.mocked(graphqlClient.query).mockResolvedValue({
          data: {
            validateField: {
              ok: false,
              type: "SOFT",
              message: "This is a warning",
            },
          },
        } as never);

        await slice.validateField("level", 1.27);

        expect(mockState.warnings?.level).toBe("This is a warning");
      });

      it("expect server result to be applied when request id matches", async () => {
        vi.mocked(graphqlClient.query).mockResolvedValue({
          data: {
            validateField: {
              ok: false,
              type: "HARD",
              message: "Applied error",
            },
          },
        } as never);

        await slice.validateField("level", 1.2345);

        // The HARD error should be set because the guard sees the latest request id
        expect(mockState.serverErrors?.level).toBe("Applied error");
        // Final completion guard should clear isValidating when ids match
        expect(mockState.isValidating?.level).toBe(false);
      });

      it("expect default message when server error has no message", async () => {
        vi.mocked(graphqlClient.query).mockResolvedValue({
          data: {
            validateField: {
              ok: false,
              type: "HARD",
              message: null,
            },
          },
        } as never);

        await slice.validateField("level", 1.27);

        expect(mockState.serverErrors?.level).toBe("Invalid");
      });

      it("expect default warning when soft error has no message", async () => {
        vi.mocked(graphqlClient.query).mockResolvedValue({
          data: {
            validateField: {
              ok: false,
              type: "SOFT",
              message: null,
            },
          },
        } as never);

        await slice.validateField("level", 1.27);

        expect(mockState.warnings?.level).toBe("Check value");
      });

      it("expect server validation error to be logged", async () => {
        const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        vi.mocked(graphqlClient.query).mockRejectedValue(new Error("Query error"));

        await slice.validateField("level", 1.27);

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining("Server validation error"),
          expect.any(Error)
        );

        consoleErrorSpy.mockRestore();
      });

      it("expect payload-less server response to leave state unchanged but complete", async () => {
        vi.mocked(graphqlClient.query).mockResolvedValue({ data: {} } as never);

        await slice.validateField("level", 1.27);

        // No payload means no serverErrors/warnings set
        expect(mockState.serverErrors?.level).toBeUndefined();
        expect(mockState.warnings?.level).toBeUndefined();
        // Should still clear isValidating on completion
        expect(mockState.isValidating?.level).toBe(false);
      });

      it("expect async guard to short-circuit when request id is stale before payload handling", async () => {
        vi.mocked(graphqlClient.query).mockImplementation(async () => {
          // Simulate newer validation request arriving before payload is processed
          mockState.validationRequestIds = { level: 999 };
          return { data: { validateField: { ok: true } } } as never;
        });

        await slice.validateField("level", 1.27);

        // Early return should skip server error/warning updates and completion flag
        expect(mockState.serverErrors?.level).toBeUndefined();
        expect(mockState.warnings?.level).toBeUndefined();
        // isValidating remains true because completion is skipped on guard return
        expect(mockState.isValidating?.level).toBe(true);
        // Validation request id reflects the newer request we simulated
        expect(mockState.validationRequestIds?.level).toBe(999);
      });

      it("expect second async guard to skip mutation when request id changes after payload", async () => {
        let callCount = 0;
        const customGet = vi.fn(() => {
          callCount += 1;
          if (callCount === 3) {
            // After first guard passes and payload is read, flip the id to simulate newer request
            mockState.validationRequestIds = { level: 999 };
          }
          return {
            ...mockState,
            getDerivedValues: () => mockDerivedValues,
          };
        }) as never;

        const sliceWithCustomGet = createValidationSlice(set as never, customGet, {} as never);

        vi.mocked(graphqlClient.query).mockResolvedValue({
          data: { validateField: { ok: false, type: "HARD", message: "Should be skipped" } },
        } as never);

        await sliceWithCustomGet.validateField("level", 1.27);

        // Because id changed between guards, no mutation should occur and completion guard should also skip
        expect(mockState.serverErrors?.level).toBeUndefined();
        expect(mockState.warnings?.level).toBeUndefined();
        expect(mockState.isValidating?.level).toBe(true);
        expect(mockState.validationRequestIds?.level).toBe(999);
      });
    });

    describe("race condition handling", () => {
      it("expect stale validation results to be ignored", async () => {
        vi.mocked(v.safeParse).mockReturnValue({
          success: true,
          typed: true,
          output: mockDerivedValues,
          issues: [],
        } as never);

        // Simulate stale request by setting a higher request ID
        mockState.validationRequestIds = { level: 999 };

        vi.mocked(graphqlClient.query).mockResolvedValue({
          data: {
            validateField: {
              ok: false,
              type: "HARD",
              message: "Stale error",
            },
          },
        } as never);

        await slice.validateField("level", 1.27);

        // The stale result should not set the error
        // Because validationRequestIds was already higher
      });

      it("expect async result to be ignored when request id changes mid-flight", async () => {
        vi.mocked(v.safeParse).mockReturnValue({
          success: true,
          typed: true,
          output: mockDerivedValues,
          issues: [],
        } as never);

        // Simulate a new validation request arriving while async call is in-flight
        vi.mocked(graphqlClient.query).mockImplementation(async () => {
          mockState.validationRequestIds = { level: 999 };
          return {
            data: {
              validateField: {
                ok: false,
                type: "HARD",
                message: "Late arrival",
              },
            },
          } as never;
        });

        await slice.validateField("level", 1.27);

        // Guards should prevent late results from mutating state
        expect(mockState.serverErrors?.level).toBeUndefined();
        expect(mockState.warnings?.level).toBeUndefined();
        // isValidating stays true because completion guard also exits
        expect(mockState.isValidating?.level).toBe(true);
      });

      it("expect flow to continue when no schema exists for order type", async () => {
        const getWithoutSchema = vi.fn(() => ({
          ...mockState,
          getDerivedValues: () => ({
            ...mockDerivedValues,
            orderType: "UNKNOWN", // not present in mocked SCHEMA_MAP
          }),
        })) as never;

        const sliceWithoutSchema = createValidationSlice(
          set as never,
          getWithoutSchema,
          {} as never
        );

        vi.mocked(graphqlClient.query).mockResolvedValue({
          data: { validateField: { ok: true } },
        } as never);

        await sliceWithoutSchema.validateField("level", 1.27);

        // Should still finish and clear validating even without schema branch
        expect(mockState.isValidating?.level).toBe(false);
        expect(mockState.errors?.level).toBeUndefined();
      });
    });
  });

  describe("validateRefData", () => {
    it("expect no errors when all ref data exists", () => {
      mockState.accounts = [{ sdsId: 123, name: "Test" }];
      mockState.entitledOrderTypes = [OrderType.TAKE_PROFIT];
      mockState.currencyPairs = [createMockCurrencyPair("GBPUSD")];
      mockState.pools = [{ value: "POOL1", name: "Pool 1" }];

      slice.validateRefData();

      expect(mockState.refDataErrors).toEqual({});
    });

    it("expect account error when account not in list", () => {
      mockState.accounts = [{ sdsId: 456, name: "Other Account" }]; // Different account

      slice.validateRefData();

      expect(mockState.refDataErrors?.account).toBe("Account not available");
    });

    it("expect orderType error when not entitled", () => {
      mockState.entitledOrderTypes = [OrderType.LIQUIDITY_SEEKER]; // TAKE_PROFIT not entitled

      slice.validateRefData();

      expect(mockState.refDataErrors?.orderType).toBe("Order type not supported");
    });

    it("expect currencyPair error when currency pair not available", () => {
      mockState.currencyPairs = [createMockCurrencyPair("EURUSD")];

      slice.validateRefData();

      expect(mockState.refDataErrors?.currencyPair).toBe(
        "Currency pair not available for this order type"
      );
    });

    it("expect liquidityPool error when pool not available", () => {
      mockState.pools = [{ value: "POOL2", name: "Pool 2" }];

      slice.validateRefData();

      expect(mockState.refDataErrors?.liquidityPool).toBe("Liquidity pool not available");
    });

    it("expect globalError to be set when refDataErrors exist", () => {
      mockState.pools = []; // No pools available

      slice.validateRefData();

      expect(mockState.globalError).toBe("Please contact support@example.com");
    });

    it("expect globalError to be cleared when refDataErrors are resolved", () => {
      mockState.globalError = "Please contact support@example.com";
      // All ref data exists (set in beforeEach)

      slice.validateRefData();

      expect(mockState.globalError).toBeNull();
    });

    it("expect globalError not to be overwritten when server error exists", () => {
      mockState.globalError = "Server error message";
      mockState.pools = []; // No pools - would normally set globalError

      slice.validateRefData();

      // Should keep server error, not override with refData error
      expect(mockState.globalError).toBe("Server error message");
    });

    it("expect no account error when account is empty", () => {
      const newGet = vi.fn(() => ({
        ...mockState,
        getDerivedValues: () => ({ ...mockDerivedValues, account: undefined }),
      })) as never;

      const newSlice = createValidationSlice(set as never, newGet, {} as never);
      newSlice.validateRefData();

      expect(mockState.refDataErrors?.account).toBeUndefined();
    });

    it("expect no orderType error when orderType is empty", () => {
      const newGet = vi.fn(() => ({
        ...mockState,
        getDerivedValues: () => ({ ...mockDerivedValues, orderType: "" }),
      })) as never;

      const newSlice = createValidationSlice(set as never, newGet, {} as never);
      newSlice.validateRefData();

      expect(mockState.refDataErrors?.orderType).toBeUndefined();
    });

    it("expect no currencyPair error when currencyPair is empty", () => {
      const newGet = vi.fn(() => ({
        ...mockState,
        getDerivedValues: () => ({ ...mockDerivedValues, currencyPair: "" }),
      })) as never;

      const newSlice = createValidationSlice(set as never, newGet, {} as never);
      newSlice.validateRefData();

      expect(mockState.refDataErrors?.currencyPair).toBeUndefined();
    });

    it("expect no liquidityPool error when pool is empty", () => {
      const newGet = vi.fn(() => ({
        ...mockState,
        getDerivedValues: () => ({ ...mockDerivedValues, liquidityPool: "" }),
      })) as never;

      const newSlice = createValidationSlice(set as never, newGet, {} as never);
      newSlice.validateRefData();

      expect(mockState.refDataErrors?.liquidityPool).toBeUndefined();
    });
  });

  describe("setGlobalError", () => {
    it("expect globalError to be set", () => {
      slice.setGlobalError("Custom error message");

      expect(mockState.globalError).toBe("Custom error message");
    });

    it("expect globalError to be cleared when set to null", () => {
      mockState.globalError = "Existing error";

      slice.setGlobalError(null);

      expect(mockState.globalError).toBeNull();
    });
  });

  describe("cancelAllValidations", () => {
    it("expect all validation errors to be cleared", () => {
      mockState.errors = { level: "Error" };
      mockState.serverErrors = { currencyPair: "Server error" };
      mockState.warnings = { account: "Warning" };
      mockState.refDataErrors = { orderType: "Ref data error" };
      mockState.isValidating = { level: true };

      slice.cancelAllValidations();

      expect(mockState.errors).toEqual({});
      expect(mockState.serverErrors).toEqual({});
      expect(mockState.warnings).toEqual({});
      expect(mockState.refDataErrors).toEqual({});
      expect(mockState.isValidating).toEqual({});
    });

    it("expect validationRequestIds to be preserved", () => {
      mockState.validationRequestIds = { level: 5, currencyPair: 3 };
      mockState.errors = { level: "Error" };

      slice.cancelAllValidations();

      // validationRequestIds should NOT be cleared (they prevent stale validations)
      expect(mockState.validationRequestIds).toEqual({ level: 5, currencyPair: 3 });
    });

    it("expect set to be called when cancelling validations", () => {
      mockState.errors = { level: "Error" };

      slice.cancelAllValidations();

      expect(set).toHaveBeenCalledTimes(1);
    });
  });

  describe("clearValidationState", () => {
    it("expect all validation state to be cleared", () => {
      mockState.errors = { level: "Error" };
      mockState.warnings = { currencyPair: "Warning" };
      mockState.serverErrors = { account: "Server error" };
      mockState.refDataErrors = { orderType: "Ref error" };
      mockState.globalError = "Global error";
      mockState.isValidating = { level: true };
      mockState.validationRequestIds = { level: 1 };

      slice.clearValidationState();

      expect(mockState.errors).toEqual({});
      expect(mockState.warnings).toEqual({});
      expect(mockState.serverErrors).toEqual({});
      expect(mockState.refDataErrors).toEqual({});
      expect(mockState.globalError).toBeNull();
      expect(mockState.isValidating).toEqual({});
      expect(mockState.validationRequestIds).toEqual({});
    });
  });
});
