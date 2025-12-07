import { describe, expect, it } from "vitest";

import { formatCurrency, formatPrice } from "./numberFormats";

describe("numberFormats", () => {
  describe("formatCurrency", () => {
    it("should format positive integers with currency currencyPair", () => {
      expect(formatCurrency(1000, "USD")).toBe("$1,000");
      expect(formatCurrency(1000000, "USD")).toBe("$1,000,000");
      expect(formatCurrency(1234567, "USD")).toBe("$1,234,567");
    });

    it("should format zero correctly", () => {
      expect(formatCurrency(0, "USD")).toBe("$0");
    });

    it("should format negative numbers", () => {
      expect(formatCurrency(-1000, "USD")).toBe("-$1,000");
      expect(formatCurrency(-1234567, "USD")).toBe("-$1,234,567");
    });

    it("should handle different currencies", () => {
      expect(formatCurrency(1000, "EUR")).toContain("1,000");
      expect(formatCurrency(1000, "GBP")).toContain("1,000");
    });

    it("should handle very large numbers", () => {
      expect(formatCurrency(100000000000, "USD")).toBe("$100,000,000,000");
    });

    it("should use USD as default currency", () => {
      expect(formatCurrency(1000)).toBe("$1,000");
    });
  });

  describe("formatPrice", () => {
    it("should format prices with 5 decimal places by default", () => {
      expect(formatPrice(1.27345)).toBe("1.27345");
      expect(formatPrice(123.456789)).toBe("123.45679");
    });

    it("should format prices with custom decimal places", () => {
      expect(formatPrice(1.27345, 2)).toBe("1.27");
      expect(formatPrice(1.27345, 3)).toBe("1.273");
      expect(formatPrice(1.27345, 7)).toBe("1.2734500");
    });

    it("should format zero correctly", () => {
      expect(formatPrice(0)).toBe("0.00000");
      expect(formatPrice(0, 2)).toBe("0.00");
    });

    it("should format very small numbers", () => {
      expect(formatPrice(0.00001)).toBe("0.00001");
      expect(formatPrice(0.123456789, 8)).toBe("0.12345679");
    });

    it("should handle negative prices", () => {
      expect(formatPrice(-1.27345)).toBe("-1.27345");
      expect(formatPrice(-123.456789, 3)).toBe("-123.457");
    });

    it("should throw error for undefined values", () => {
      expect(() => formatPrice(undefined as unknown as number)).toThrow();
    });

    it("should round correctly", () => {
      expect(formatPrice(1.275555, 4)).toBe("1.2756");
      expect(formatPrice(1.274444, 4)).toBe("1.2744");
    });
  });
});
