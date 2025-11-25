import { useState } from "react";

import { useSubscription } from "@apollo/client";

import { PRICE_CONFIG } from "../../config/constants";
import { GATOR_DATA_SUBSCRIPTION } from "../../graphql/subscriptions";
import { useOrderEntryStore } from "../../store";
import { isNdf, isOnshore } from "../../utils/currencyPairHelpers";

import { VerticalSpacer } from "./VerticalSpacer";

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
 * Subscribes to GATOR_DATA_SUBSCRIPTION for live price feeds via WebSocket.
 *
 * Features:
 * - Displays both bid (SELL) and ask (BUY) prices
 * - Updates store with current prices for use by LimitPriceWithCheckbox
 * - Re-initializes when symbol changes
 * - Skips subscription when symbol or currency pair is invalid
 *
 * @example
 * ```tsx
 * <TickingPrice symbol="GBPUSD" />
 * ```
 */
export const TickingPrice = ({ symbol }: TickingPriceProps) => {
  // Local state for buy/sell prices
  const [buyPrice, setBuyPrice] = useState<number>(PRICE_CONFIG.INITIAL_BUY_PRICE);
  const [sellPrice, setSellPrice] = useState<number>(PRICE_CONFIG.INITIAL_SELL_PRICE);

  // Get current currency pair from store to determine NDF/Onshore status
  const currencyPairs = useOrderEntryStore((s) => s.currencyPairs);
  const currentPair = currencyPairs.find((cp) => cp.symbol === symbol);

  // Action to update prices in store (used by LimitPriceWithCheckbox)
  const setCurrentPrices = useOrderEntryStore((s) => s.setCurrentPrices);

  /**
   * Subscribe to real-time price feed from GATOR.
   * Re-subscribes when symbol changes.
   * Skips subscription if symbol is empty or currency pair is not found.
   */
  useSubscription(GATOR_DATA_SUBSCRIPTION, {
    variables: {
      input: {
        currencyPair: symbol,
        ndf: isNdf(currentPair),
        onshore: isOnshore(currentPair),
        pipExtent: currentPair?.spotPrecision || 5,
        pipSteps: 1,
        markets: ["GATOR"],
      },
    },
    skip: !symbol || !currentPair, // Skip subscription for invalid symbols
    fetchPolicy: "no-cache",
    onData: ({ data }) => {
      const payload = data.data;
      if (payload?.gatorData) {
        const newBuyPrice = payload.gatorData.topOfTheBookBuy.precisionValue;
        const newSellPrice = payload.gatorData.topOfTheBookSell.precisionValue;
        setBuyPrice(newBuyPrice);
        setSellPrice(newSellPrice);
        setCurrentPrices(newBuyPrice, newSellPrice);
      }
    },
    onError: (err) => {
      console.error(`[TickingPrice] Price subscription error for ${symbol}:`, err);
    },
  });

  // Format prices to 5 decimal places (standard for FX)
  const formattedBuyPrice = buyPrice.toFixed(PRICE_CONFIG.PRICE_DECIMALS);
  const formattedSellPrice = sellPrice.toFixed(PRICE_CONFIG.PRICE_DECIMALS);

  return (
    <div className={styles.container} data-testid="ticking-price">
      {/* BUY price box */}
      <div className={styles.priceBox} data-testid="top-of-book-buy-price">
        <div className={styles.label}>BUY</div>
        <div className={styles.price}>{formattedBuyPrice}</div>
      </div>
      {/* Vertical separator between prices */}
      <VerticalSpacer />
      {/* SELL price box */}
      <div className={styles.priceBox} data-testid="top-of-book-sell-price">
        <div className={styles.label}>SELL</div>
        <div className={styles.price}>{formattedSellPrice}</div>
      </div>
    </div>
  );
};
