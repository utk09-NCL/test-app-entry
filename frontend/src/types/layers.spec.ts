import { describe, expect, it } from "vitest";

import { LayerPriority } from "./layers";

describe("layers", () => {
  describe("LayerPriority", () => {
    it("expect DEFAULTS to have priority 1", () => {
      expect(LayerPriority.DEFAULTS).toBe(1);
    });

    it("expect USER_PREFS to have priority 2", () => {
      expect(LayerPriority.USER_PREFS).toBe(2);
    });

    it("expect FDC3_INTENT to have priority 3", () => {
      expect(LayerPriority.FDC3_INTENT).toBe(3);
    });

    it("expect USER_INPUT to have priority 4", () => {
      expect(LayerPriority.USER_INPUT).toBe(4);
    });

    it("expect priority order to be correct (DEFAULTS < USER_PREFS < FDC3_INTENT < USER_INPUT)", () => {
      expect(LayerPriority.DEFAULTS).toBeLessThan(LayerPriority.USER_PREFS);
      expect(LayerPriority.USER_PREFS).toBeLessThan(LayerPriority.FDC3_INTENT);
      expect(LayerPriority.FDC3_INTENT).toBeLessThan(LayerPriority.USER_INPUT);
    });
  });
});
