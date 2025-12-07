import { describe, expect, it } from "vitest";

import { ExpiryStrategy, OrderType, StartMode } from "../types/domain";

import { FIELD_VISIBILITY_RULES, filterVisibleFields, isFieldVisible } from "./visibilityRules";

describe("visibilityRules", () => {
  describe("FIELD_VISIBILITY_RULES", () => {
    describe("level rule", () => {
      it("expect level to be visible when orderType is TAKE_PROFIT", () => {
        const rule = FIELD_VISIBILITY_RULES.level!;
        expect(rule({ orderType: OrderType.TAKE_PROFIT })).toBe(true);
      });

      it("expect level to be visible when orderType is FLOAT", () => {
        const rule = FIELD_VISIBILITY_RULES.level!;
        expect(rule({ orderType: OrderType.FLOAT })).toBe(true);
      });

      it("expect level to be hidden when orderType is LIQUIDITY_SEEKER", () => {
        const rule = FIELD_VISIBILITY_RULES.level!;
        expect(rule({ orderType: OrderType.LIQUIDITY_SEEKER })).toBe(false);
      });

      it("expect level to be visible when orderType is STOP_LOSS", () => {
        const rule = FIELD_VISIBILITY_RULES.level!;
        expect(rule({ orderType: OrderType.STOP_LOSS })).toBe(true);
      });
    });

    describe("liquidityPool rule", () => {
      it("expect liquidityPool to be visible when orderType is POUNCE", () => {
        const rule = FIELD_VISIBILITY_RULES.liquidityPool!;
        expect(rule({ orderType: OrderType.POUNCE })).toBe(true);
      });

      it("expect liquidityPool to be visible when orderType is FLOAT", () => {
        const rule = FIELD_VISIBILITY_RULES.liquidityPool!;
        expect(rule({ orderType: OrderType.FLOAT })).toBe(true);
      });

      it("expect liquidityPool to be hidden when orderType is FIXING", () => {
        const rule = FIELD_VISIBILITY_RULES.liquidityPool!;
        expect(rule({ orderType: OrderType.FIXING })).toBe(false);
      });
    });

    describe("level rule (additional)", () => {
      it("expect level to be visible when orderType is POUNCE", () => {
        const rule = FIELD_VISIBILITY_RULES.level!;
        expect(rule({ orderType: OrderType.POUNCE })).toBe(true);
      });

      it("expect level to be visible when orderType is TAKE_PROFIT", () => {
        const rule = FIELD_VISIBILITY_RULES.level!;
        expect(rule({ orderType: OrderType.TAKE_PROFIT })).toBe(true);
      });

      it("expect level to be visible when orderType is CALL_LEVEL", () => {
        const rule = FIELD_VISIBILITY_RULES.level!;
        expect(rule({ orderType: OrderType.CALL_LEVEL })).toBe(true);
      });

      it("expect level to be visible when orderType is FLOAT", () => {
        const rule = FIELD_VISIBILITY_RULES.level!;
        expect(rule({ orderType: OrderType.FLOAT })).toBe(true);
      });

      it("expect level to be hidden when orderType is LIQUIDITY_SEEKER", () => {
        const rule = FIELD_VISIBILITY_RULES.level!;
        expect(rule({ orderType: OrderType.LIQUIDITY_SEEKER })).toBe(false);
      });

      it("expect level to be hidden when orderType is STOP_LOSS and liquidityPool is FLOAT_POOL", () => {
        const rule = FIELD_VISIBILITY_RULES.level!;
        expect(rule({ orderType: OrderType.STOP_LOSS, liquidityPool: "FLOAT_POOL" })).toBe(false);
      });
    });

    describe("targetExecutionRate rule", () => {
      it("expect targetExecutionRate to be visible when orderType is FLOAT", () => {
        const rule = FIELD_VISIBILITY_RULES.targetExecutionRate!;
        expect(rule({ orderType: OrderType.FLOAT })).toBe(true);
      });

      it("expect targetExecutionRate to be visible when orderType is LIQUIDITY_SEEKER", () => {
        const rule = FIELD_VISIBILITY_RULES.targetExecutionRate!;
        expect(rule({ orderType: OrderType.LIQUIDITY_SEEKER })).toBe(true);
      });

      it("expect targetExecutionRate to be hidden when orderType is STOP_LOSS", () => {
        const rule = FIELD_VISIBILITY_RULES.targetExecutionRate!;
        expect(rule({ orderType: OrderType.STOP_LOSS })).toBe(false);
      });

      it("expect targetExecutionRate to be hidden when orderType is PARTICIPATION", () => {
        const rule = FIELD_VISIBILITY_RULES.targetExecutionRate!;
        expect(rule({ orderType: OrderType.PARTICIPATION })).toBe(false);
      });
    });

    describe("participationRate rule", () => {
      it("expect participationRate to be visible when orderType is PARTICIPATION", () => {
        const rule = FIELD_VISIBILITY_RULES.participationRate!;
        expect(rule({ orderType: OrderType.PARTICIPATION })).toBe(true);
      });

      it("expect participationRate to be hidden when orderType is FLOAT", () => {
        const rule = FIELD_VISIBILITY_RULES.participationRate!;
        expect(rule({ orderType: OrderType.FLOAT })).toBe(false);
      });

      it("expect participationRate to be hidden when orderType is POUNCE", () => {
        const rule = FIELD_VISIBILITY_RULES.participationRate!;
        expect(rule({ orderType: OrderType.POUNCE })).toBe(false);
      });
    });

    describe("executionStyle rule", () => {
      it("expect executionStyle to be visible when orderType is AGGRESSIVE", () => {
        const rule = FIELD_VISIBILITY_RULES.executionStyle!;
        expect(rule({ orderType: OrderType.AGGRESSIVE })).toBe(true);
      });

      it("expect executionStyle to be visible when orderType is PARTICIPATION", () => {
        const rule = FIELD_VISIBILITY_RULES.executionStyle!;
        expect(rule({ orderType: OrderType.PARTICIPATION })).toBe(true);
      });

      it("expect executionStyle to be hidden when orderType is FLOAT", () => {
        const rule = FIELD_VISIBILITY_RULES.executionStyle!;
        expect(rule({ orderType: OrderType.FLOAT })).toBe(false);
      });

      it("expect executionStyle to be hidden when orderType is IOC", () => {
        const rule = FIELD_VISIBILITY_RULES.executionStyle!;
        expect(rule({ orderType: OrderType.IOC })).toBe(false);
      });
    });

    describe("discretionFactor rule", () => {
      it("expect discretionFactor to be visible when orderType is PARTICIPATION", () => {
        const rule = FIELD_VISIBILITY_RULES.discretionFactor!;
        expect(rule({ orderType: OrderType.PARTICIPATION })).toBe(true);
      });

      it("expect discretionFactor to be visible when orderType is PEG", () => {
        const rule = FIELD_VISIBILITY_RULES.discretionFactor!;
        expect(rule({ orderType: OrderType.PEG })).toBe(true);
      });

      it("expect discretionFactor to be hidden when orderType is FLOAT", () => {
        const rule = FIELD_VISIBILITY_RULES.discretionFactor!;
        expect(rule({ orderType: OrderType.FLOAT })).toBe(false);
      });

      it("expect discretionFactor to be hidden when orderType is STOP_LOSS", () => {
        const rule = FIELD_VISIBILITY_RULES.discretionFactor!;
        expect(rule({ orderType: OrderType.STOP_LOSS })).toBe(false);
      });
    });

    describe("triggerSide rule", () => {
      it("expect triggerSide to be visible when orderType is STOP_LOSS", () => {
        const rule = FIELD_VISIBILITY_RULES.triggerSide!;
        expect(rule({ orderType: OrderType.STOP_LOSS })).toBe(true);
      });

      it("expect triggerSide to be hidden when orderType is TAKE_PROFIT", () => {
        const rule = FIELD_VISIBILITY_RULES.triggerSide!;
        expect(rule({ orderType: OrderType.TAKE_PROFIT })).toBe(false);
      });

      it("expect triggerSide to be hidden when orderType is FLOAT", () => {
        const rule = FIELD_VISIBILITY_RULES.triggerSide!;
        expect(rule({ orderType: OrderType.FLOAT })).toBe(false);
      });
    });

    describe("startTime rule", () => {
      it("expect startTime to be visible when startMode is START_AT", () => {
        const rule = FIELD_VISIBILITY_RULES.startTime!;
        expect(rule({ startMode: StartMode.START_AT })).toBe(true);
      });

      it("expect startTime to be hidden when expiry strategy is GTC", () => {
        const rule = FIELD_VISIBILITY_RULES.startTime!;
        expect(rule({ expiry: { strategy: ExpiryStrategy.GTC } })).toBe(false);
      });

      it("expect startTime to be hidden when expiry is undefined", () => {
        const rule = FIELD_VISIBILITY_RULES.startTime!;
        expect(rule({})).toBe(false);
      });
    });

    describe("startDate rule", () => {
      it("expect startDate to be visible when startMode is START_AT", () => {
        const rule = FIELD_VISIBILITY_RULES.startDate!;
        expect(rule({ startMode: StartMode.START_AT })).toBe(true);
      });

      it("expect startDate to be hidden when startMode is START_NOW", () => {
        const rule = FIELD_VISIBILITY_RULES.startDate!;
        expect(rule({ startMode: StartMode.START_NOW })).toBe(false);
      });

      it("expect startDate to be hidden when startMode is undefined", () => {
        const rule = FIELD_VISIBILITY_RULES.startDate!;
        expect(rule({})).toBe(false);
      });
    });

    describe("timeZone rule", () => {
      it("expect timeZone to be visible when startMode is START_AT", () => {
        const rule = FIELD_VISIBILITY_RULES.timeZone!;
        expect(rule({ startMode: StartMode.START_AT })).toBe(true);
      });

      it("expect timeZone to be hidden when startMode is START_NOW", () => {
        const rule = FIELD_VISIBILITY_RULES.timeZone!;
        expect(rule({ startMode: StartMode.START_NOW })).toBe(false);
      });

      it("expect timeZone to be hidden when startMode is undefined", () => {
        const rule = FIELD_VISIBILITY_RULES.timeZone!;
        expect(rule({})).toBe(false);
      });
    });

    describe("expiryTime rule", () => {
      it("expect expiryTime to be visible when expiry strategy is GTD", () => {
        const rule = FIELD_VISIBILITY_RULES.expiryTime!;
        expect(rule({ expiry: { strategy: ExpiryStrategy.GTD } })).toBe(true);
      });

      it("expect expiryTime to be visible when expiry strategy is GTT", () => {
        const rule = FIELD_VISIBILITY_RULES.expiryTime!;
        expect(rule({ expiry: { strategy: ExpiryStrategy.GTT } })).toBe(true);
      });

      it("expect expiryTime to be hidden when expiry strategy is GTC", () => {
        const rule = FIELD_VISIBILITY_RULES.expiryTime!;
        expect(rule({ expiry: { strategy: ExpiryStrategy.GTC } })).toBe(false);
      });

      it("expect expiryTime to be hidden when expiry is undefined", () => {
        const rule = FIELD_VISIBILITY_RULES.expiryTime!;
        expect(rule({})).toBe(false);
      });
    });

    describe("expiryDate rule", () => {
      it("expect expiryDate to be visible when expiry strategy is GTD", () => {
        const rule = FIELD_VISIBILITY_RULES.expiryDate!;
        expect(rule({ expiry: { strategy: ExpiryStrategy.GTD } })).toBe(true);
      });

      it("expect expiryDate to be visible when expiry strategy is GTT", () => {
        const rule = FIELD_VISIBILITY_RULES.expiryDate!;
        expect(rule({ expiry: { strategy: ExpiryStrategy.GTT } })).toBe(true);
      });

      it("expect expiryDate to be hidden when expiry strategy is GTC", () => {
        const rule = FIELD_VISIBILITY_RULES.expiryDate!;
        expect(rule({ expiry: { strategy: ExpiryStrategy.GTC } })).toBe(false);
      });

      it("expect expiryDate to be hidden when expiry is undefined", () => {
        const rule = FIELD_VISIBILITY_RULES.expiryDate!;
        expect(rule({})).toBe(false);
      });
    });

    describe("expiryTimeZone rule", () => {
      it("expect expiryTimeZone to be visible when expiry strategy is GTD", () => {
        const rule = FIELD_VISIBILITY_RULES.expiryTimeZone!;
        expect(rule({ expiry: { strategy: ExpiryStrategy.GTD } })).toBe(true);
      });

      it("expect expiryTimeZone to be visible when expiry strategy is GTT", () => {
        const rule = FIELD_VISIBILITY_RULES.expiryTimeZone!;
        expect(rule({ expiry: { strategy: ExpiryStrategy.GTT } })).toBe(true);
      });

      it("expect expiryTimeZone to be hidden when expiry strategy is GTC", () => {
        const rule = FIELD_VISIBILITY_RULES.expiryTimeZone!;
        expect(rule({ expiry: { strategy: ExpiryStrategy.GTC } })).toBe(false);
      });

      it("expect expiryTimeZone to be hidden when expiry is undefined", () => {
        const rule = FIELD_VISIBILITY_RULES.expiryTimeZone!;
        expect(rule({})).toBe(false);
      });
    });

    describe("iceberg rule", () => {
      it("expect iceberg to be visible when orderType is TAKE_PROFIT", () => {
        const rule = FIELD_VISIBILITY_RULES.iceberg!;
        expect(rule({ orderType: OrderType.TAKE_PROFIT })).toBe(true);
      });

      it("expect iceberg to be hidden when orderType is FLOAT", () => {
        const rule = FIELD_VISIBILITY_RULES.iceberg!;
        expect(rule({ orderType: OrderType.FLOAT })).toBe(false);
      });

      it("expect iceberg to be hidden when orderType is STOP_LOSS", () => {
        const rule = FIELD_VISIBILITY_RULES.iceberg!;
        expect(rule({ orderType: OrderType.STOP_LOSS })).toBe(false);
      });
    });

    describe("fixingId rule", () => {
      it("expect fixingId to be visible when orderType is FIXING", () => {
        const rule = FIELD_VISIBILITY_RULES.fixingId!;
        expect(rule({ orderType: OrderType.FIXING })).toBe(true);
      });

      it("expect fixingId to be hidden when orderType is FLOAT", () => {
        const rule = FIELD_VISIBILITY_RULES.fixingId!;
        expect(rule({ orderType: OrderType.FLOAT })).toBe(false);
      });

      it("expect fixingId to be hidden when orderType is POUNCE", () => {
        const rule = FIELD_VISIBILITY_RULES.fixingId!;
        expect(rule({ orderType: OrderType.POUNCE })).toBe(false);
      });
    });

    describe("fixingDate rule", () => {
      it("expect fixingDate to be visible when orderType is FIXING", () => {
        const rule = FIELD_VISIBILITY_RULES.fixingDate!;
        expect(rule({ orderType: OrderType.FIXING })).toBe(true);
      });

      it("expect fixingDate to be hidden when orderType is FLOAT", () => {
        const rule = FIELD_VISIBILITY_RULES.fixingDate!;
        expect(rule({ orderType: OrderType.FLOAT })).toBe(false);
      });

      it("expect fixingDate to be hidden when orderType is TAKE_PROFIT", () => {
        const rule = FIELD_VISIBILITY_RULES.fixingDate!;
        expect(rule({ orderType: OrderType.TAKE_PROFIT })).toBe(false);
      });
    });

    describe("twapTargetEndTime rule", () => {
      it("expect twapTargetEndTime to be visible when orderType is TWAP", () => {
        const rule = FIELD_VISIBILITY_RULES.twapTargetEndTime!;
        expect(rule({ orderType: OrderType.TWAP })).toBe(true);
      });

      it("expect twapTargetEndTime to be hidden when orderType is FLOAT", () => {
        const rule = FIELD_VISIBILITY_RULES.twapTargetEndTime!;
        expect(rule({ orderType: OrderType.FLOAT })).toBe(false);
      });

      it("expect twapTargetEndTime to be hidden when orderType is PARTICIPATION", () => {
        const rule = FIELD_VISIBILITY_RULES.twapTargetEndTime!;
        expect(rule({ orderType: OrderType.PARTICIPATION })).toBe(false);
      });
    });

    describe("twapTimeZone rule", () => {
      it("expect twapTimeZone to be visible when orderType is TWAP", () => {
        const rule = FIELD_VISIBILITY_RULES.twapTimeZone!;
        expect(rule({ orderType: OrderType.TWAP })).toBe(true);
      });

      it("expect twapTimeZone to be hidden when orderType is FLOAT", () => {
        const rule = FIELD_VISIBILITY_RULES.twapTimeZone!;
        expect(rule({ orderType: OrderType.FLOAT })).toBe(false);
      });

      it("expect twapTimeZone to be hidden when orderType is LIQUIDITY_SEEKER", () => {
        const rule = FIELD_VISIBILITY_RULES.twapTimeZone!;
        expect(rule({ orderType: OrderType.LIQUIDITY_SEEKER })).toBe(false);
      });
    });

    describe("skew rule", () => {
      it("expect skew to be visible when orderType is ADAPT", () => {
        const rule = FIELD_VISIBILITY_RULES.skew!;
        expect(rule({ orderType: OrderType.ADAPT })).toBe(true);
      });

      it("expect skew to be visible when orderType is PARTICIPATION", () => {
        const rule = FIELD_VISIBILITY_RULES.skew!;
        expect(rule({ orderType: OrderType.PARTICIPATION })).toBe(true);
      });

      it("expect skew to be hidden when orderType is FLOAT", () => {
        const rule = FIELD_VISIBILITY_RULES.skew!;
        expect(rule({ orderType: OrderType.FLOAT })).toBe(false);
      });

      it("expect skew to be hidden when orderType is POUNCE", () => {
        const rule = FIELD_VISIBILITY_RULES.skew!;
        expect(rule({ orderType: OrderType.POUNCE })).toBe(false);
      });
    });

    describe("franchiseExposure rule", () => {
      it("expect franchiseExposure to be visible when orderType is ADAPT", () => {
        const rule = FIELD_VISIBILITY_RULES.franchiseExposure!;
        expect(rule({ orderType: OrderType.ADAPT })).toBe(true);
      });

      it("expect franchiseExposure to be visible when orderType is PARTICIPATION", () => {
        const rule = FIELD_VISIBILITY_RULES.franchiseExposure!;
        expect(rule({ orderType: OrderType.PARTICIPATION })).toBe(true);
      });

      it("expect franchiseExposure to be hidden when orderType is FLOAT", () => {
        const rule = FIELD_VISIBILITY_RULES.franchiseExposure!;
        expect(rule({ orderType: OrderType.FLOAT })).toBe(false);
      });

      it("expect franchiseExposure to be hidden when orderType is IOC", () => {
        const rule = FIELD_VISIBILITY_RULES.franchiseExposure!;
        expect(rule({ orderType: OrderType.IOC })).toBe(false);
      });
    });

    describe("delayBehaviour rule", () => {
      it("expect delayBehaviour to be visible when orderType is PARTICIPATION", () => {
        const rule = FIELD_VISIBILITY_RULES.delayBehaviour!;
        expect(rule({ orderType: OrderType.PARTICIPATION })).toBe(true);
      });

      it("expect delayBehaviour to be hidden when orderType is FLOAT", () => {
        const rule = FIELD_VISIBILITY_RULES.delayBehaviour!;
        expect(rule({ orderType: OrderType.FLOAT })).toBe(false);
      });

      it("expect delayBehaviour to be hidden when orderType is TWAP", () => {
        const rule = FIELD_VISIBILITY_RULES.delayBehaviour!;
        expect(rule({ orderType: OrderType.TWAP })).toBe(false);
      });
    });
  });

  describe("isFieldVisible", () => {
    it("expect field to be visible when no rule exists", () => {
      expect(isFieldVisible("currencyPair", {})).toBe(true);
      expect(isFieldVisible("side", {})).toBe(true);
      expect(isFieldVisible("amount", {})).toBe(true);
    });

    it("expect level to be visible when orderType is STOP_LOSS", () => {
      expect(isFieldVisible("level", { orderType: OrderType.STOP_LOSS })).toBe(true);
    });

    it("expect level to be hidden when orderType is LIQUIDITY_SEEKER", () => {
      expect(isFieldVisible("level", { orderType: OrderType.LIQUIDITY_SEEKER })).toBe(false);
    });

    it("expect level to be visible when orderType is TAKE_PROFIT", () => {
      expect(isFieldVisible("level", { orderType: OrderType.TAKE_PROFIT })).toBe(true);
    });

    it("expect level to be hidden when orderType is TWAP", () => {
      expect(isFieldVisible("level", { orderType: OrderType.TWAP })).toBe(false);
    });

    it("expect level to be visible when orderType is POUNCE", () => {
      expect(isFieldVisible("level", { orderType: OrderType.POUNCE })).toBe(true);
    });

    it("expect level to be visible when orderType is FLOAT", () => {
      expect(isFieldVisible("level", { orderType: OrderType.FLOAT })).toBe(true);
    });

    it("expect targetExecutionRate to be visible when orderType is LIQUIDITY_SEEKER", () => {
      expect(isFieldVisible("targetExecutionRate", { orderType: OrderType.LIQUIDITY_SEEKER })).toBe(
        true
      );
    });

    it("expect targetExecutionRate to be hidden when orderType is POUNCE", () => {
      expect(isFieldVisible("targetExecutionRate", { orderType: OrderType.POUNCE })).toBe(false);
    });

    it("expect participationRate to be visible when orderType is PARTICIPATION", () => {
      expect(isFieldVisible("participationRate", { orderType: OrderType.PARTICIPATION })).toBe(
        true
      );
    });

    it("expect participationRate to be hidden when orderType is FLOAT", () => {
      expect(isFieldVisible("participationRate", { orderType: OrderType.FLOAT })).toBe(false);
    });

    it("expect executionStyle to be visible when orderType is AGGRESSIVE", () => {
      expect(isFieldVisible("executionStyle", { orderType: OrderType.AGGRESSIVE })).toBe(true);
    });

    it("expect executionStyle to be hidden when orderType is POUNCE", () => {
      expect(isFieldVisible("executionStyle", { orderType: OrderType.POUNCE })).toBe(false);
    });

    it("expect discretionFactor to be visible when orderType is PEG", () => {
      expect(isFieldVisible("discretionFactor", { orderType: OrderType.PEG })).toBe(true);
    });

    it("expect discretionFactor to be hidden when orderType is FLOAT", () => {
      expect(isFieldVisible("discretionFactor", { orderType: OrderType.FLOAT })).toBe(false);
    });

    it("expect triggerSide to be visible when orderType is STOP_LOSS", () => {
      expect(isFieldVisible("triggerSide", { orderType: OrderType.STOP_LOSS })).toBe(true);
    });

    it("expect triggerSide to be hidden when orderType is PARTICIPATION", () => {
      expect(isFieldVisible("triggerSide", { orderType: OrderType.PARTICIPATION })).toBe(false);
    });

    it("expect iceberg to be visible when orderType is TAKE_PROFIT", () => {
      expect(isFieldVisible("iceberg", { orderType: OrderType.TAKE_PROFIT })).toBe(true);
    });

    it("expect iceberg to be hidden when orderType is POUNCE", () => {
      expect(isFieldVisible("iceberg", { orderType: OrderType.POUNCE })).toBe(false);
    });

    it("expect fixingId to be visible when orderType is FIXING", () => {
      expect(isFieldVisible("fixingId", { orderType: OrderType.FIXING })).toBe(true);
    });

    it("expect fixingId to be hidden when orderType is FLOAT", () => {
      expect(isFieldVisible("fixingId", { orderType: OrderType.FLOAT })).toBe(false);
    });

    it("expect fixingDate to be visible when orderType is FIXING", () => {
      expect(isFieldVisible("fixingDate", { orderType: OrderType.FIXING })).toBe(true);
    });

    it("expect fixingDate to be hidden when orderType is TWAP", () => {
      expect(isFieldVisible("fixingDate", { orderType: OrderType.TWAP })).toBe(false);
    });

    it("expect twapTargetEndTime to be visible when orderType is TWAP", () => {
      expect(isFieldVisible("twapTargetEndTime", { orderType: OrderType.TWAP })).toBe(true);
    });

    it("expect twapTargetEndTime to be hidden when orderType is ADAPT", () => {
      expect(isFieldVisible("twapTargetEndTime", { orderType: OrderType.ADAPT })).toBe(false);
    });

    it("expect twapTimeZone to be visible when orderType is TWAP", () => {
      expect(isFieldVisible("twapTimeZone", { orderType: OrderType.TWAP })).toBe(true);
    });

    it("expect twapTimeZone to be hidden when orderType is AGGRESSIVE", () => {
      expect(isFieldVisible("twapTimeZone", { orderType: OrderType.AGGRESSIVE })).toBe(false);
    });

    it("expect skew to be visible when orderType is ADAPT", () => {
      expect(isFieldVisible("skew", { orderType: OrderType.ADAPT })).toBe(true);
    });

    it("expect skew to be hidden when orderType is IOC", () => {
      expect(isFieldVisible("skew", { orderType: OrderType.IOC })).toBe(false);
    });

    it("expect franchiseExposure to be visible when orderType is PARTICIPATION", () => {
      expect(isFieldVisible("franchiseExposure", { orderType: OrderType.PARTICIPATION })).toBe(
        true
      );
    });

    it("expect franchiseExposure to be hidden when orderType is TWAP", () => {
      expect(isFieldVisible("franchiseExposure", { orderType: OrderType.TWAP })).toBe(false);
    });

    it("expect delayBehaviour to be visible when orderType is PARTICIPATION", () => {
      expect(isFieldVisible("delayBehaviour", { orderType: OrderType.PARTICIPATION })).toBe(true);
    });

    it("expect delayBehaviour to be hidden when orderType is CALL_LEVEL", () => {
      expect(isFieldVisible("delayBehaviour", { orderType: OrderType.CALL_LEVEL })).toBe(false);
    });

    it("expect liquidityPool to be visible when orderType is LIQUIDITY_SEEKER", () => {
      expect(isFieldVisible("liquidityPool", { orderType: OrderType.LIQUIDITY_SEEKER })).toBe(true);
    });

    it("expect liquidityPool to be visible when orderType is FLOAT", () => {
      expect(isFieldVisible("liquidityPool", { orderType: OrderType.FLOAT })).toBe(true);
    });

    it("expect expiry to be visible when orderType is POUNCE", () => {
      expect(isFieldVisible("expiry", { orderType: OrderType.POUNCE })).toBe(true);
    });

    it("expect expiry to be visible when orderType is TWAP", () => {
      // No visibility rule for expiry, so it's always visible
      expect(isFieldVisible("expiry", { orderType: OrderType.TWAP })).toBe(true);
    });
  });

  describe("filterVisibleFields", () => {
    it("expect all fields to be returned when no rules apply", () => {
      const fields: Array<"currencyPair" | "side" | "amount"> = ["currencyPair", "side", "amount"];
      const result = filterVisibleFields(fields, {});
      expect(result).toEqual(["currencyPair", "side", "amount"]);
    });

    it("expect level to be filtered out when orderType is LIQUIDITY_SEEKER", () => {
      const fields: Array<"currencyPair" | "amount" | "level"> = [
        "currencyPair",
        "amount",
        "level",
      ];
      const result = filterVisibleFields(fields, { orderType: OrderType.LIQUIDITY_SEEKER });
      expect(result).toEqual(["currencyPair", "amount"]);
    });

    it("expect level to be included when orderType is STOP_LOSS", () => {
      const fields: Array<"currencyPair" | "amount" | "level"> = [
        "currencyPair",
        "amount",
        "level",
      ];
      const result = filterVisibleFields(fields, { orderType: OrderType.STOP_LOSS });
      expect(result).toEqual(["currencyPair", "amount", "level"]);
    });

    it("expect level to be filtered out when orderType is TWAP", () => {
      const fields: Array<"currencyPair" | "amount" | "level"> = [
        "currencyPair",
        "amount",
        "level",
      ];
      const result = filterVisibleFields(fields, { orderType: OrderType.TWAP });
      expect(result).toEqual(["currencyPair", "amount"]);
    });

    it("expect level to be included when orderType is TAKE_PROFIT", () => {
      const fields: Array<"currencyPair" | "amount" | "level"> = [
        "currencyPair",
        "amount",
        "level",
      ];
      const result = filterVisibleFields(fields, { orderType: OrderType.TAKE_PROFIT });
      expect(result).toEqual(["currencyPair", "amount", "level"]);
    });

    it("expect multiple fields to be filtered based on combined rules", () => {
      const fields: Array<"currencyPair" | "level" | "liquidityPool"> = [
        "currencyPair",
        "level",
        "liquidityPool",
      ];
      const result = filterVisibleFields(fields, { orderType: OrderType.FLOAT });
      // FLOAT: level visible, liquidityPool visible
      expect(result).toEqual(["currencyPair", "level", "liquidityPool"]);
    });

    it("expect empty array when all fields are hidden", () => {
      const fields: Array<"level"> = ["level"];
      const result = filterVisibleFields(fields, { orderType: OrderType.LIQUIDITY_SEEKER });
      expect(result).toEqual([]);
    });

    it("expect empty array when input is empty", () => {
      const result = filterVisibleFields([], { orderType: OrderType.TAKE_PROFIT });
      expect(result).toEqual([]);
    });
  });
});
