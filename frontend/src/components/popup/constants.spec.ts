/**
 * Unit tests for popup constants and configuration
 */

import { describe, expect, it } from "vitest";

import {
  DEFAULT_ANIMATION_CONFIG,
  DEFAULT_ANIMATION_DURATION,
  DEFAULT_AUTO_FOCUS,
  DEFAULT_BEHAVIOR_CONFIG,
  DEFAULT_BLUR_BEHAVIOR,
  DEFAULT_CLOSE_ON_ESCAPE,
  DEFAULT_DIMENSIONS_CONFIG,
  DEFAULT_FLIP_ENABLED,
  DEFAULT_IFRAME_SANDBOX,
  DEFAULT_MODAL,
  DEFAULT_OPENFIN_BACKGROUND_COLOR,
  DEFAULT_OPENFIN_FRAME,
  DEFAULT_OVERLAY_Z_INDEX,
  DEFAULT_PLACEMENT,
  DEFAULT_POPUP_HEIGHT,
  DEFAULT_POPUP_MAX_HEIGHT,
  DEFAULT_POPUP_MIN_HEIGHT,
  DEFAULT_POPUP_MIN_WIDTH,
  DEFAULT_POPUP_SYSTEM_CONFIG,
  DEFAULT_POPUP_WIDTH,
  DEFAULT_POSITION_CONFIG,
  DEFAULT_POSITION_OFFSET,
  DEFAULT_RESTORE_FOCUS,
  DEFAULT_SHIFT_ENABLED,
  DEFAULT_SHOW_BACKDROP,
  DEFAULT_THEME,
  DEFAULT_THEME_ATTRIBUTE,
  DEFAULT_THEME_SELECTOR,
  DEFAULT_VIEWPORT_PADDING,
  mergeConfig,
} from "./constants";

