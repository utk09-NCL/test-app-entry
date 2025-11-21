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

  // Action to update any form field value
  const setFieldValue = useOrderEntryStore((s) => s.setFieldValue);

  return (
    <>
      <div className={styles.header}>
        {/* Currency Pair Selector */}
        <div className={styles.pairSelector}>
          <label className={styles.label} htmlFor="currency-pair-select">
            Currency Pair:
          </label>
          <Select
            id="currency-pair-select"
            name="currencyPair"
            value={symbol}
            onChange={(e) =>
              // Update symbol in store
              // This will trigger TickingPrice to subscribe to new symbol's prices
              setFieldValue("symbol", e.target.value)
            }
            className={styles.selectOverride}
          >
            {/* Render all available currency pairs */}
            {pairs.map((p) => (
              <option key={p.symbol} value={p.symbol}>
                {p.symbol}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Live Price Feed */}
      {/* Shows real-time BUY and SELL prices for the selected symbol */}
      {/* TODO (Phase 5): This will subscribe to WebSocket price updates */}
      <TickingPrice symbol={symbol} />
    </>
  );
};
