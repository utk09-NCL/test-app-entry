import { describe, expect, it } from "vitest";

import { FIELD_REGISTRY, FieldDefinition } from "./fieldRegistry";

describe("fieldRegistry", () => {
  describe("FIELD_REGISTRY", () => {
    it("expect all common fields to be defined when accessing registry", () => {
      const expectedFields = [
        "side",
        "currencyPair",
        "amount",
        "level",
        "iceberg",
        "liquidityPool",
        "account",
        "expiry",
        "startTime",
        "execution",
      ];
      expectedFields.forEach((field) => {
        expect(FIELD_REGISTRY[field]).toBeDefined();
      });
    });

    it("expect each field to have label property when accessing definition", () => {
      Object.values(FIELD_REGISTRY).forEach((definition: FieldDefinition) => {
        expect(definition.label).toBeDefined();
        expect(typeof definition.label).toBe("string");
        expect(definition.label.length).toBeGreaterThan(0);
      });
    });

    it("expect each field to have component property when accessing definition", () => {
      Object.values(FIELD_REGISTRY).forEach((definition: FieldDefinition) => {
        expect(definition.component).toBeDefined();
        expect(typeof definition.component).toBe("string");
      });
    });

    it("expect component types to be valid when validating definitions", () => {
      const validComponents = [
        "InputNumber",
        "InputText",
        "InputTime",
        "InputDate",
        "Select",
        "Toggle",
        "RangeSlider",
        "DateTime",
        "AmountWithCurrency",
        "LimitPriceWithCheckbox",
      ];
      Object.values(FIELD_REGISTRY).forEach((definition: FieldDefinition) => {
        expect(validComponents).toContain(definition.component);
      });
    });
  });

  describe("side field", () => {
    it("expect side to use Toggle component when rendering", () => {
      expect(FIELD_REGISTRY.side.component).toBe("Toggle");
    });

    it("expect side to have Direction label when rendering", () => {
      expect(FIELD_REGISTRY.side.label).toBe("Direction");
    });
  });

  describe("currencyPair field", () => {
    it("expect currencyPair to use InputText component when rendering", () => {
      expect(FIELD_REGISTRY.currencyPair.component).toBe("InputText");
    });

    it("expect currencyPair to have Symbol label when rendering", () => {
      expect(FIELD_REGISTRY.currencyPair.label).toBe("Symbol");
    });
  });

  describe("amount field", () => {
    it("expect amount to use AmountWithCurrency component when rendering", () => {
      expect(FIELD_REGISTRY.amount.component).toBe("AmountWithCurrency");
    });

    it("expect amount to have Amount label when rendering", () => {
      expect(FIELD_REGISTRY.amount.label).toBe("Amount");
    });
  });

  describe("level field", () => {
    it("expect level to use InputNumber component when rendering", () => {
      expect(FIELD_REGISTRY.level.component).toBe("InputNumber");
    });

    it("expect level to have Price label when rendering", () => {
      expect(FIELD_REGISTRY.level.label).toBe("Limit Price");
    });
  });

  describe("iceberg field", () => {
    it("expect iceberg to use InputNumber component when rendering", () => {
      expect(FIELD_REGISTRY.iceberg.component).toBe("InputNumber");
    });

    it("expect iceberg to have Iceberg label when rendering", () => {
      expect(FIELD_REGISTRY.iceberg.label).toBe("Iceberg");
    });
  });

  describe("liquidityPool field", () => {
    it("expect liquidityPool to use Select component when rendering", () => {
      expect(FIELD_REGISTRY.liquidityPool.component).toBe("Select");
    });

    it("expect liquidityPool to have Liquidity Pool label when rendering", () => {
      expect(FIELD_REGISTRY.liquidityPool.label).toBe("Liquidity Pool");
    });
  });

  describe("account field", () => {
    it("expect account to use Select component when rendering", () => {
      expect(FIELD_REGISTRY.account.component).toBe("Select");
    });

    it("expect account to have Account label when rendering", () => {
      expect(FIELD_REGISTRY.account.label).toBe("Account");
    });
  });

  describe("expiry field", () => {
    it("expect expiry to use Select component when rendering", () => {
      expect(FIELD_REGISTRY.expiry.component).toBe("Select");
    });

    it("expect expiry to have Expiry label when rendering", () => {
      expect(FIELD_REGISTRY.expiry.label).toBe("Expiry");
    });
  });

  describe("startTime field", () => {
    it("expect startTime to use InputTime component when rendering", () => {
      expect(FIELD_REGISTRY.startTime.component).toBe("InputTime");
    });

    it("expect startTime to have Start Time label when rendering", () => {
      expect(FIELD_REGISTRY.startTime.label).toBe("Start Time");
    });
  });

  describe("execution field", () => {
    it("expect execution to use InputText component when rendering", () => {
      expect(FIELD_REGISTRY.execution.component).toBe("InputText");
    });

    it("expect execution to have Execution label when rendering", () => {
      expect(FIELD_REGISTRY.execution.label).toBe("Execution");
    });
  });
});