describe("popup/constants", () => {
  describe("individual defaults", () => {
    it("expect dimension defaults to have sensible values", () => {
      expect(DEFAULT_POPUP_WIDTH).toBe(300);
      expect(DEFAULT_POPUP_HEIGHT).toBe(300);
      expect(DEFAULT_POPUP_MAX_HEIGHT).toBe(400);
      expect(DEFAULT_POPUP_MIN_WIDTH).toBe(100);
      expect(DEFAULT_POPUP_MIN_HEIGHT).toBe(50);
    });

    it("expect positioning defaults to have sensible values", () => {
      expect(DEFAULT_POSITION_OFFSET).toBe(4);
      expect(DEFAULT_VIEWPORT_PADDING).toBe(8);
      expect(DEFAULT_PLACEMENT).toBe("bottom-start");
      expect(DEFAULT_FLIP_ENABLED).toBe(true);
      expect(DEFAULT_SHIFT_ENABLED).toBe(true);
    });

    it("expect animation defaults to have sensible values", () => {
      expect(DEFAULT_ANIMATION_DURATION).toBe(150);
    });

    it("expect overlay defaults to have sensible values", () => {
      expect(DEFAULT_OVERLAY_Z_INDEX).toBe(9999);
    });

    it("expect behavior defaults to have sensible values", () => {
      expect(DEFAULT_BLUR_BEHAVIOR).toBe("close");
      expect(DEFAULT_CLOSE_ON_ESCAPE).toBe(true);
      expect(DEFAULT_AUTO_FOCUS).toBe(true);
      expect(DEFAULT_RESTORE_FOCUS).toBe(true);
      expect(DEFAULT_SHOW_BACKDROP).toBe(false);
      expect(DEFAULT_MODAL).toBe(false);
    });

    it("expect OpenFin defaults to have sensible values", () => {
      expect(DEFAULT_OPENFIN_FRAME).toBe(false);
      expect(DEFAULT_OPENFIN_BACKGROUND_COLOR).toBe("#ffffff");
    });

    it("expect iframe defaults to have sensible values", () => {
      expect(DEFAULT_IFRAME_SANDBOX).toBe("allow-scripts allow-same-origin allow-forms");
    });

    it("expect theme defaults to have sensible values", () => {
      expect(DEFAULT_THEME).toBe("dark");
      expect(DEFAULT_THEME_ATTRIBUTE).toBe("data-theme");
      expect(DEFAULT_THEME_SELECTOR).toBe("html");
    });
  });

  describe("DEFAULT_POSITION_CONFIG", () => {
    it("expect to contain all positioning properties", () => {
      expect(DEFAULT_POSITION_CONFIG).toEqual({
        placement: "bottom-start",
        offset: 4,
        flip: true,
        shift: true,
        viewportPadding: 8,
      });
    });
  });

  describe("DEFAULT_DIMENSIONS_CONFIG", () => {
    it("expect to contain all dimension properties", () => {
      expect(DEFAULT_DIMENSIONS_CONFIG).toEqual({
        width: 300,
        height: 300,
        minWidth: 100,
        minHeight: 50,
        maxHeight: 400,
      });
    });

    it("expect to reference individual dimension constants", () => {
      expect(DEFAULT_DIMENSIONS_CONFIG.width).toBe(DEFAULT_POPUP_WIDTH);
      expect(DEFAULT_DIMENSIONS_CONFIG.height).toBe(DEFAULT_POPUP_HEIGHT);
      expect(DEFAULT_DIMENSIONS_CONFIG.minWidth).toBe(DEFAULT_POPUP_MIN_WIDTH);
      expect(DEFAULT_DIMENSIONS_CONFIG.minHeight).toBe(DEFAULT_POPUP_MIN_HEIGHT);
      expect(DEFAULT_DIMENSIONS_CONFIG.maxHeight).toBe(DEFAULT_POPUP_MAX_HEIGHT);
    });
  });

  describe("DEFAULT_ANIMATION_CONFIG", () => {
    it("expect to contain animation duration", () => {
      expect(DEFAULT_ANIMATION_CONFIG).toEqual({
        duration: 150,
      });
    });

    it("expect to reference individual animation constants", () => {
      expect(DEFAULT_ANIMATION_CONFIG.duration).toBe(DEFAULT_ANIMATION_DURATION);
    });
  });

  describe("DEFAULT_BEHAVIOR_CONFIG", () => {
    it("expect to contain all behavior properties", () => {
      expect(DEFAULT_BEHAVIOR_CONFIG).toEqual({
        blurBehavior: "close",
        closeOnEscape: true,
        autoFocus: true,
        restoreFocus: true,
        showBackdrop: false,
        modal: false,
      });
    });

    it("expect to reference individual behavior constants", () => {
      expect(DEFAULT_BEHAVIOR_CONFIG.blurBehavior).toBe(DEFAULT_BLUR_BEHAVIOR);
      expect(DEFAULT_BEHAVIOR_CONFIG.closeOnEscape).toBe(DEFAULT_CLOSE_ON_ESCAPE);
      expect(DEFAULT_BEHAVIOR_CONFIG.autoFocus).toBe(DEFAULT_AUTO_FOCUS);
      expect(DEFAULT_BEHAVIOR_CONFIG.restoreFocus).toBe(DEFAULT_RESTORE_FOCUS);
      expect(DEFAULT_BEHAVIOR_CONFIG.showBackdrop).toBe(DEFAULT_SHOW_BACKDROP);
      expect(DEFAULT_BEHAVIOR_CONFIG.modal).toBe(DEFAULT_MODAL);
    });
  });

  describe("DEFAULT_POPUP_SYSTEM_CONFIG", () => {
    it("expect to contain all configuration sections", () => {
      expect(DEFAULT_POPUP_SYSTEM_CONFIG).toHaveProperty("dimensions");
      expect(DEFAULT_POPUP_SYSTEM_CONFIG).toHaveProperty("positioning");
      expect(DEFAULT_POPUP_SYSTEM_CONFIG).toHaveProperty("animation");
      expect(DEFAULT_POPUP_SYSTEM_CONFIG).toHaveProperty("behavior");
      expect(DEFAULT_POPUP_SYSTEM_CONFIG).toHaveProperty("overlay");
      expect(DEFAULT_POPUP_SYSTEM_CONFIG).toHaveProperty("theme");
      expect(DEFAULT_POPUP_SYSTEM_CONFIG).toHaveProperty("openfin");
      expect(DEFAULT_POPUP_SYSTEM_CONFIG).toHaveProperty("iframe");
    });

    it("expect dimensions section to have correct values", () => {
      expect(DEFAULT_POPUP_SYSTEM_CONFIG.dimensions).toEqual({
        width: 300,
        height: 300,
        minWidth: 100,
        minHeight: 50,
        maxHeight: 400,
      });
    });

    it("expect positioning section to have correct values", () => {
      expect(DEFAULT_POPUP_SYSTEM_CONFIG.positioning).toEqual({
        placement: "bottom-start",
        offset: 4,
        flip: true,
        shift: true,
        viewportPadding: 8,
      });
    });

    it("expect behavior section to have correct values", () => {
      expect(DEFAULT_POPUP_SYSTEM_CONFIG.behavior).toEqual({
        blurBehavior: "close",
        closeOnEscape: true,
        autoFocus: true,
        restoreFocus: true,
        showBackdrop: false,
        modal: false,
      });
    });

    it("expect animation section to have correct values", () => {
      expect(DEFAULT_POPUP_SYSTEM_CONFIG.animation).toEqual({
        duration: 150,
      });
    });

    it("expect overlay section to have correct values", () => {
      expect(DEFAULT_POPUP_SYSTEM_CONFIG.overlay).toEqual({
        zIndex: 9999,
      });
    });

    it("expect theme section to have correct values", () => {
      expect(DEFAULT_POPUP_SYSTEM_CONFIG.theme).toEqual({
        default: "dark",
        attribute: "data-theme",
        selector: "html",
      });
    });

    it("expect openfin section to have correct values", () => {
      expect(DEFAULT_POPUP_SYSTEM_CONFIG.openfin).toEqual({
        frame: false,
        backgroundColor: "#ffffff",
      });
    });

    it("expect iframe section to have correct values", () => {
      expect(DEFAULT_POPUP_SYSTEM_CONFIG.iframe).toEqual({
        sandbox: "allow-scripts allow-same-origin allow-forms",
      });
    });
  });

  describe("mergeConfig", () => {
    it("expect to return defaults when no override provided", () => {
      const result = mergeConfig();
      expect(result).toEqual(DEFAULT_POPUP_SYSTEM_CONFIG);
    });

    it("expect to return defaults when undefined provided", () => {
      const result = mergeConfig(undefined);
      expect(result).toEqual(DEFAULT_POPUP_SYSTEM_CONFIG);
    });

    it("expect to return merged config when empty object provided", () => {
      const result = mergeConfig({});
      expect(result).toEqual(DEFAULT_POPUP_SYSTEM_CONFIG);
    });

    it("expect to merge partial dimensions override", () => {
      const result = mergeConfig({
        dimensions: { width: 500 },
      });

      expect(result.dimensions.width).toBe(500);
      expect(result.dimensions.height).toBe(300); // default
      expect(result.dimensions.minWidth).toBe(100); // default
    });

    it("expect to merge partial positioning override", () => {
      const result = mergeConfig({
        positioning: { placement: "top", offset: 10 },
      });

      expect(result.positioning.placement).toBe("top");
      expect(result.positioning.offset).toBe(10);
      expect(result.positioning.flip).toBe(true); // default
      expect(result.positioning.shift).toBe(true); // default
    });

    it("expect to merge partial behavior override", () => {
      const result = mergeConfig({
        behavior: { blurBehavior: "none", modal: true },
      });

      expect(result.behavior.blurBehavior).toBe("none");
      expect(result.behavior.modal).toBe(true);
      expect(result.behavior.closeOnEscape).toBe(true); // default
      expect(result.behavior.autoFocus).toBe(true); // default
    });

    it("expect to merge partial animation override", () => {
      const result = mergeConfig({
        animation: { duration: 300 },
      });

      expect(result.animation.duration).toBe(300);
    });

    it("expect to merge partial overlay override", () => {
      const result = mergeConfig({
        overlay: { zIndex: 10000 },
      });

      expect(result.overlay.zIndex).toBe(10000);
    });

    it("expect to merge partial theme override", () => {
      const result = mergeConfig({
        theme: { default: "light" },
      });

      expect(result.theme.default).toBe("light");
      expect(result.theme.attribute).toBe("data-theme"); // default
      expect(result.theme.selector).toBe("html"); // default
    });

    it("expect to merge partial openfin override", () => {
      const result = mergeConfig({
        openfin: { frame: true, backgroundColor: "#000000" },
      });

      expect(result.openfin.frame).toBe(true);
      expect(result.openfin.backgroundColor).toBe("#000000");
    });

    it("expect to merge partial iframe override", () => {
      const result = mergeConfig({
        iframe: { sandbox: "allow-scripts" },
      });

      expect(result.iframe.sandbox).toBe("allow-scripts");
    });

    it("expect to merge multiple sections at once", () => {
      const result = mergeConfig({
        dimensions: { width: 400 },
        positioning: { placement: "right" },
        behavior: { modal: true },
        animation: { duration: 200 },
      });

      expect(result.dimensions.width).toBe(400);
      expect(result.positioning.placement).toBe("right");
      expect(result.behavior.modal).toBe(true);
      expect(result.animation.duration).toBe(200);
      // Unchanged sections should have defaults
      expect(result.overlay.zIndex).toBe(9999);
      expect(result.theme.default).toBe("dark");
    });

    it("expect original defaults to be immutable", () => {
      const original = { ...DEFAULT_POPUP_SYSTEM_CONFIG.dimensions };

      mergeConfig({
        dimensions: { width: 999 },
      });

      expect(DEFAULT_POPUP_SYSTEM_CONFIG.dimensions).toEqual(original);
    });
  });
});
