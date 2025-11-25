/**
 * Currency Pair Helper Functions
 *
 * Utility functions for determining currency pair characteristics.
 * Used primarily for GraphQL subscription parameters.
 */

import { CurrencyPair } from "../types/domain";

/**
 * Check if a currency pair is NDF (Non-Deliverable Forward).
 * A pair is NDF if at least one currency is not deliverable.
 *
 * @param currencyPair - The currency pair to check
 * @returns true if NDF, false if deliverable
 */
export const isNdf = (currencyPair: CurrencyPair | undefined): boolean => {
  if (!currencyPair) return false;
  return !currencyPair.ccy1Deliverable || !currencyPair.ccy2Deliverable;
};

/**
 * Check if a currency pair is onshore.
 * A pair is onshore if at least one currency is onshore.
 *
 * @param currencyPair - The currency pair to check
 * @returns true if onshore, false otherwise
 */
export const isOnshore = (currencyPair: CurrencyPair | undefined): boolean => {
  if (!currencyPair) return false;
  return currencyPair.ccy1Onshore || currencyPair.ccy2Onshore;
};
