/**
 * Unit tests for popup positioning utilities
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  applyShift,
  buildPlacement,
  calculateBasePosition,
  calculateCenterPosition,
  calculatePopupPosition,
  checkOverflow,
  constrainSize,
  getElementRect,
  getOppositeSide,
  getViewportSize,
  parsePlacement,
  shouldFlip,
  toScreenCoordinates,
} from "./positioning";

// Mock window dimensions
const mockWindowSize = (width: number, height: number) => {
  vi.stubGlobal("innerWidth", width);
  vi.stubGlobal("innerHeight", height);
};

describe("popup/utils/positioning", () => {
  beforeEach(() => {
    // Default viewport size
    mockWindowSize(1024, 768);
    vi.stubGlobal("screenX", 0);
    vi.stubGlobal("screenY", 0);
  });

  describe("getViewportSize", () => {
    it("expect to return window dimensions", () => {
      mockWindowSize(1920, 1080);
      const size = getViewportSize();

      expect(size.width).toBe(1920);
      expect(size.height).toBe(1080);
    });
  });

  describe("getElementRect", () => {
    it("expect to return bounding rect of element", () => {
      const mockElement = {
        getBoundingClientRect: () => ({
          left: 100,
          top: 200,
          width: 50,
          height: 30,
        }),
      } as HTMLElement;

      const rect = getElementRect(mockElement);

      expect(rect).toEqual({
        x: 100,
        y: 200,
        width: 50,
        height: 30,
      });
    });
  });

  describe("parsePlacement", () => {
    it("expect to parse simple placement (side only)", () => {
      expect(parsePlacement("top")).toEqual({ side: "top", alignment: "center" });
      expect(parsePlacement("bottom")).toEqual({ side: "bottom", alignment: "center" });
      expect(parsePlacement("left")).toEqual({ side: "left", alignment: "center" });
      expect(parsePlacement("right")).toEqual({ side: "right", alignment: "center" });
    });

    it("expect to parse placement with start alignment", () => {
      expect(parsePlacement("top-start")).toEqual({ side: "top", alignment: "start" });
      expect(parsePlacement("bottom-start")).toEqual({ side: "bottom", alignment: "start" });
      expect(parsePlacement("left-start")).toEqual({ side: "left", alignment: "start" });
      expect(parsePlacement("right-start")).toEqual({ side: "right", alignment: "start" });
    });

    it("expect to parse placement with end alignment", () => {
      expect(parsePlacement("top-end")).toEqual({ side: "top", alignment: "end" });
      expect(parsePlacement("bottom-end")).toEqual({ side: "bottom", alignment: "end" });
      expect(parsePlacement("left-end")).toEqual({ side: "left", alignment: "end" });
      expect(parsePlacement("right-end")).toEqual({ side: "right", alignment: "end" });
    });
  });

  describe("getOppositeSide", () => {
    it("expect to return opposite sides", () => {
      expect(getOppositeSide("top")).toBe("bottom");
      expect(getOppositeSide("bottom")).toBe("top");
      expect(getOppositeSide("left")).toBe("right");
      expect(getOppositeSide("right")).toBe("left");
    });
  });

  describe("buildPlacement", () => {
    it("expect to build simple placement for center alignment", () => {
      expect(buildPlacement("top", "center")).toBe("top");
      expect(buildPlacement("bottom", "center")).toBe("bottom");
      expect(buildPlacement("left", "center")).toBe("left");
      expect(buildPlacement("right", "center")).toBe("right");
    });

    it("expect to build compound placement for start/end alignment", () => {
      expect(buildPlacement("top", "start")).toBe("top-start");
      expect(buildPlacement("bottom", "end")).toBe("bottom-end");
      expect(buildPlacement("left", "start")).toBe("left-start");
      expect(buildPlacement("right", "end")).toBe("right-end");
    });
  });

  describe("calculateBasePosition", () => {
    const anchor = { x: 100, y: 100, width: 100, height: 40 };
    const popup = { width: 200, height: 150 };
    const offset = 4;

    describe("top placements", () => {
      it("expect top to position above anchor, centered", () => {
        const pos = calculateBasePosition(anchor, popup, "top", offset);
        expect(pos.y).toBe(100 - 150 - 4); // anchor.y - popup.height - offset
        expect(pos.x).toBe(100 + 50 - 100); // anchor.x + anchor.width/2 - popup.width/2
      });

      it("expect top-start to position above anchor, left-aligned", () => {
        const pos = calculateBasePosition(anchor, popup, "top-start", offset);
        expect(pos.y).toBe(100 - 150 - 4);
        expect(pos.x).toBe(100); // anchor.x
      });

      it("expect top-end to position above anchor, right-aligned", () => {
        const pos = calculateBasePosition(anchor, popup, "top-end", offset);
        expect(pos.y).toBe(100 - 150 - 4);
        expect(pos.x).toBe(100 + 100 - 200); // anchor.x + anchor.width - popup.width
      });
    });

    describe("bottom placements", () => {
      it("expect bottom to position below anchor, centered", () => {
        const pos = calculateBasePosition(anchor, popup, "bottom", offset);
        expect(pos.y).toBe(100 + 40 + 4); // anchor.y + anchor.height + offset
        expect(pos.x).toBe(100 + 50 - 100); // centered
      });

      it("expect bottom-start to position below anchor, left-aligned", () => {
        const pos = calculateBasePosition(anchor, popup, "bottom-start", offset);
        expect(pos.y).toBe(144);
        expect(pos.x).toBe(100);
      });

      it("expect bottom-end to position below anchor, right-aligned", () => {
        const pos = calculateBasePosition(anchor, popup, "bottom-end", offset);
        expect(pos.y).toBe(144);
        expect(pos.x).toBe(0); // 100 + 100 - 200
      });
    });

    describe("left placements", () => {
      it("expect left to position left of anchor, centered", () => {
        const pos = calculateBasePosition(anchor, popup, "left", offset);
        expect(pos.x).toBe(100 - 200 - 4); // anchor.x - popup.width - offset
        expect(pos.y).toBe(100 + 20 - 75); // anchor.y + anchor.height/2 - popup.height/2
      });

      it("expect left-start to position left of anchor, top-aligned", () => {
        const pos = calculateBasePosition(anchor, popup, "left-start", offset);
        expect(pos.x).toBe(-104);
        expect(pos.y).toBe(100); // anchor.y
      });

      it("expect left-end to position left of anchor, bottom-aligned", () => {
        const pos = calculateBasePosition(anchor, popup, "left-end", offset);
        expect(pos.x).toBe(-104);
        expect(pos.y).toBe(100 + 40 - 150); // anchor.y + anchor.height - popup.height
      });
    });

    describe("right placements", () => {
      it("expect right to position right of anchor, centered", () => {
        const pos = calculateBasePosition(anchor, popup, "right", offset);
        expect(pos.x).toBe(100 + 100 + 4); // anchor.x + anchor.width + offset
        expect(pos.y).toBe(100 + 20 - 75); // centered vertically
      });

      it("expect right-start to position right of anchor, top-aligned", () => {
        const pos = calculateBasePosition(anchor, popup, "right-start", offset);
        expect(pos.x).toBe(204);
        expect(pos.y).toBe(100);
      });

      it("expect right-end to position right of anchor, bottom-aligned", () => {
        const pos = calculateBasePosition(anchor, popup, "right-end", offset);
        expect(pos.x).toBe(204);
        expect(pos.y).toBe(-10); // 100 + 40 - 150
      });
    });
  });

  describe("checkOverflow", () => {
    const viewport = { width: 1024, height: 768 };
    const popup = { width: 200, height: 150 };
    const padding = 8;

    it("expect no overflow when popup is within viewport", () => {
      const position = { x: 100, y: 100 };
      const overflow = checkOverflow(position, popup, viewport, padding);

      expect(overflow.top).toBeLessThanOrEqual(0);
      expect(overflow.right).toBeLessThanOrEqual(0);
      expect(overflow.bottom).toBeLessThanOrEqual(0);
      expect(overflow.left).toBeLessThanOrEqual(0);
    });

    it("expect left overflow when popup extends past left edge", () => {
      const position = { x: -50, y: 100 };
      const overflow = checkOverflow(position, popup, viewport, padding);

      expect(overflow.left).toBe(58); // padding - position.x
    });

    it("expect right overflow when popup extends past right edge", () => {
      const position = { x: 900, y: 100 }; // 900 + 200 = 1100 > 1024 - 8
      const overflow = checkOverflow(position, popup, viewport, padding);

      expect(overflow.right).toBe(900 + 200 - (1024 - 8)); // 84
    });

    it("expect top overflow when popup extends past top edge", () => {
      const position = { x: 100, y: -20 };
      const overflow = checkOverflow(position, popup, viewport, padding);

      expect(overflow.top).toBe(28); // padding - position.y
    });

    it("expect bottom overflow when popup extends past bottom edge", () => {
      const position = { x: 100, y: 700 }; // 700 + 150 = 850 > 768 - 8
      const overflow = checkOverflow(position, popup, viewport, padding);

      expect(overflow.bottom).toBe(700 + 150 - (768 - 8)); // 90
    });
  });

  describe("shouldFlip", () => {
    it("expect to flip when top overflow exists for top placement", () => {
      const overflow = { top: 20, right: 0, bottom: 0, left: 0 };
      expect(shouldFlip(overflow, "top")).toBe(true);
    });

    it("expect to flip when bottom overflow exists for bottom placement", () => {
      const overflow = { top: 0, right: 0, bottom: 30, left: 0 };
      expect(shouldFlip(overflow, "bottom")).toBe(true);
    });

    it("expect to flip when left overflow exists for left placement", () => {
      const overflow = { top: 0, right: 0, bottom: 0, left: 40 };
      expect(shouldFlip(overflow, "left")).toBe(true);
    });

    it("expect to flip when right overflow exists for right placement", () => {
      const overflow = { top: 0, right: 50, bottom: 0, left: 0 };
      expect(shouldFlip(overflow, "right")).toBe(true);
    });

    it("expect not to flip when no relevant overflow", () => {
      const overflow = { top: 0, right: 0, bottom: 0, left: 0 };
      expect(shouldFlip(overflow, "top")).toBe(false);
      expect(shouldFlip(overflow, "bottom")).toBe(false);
      expect(shouldFlip(overflow, "left")).toBe(false);
      expect(shouldFlip(overflow, "right")).toBe(false);
    });
  });

  describe("applyShift", () => {
    it("expect to shift right when left overflow for top/bottom placement", () => {
      const position = { x: -50, y: 100 };
      const overflow = { top: 0, right: 0, bottom: 0, left: 58 };
      const shifted = applyShift(position, overflow, "bottom");

      expect(shifted.x).toBe(-50 + 58); // shifted right
      expect(shifted.y).toBe(100); // unchanged
    });

    it("expect to shift left when right overflow for top/bottom placement", () => {
      const position = { x: 900, y: 100 };
      const overflow = { top: 0, right: 84, bottom: 0, left: 0 };
      const shifted = applyShift(position, overflow, "bottom");

      expect(shifted.x).toBe(900 - 84); // shifted left
      expect(shifted.y).toBe(100); // unchanged
    });

    it("expect to shift down when top overflow for left/right placement", () => {
      const position = { x: 100, y: -20 };
      const overflow = { top: 28, right: 0, bottom: 0, left: 0 };
      const shifted = applyShift(position, overflow, "right");

      expect(shifted.x).toBe(100); // unchanged
      expect(shifted.y).toBe(-20 + 28); // shifted down
    });

    it("expect to shift up when bottom overflow for left/right placement", () => {
      const position = { x: 100, y: 700 };
      const overflow = { top: 0, right: 0, bottom: 90, left: 0 };
      const shifted = applyShift(position, overflow, "right");

      expect(shifted.x).toBe(100); // unchanged
      expect(shifted.y).toBe(700 - 90); // shifted up
    });
  });

  describe("calculatePopupPosition", () => {
    it("expect to use default config when none provided", () => {
      const anchor = { x: 100, y: 100, width: 100, height: 40 };
      const popup = { width: 200, height: 150 };

      const result = calculatePopupPosition(anchor, popup);

      // Default is bottom-start with 4px offset
      expect(result.placement).toBe("bottom-start");
      expect(result.y).toBe(144); // 100 + 40 + 4
    });

    it("expect to use custom config when provided", () => {
      // Position anchor in middle of viewport to avoid flip
      const anchor = { x: 400, y: 400, width: 100, height: 40 };
      const popup = { width: 200, height: 150 };

      const result = calculatePopupPosition(anchor, popup, {
        placement: "top-start",
        offset: 10,
      });

      // top-start positions above anchor with 10px offset
      expect(result.y).toBe(400 - 150 - 10); // 240
    });

    it("expect to accept HTMLElement as anchor", () => {
      // Mock element with complete getBoundingClientRect return
      const mockElement = document.createElement("div");
      // Override getBoundingClientRect
      mockElement.getBoundingClientRect = () => ({
        left: 100,
        top: 100,
        width: 100,
        height: 40,
        right: 200,
        bottom: 140,
        x: 100,
        y: 100,
        toJSON: () => ({}),
      });
      const popup = { width: 200, height: 150 };

      const result = calculatePopupPosition(mockElement, popup);

      expect(result.y).toBe(144); // 100 + 40 + 4 (default offset)
    });

    it("expect to return rounded coordinates", () => {
      const anchor = { x: 100.7, y: 100.3, width: 99.5, height: 39.9 };
      const popup = { width: 200, height: 150 };

      const result = calculatePopupPosition(anchor, popup);

      expect(Number.isInteger(result.x)).toBe(true);
      expect(Number.isInteger(result.y)).toBe(true);
    });

    it("expect to indicate when flipped", () => {
      // Anchor at top of viewport - should flip to bottom
      const anchor = { x: 100, y: 20, width: 100, height: 40 };
      const popup = { width: 200, height: 150 };

      const result = calculatePopupPosition(anchor, popup, {
        placement: "top",
        flip: true,
      });

      expect(result.flipped).toBe(true);
      expect(result.placement).toBe("bottom");
    });

    it("expect to not flip when disabled", () => {
      const anchor = { x: 100, y: 20, width: 100, height: 40 };
      const popup = { width: 200, height: 150 };

      const result = calculatePopupPosition(anchor, popup, {
        placement: "top",
        flip: false,
      });

      expect(result.flipped).toBe(false);
      expect(result.placement).toBe("top");
    });
  });

  describe("calculateCenterPosition", () => {
    it("expect to center popup in default viewport", () => {
      mockWindowSize(1024, 768);
      const popup = { width: 200, height: 150 };

      const position = calculateCenterPosition(popup);

      expect(position.x).toBe(Math.round((1024 - 200) / 2));
      expect(position.y).toBe(Math.round((768 - 150) / 2));
    });

    it("expect to center popup in custom viewport", () => {
      const popup = { width: 200, height: 150 };
      const viewport = { width: 500, height: 400 };

      const position = calculateCenterPosition(popup, viewport);

      expect(position.x).toBe(150); // (500 - 200) / 2
      expect(position.y).toBe(125); // (400 - 150) / 2
    });
  });

  describe("toScreenCoordinates", () => {
    it("expect to add screen offsets to position", () => {
      vi.stubGlobal("screenX", 100);
      vi.stubGlobal("screenY", 50);

      const position = { x: 200, y: 300 };
      const screenPos = toScreenCoordinates(position);

      expect(screenPos.x).toBe(300); // 200 + 100
      expect(screenPos.y).toBe(350); // 300 + 50
    });

    it("expect to handle zero screen offsets", () => {
      vi.stubGlobal("screenX", 0);
      vi.stubGlobal("screenY", 0);

      const position = { x: 200, y: 300 };
      const screenPos = toScreenCoordinates(position);

      expect(screenPos.x).toBe(200);
      expect(screenPos.y).toBe(300);
    });
  });

  describe("constrainSize", () => {
    it("expect to constrain width to max size minus padding", () => {
      const size = { width: 1000, height: 200 };
      const maxSize = { width: 800, height: 600 };
      const padding = 10;

      const constrained = constrainSize(size, maxSize, padding);

      expect(constrained.width).toBe(780); // 800 - 10*2
      expect(constrained.height).toBe(200); // unchanged
    });

    it("expect to constrain height to max size minus padding", () => {
      const size = { width: 200, height: 700 };
      const maxSize = { width: 800, height: 600 };
      const padding = 10;

      const constrained = constrainSize(size, maxSize, padding);

      expect(constrained.width).toBe(200); // unchanged
      expect(constrained.height).toBe(580); // 600 - 10*2
    });

    it("expect to use default viewport when max size not provided", () => {
      mockWindowSize(1024, 768);
      const size = { width: 2000, height: 1000 };

      const constrained = constrainSize(size);

      expect(constrained.width).toBe(1024 - 16); // viewport - default padding*2
      expect(constrained.height).toBe(768 - 16);
    });

    it("expect to not modify sizes smaller than max", () => {
      const size = { width: 200, height: 150 };
      const maxSize = { width: 800, height: 600 };
      const padding = 10;

      const constrained = constrainSize(size, maxSize, padding);

      expect(constrained.width).toBe(200);
      expect(constrained.height).toBe(150);
    });
  });
});
