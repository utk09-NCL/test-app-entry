import { Account, CurrencyPair, LiquidityPool, OrderStateData } from "./domain";

// --- Slice Interfaces ---

export interface AppSlice {
  instanceId: string;
  status: "INITIALIZING" | "READY" | "SUBMITTING" | "READ_ONLY" | "ERROR";
  setStatus: (status: AppSlice["status"]) => void;
  toastMessage: { type: "success" | "error" | "info"; text: string } | null;
  setToast: (msg: { type: "success" | "error" | "info"; text: string } | null) => void;
}

export interface RefDataSlice {
  accounts: Account[];
  pools: LiquidityPool[];
  currencyPairs: CurrencyPair[];
  isLoadingRefData: boolean;
  setRefData: (data: {
    accounts: Account[];
    pools: LiquidityPool[];
    currencyPairs: CurrencyPair[];
  }) => void;
}

export interface InitialOrderSlice {
  baseValues: Partial<OrderStateData>;
  setBaseValues: (values: Partial<OrderStateData>) => void;
}

export interface UserInteractionSlice {
  dirtyValues: Partial<OrderStateData>;
  touchedFields: Record<string, boolean>;
  setFieldValue: <K extends keyof OrderStateData>(
    field: K,
    value: OrderStateData[K] | undefined
  ) => void;
  resetFormInteractions: () => void;
  setAllTouched: () => void;
}

export interface ComputedSlice {
  // Getters
  getDerivedValues: () => OrderStateData;

  // Validation & Async State
  errors: Record<string, string>; // Hard errors
  warnings: Record<string, string>; // Soft warnings
  serverErrors: Record<string, string>;
  isValidating: Record<string, boolean>;
  validationRequestIds: Record<string, number>;

  // Flags
  isFormValid: () => boolean;
  isDirty: () => boolean;

  // Actions
  validateField: <K extends keyof OrderStateData>(
    field: K,
    value: OrderStateData[K] | undefined
  ) => Promise<void>;
  submitOrder: () => Promise<void>;
  amendOrder: () => void;
}

// --- Combined Store Type ---
export type BoundState = AppSlice &
  RefDataSlice &
  InitialOrderSlice &
  UserInteractionSlice &
  ComputedSlice;
