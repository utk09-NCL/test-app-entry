import { describe, expect, it, vi } from "vitest";

import { loggerMiddleware } from "./logger";

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

    expect(mockSet).toHaveBeenCalledWith(newState);
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
