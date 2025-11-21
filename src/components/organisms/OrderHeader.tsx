import { useOrderEntryStore } from "../../store";
import { Select } from "../atoms/Select";
import { TickingPrice } from "../molecules/TickingPrice";

import styles from "./OrderHeader.module.scss";

export const OrderHeader = () => {
  const pairs = useOrderEntryStore((s) => s.currencyPairs);
  const symbol = useOrderEntryStore((s) => s.getDerivedValues().symbol);
  const setFieldValue = useOrderEntryStore((s) => s.setFieldValue);

  return (
    <>
      <div className={styles.header}>
        <div className={styles.pairSelector}>
          <label className={styles.label} htmlFor="currency-pair-select">
            Currency Pair:
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
      </div>
      <TickingPrice symbol={symbol} />
    </>
  );
};
