/**
 * Unit Tests for idGenerator
 *
 * Tests the unique ID generation utility.
 */

import { describe, expect, it } from "vitest";

import { generateId } from "./idGenerator";

describe("idGenerator", () => {
  describe("generateId", () => {
    it("should generate a unique ID", () => {
      const id = generateId();
      expect(id).toBeDefined();
      expect(typeof id).toBe("string");
      expect(id.length).toBeGreaterThan(0);
    });

    it("should generate unique IDs on multiple calls", () => {
      const ids = new Set<string>();
      const iterations = 1000;

      for (let i = 0; i < iterations; i++) {
        ids.add(generateId());
      }

      // All IDs should be unique
      expect(ids.size).toBe(iterations);
    });

    it("should generate IDs with expected format (base36 timestamp + random)", () => {
      const id = generateId();
      // ID should be alphanumeric (base36 encoding, no hyphens)
      expect(id).toMatch(/^[a-z0-9]+$/);
      // Should have reasonable length (timestamp in base36 + random)
      expect(id.length).toBeGreaterThan(10);
    });

    it("should generate IDs starting with timestamp-like prefix", () => {
      const id1 = generateId();
      const id2 = generateId();

      // IDs generated close together should have similar prefixes (same timestamp)
      // Since both use Date.now().toString(36), they should share prefix characters
      expect(id1[0]).toBe(id2[0]); // At least first character should match
    });

    it("should generate different IDs even when called in rapid succession", () => {
      const id1 = generateId();
      const id2 = generateId();
      const id3 = generateId();

      expect(id1).not.toBe(id2);
      expect(id2).not.toBe(id3);
      expect(id1).not.toBe(id3);
    });
  });
});
