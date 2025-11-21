import { useEffect, useState } from "react";

import { PRICE_CONFIG } from "../../config/constants";
import { useOrderEntryStore } from "../../store";

import styles from "./TickingPrice.module.scss";

/**
 * Props for the TickingPrice component.
 */
interface TickingPriceProps {
  /** Currency pair symbol (e.g., "GBPUSD") */
  symbol: string;
}

/**
 * Price data structure.
 */
export interface PriceData {
  buy: number;
  sell: number;
}

/**
 * TickingPrice - Live market price display for FX pairs.
 *
 * Shows both BUY and SELL prices that update in real-time.
 * Currently uses simulated price movement for demo purposes.
 * In production, this would subscribe to live price feeds via WebSocket.
 *
 * Features:
 * - Displays both bid (SELL) and ask (BUY) prices
 * - Visual indicators for price movement (green up, red down)
 * - Updates store with current prices for use by LimitPriceWithCheckbox
 * - Re-initializes when symbol changes
 *
 * @example
 * ```tsx
 * <TickingPrice symbol="GBPUSD" />
 * ```
 */
export const TickingPrice = ({ symbol }: TickingPriceProps) => {
  // Local state for buy price with initial value from config
  const [buyPrice, setBuyPrice] = useState<number>(PRICE_CONFIG.INITIAL_BUY_PRICE);
  // Local state for sell price
  const [sellPrice, setSellPrice] = useState<number>(PRICE_CONFIG.INITIAL_SELL_PRICE);
  // Track price direction for visual indicator
  const [buyIsUp, setBuyIsUp] = useState(true);
  const [sellIsUp, setSellIsUp] = useState(true);

  // Action to update prices in store (used by LimitPriceWithCheckbox)
  const setCurrentPrices = useOrderEntryStore((s) => s.setCurrentPrices);

  /**
   * Simulate price ticking via setInterval.
   * In production, this would be replaced with WebSocket subscription.
   * Re-runs when symbol changes to simulate new price feed subscription.
   */
  useEffect(() => {
    const interval = setInterval(() => {
      // Update buy price with random movement
      setBuyPrice((prev) => {
        // Random change between -0.0001 and +0.0001
        const change = (Math.random() - 0.5) * PRICE_CONFIG.MAX_PRICE_CHANGE;
        const newPrice = prev + change;
        setBuyIsUp(change > 0); // Track direction for styling
        // Clamp price to realistic range
        return Math.max(PRICE_CONFIG.MIN_PRICE, Math.min(PRICE_CONFIG.MAX_PRICE, newPrice));
      });

      // Update sell price independently
      setSellPrice((prev) => {
        const change = (Math.random() - 0.5) * PRICE_CONFIG.MAX_PRICE_CHANGE;
        const newPrice = prev + change;
        setSellIsUp(change > 0);
        return Math.max(PRICE_CONFIG.MIN_PRICE, Math.min(PRICE_CONFIG.MAX_PRICE, newPrice));
      });
    }, PRICE_CONFIG.TICK_INTERVAL_MS); // Update every 1000ms

    // Cleanup interval on unmount or symbol change
    return () => clearInterval(interval);
  }, [symbol]); // Re-subscribe when symbol changes

  /**
   * Update store whenever prices change.
   * This makes current prices available to LimitPriceWithCheckbox's "Grab" feature.
   */
  useEffect(() => {
    setCurrentPrices(buyPrice, sellPrice);
  }, [buyPrice, sellPrice, setCurrentPrices]);

  // Format prices to 5 decimal places (standard for FX)
  const formattedBuyPrice = buyPrice.toFixed(PRICE_CONFIG.PRICE_DECIMALS);
  const formattedSellPrice = sellPrice.toFixed(PRICE_CONFIG.PRICE_DECIMALS);

  return (
    <div className={styles.container}>
      {/* BUY price box */}
      <div className={styles.priceBox}>
        <div className={styles.label}>BUY</div>
        {/* Apply green/red styling based on price direction */}
        <div className={`${styles.price} ${buyIsUp ? styles.up : styles.down}`}>
          {formattedBuyPrice}
        </div>
      </div>
      {/* Spacer between prices */}
      <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</div>
      {/* SELL price box */}
      <div className={styles.priceBox}>
        <div className={styles.label}>SELL</div>
        <div className={`${styles.price} ${sellIsUp ? styles.up : styles.down}`}>
          {formattedSellPrice}
        </div>
      </div>
    </div>
  );
};
