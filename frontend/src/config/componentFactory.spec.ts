import { describe, expect, it } from "vitest";

import {
  getInputType,
  isAmountWithCurrencyComponent,
  isInputDateComponent,
  isInputTimeComponent,
  isLimitPriceComponent,
  isRangeSliderComponent,
  isSelectComponent,
  isSpecialComponent,
  isToggleComponent,
} from "./componentFactory";

describe("componentFactory", () => {
  describe("getInputType", () => {
    it("expect 'number' type when component is InputNumber", () => {
      expect(getInputType("InputNumber")).toBe("number");
    });

    it("expect 'number' type when component is AmountWithCurrency", () => {
      expect(getInputType("AmountWithCurrency")).toBe("number");
    });

    it("expect 'number' type when component is LimitPriceWithCheckbox", () => {
      expect(getInputType("LimitPriceWithCheckbox")).toBe("number");
    });

    it("expect 'text' type when component is InputText", () => {
      expect(getInputType("InputText")).toBe("text");
    });

    it("expect 'text' type when component is Select", () => {
      expect(getInputType("Select")).toBe("text");
    });

    it("expect 'text' type when component is Toggle", () => {
      expect(getInputType("Toggle")).toBe("text");
    });

    it("expect 'text' type when component is DateTime", () => {
      expect(getInputType("DateTime")).toBe("text");
    });
  });

  describe("isSelectComponent", () => {
    it("expect true when component is Select", () => {
      expect(isSelectComponent("Select")).toBe(true);
    });

    it("expect false when component is InputText", () => {
      expect(isSelectComponent("InputText")).toBe(false);
    });

    it("expect false when component is InputNumber", () => {
      expect(isSelectComponent("InputNumber")).toBe(false);
    });

    it("expect false when component is Toggle", () => {
      expect(isSelectComponent("Toggle")).toBe(false);
    });
  });

  describe("isToggleComponent", () => {
    it("expect true when component is Toggle", () => {
      expect(isToggleComponent("Toggle")).toBe(true);
    });

    it("expect false when component is Select", () => {
      expect(isToggleComponent("Select")).toBe(false);
    });

    it("expect false when component is InputText", () => {
      expect(isToggleComponent("InputText")).toBe(false);
    });
  });

  describe("isAmountWithCurrencyComponent", () => {
    it("expect true when component is AmountWithCurrency", () => {
      expect(isAmountWithCurrencyComponent("AmountWithCurrency")).toBe(true);
    });

    it("expect false when component is InputNumber", () => {
      expect(isAmountWithCurrencyComponent("InputNumber")).toBe(false);
    });

    it("expect false when component is LimitPriceWithCheckbox", () => {
      expect(isAmountWithCurrencyComponent("LimitPriceWithCheckbox")).toBe(false);
    });
  });

  describe("isLimitPriceComponent", () => {
    it("expect true when component is LimitPriceWithCheckbox", () => {
      expect(isLimitPriceComponent("LimitPriceWithCheckbox")).toBe(true);
    });

    it("expect false when component is InputNumber", () => {
      expect(isLimitPriceComponent("InputNumber")).toBe(false);
    });

    it("expect false when component is AmountWithCurrency", () => {
      expect(isLimitPriceComponent("AmountWithCurrency")).toBe(false);
    });
  });

  describe("isInputTimeComponent", () => {
    it("expect true when component is InputTime", () => {
      expect(isInputTimeComponent("InputTime")).toBe(true);
    });

    it("expect false when component is InputDate", () => {
      expect(isInputTimeComponent("InputDate")).toBe(false);
    });

    it("expect false when component is InputText", () => {
      expect(isInputTimeComponent("InputText")).toBe(false);
    });

    it("expect false when component is Select", () => {
      expect(isInputTimeComponent("Select")).toBe(false);
    });
  });

  describe("isInputDateComponent", () => {
    it("expect true when component is InputDate", () => {
      expect(isInputDateComponent("InputDate")).toBe(true);
    });

    it("expect false when component is InputTime", () => {
      expect(isInputDateComponent("InputTime")).toBe(false);
    });

    it("expect false when component is InputText", () => {
      expect(isInputDateComponent("InputText")).toBe(false);
    });

    it("expect false when component is Select", () => {
      expect(isInputDateComponent("Select")).toBe(false);
    });
  });

  describe("isRangeSliderComponent", () => {
    it("expect true when component is RangeSlider", () => {
      expect(isRangeSliderComponent("RangeSlider")).toBe(true);
    });

    it("expect false when component is InputNumber", () => {
      expect(isRangeSliderComponent("InputNumber")).toBe(false);
    });

    it("expect false when component is Select", () => {
      expect(isRangeSliderComponent("Select")).toBe(false);
    });

    it("expect false when component is Toggle", () => {
      expect(isRangeSliderComponent("Toggle")).toBe(false);
    });
  });

  describe("isSpecialComponent", () => {
    it("expect true when component is AmountWithCurrency", () => {
      expect(isSpecialComponent("AmountWithCurrency")).toBe(true);
    });

    it("expect true when component is LimitPriceWithCheckbox", () => {
      expect(isSpecialComponent("LimitPriceWithCheckbox")).toBe(true);
    });

    it("expect true when component is Toggle", () => {
      expect(isSpecialComponent("Toggle")).toBe(true);
    });

    it("expect true when component is RangeSlider", () => {
      expect(isSpecialComponent("RangeSlider")).toBe(true);
    });

    it("expect true when component is InputTime", () => {
      expect(isSpecialComponent("InputTime")).toBe(true);
    });

    it("expect true when component is InputDate", () => {
      expect(isSpecialComponent("InputDate")).toBe(true);
    });

    it("expect false when component is InputNumber", () => {
      expect(isSpecialComponent("InputNumber")).toBe(false);
    });

    it("expect false when component is InputText", () => {
      expect(isSpecialComponent("InputText")).toBe(false);
    });

    it("expect false when component is Select", () => {
      expect(isSpecialComponent("Select")).toBe(false);
    });

    it("expect false when component is DateTime", () => {
      expect(isSpecialComponent("DateTime")).toBe(false);
    });
  });
});
