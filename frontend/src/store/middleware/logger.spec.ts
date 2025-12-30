import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { create } from "zustand";

import {
  isPriceLoggingEnabled,
  isValidationLoggingEnabled,
  loggerConfig,
  loggerMiddleware,
  resetPriceLogTime,
} from "./logger";

const originalNodeEnv = process.env.NODE_ENV;

describe("loggerMiddleware", () => {
  it("expect middleware to be a function when imported", () => {
    expect(typeof loggerMiddleware).toBe("function");
  });

  it("expect middleware to return a function when called with config", () => {
    const mockConfig = vi.fn();
    const result = loggerMiddleware(mockConfig);
    expect(typeof result).toBe("function");
  });

  it("expect middleware to call config with set, get, api when initialized", () => {
    const mockConfig = vi.fn();
    const mockSet = vi.fn();
    const mockGet = vi.fn();
    const mockApi = {
      setState: vi.fn(),
      getState: vi.fn(),
      subscribe: vi.fn(),
      getInitialState: vi.fn(),
    };

    const middleware = loggerMiddleware(mockConfig);
    middleware(mockSet, mockGet, mockApi);

    expect(mockConfig).toHaveBeenCalledTimes(1);
    expect(mockConfig).toHaveBeenCalledWith(expect.any(Function), mockGet, mockApi);
  });

  it("expect wrapped set to call original set when invoked", () => {
    const mockSet = vi.fn();
    const mockGet = vi.fn().mockReturnValue({ count: 0 });
    const mockApi = {
      setState: vi.fn(),
      getState: vi.fn(),
      subscribe: vi.fn(),
      getInitialState: vi.fn(),
    };

    // Capture the wrapped set function
    let wrappedSet: (args: unknown) => void = () => {};
    const mockConfig = vi.fn().mockImplementation((set) => {
      wrappedSet = set;
    });

    const middleware = loggerMiddleware(mockConfig);
    middleware(mockSet, mockGet, mockApi);

    // Call the wrapped set
    const newState = { count: 1 };
    wrappedSet(newState);

    // Logger passes (arg1, arg2) where arg2 is undefined when not provided
    expect(mockSet).toHaveBeenCalledWith(newState, undefined);
  });

  it("expect set to be passed through transparently when middleware wraps it", () => {
    const updates: unknown[] = [];
    const mockSet = vi.fn().mockImplementation((arg) => updates.push(arg));
    const mockGet = vi.fn().mockReturnValue({ value: "test" });
    const mockApi = {
      setState: vi.fn(),
      getState: vi.fn(),
      subscribe: vi.fn(),
      getInitialState: vi.fn(),
    };

    let wrappedSet: (args: unknown) => void = () => {};
    const mockConfig = vi.fn().mockImplementation((set) => {
      wrappedSet = set;
    });

    const middleware = loggerMiddleware(mockConfig);
    middleware(mockSet, mockGet, mockApi);

    // Test with object
    wrappedSet({ value: "new" });
    expect(updates[0]).toEqual({ value: "new" });

    // Test with function
    const updateFn = (state: { value: string }) => ({ value: state.value + "!" });
    wrappedSet(updateFn);
    expect(updates[1]).toBe(updateFn);
  });
});

