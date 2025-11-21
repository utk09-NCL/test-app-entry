export type Direction = "BUY" | "SELL";

export type OrderType = "LIMIT" | "MARKET" | "STOP_LOSS" | "TAKE_PROFIT";

export type TimeInForce = "GTC" | "GTD" | "IOC" | "FOK";

export type OrderStatus =
  | "PENDING"
  | "FILLED"
  | "PARTIALLY_FILLED"
  | "CANCELLED"
  | "REJECTED"
  | "NEW";

export interface Account {
  id: string;
  name: string;
  currency: string;
}

export interface LiquidityPool {
  id: string;
  name: string;
  provider: string;
}

export interface CurrencyPair {
  symbol: string; // e.g. EUR/USD
  base: string;
  quote: string;
  precision: number;
}

// The shape of the Order Data used in the form
export interface OrderStateData {
  orderId?: string; // Present if amending
  symbol: string;
  direction: Direction;
  orderType: OrderType;
  notional: number;
  limitPrice?: number; // Optional based on type
  stopPrice?: number;
  liquidityPool: string;
  account: string;
  timeInForce: TimeInForce;
  startTime?: string; // ISO string
  notes?: string;
}

export interface ValidationError {
  field: string;
  message: string;
  type: "SOFT" | "HARD";
}
