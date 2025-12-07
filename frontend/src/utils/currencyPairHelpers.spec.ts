import { describe, expect, it } from "vitest";

import { CurrencyPair } from "../types/domain";

import { isNdf, isOnshore } from "./currencyPairHelpers";

describe("currencyPairHelpers", () => {
  describe("isNdf", () => {
    it("should return true when both currencies are non-deliverable", () => {
      const pair: CurrencyPair = {
        id: "USDCNY",
        symbol: "USDCNY",
        ccy1: "USD",
        ccy2: "CNY",
        ccy1Deliverable: false,
        ccy2Deliverable: false,
        ccy1Onshore: false,
        ccy2Onshore: false,
        spotPrecision: 5,
        bigDigits: 2,
        bigDigitsOffset: 0,
        additionalPrecision: 0,
        minPipStep: 0.0001,
        defaultPipStep: 0.0001,
        defaultTenor: "SPOT",
        tenor: "SPOT",
        stopLossAllowed: false,
      };

      expect(isNdf(pair)).toBe(true);
    });

    it("should return false when both currencies are deliverable", () => {
      const pair: CurrencyPair = {
        id: "GBPUSD",
        symbol: "GBPUSD",
        ccy1: "GBP",
        ccy2: "USD",
        ccy1Deliverable: true,
        ccy2Deliverable: true,
        ccy1Onshore: false,
        ccy2Onshore: false,
        spotPrecision: 5,
        bigDigits: 2,
        bigDigitsOffset: 0,
        additionalPrecision: 0,
        minPipStep: 0.0001,
        defaultPipStep: 0.0001,
        defaultTenor: "SPOT",
        tenor: "SPOT",
        stopLossAllowed: true,
      };

      expect(isNdf(pair)).toBe(false);
    });

    it("should return false when only one currency is deliverable", () => {
      const pair: CurrencyPair = {
        id: "USDKRW",
        symbol: "USDKRW",
        ccy1: "USD",
        ccy2: "KRW",
        ccy1Deliverable: true,
        ccy2Deliverable: false,
        ccy1Onshore: false,
        ccy2Onshore: false,
        spotPrecision: 5,
        bigDigits: 2,
        bigDigitsOffset: 0,
        additionalPrecision: 0,
        minPipStep: 0.0001,
        defaultPipStep: 0.0001,
        defaultTenor: "SPOT",
        tenor: "SPOT",
        stopLossAllowed: false,
      };

      expect(isNdf(pair)).toBe(true);
    });

    it("should return false when pair is undefined", () => {
      expect(isNdf(undefined)).toBe(false);
    });
  });

  describe("isOnshore", () => {
    it("should return true when either currency is onshore", () => {
      const pair1: CurrencyPair = {
        id: "USDCNH",
        symbol: "USDCNH",
        ccy1: "USD",
        ccy2: "CNH",
        ccy1Deliverable: true,
        ccy2Deliverable: true,
        ccy1Onshore: false,
        ccy2Onshore: true,
        spotPrecision: 5,
        bigDigits: 2,
        bigDigitsOffset: 0,
        additionalPrecision: 0,
        minPipStep: 0.0001,
        defaultPipStep: 0.0001,
        defaultTenor: "SPOT",
        tenor: "SPOT",
        stopLossAllowed: false,
      };

      expect(isOnshore(pair1)).toBe(true);

      const pair2: CurrencyPair = {
        ...pair1,
        ccy1Onshore: true,
        ccy2Onshore: false,
      };

      expect(isOnshore(pair2)).toBe(true);
    });

    it("should return true when both currencies are onshore", () => {
      const pair: CurrencyPair = {
        id: "CNHCNY",
        symbol: "CNHCNY",
        ccy1: "CNH",
        ccy2: "CNY",
        ccy1Deliverable: true,
        ccy2Deliverable: false,
        ccy1Onshore: true,
        ccy2Onshore: true,
        spotPrecision: 5,
        bigDigits: 2,
        bigDigitsOffset: 0,
        additionalPrecision: 0,
        minPipStep: 0.0001,
        defaultPipStep: 0.0001,
        defaultTenor: "SPOT",
        tenor: "SPOT",
        stopLossAllowed: false,
      };

      expect(isOnshore(pair)).toBe(true);
    });

    it("should return false when both currencies are offshore", () => {
      const pair: CurrencyPair = {
        id: "GBPUSD",
        symbol: "GBPUSD",
        ccy1: "GBP",
        ccy2: "USD",
        ccy1Deliverable: true,
        ccy2Deliverable: true,
        ccy1Onshore: false,
        ccy2Onshore: false,
        spotPrecision: 5,
        bigDigits: 2,
        bigDigitsOffset: 0,
        additionalPrecision: 0,
        minPipStep: 0.0001,
        defaultPipStep: 0.0001,
        defaultTenor: "SPOT",
        tenor: "SPOT",
        stopLossAllowed: true,
      };

      expect(isOnshore(pair)).toBe(false);
    });

    it("should return false when pair is undefined", () => {
      expect(isOnshore(undefined)).toBe(false);
    });
  });
});
