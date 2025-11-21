import { useEffect, useState } from "react";

import { PRICE_CONFIG } from "../../config/constants";
import { useOrderEntryStore } from "../../store";

import styles from "./TickingPrice.module.scss";

interface TickingPriceProps {
  symbol: string;
}

export interface PriceData {
  buy: number;
  sell: number;
}

export const TickingPrice = ({ symbol }: TickingPriceProps) => {
  const [buyPrice, setBuyPrice] = useState<number>(PRICE_CONFIG.INITIAL_BUY_PRICE);
  const [sellPrice, setSellPrice] = useState<number>(PRICE_CONFIG.INITIAL_SELL_PRICE);
  const [buyIsUp, setBuyIsUp] = useState(true);
  const [sellIsUp, setSellIsUp] = useState(true);
  const setCurrentPrices = useOrderEntryStore((s) => s.setCurrentPrices);

  useEffect(() => {
    // Simulate price ticking for both buy and sell
    const interval = setInterval(() => {
      setBuyPrice((prev) => {
        const change = (Math.random() - 0.5) * PRICE_CONFIG.MAX_PRICE_CHANGE;
        const newPrice = prev + change;
        setBuyIsUp(change > 0);
        return Math.max(PRICE_CONFIG.MIN_PRICE, Math.min(PRICE_CONFIG.MAX_PRICE, newPrice));
      });

      setSellPrice((prev) => {
        const change = (Math.random() - 0.5) * PRICE_CONFIG.MAX_PRICE_CHANGE;
        const newPrice = prev + change;
        setSellIsUp(change > 0);
        return Math.max(PRICE_CONFIG.MIN_PRICE, Math.min(PRICE_CONFIG.MAX_PRICE, newPrice));
      });
    }, PRICE_CONFIG.TICK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [symbol]);

  // Update store with current prices
  useEffect(() => {
    setCurrentPrices(buyPrice, sellPrice);
  }, [buyPrice, sellPrice, setCurrentPrices]);

  const formattedBuyPrice = buyPrice.toFixed(PRICE_CONFIG.PRICE_DECIMALS);
  const formattedSellPrice = sellPrice.toFixed(PRICE_CONFIG.PRICE_DECIMALS);

  return (
    <div className={styles.container}>
      <div className={styles.priceBox}>
        <div className={styles.label}>BUY</div>
        <div className={`${styles.price} ${buyIsUp ? styles.up : styles.down}`}>
          {formattedBuyPrice}
        </div>
      </div>
      <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</div>
      <div className={styles.priceBox}>
        <div className={styles.label}>SELL</div>
        <div className={`${styles.price} ${sellIsUp ? styles.up : styles.down}`}>
          {formattedSellPrice}
        </div>
      </div>
    </div>
  );
};