describe("Logger Middleware - Development Mode Logging", () => {
  // Mock console methods
  const consoleSpy = {
    group: vi.spyOn(console, "group").mockImplementation(() => {}),
    groupCollapsed: vi.spyOn(console, "groupCollapsed").mockImplementation(() => {}),
    groupEnd: vi.spyOn(console, "groupEnd").mockImplementation(() => {}),
    log: vi.spyOn(console, "log").mockImplementation(() => {}),
    table: vi.spyOn(console, "table").mockImplementation(() => {}),
  };

  beforeEach(() => {
    // Set to development for logging to occur
    process.env.NODE_ENV = "development";
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore original NODE_ENV
    process.env.NODE_ENV = originalNodeEnv;
  });

  describe("Basic Logging", () => {
    it("expect logger to log primitive state changes in development", () => {
      interface TestState {
        count: number;
        name: string;
        setCount: (n: number) => void;
        setName: (n: string) => void;
      }

      const useStore = create<TestState>()(
        loggerMiddleware(
          (set) => ({
            count: 0,
            name: "test",
            setCount: (n: number) => set({ count: n }),
            setName: (n: string) => set({ name: n }),
          }),
          "TestStore"
        )
      );

      // Trigger a state change
      useStore.getState().setCount(5);

      // Verify console.group was called with store name
      expect(consoleSpy.group).toHaveBeenCalledWith("--- TestStore state update ---");
      expect(consoleSpy.log).toHaveBeenCalledWith(
        "%cPrimitive changes:",
        "color: #3b82f6; font-weight: bold"
      );
      expect(consoleSpy.table).toHaveBeenCalled();
      expect(consoleSpy.groupEnd).toHaveBeenCalled();
    });

    it("expect logger to not log when there are no changes", () => {
      interface TestState {
        count: number;
        setCount: (n: number) => void;
      }

      const useStore = create<TestState>()(
        loggerMiddleware(
          (set) => ({
            count: 0,
            setCount: (n: number) => set({ count: n }),
          }),
          "NoChangeStore"
        )
      );

      // Set to same value (no actual change)
      useStore.getState().setCount(0);

      // No logging should occur
      expect(consoleSpy.group).not.toHaveBeenCalled();
    });

    it("expect logger to skip logging in non-development environment", () => {
      process.env.NODE_ENV = "production";

      interface TestState {
        count: number;
        setCount: (n: number) => void;
      }

      const useStore = create<TestState>()(
        loggerMiddleware(
          (set) => ({
            count: 0,
            setCount: (n: number) => set({ count: n }),
          }),
          "ProdStore"
        )
      );

      useStore.getState().setCount(5);

      // No logging in production
      expect(consoleSpy.group).not.toHaveBeenCalled();
    });

    it("expect logger to use default name when none provided", () => {
      interface TestState {
        value: string;
        setValue: (v: string) => void;
      }

      const useStore = create<TestState>()(
        loggerMiddleware((set) => ({
          value: "initial",
          setValue: (v: string) => set({ value: v }),
        }))
      );

      useStore.getState().setValue("changed");

      // Should use 'zustand' as default name
      expect(consoleSpy.group).toHaveBeenCalledWith("--- zustand state update ---");
    });
  });

  describe("Price Update Handling", () => {
    it("expect logger to skip price-only updates when price logging is disabled", () => {
      interface PriceState {
        currentBuyPrice: number;
        currentSellPrice: number;
        setPrices: (buy: number, sell: number) => void;
      }

      const useStore = create<PriceState>()(
        loggerMiddleware(
          (set) => ({
            currentBuyPrice: 0,
            currentSellPrice: 0,
            setPrices: (buy: number, sell: number) =>
              set({ currentBuyPrice: buy, currentSellPrice: sell }),
          }),
          "PriceStore"
        )
      );

      // Update prices
      useStore.getState().setPrices(1.2735, 1.2732);

      // Price logging is disabled by default, so no log
      expect(consoleSpy.group).not.toHaveBeenCalled();
    });

    it("expect logger to skip single buy price updates", () => {
      interface PriceState {
        currentBuyPrice: number;
        setBuyPrice: (price: number) => void;
      }

      const useStore = create<PriceState>()(
        loggerMiddleware(
          (set) => ({
            currentBuyPrice: 0,
            setBuyPrice: (price: number) => set({ currentBuyPrice: price }),
          }),
          "SingleBuyPriceStore"
        )
      );

      useStore.getState().setBuyPrice(1.5);

      // Price-only update should be skipped
      expect(consoleSpy.group).not.toHaveBeenCalled();
    });

    it("expect logger to skip single sell price updates", () => {
      interface PriceState {
        currentSellPrice: number;
        setSellPrice: (price: number) => void;
      }

      const useStore = create<PriceState>()(
        loggerMiddleware(
          (set) => ({
            currentSellPrice: 0,
            setSellPrice: (price: number) => set({ currentSellPrice: price }),
          }),
          "SingleSellPriceStore"
        )
      );

      useStore.getState().setSellPrice(1.5);

      // Price-only update should be skipped
      expect(consoleSpy.group).not.toHaveBeenCalled();
    });

    it("expect logger to handle price updates with other changes", () => {
      interface MixedPriceState {
        currentBuyPrice: number;
        status: string;
        updateBoth: (price: number, status: string) => void;
      }

      const useStore = create<MixedPriceState>()(
        loggerMiddleware(
          (set) => ({
            currentBuyPrice: 0,
            status: "idle",
            updateBoth: (price, status) => set({ currentBuyPrice: price, status }),
          }),
          "MixedPriceStore"
        )
      );

      // Update both price and status - should log because not price-only
      useStore.getState().updateBoth(1.5, "active");

      expect(consoleSpy.group).toHaveBeenCalled();
    });
  });

  describe("Validation Update Handling", () => {
    it("expect logger to skip isValidating-only updates", () => {
      interface ValidationState {
        isValidating: boolean;
        setValidating: (v: boolean) => void;
      }

      const useStore = create<ValidationState>()(
        loggerMiddleware(
          (set) => ({
            isValidating: false,
            setValidating: (v: boolean) => set({ isValidating: v }),
          }),
          "ValidationStore"
        )
      );

      // Update validation state
      useStore.getState().setValidating(true);

      // Validation logging is disabled by default
      expect(consoleSpy.group).not.toHaveBeenCalled();
    });

    it("expect logger to skip validationRequestIds-only updates", () => {
      interface ValidationState {
        validationRequestIds: string[];
        setRequestIds: (ids: string[]) => void;
      }

      const useStore = create<ValidationState>()(
        loggerMiddleware(
          (set) => ({
            validationRequestIds: [],
            setRequestIds: (ids: string[]) => set({ validationRequestIds: ids }),
          }),
          "ValidationIdsStore"
        )
      );

      useStore.getState().setRequestIds(["req1", "req2"]);

      expect(consoleSpy.group).not.toHaveBeenCalled();
    });

    it("expect logger to skip combined validation updates", () => {
      interface ValidationState {
        isValidating: boolean;
        validationRequestIds: string[];
        updateValidation: (v: boolean, ids: string[]) => void;
      }

      const useStore = create<ValidationState>()(
        loggerMiddleware(
          (set) => ({
            isValidating: false,
            validationRequestIds: [],
            updateValidation: (v, ids) => set({ isValidating: v, validationRequestIds: ids }),
          }),
          "CombinedValidationStore"
        )
      );

      useStore.getState().updateValidation(true, ["req1"]);

      expect(consoleSpy.group).not.toHaveBeenCalled();
    });

    it("expect logger to log validation updates with other changes", () => {
      interface MixedValidationState {
        isValidating: boolean;
        count: number;
        updateBoth: (v: boolean, c: number) => void;
      }

      const useStore = create<MixedValidationState>()(
        loggerMiddleware(
          (set) => ({
            isValidating: false,
            count: 0,
            updateBoth: (v, c) => set({ isValidating: v, count: c }),
          }),
          "MixedValidationStore"
        )
      );

      useStore.getState().updateBoth(true, 5);

      expect(consoleSpy.group).toHaveBeenCalled();
    });
  });

  describe("Object Change Handling", () => {
    it("expect logger to log object changes with before/after views", () => {
      interface ObjectState {
        user: { name: string; age: number };
        setUser: (u: { name: string; age: number }) => void;
      }

      const useStore = create<ObjectState>()(
        loggerMiddleware(
          (set) => ({
            user: { name: "John", age: 30 },
            setUser: (u) => set({ user: u }),
          }),
          "ObjectStore"
        )
      );

      useStore.getState().setUser({ name: "Jane", age: 25 });

      // Object changes should be logged
      expect(consoleSpy.group).toHaveBeenCalled();
      expect(consoleSpy.log).toHaveBeenCalledWith(
        "%cObject changes:",
        "color: #cfbe02ff; font-weight: bold"
      );
      expect(consoleSpy.groupCollapsed).toHaveBeenCalledWith(" user");
      expect(consoleSpy.log).toHaveBeenCalledWith("%cBefore:", "color: #ef4444; font-weight: bold");
      expect(consoleSpy.log).toHaveBeenCalledWith("%cAfter:", "color: #10b981; font-weight: bold");
    });

    it("expect logger to handle empty object as before state", () => {
      interface EmptyObjectState {
        data: Record<string, unknown>;
        setData: (d: Record<string, unknown>) => void;
      }

      const useStore = create<EmptyObjectState>()(
        loggerMiddleware(
          (set) => ({
            data: {},
            setData: (d) => set({ data: d }),
          }),
          "EmptyBeforeStore"
        )
      );

      // Change from empty to populated
      useStore.getState().setData({ key: "value" });

      expect(consoleSpy.group).toHaveBeenCalled();
      // Should log "(empty object)" for the Before state
      expect(consoleSpy.log).toHaveBeenCalledWith(" (empty object)");
    });

    it("expect logger to handle empty object as after state", () => {
      interface EmptyObjectState {
        data: Record<string, unknown>;
        setData: (d: Record<string, unknown>) => void;
      }

      const useStore = create<EmptyObjectState>()(
        loggerMiddleware(
          (set) => ({
            data: { existing: "value" },
            setData: (d) => set({ data: d }),
          }),
          "EmptyAfterStore"
        )
      );

      // Change from populated to empty
      useStore.getState().setData({});

      expect(consoleSpy.group).toHaveBeenCalled();
    });

    it("expect logger to handle non-empty objects in both before and after", () => {
      interface ObjectState {
        config: { a: number; b: number };
        setConfig: (c: { a: number; b: number }) => void;
      }

      const useStore = create<ObjectState>()(
        loggerMiddleware(
          (set) => ({
            config: { a: 1, b: 2 },
            setConfig: (c) => set({ config: c }),
          }),
          "NonEmptyObjectStore"
        )
      );

      useStore.getState().setConfig({ a: 3, b: 4 });

      expect(consoleSpy.group).toHaveBeenCalled();
      expect(consoleSpy.table).toHaveBeenCalled();
    });
  });

  describe("Deep Equality Checks", () => {
    it("expect logger to not log when object values are deeply equal", () => {
      interface DeepState {
        config: { a: number; b: { c: number } };
        setConfig: (c: { a: number; b: { c: number } }) => void;
      }

      const useStore = create<DeepState>()(
        loggerMiddleware(
          (set) => ({
            config: { a: 1, b: { c: 2 } },
            setConfig: (c) => set({ config: c }),
          }),
          "DeepEqualStore"
        )
      );

      // Set to equivalent object (new reference, same values)
      useStore.getState().setConfig({ a: 1, b: { c: 2 } });

      // Should not log because values are deeply equal
      expect(consoleSpy.group).not.toHaveBeenCalled();
    });

    it("expect logger to detect changes in nested objects", () => {
      interface NestedState {
        nested: { level1: { level2: string } };
        setNested: (n: { level1: { level2: string } }) => void;
      }

      const useStore = create<NestedState>()(
        loggerMiddleware(
          (set) => ({
            nested: { level1: { level2: "original" } },
            setNested: (n) => set({ nested: n }),
          }),
          "NestedStore"
        )
      );

      useStore.getState().setNested({ level1: { level2: "changed" } });

      expect(consoleSpy.group).toHaveBeenCalled();
    });

    it("expect logger to handle array equality correctly - same values", () => {
      interface ArrayState {
        items: number[];
        setItems: (i: number[]) => void;
      }

      const useStore = create<ArrayState>()(
        loggerMiddleware(
          (set) => ({
            items: [1, 2, 3],
            setItems: (i) => set({ items: i }),
          }),
          "ArrayEqualStore"
        )
      );

      // Same array values should not trigger log
      useStore.getState().setItems([1, 2, 3]);
      expect(consoleSpy.group).not.toHaveBeenCalled();
    });

    it("expect logger to detect array value changes", () => {
      interface ArrayState {
        items: number[];
        setItems: (i: number[]) => void;
      }

      const useStore = create<ArrayState>()(
        loggerMiddleware(
          (set) => ({
            items: [1, 2, 3],
            setItems: (i) => set({ items: i }),
          }),
          "ArrayChangeStore"
        )
      );

      // Different array should trigger log
      useStore.getState().setItems([1, 2, 3, 4]);
      expect(consoleSpy.group).toHaveBeenCalled();
    });

    it("expect logger to detect array length decreases", () => {
      interface ArrayState {
        items: string[];
        setItems: (i: string[]) => void;
      }

      const useStore = create<ArrayState>()(
        loggerMiddleware(
          (set) => ({
            items: ["a", "b"],
            setItems: (i) => set({ items: i }),
          }),
          "ArrayLengthStore"
        )
      );

      useStore.getState().setItems(["a"]);

      expect(consoleSpy.group).toHaveBeenCalled();
    });

    it("expect logger to handle nested arrays", () => {
      interface NestedArrayState {
        matrix: number[][];
        setMatrix: (m: number[][]) => void;
      }

      const useStore = create<NestedArrayState>()(
        loggerMiddleware(
          (set) => ({
            matrix: [
              [1, 2],
              [3, 4],
            ],
            setMatrix: (m) => set({ matrix: m }),
          }),
          "NestedArrayStore"
        )
      );

      // Same nested arrays should not trigger log
      useStore.getState().setMatrix([
        [1, 2],
        [3, 4],
      ]);
      expect(consoleSpy.group).not.toHaveBeenCalled();

      // Different nested arrays should trigger log
      useStore.getState().setMatrix([
        [1, 2],
        [3, 5],
      ]);
      expect(consoleSpy.group).toHaveBeenCalled();
    });

    it("expect logger to handle null values", () => {
      interface NullState {
        value: string | null;
        setValue: (v: string | null) => void;
      }

      const useStore = create<NullState>()(
        loggerMiddleware(
          (set) => ({
            value: null,
            setValue: (v) => set({ value: v }),
          }),
          "NullStore"
        )
      );

      // null to value
      useStore.getState().setValue("not null");
      expect(consoleSpy.group).toHaveBeenCalled();

      vi.clearAllMocks();

      // value to null
      useStore.getState().setValue(null);
      expect(consoleSpy.group).toHaveBeenCalled();
    });

    it("expect logger to handle undefined values", () => {
      interface UndefinedState {
        value: string | undefined;
        setValue: (v: string | undefined) => void;
      }

      const useStore = create<UndefinedState>()(
        loggerMiddleware(
          (set) => ({
            value: undefined,
            setValue: (v) => set({ value: v }),
          }),
          "UndefinedStore"
        )
      );

      useStore.getState().setValue("defined");
      expect(consoleSpy.group).toHaveBeenCalled();
    });

    it("expect logger to handle type changes between primitives", () => {
      interface TypeChangeState {
        value: string | number;
        setValue: (v: string | number) => void;
      }

      const useStore = create<TypeChangeState>()(
        loggerMiddleware(
          (set) => ({
            value: "string" as string | number,
            setValue: (v) => set({ value: v }),
          }),
          "TypeChangeStore"
        )
      );

      useStore.getState().setValue(123);
      expect(consoleSpy.group).toHaveBeenCalled();
    });

    it("expect logger to handle array vs non-array comparison", () => {
      interface MixedTypeState {
        data: number[] | number;
        setData: (d: number[] | number) => void;
      }

      const useStore = create<MixedTypeState>()(
        loggerMiddleware(
          (set) => ({
            data: [1, 2, 3] as number[] | number,
            setData: (d) => set({ data: d }),
          }),
          "ArrayNonArrayStore"
        )
      );

      useStore.getState().setData(5);
      expect(consoleSpy.group).toHaveBeenCalled();
    });

    it("expect logger to treat equal primitives as no change", () => {
      interface PrimitiveState {
        count: number;
        setCount: (n: number) => void;
      }

      const useStore = create<PrimitiveState>()(
        loggerMiddleware(
          (set) => ({
            count: 5,
            setCount: (n) => set({ count: n }),
          }),
          "SamePrimitiveStore"
        )
      );

      useStore.getState().setCount(5);
      expect(consoleSpy.group).not.toHaveBeenCalled();
    });
  });

  describe("Mixed Updates", () => {
    it("expect logger to log both primitive and object changes together", () => {
      interface MixedState {
        count: number;
        config: { setting: boolean };
        update: (c: number, cfg: { setting: boolean }) => void;
      }

      const useStore = create<MixedState>()(
        loggerMiddleware(
          (set) => ({
            count: 0,
            config: { setting: false },
            update: (c, cfg) => set({ count: c, config: cfg }),
          }),
          "MixedStore"
        )
      );

      useStore.getState().update(5, { setting: true });

      // Both primitive and object logs should appear
      expect(consoleSpy.log).toHaveBeenCalledWith(
        "%cPrimitive changes:",
        "color: #3b82f6; font-weight: bold"
      );
      expect(consoleSpy.log).toHaveBeenCalledWith(
        "%cObject changes:",
        "color: #cfbe02ff; font-weight: bold"
      );
    });

    it("expect logger to only log primitive changes when no object changes", () => {
      interface PrimitiveOnlyState {
        a: number;
        b: string;
        update: (a: number, b: string) => void;
      }

      const useStore = create<PrimitiveOnlyState>()(
        loggerMiddleware(
          (set) => ({
            a: 0,
            b: "test",
            update: (a, b) => set({ a, b }),
          }),
          "PrimitiveOnlyStore"
        )
      );

      useStore.getState().update(5, "changed");

      expect(consoleSpy.log).toHaveBeenCalledWith(
        "%cPrimitive changes:",
        "color: #3b82f6; font-weight: bold"
      );
      // Object changes should NOT be logged
      const objectChangeCalls = consoleSpy.log.mock.calls.filter(
        (call) => call[0] === "%cObject changes:"
      );
      expect(objectChangeCalls).toHaveLength(0);
    });

    it("expect logger to only log object changes when no primitive changes", () => {
      interface ObjectOnlyState {
        config1: { a: number };
        config2: { b: string };
        update: (c1: { a: number }, c2: { b: string }) => void;
      }

      const useStore = create<ObjectOnlyState>()(
        loggerMiddleware(
          (set) => ({
            config1: { a: 1 },
            config2: { b: "test" },
            update: (c1, c2) => set({ config1: c1, config2: c2 }),
          }),
          "ObjectOnlyStore"
        )
      );

      useStore.getState().update({ a: 2 }, { b: "changed" });

      expect(consoleSpy.log).toHaveBeenCalledWith(
        "%cObject changes:",
        "color: #cfbe02ff; font-weight: bold"
      );
      // Primitive changes should NOT be logged
      const primitiveChangeCalls = consoleSpy.log.mock.calls.filter(
        (call) => call[0] === "%cPrimitive changes:"
      );
      expect(primitiveChangeCalls).toHaveLength(0);
    });
  });

  describe("State Diff Detection", () => {
    it("expect logger to detect new keys added to state", () => {
      interface DynamicState {
        existing: string;
        newKey?: string;
        addKey: () => void;
      }

      const useStore = create<DynamicState>()(
        loggerMiddleware(
          (set) => ({
            existing: "value",
            addKey: () => set({ newKey: "newValue" }),
          }),
          "DynamicStore"
        )
      );

      useStore.getState().addKey();

      expect(consoleSpy.group).toHaveBeenCalled();
    });

    it("expect logger to handle multiple key changes at once", () => {
      interface MultiKeyState {
        a: number;
        b: number;
        c: number;
        updateAll: () => void;
      }

      const useStore = create<MultiKeyState>()(
        loggerMiddleware(
          (set) => ({
            a: 1,
            b: 2,
            c: 3,
            updateAll: () => set({ a: 10, b: 20, c: 30 }),
          }),
          "MultiKeyStore"
        )
      );

      useStore.getState().updateAll();

      expect(consoleSpy.group).toHaveBeenCalled();
      expect(consoleSpy.table).toHaveBeenCalled();
    });
  });

  describe("Non-Plain Objects", () => {
    it("expect logger to handle arrays as non-plain objects in diff", () => {
      interface ArrayState {
        items: string[];
        setItems: (i: string[]) => void;
      }

      const useStore = create<ArrayState>()(
        loggerMiddleware(
          (set) => ({
            items: ["a"],
            setItems: (i) => set({ items: i }),
          }),
          "ArrayLogStore"
        )
      );

      useStore.getState().setItems(["a", "b"]);

      // Arrays should be treated as primitives in the log output
      expect(consoleSpy.group).toHaveBeenCalled();
    });

    it("expect logger to handle null as non-plain object", () => {
      interface NullObjectState {
        data: Record<string, unknown> | null;
        setData: (d: Record<string, unknown> | null) => void;
      }

      const useStore = create<NullObjectState>()(
        loggerMiddleware(
          (set) => ({
            data: null,
            setData: (d) => set({ data: d }),
          }),
          "NullObjectStore"
        )
      );

      useStore.getState().setData({ key: "value" });

      expect(consoleSpy.group).toHaveBeenCalled();
    });
  });

  describe("Edge Cases", () => {
    it("expect logger to handle empty diff gracefully", () => {
      interface EmptyDiffState {
        count: number;
        setCount: (n: number) => void;
      }

      const useStore = create<EmptyDiffState>()(
        loggerMiddleware(
          (set) => ({
            count: 0,
            setCount: (n) => set({ count: n }),
          }),
          "EmptyDiffStore"
        )
      );

      // Same value should result in empty diff
      useStore.getState().setCount(0);

      expect(consoleSpy.group).not.toHaveBeenCalled();
    });

    it("expect logger to handle boolean changes", () => {
      interface BoolState {
        flag: boolean;
        toggle: () => void;
      }

      const useStore = create<BoolState>()(
        loggerMiddleware(
          (set, get) => ({
            flag: false,
            toggle: () => set({ flag: !get().flag }),
          }),
          "BoolStore"
        )
      );

      useStore.getState().toggle();

      expect(consoleSpy.group).toHaveBeenCalled();
    });

    it("expect logger to handle deeply nested equal structures", () => {
      interface DeepNestedState {
        deep: { a: { b: { c: { d: number } } } };
        setDeep: (d: { a: { b: { c: { d: number } } } }) => void;
      }

      const useStore = create<DeepNestedState>()(
        loggerMiddleware(
          (set) => ({
            deep: { a: { b: { c: { d: 1 } } } },
            setDeep: (d) => set({ deep: d }),
          }),
          "DeepNestedStore"
        )
      );

      // Same structure should not log
      useStore.getState().setDeep({ a: { b: { c: { d: 1 } } } });
      expect(consoleSpy.group).not.toHaveBeenCalled();

      // Different structure should log
      useStore.getState().setDeep({ a: { b: { c: { d: 2 } } } });
      expect(consoleSpy.group).toHaveBeenCalled();
    });
  });
});

