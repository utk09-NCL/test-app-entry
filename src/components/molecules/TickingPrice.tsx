import { useEffect, useState } from "react";

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
  const [buyPrice, setBuyPrice] = useState(1.27345);
  const [sellPrice, setSellPrice] = useState(1.27115);
  const [buyIsUp, setBuyIsUp] = useState(true);
  const [sellIsUp, setSellIsUp] = useState(true);
  const setCurrentPrices = useOrderEntryStore((s) => s.setCurrentPrices);

  useEffect(() => {
    // Simulate price ticking for both buy and sell
    const interval = setInterval(() => {
      setBuyPrice((prev) => {
        const change = (Math.random() - 0.5) * 0.0002;
        const newPrice = prev + change;
        setBuyIsUp(change > 0);
        return Math.max(0.5, Math.min(2.0, newPrice));
      });

      setSellPrice((prev) => {
        const change = (Math.random() - 0.5) * 0.0002;
        const newPrice = prev + change;
        setSellIsUp(change > 0);
        return Math.max(0.5, Math.min(2.0, newPrice));
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [symbol]);

  // Update store with current prices
  useEffect(() => {
    setCurrentPrices(buyPrice, sellPrice);
  }, [buyPrice, sellPrice, setCurrentPrices]);

  const formattedBuyPrice = buyPrice.toFixed(5);
  const formattedSellPrice = sellPrice.toFixed(5);

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
