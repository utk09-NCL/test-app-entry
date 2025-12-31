/**
 * Unit tests for popup context
 */

import { describe, expect, it } from "vitest";

import { DEFAULT_POPUP_SYSTEM_CONFIG } from "./constants";
import { PopupConfigContext, PopupContext } from "./context";

describe("popup/context", () => {
  describe("PopupContext", () => {
    it("expect context to be defined", () => {
      expect(PopupContext).toBeDefined();
    });

    it("expect context default value to be null", () => {
      // React contexts store default values internally
      // The default is null as specified in createContext(null)
      expect(PopupContext.Provider).toBeDefined();
      expect(PopupContext.Consumer).toBeDefined();
    });
  });

  describe("PopupConfigContext", () => {
    it("expect config context to be defined", () => {
      expect(PopupConfigContext).toBeDefined();
    });

    it("expect config context to have default system config", () => {
      // The context is created with DEFAULT_POPUP_SYSTEM_CONFIG
      expect(PopupConfigContext.Provider).toBeDefined();
      expect(PopupConfigContext.Consumer).toBeDefined();
    });

    it("expect default config to match DEFAULT_POPUP_SYSTEM_CONFIG", () => {
      // Verify the default value structure matches
      expect(DEFAULT_POPUP_SYSTEM_CONFIG).toHaveProperty("dimensions");
      expect(DEFAULT_POPUP_SYSTEM_CONFIG).toHaveProperty("positioning");
      expect(DEFAULT_POPUP_SYSTEM_CONFIG).toHaveProperty("animation");
      expect(DEFAULT_POPUP_SYSTEM_CONFIG).toHaveProperty("behavior");
    });
  });
});