describe("Logging Configuration Functions", () => {
  afterEach(() => {
    // Always reset config after each test
    loggerConfig.enablePriceLogging = false;
    loggerConfig.enableValidationLogging = false;
  });

  it("expect isPriceLoggingEnabled to return false by default", () => {
    // Default is false since VITE_ENABLE_PRICE_LOGGING is not set
    expect(isPriceLoggingEnabled()).toBe(false);
  });

  it("expect isValidationLoggingEnabled to return false by default", () => {
    // Default is false since VITE_ENABLE_VALIDATION_LOGGING is not set
    expect(isValidationLoggingEnabled()).toBe(false);
  });

  it("expect loggerConfig to be modifiable", () => {
    // Default values
    expect(isPriceLoggingEnabled()).toBe(false);
    expect(isValidationLoggingEnabled()).toBe(false);

    // Modify config
    loggerConfig.enablePriceLogging = true;
    loggerConfig.enableValidationLogging = true;

    // Verify config reads from mutable object
    expect(isPriceLoggingEnabled()).toBe(true);
    expect(isValidationLoggingEnabled()).toBe(true);
  });
});

describe("Logger Middleware - Price Logging Enabled", () => {
  const consoleSpy = {
    group: vi.spyOn(console, "group").mockImplementation(() => {}),
    groupCollapsed: vi.spyOn(console, "groupCollapsed").mockImplementation(() => {}),
    groupEnd: vi.spyOn(console, "groupEnd").mockImplementation(() => {}),
    log: vi.spyOn(console, "log").mockImplementation(() => {}),
    table: vi.spyOn(console, "table").mockImplementation(() => {}),
  };

  beforeEach(() => {
    process.env.NODE_ENV = "development";
    // Enable price logging via the mutable config
    loggerConfig.enablePriceLogging = true;
    // Reset throttle timer to ensure clean state between tests
    resetPriceLogTime();
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    // Reset config
    loggerConfig.enablePriceLogging = false;
  });

  it("expect logger to log price updates when price logging is enabled", () => {
    interface PriceState {
      currentBuyPrice: number;
      currentSellPrice: number;
      setPrices: (buy: number, sell: number) => void;
    }

    const useStore = create<PriceState>()(
      loggerMiddleware(
        (set) => ({
          currentBuyPrice: 0,
          currentSellPrice: 0,
          setPrices: (buy: number, sell: number) =>
            set({ currentBuyPrice: buy, currentSellPrice: sell }),
        }),
        "PriceEnabledStore"
      )
    );

    useStore.getState().setPrices(1.2735, 1.2732);

    // Price logging should occur with [price tick] suffix
    expect(consoleSpy.group).toHaveBeenCalledWith(
      "--- PriceEnabledStore [price tick] state update ---"
    );
  });

  it("expect logger to throttle price updates", () => {
    interface PriceState {
      currentBuyPrice: number;
      setBuyPrice: (price: number) => void;
    }

    const useStore = create<PriceState>()(
      loggerMiddleware(
        (set) => ({
          currentBuyPrice: 0,
          setBuyPrice: (price: number) => set({ currentBuyPrice: price }),
        }),
        "ThrottleStore"
      )
    );

    // First update should log
    useStore.getState().setBuyPrice(1.0);
    expect(consoleSpy.group).toHaveBeenCalledTimes(1);

    // Immediate second update should be throttled (not logged)
    useStore.getState().setBuyPrice(1.1);
    expect(consoleSpy.group).toHaveBeenCalledTimes(1);

    // Third update also throttled
    useStore.getState().setBuyPrice(1.2);
    expect(consoleSpy.group).toHaveBeenCalledTimes(1);
  });
});

