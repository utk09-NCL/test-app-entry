import { describe, expect, it } from "vitest";

import { OrderType } from "../types/domain";

import { getViewFields, ORDER_TYPES } from "./orderConfig";

describe("orderConfig", () => {
  describe("ORDER_TYPES", () => {
    it("expect all real server order types to be defined in config", () => {
      expect(ORDER_TYPES[OrderType.FLOAT]).toBeDefined();
      expect(ORDER_TYPES[OrderType.STOP_LOSS]).toBeDefined();
      expect(ORDER_TYPES[OrderType.TAKE_PROFIT]).toBeDefined();
      expect(ORDER_TYPES[OrderType.LIQUIDITY_SEEKER]).toBeDefined();
      expect(ORDER_TYPES[OrderType.POUNCE]).toBeDefined();
      expect(ORDER_TYPES[OrderType.PARTICIPATION]).toBeDefined();
    });

    it("expect each order type to have required properties when accessing config", () => {
      Object.values(ORDER_TYPES).forEach((config) => {
        expect(config.fields).toBeDefined();
        expect(Array.isArray(config.fields)).toBe(true);
        expect(config.initialFocus).toBeDefined();
        expect(config.editableFields).toBeDefined();
        expect(Array.isArray(config.editableFields)).toBe(true);
      });
    });

    describe("FLOAT order", () => {
      it("expect FLOAT to have liquidityPool when rendering form", () => {
        const { fields } = ORDER_TYPES[OrderType.FLOAT];
        expect(fields).toContain("liquidityPool");
      });

      it("expect FLOAT to not have timeInForce when rendering form", () => {
        const { fields } = ORDER_TYPES[OrderType.FLOAT];
        expect(fields).not.toContain("timeInForce");
      });

      it("expect FLOAT to have level when rendering form", () => {
        const { fields } = ORDER_TYPES[OrderType.FLOAT];
        expect(fields).toContain("level");
      });

      it("expect FLOAT initialFocus to be amount when selecting order type", () => {
        expect(ORDER_TYPES[OrderType.FLOAT].initialFocus).toBe("amount");
      });

      it("expect FLOAT editableFields to include amount and level when amending", () => {
        const { editableFields } = ORDER_TYPES[OrderType.FLOAT];
        expect(editableFields).toContain("amount");
        expect(editableFields).toContain("level");
      });
    });

    describe("STOP_LOSS order", () => {
      it("expect STOP_LOSS to have level when rendering form", () => {
        const { fields } = ORDER_TYPES[OrderType.STOP_LOSS];
        expect(fields).toContain("level");
      });

      it("expect STOP_LOSS initialFocus to be level when selecting order type", () => {
        expect(ORDER_TYPES[OrderType.STOP_LOSS].initialFocus).toBe("level");
      });

      it("expect STOP_LOSS editableFields to include level when amending", () => {
        const { editableFields } = ORDER_TYPES[OrderType.STOP_LOSS];
        expect(editableFields).toContain("level");
        expect(editableFields).toContain("amount");
      });
    });

    describe("TAKE_PROFIT order", () => {
      it("expect TAKE_PROFIT to have level field when rendering form", () => {
        const { fields } = ORDER_TYPES[OrderType.TAKE_PROFIT];
        expect(fields).toContain("level");
      });

      it("expect TAKE_PROFIT initialFocus to be level when selecting order type", () => {
        expect(ORDER_TYPES[OrderType.TAKE_PROFIT].initialFocus).toBe("level");
      });

      it("expect TAKE_PROFIT editableFields to include level and iceberg when amending", () => {
        const { editableFields } = ORDER_TYPES[OrderType.TAKE_PROFIT];
        expect(editableFields).toContain("level");
        expect(editableFields).toContain("iceberg");
        expect(editableFields).toContain("amount");
      });
    });

    describe("LIQUIDITY_SEEKER order", () => {
      it("expect LIQUIDITY_SEEKER to have liquidityPool when rendering form", () => {
        const { fields } = ORDER_TYPES[OrderType.LIQUIDITY_SEEKER];
        expect(fields).toContain("liquidityPool");
      });
    });

    describe("POUNCE order", () => {
      it("expect POUNCE to have level field when rendering form", () => {
        const { fields } = ORDER_TYPES[OrderType.POUNCE];
        expect(fields).toContain("level");
      });

      it("expect POUNCE initialFocus to be level when selecting order type", () => {
        expect(ORDER_TYPES[OrderType.POUNCE].initialFocus).toBe("level");
      });
    });
  });

  describe("getViewFields", () => {
    it("expect execution to be first field when getting view fields for FLOAT", () => {
      const viewFields = getViewFields(OrderType.FLOAT);
      expect(viewFields[0]).toBe("execution");
    });

    it("expect execution to be first field when getting view fields for STOP_LOSS", () => {
      const viewFields = getViewFields(OrderType.STOP_LOSS);
      expect(viewFields[0]).toBe("execution");
    });

    it("expect view fields to include all config fields when getting FLOAT view fields", () => {
      const viewFields = getViewFields(OrderType.FLOAT);
      const configFields = ORDER_TYPES[OrderType.FLOAT].fields;
      configFields.forEach((field) => {
        expect(viewFields).toContain(field);
      });
    });

    it("expect view fields length to be config fields plus one when adding status", () => {
      const viewFields = getViewFields(OrderType.STOP_LOSS);
      expect(viewFields.length).toBe(ORDER_TYPES[OrderType.STOP_LOSS].fields.length + 1);
    });

    it("expect view fields to preserve order of config fields when getting view fields", () => {
      const viewFields = getViewFields(OrderType.TAKE_PROFIT);
      const configFields = ORDER_TYPES[OrderType.TAKE_PROFIT].fields;
      // Skip first element (status), then check order matches
      for (let i = 0; i < configFields.length; i++) {
        expect(viewFields[i + 1]).toBe(configFields[i]);
      }
    });
  });

  describe("field consistency", () => {
    it("expect all order types to include side when rendering form", () => {
      Object.values(ORDER_TYPES).forEach((config) => {
        expect(config.fields).toContain("side");
      });
    });

    it("expect all order types to include amount when rendering form", () => {
      Object.values(ORDER_TYPES).forEach((config) => {
        expect(config.fields).toContain("amount");
      });
    });

    it("expect all order types to include account when rendering form", () => {
      Object.values(ORDER_TYPES).forEach((config) => {
        expect(config.fields).toContain("account");
      });
    });

    it("expect all editableFields to be subset of fields when validating config", () => {
      Object.values(ORDER_TYPES).forEach((config) => {
        config.editableFields.forEach((editableField) => {
          expect(config.fields).toContain(editableField);
        });
      });
    });

    it("expect initialFocus to be in fields when validating config", () => {
      Object.values(ORDER_TYPES).forEach((config) => {
        expect(config.fields).toContain(config.initialFocus);
      });
    });
  });
});
