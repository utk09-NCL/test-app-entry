/**
 * OrderHeader Component
 *
 * Displays the currency pair selector and live ticking price feed.
 * This is the top section of the trading interface.
 *
 * Components:
 * 1. Currency Pair Dropdown: Allows user to select which FX pair to trade
 * 2. TickingPrice: Shows live BUY and SELL prices for the selected symbol
 *
 * Data Flow:
 * - Reads symbol from store (merged baseValues + dirtyValues)
 * - When user changes symbol, updates store via setFieldValue
 * - TickingPrice component receives symbol as prop and updates prices
 * - Price updates trigger new subscription to server (Phase 5 implementation)
 *
 * Note: The symbol can also be set by FDC3 intents from external applications
 */

import clsx from "clsx";

import { useOrderEntryStore } from "../../store";
import { Select } from "../atoms/Select";
import { TickingPrice } from "../molecules/TickingPrice";

import styles from "./OrderHeader.module.scss";

export const OrderHeader = () => {
  // Get available currency pairs from reference data
  // Loaded during app initialization (useAppInit hook)
  const pairs = useOrderEntryStore((s) => s.currencyPairs);

  // Get currently selected symbol (e.g., "GBPUSD")
  // This comes from the merged state (baseValues + dirtyValues)
  const symbol = useOrderEntryStore((s) => s.getDerivedValues().symbol);

  // Get edit mode and reference data errors
  const editMode = useOrderEntryStore((s) => s.editMode);
  const refDataError = useOrderEntryStore((s) => s.refDataErrors.symbol);

  // Action to update any form field value
  const setFieldValue = useOrderEntryStore((s) => s.setFieldValue);
  const validateRefData = useOrderEntryStore((s) => s.validateRefData);

  // Determine if symbol selector should be disabled (read-only in viewing/amending modes)
  const isReadOnly = editMode === "viewing" || editMode === "amending";

  // Handle symbol change
  const handleSymbolChange = (newSymbol: string) => {
    setFieldValue("symbol", newSymbol);
    // Re-validate reference data after change
    // Zustand updates are synchronous, so no setTimeout needed
    validateRefData();
  };

  // Build currency pair options
  // If current symbol is unavailable, add it to the list
  const symbolOptions = [...pairs];
  const currentSymbolExists = pairs.some((p) => p.symbol === symbol);

  if (symbol && !currentSymbolExists) {
    // Add unavailable symbol to dropdown
    symbolOptions.unshift({
      symbol,
      id: symbol,
      ccy1: symbol.slice(0, 3),
      ccy2: symbol.slice(3, 6),
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
    });
  }

  return (
    <>
      <div className={styles.header} data-testid="order-header">
        {/* Currency Pair Selector */}
        <div className={styles.pairSelector}>
          <label className={clsx(styles.label, "sr-only")} htmlFor="currency-pair-select">
            Currency Pair:
          </label>
          <Select
            id="currency-pair-select"
            name="currencyPair"
            value={symbol}
            onChange={(e) => handleSymbolChange(e.target.value)}
            className={styles.selectOverride}
            hasError={!!refDataError}
            disabled={isReadOnly}
          >
            {/* Render all available currency pairs */}
            {symbolOptions.map((p) => (
              <option key={p.symbol} value={p.symbol}>
                {p.symbol}
                {!currentSymbolExists && p.symbol === symbol ? " (Unavailable)" : ""}
              </option>
            ))}
          </Select>
          {refDataError && <div className={styles.error}>{refDataError}</div>}
        </div>
      </div>

      {/* Live Price Feed */}
      {/* Shows real-time BUY and SELL prices for the selected symbol */}
      {/* // TODO (Phase 5): This will subscribe to WebSocket price updates */}
      <TickingPrice symbol={symbol} />
    </>
  );
};