describe("Logger Middleware - Validation Logging Enabled", () => {
  const consoleSpy = {
    group: vi.spyOn(console, "group").mockImplementation(() => {}),
    groupCollapsed: vi.spyOn(console, "groupCollapsed").mockImplementation(() => {}),
    groupEnd: vi.spyOn(console, "groupEnd").mockImplementation(() => {}),
    log: vi.spyOn(console, "log").mockImplementation(() => {}),
    table: vi.spyOn(console, "table").mockImplementation(() => {}),
  };

  beforeEach(() => {
    process.env.NODE_ENV = "development";
    // Enable validation logging via the mutable config
    loggerConfig.enableValidationLogging = true;
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    // Reset config
    loggerConfig.enableValidationLogging = false;
  });

  it("expect logger to log validation updates when validation logging is enabled", () => {
    interface ValidationState {
      isValidating: boolean;
      setValidating: (v: boolean) => void;
    }

    const useStore = create<ValidationState>()(
      loggerMiddleware(
        (set) => ({
          isValidating: false,
          setValidating: (v: boolean) => set({ isValidating: v }),
        }),
        "ValidationEnabledStore"
      )
    );

    useStore.getState().setValidating(true);

    // Validation logging should occur with [validation] suffix
    expect(consoleSpy.group).toHaveBeenCalledWith(
      "--- ValidationEnabledStore [validation] state update ---"
    );
  });

  it("expect logger to log validationRequestIds updates when enabled", () => {
    interface ValidationState {
      validationRequestIds: string[];
      setRequestIds: (ids: string[]) => void;
    }

    const useStore = create<ValidationState>()(
      loggerMiddleware(
        (set) => ({
          validationRequestIds: [],
          setRequestIds: (ids: string[]) => set({ validationRequestIds: ids }),
        }),
        "ValidationIdsEnabledStore"
      )
    );

    useStore.getState().setRequestIds(["req1", "req2"]);

    expect(consoleSpy.group).toHaveBeenCalledWith(
      "--- ValidationIdsEnabledStore [validation] state update ---"
    );
  });
});
