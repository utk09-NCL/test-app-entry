import { useEffect } from "react";

import { Fdc3Service } from "../api/fdc3/fdc3Service";
import { mapContextToOrder } from "../api/fdc3/intentMapper";
import { useOrderEntryStore } from "../store";

export const useAppInit = () => {
  const setStatus = useOrderEntryStore((s) => s.setStatus);
  const setRefData = useOrderEntryStore((s) => s.setRefData);
  const setBaseValues = useOrderEntryStore((s) => s.setBaseValues);
  const resetInteractions = useOrderEntryStore((s) => s.resetFormInteractions);

  useEffect(() => {
    const init = async () => {
      setStatus("INITIALIZING");

      // 1. Mock Fetch Ref Data (Simulating WebSocket/GraphQL response)
      setTimeout(() => {
        setRefData({
          accounts: [
            { id: "ACC-001", name: "Hedge Fund A", currency: "USD" },
            { id: "ACC-002", name: "Prop Desk Alpha", currency: "EUR" },
            { id: "ACC-003", name: "Client Omnibus", currency: "GBP" },
          ],
          pools: [
            { id: "GATOR_POOL_1", name: "Gator Liquid", provider: "Int" },
            { id: "EXT_POOL_A", name: "External Agg 1", provider: "Ext" },
          ],
          currencyPairs: [
            { symbol: "EUR/USD", base: "EUR", quote: "USD", precision: 5 },
            { symbol: "GBP/USD", base: "GBP", quote: "USD", precision: 5 },
            { symbol: "USD/JPY", base: "USD", quote: "JPY", precision: 3 },
          ],
        });
        setStatus("READY");
      }, 1500);

      // 2. Init FDC3
      Fdc3Service.getInstance().initialize((ctx) => {
        const mapped = mapContextToOrder(ctx);
        setBaseValues(mapped);
        resetInteractions(); // Important: FDC3 intent overrides current user mess
      });
    };

    init();
  }, [setStatus, setRefData, setBaseValues, resetInteractions]);
};
