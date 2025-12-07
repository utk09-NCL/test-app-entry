/**
 * useFieldOptions Hook
 *
 * Provides dropdown options for Select fields. This hook extracts the
 * option-loading logic that was hardcoded in FieldController.
 *
 * Handles:
 * - account: Options from accounts reference data
 * - liquidityPool: Options from pools reference data
 * - Unavailable values: Adds "(Unavailable)" suffix if current value not in options
 *
 * @param fieldKey - The field name from OrderStateData
 * @returns Options array and loading state
 */

import { useMemo } from "react";

import { useOrderEntryStore } from "../../store";
import {
  ExpiryStrategy,
  OrderSide,
  OrderStateData,
  StartMode,
  StopLossTriggerSide,
} from "../../types/domain";

export interface SelectOption {
  label: string;
  value: string;
}

export interface UseFieldOptionsReturn {
  /** Dropdown options */
  options: SelectOption[];
  /** Whether options are still loading */
  isLoading: boolean;
}

export const useFieldOptions = (fieldKey: keyof OrderStateData): UseFieldOptionsReturn => {
  // Get reference data
  const accounts = useOrderEntryStore((s) => s.accounts);
  const pools = useOrderEntryStore((s) => s.pools);
  const isLoadingRefData = useOrderEntryStore((s) => s.isLoadingRefData);

  // Get current values using stable selectors (not getDerivedValues() which creates new objects)
  // This prevents infinite loops from Zustand's useSyncExternalStore
  const currentAccount = useOrderEntryStore((s) => s.getDerivedValues().account);
  const currentLiquidityPool = useOrderEntryStore((s) => s.getDerivedValues().liquidityPool);
  const currentSide = useOrderEntryStore((s) => s.getDerivedValues().side);

  // Compute options based on field key
  const options = useMemo((): SelectOption[] => {
    switch (fieldKey) {
      case "account": {
        const opts = accounts.map((a) => ({
          label: a.name,
          value: a.sdsId.toString(),
        }));

        // If current value doesn't exist in options (unavailable account)
        // Add it to dropdown so it can be displayed
        if (currentAccount && !opts.some((opt) => opt.value === currentAccount.sdsId.toString())) {
          opts.unshift({
            label: `${currentAccount.name} (Unavailable)`,
            value: currentAccount.sdsId.toString(),
          });
        }

        return opts;
      }

      case "liquidityPool": {
        const opts = pools.map((p) => ({
          label: p.name,
          value: p.value,
        }));

        // If current value doesn't exist in options (unavailable pool)
        // Add it to dropdown so it can be displayed
        if (currentLiquidityPool && !opts.some((opt) => opt.value === currentLiquidityPool)) {
          opts.unshift({
            label: `${currentLiquidityPool} (Unavailable)`,
            value: currentLiquidityPool,
          });
        }

        return opts;
      }

      case "startMode":
        return [
          { label: "Start Now", value: StartMode.START_NOW },
          { label: "Start At", value: StartMode.START_AT },
        ];

      case "timeZone":
      case "expiryTimeZone":
        return [
          { label: "LDN", value: "Europe/London" },
          { label: "CET", value: "Europe/Paris" },
          { label: "EST", value: "America/New_York" },
          { label: "UTC", value: "UTC" },
          { label: "GMT", value: "GMT" },
          { label: "JST", value: "Asia/Tokyo" },
          { label: "SGT", value: "Asia/Singapore" },
          { label: "CST", value: "America/Chicago" },
          { label: "PST", value: "America/Los_Angeles" },
          { label: "HKT", value: "Asia/Hong_Kong" },
        ];

      case "expiry":
        return [
          { label: "GTC (Good Till Cancel)", value: ExpiryStrategy.GTC },
          { label: "GTD (Good Till Date)", value: ExpiryStrategy.GTD },
          { label: "GTT (Good Till Time)", value: ExpiryStrategy.GTT },
        ];

      case "triggerSide":
        // Dynamic options based on side
        if (currentSide === OrderSide.BUY) {
          return [
            { label: "Trailing Bid", value: StopLossTriggerSide.TRAILING },
            { label: "Mid", value: StopLossTriggerSide.MID },
            { label: "Leading Offer", value: StopLossTriggerSide.LEADING },
          ];
        } else if (currentSide === OrderSide.SELL) {
          return [
            { label: "Trailing Offer", value: StopLossTriggerSide.TRAILING },
            { label: "Mid", value: StopLossTriggerSide.MID },
            { label: "Leading Bid", value: StopLossTriggerSide.LEADING },
          ];
        }
        return [];

      default:
        return [];
    }
  }, [fieldKey, accounts, pools, currentAccount, currentLiquidityPool, currentSide]);

  // Determine if this field is loading options
  const isLoading = useMemo(() => {
    const refDataFields = ["account", "liquidityPool"];
    return refDataFields.includes(fieldKey) && isLoadingRefData;
  }, [fieldKey, isLoadingRefData]);

  return { options, isLoading };
};
