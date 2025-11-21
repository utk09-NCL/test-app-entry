import { useShallow } from "zustand/react/shallow";

import { useOrderEntryStore } from "../../store";
import { formatPrice } from "../../utils/numberFormats";
import { Select } from "../atoms/Select";

import styles from "./OrderHeader.module.scss";

export const OrderHeader = () => {
  const pairs = useOrderEntryStore((s) => s.currencyPairs);
  const { symbol, direction } = useOrderEntryStore(useShallow((s) => s.getDerivedValues()));
  const setFieldValue = useOrderEntryStore((s) => s.setFieldValue);

  // Mock Price
  const price = direction === "BUY" ? 1.085 : 1.0845;

  return (
    <div className={styles.header}>
      <div className={styles.pairSelector}>
        <label className={styles.label} htmlFor="currency-pair-select">
          Currency Pair
        </label>
        <Select
          id="currency-pair-select"
          name="currencyPair"
          value={symbol}
          onChange={(e) => setFieldValue("symbol", e.target.value)}
          className={styles.selectOverride}
        >
          {pairs.map((p) => (
            <option key={p.symbol} value={p.symbol}>
              {p.symbol}
            </option>
          ))}
        </Select>
      </div>
      <div className={styles.priceDisplay}>
        <span className={`${styles.price} ${direction === "BUY" ? styles.buy : styles.sell}`}>
          {formatPrice(price)}
        </span>
        <div className={styles.rateLabel}>Live Rate</div>
      </div>
    </div>
  );
};
