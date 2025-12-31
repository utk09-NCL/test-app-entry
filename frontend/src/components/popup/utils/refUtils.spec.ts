/**
 * Unit tests for refUtils
 */

import { describe, expect, it, vi } from "vitest";

import { setRef } from "./refUtils";

describe("popup/utils/refUtils", () => {
  describe("setRef", () => {
    it("expect to do nothing when ref is null", () => {
      // Should not throw
      expect(() => setRef(null, document.createElement("div"))).not.toThrow();
    });

    it("expect to do nothing when ref is undefined", () => {
      // Should not throw
      expect(() => setRef(undefined, document.createElement("div"))).not.toThrow();
    });

    it("expect to call callback ref with value", () => {
      const callbackRef = vi.fn();
      const element = document.createElement("div");

      setRef(callbackRef, element);

      expect(callbackRef).toHaveBeenCalledWith(element);
    });

    it("expect to call callback ref with null", () => {
      const callbackRef = vi.fn();

      setRef(callbackRef, null);

      expect(callbackRef).toHaveBeenCalledWith(null);
    });

    it("expect to set object ref current value", () => {
      const objectRef = { current: null } as { current: HTMLDivElement | null };
      const element = document.createElement("div");

      setRef(objectRef, element);

      expect(objectRef.current).toBe(element);
    });

    it("expect to set object ref current to null", () => {
      const element = document.createElement("div");
      const objectRef = { current: element } as { current: HTMLDivElement | null };

      setRef(objectRef, null);

      expect(objectRef.current).toBeNull();
    });

    it("expect to handle callback ref returning undefined", () => {
      const callbackRef = vi.fn(() => undefined);
      const element = document.createElement("div");

      // Should not throw
      expect(() => setRef(callbackRef, element)).not.toThrow();
      expect(callbackRef).toHaveBeenCalledWith(element);
    });
  });
});
