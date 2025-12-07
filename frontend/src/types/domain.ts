/**
 * Domain Types - Business Entities and Models
 *
 * This file defines the core business domain for FX order entry:
 * - Order types (TAKE_PROFIT, STOP_LOSS, FLOAT, etc.)
 * - Reference data entities (Account, LiquidityPool, CurrencyPair)
 * - Order state shape (OrderStateData)
 *
 * Why separate from store types?
 * - Domain types represent business concepts (can be shared with backend)
 * - Store types represent UI state structure (Zustand-specific)
 * - Clean separation enables reuse in APIs, services, and tests
 */

// Re-export enums from GraphQL types - these are the server-side enums
export enum OrderType {
  ADAPT = "ADAPT",
  AGGRESSIVE = "AGGRESSIVE",
  CALL_LEVEL = "CALL_LEVEL",
  FIXING = "FIXING",
  FLOAT = "FLOAT",
  IOC = "IOC",
  LIQUIDITY_SEEKER = "LIQUIDITY_SEEKER",
  PARTICIPATION = "PARTICIPATION",
  PEG = "PEG",
  POUNCE = "POUNCE",
  STOP_LOSS = "STOP_LOSS",
  TAKE_PROFIT = "TAKE_PROFIT",
  TWAP = "TWAP",
}

export enum OrderSide {
  BUY = "BUY",
  SELL = "SELL",
}

export enum OrderStatus {
  CANCELLED = "CANCELLED",
  EXPIRED = "EXPIRED",
  FILLED = "FILLED",
  LIVE = "LIVE",
  LIVE_DELAYED = "LIVE_DELAYED",
  LIVE_SUSPENDED = "LIVE_SUSPENDED",
  LOADING = "LOADING",
  PENDING_AMEND = "PENDING_AMEND",
  PENDING_CANCEL = "PENDING_CANCEL",
  PENDING_EXPIRY = "PENDING_EXPIRY",
  PENDING_FILL = "PENDING_FILL",
  PENDING_LIVE = "PENDING_LIVE",
  PENDING_MOVE_TO_MANUAL = "PENDING_MOVE_TO_MANUAL",
  PENDING_RESUME = "PENDING_RESUME",
  PENDING_SUSPEND = "PENDING_SUSPEND",
  REJECTED = "REJECTED",
  UNSPECIFIED = "UNSPECIFIED",
}

export enum ExpiryStrategy {
  GTC = "GTC",
  GTD = "GTD",
  GTT = "GTT",
}

export enum DelayBehaviour {
  CONSTANT = "CONSTANT",
  SPEED_UP_CANCEL = "SPEED_UP_CANCEL",
  SPEED_UP_EXTEND = "SPEED_UP_EXTEND",
}

export enum StartMode {
  START_NOW = "START_NOW",
  START_AT = "START_AT",
}

export enum DiscretionFactor {
  AGGRESSIVE = "AGGRESSIVE",
  NEUTRAL = "NEUTRAL",
  PASSIVE = "PASSIVE",
}

export enum ExecutionStyle {
  EXECUTION_STYLE_AGGRESSIVE = "EXECUTION_STYLE_AGGRESSIVE",
  EXECUTION_STYLE_INVALID = "EXECUTION_STYLE_INVALID",
  EXECUTION_STYLE_NEUTRAL = "EXECUTION_STYLE_NEUTRAL",
  EXECUTION_STYLE_PASSIVE = "EXECUTION_STYLE_PASSIVE",
}

export enum ExecutionAgent {
  EXECUTION_AGENT_AUTO = "EXECUTION_AGENT_AUTO",
  EXECUTION_AGENT_BENCHMARK = "EXECUTION_AGENT_BENCHMARK",
  EXECUTION_AGENT_INVALID = "EXECUTION_AGENT_INVALID",
  EXECUTION_AGENT_MANUAL = "EXECUTION_AGENT_MANUAL",
}

export enum FranchiseExposure {
  FRANCHISE_EXPOSURE_FAST = "FRANCHISE_EXPOSURE_FAST",
  FRANCHISE_EXPOSURE_INVALID = "FRANCHISE_EXPOSURE_INVALID",
  FRANCHISE_EXPOSURE_MEDIUM = "FRANCHISE_EXPOSURE_MEDIUM",
  FRANCHISE_EXPOSURE_MEDIUM_MINUS = "FRANCHISE_EXPOSURE_MEDIUM_MINUS",
  FRANCHISE_EXPOSURE_MEDIUM_PLUS = "FRANCHISE_EXPOSURE_MEDIUM_PLUS",
  FRANCHISE_EXPOSURE_SLOW = "FRANCHISE_EXPOSURE_SLOW",
}

export enum TargetExecutionRate {
  TARGET_EXECUTION_RATE_FAST = "TARGET_EXECUTION_RATE_FAST",
  TARGET_EXECUTION_RATE_INVALID = "TARGET_EXECUTION_RATE_INVALID",
  TARGET_EXECUTION_RATE_MEDIUM = "TARGET_EXECUTION_RATE_MEDIUM",
  TARGET_EXECUTION_RATE_MEDIUM_MINUS = "TARGET_EXECUTION_RATE_MEDIUM_MINUS",
  TARGET_EXECUTION_RATE_MEDIUM_PLUS = "TARGET_EXECUTION_RATE_MEDIUM_PLUS",
  TARGET_EXECUTION_RATE_SLOW = "TARGET_EXECUTION_RATE_SLOW",
}

export enum ParticipationRate {
  PARTICIPATION_RATE_FAST = "PARTICIPATION_RATE_FAST",
  PARTICIPATION_RATE_INVALID = "PARTICIPATION_RATE_INVALID",
  PARTICIPATION_RATE_MEDIUM = "PARTICIPATION_RATE_MEDIUM",
  PARTICIPATION_RATE_MEDIUM_MINUS = "PARTICIPATION_RATE_MEDIUM_MINUS",
  PARTICIPATION_RATE_MEDIUM_PLUS = "PARTICIPATION_RATE_MEDIUM_PLUS",
  PARTICIPATION_RATE_SLOW = "PARTICIPATION_RATE_SLOW",
}

export enum Skew {
  SKEW_HIGH = "SKEW_HIGH",
  SKEW_INVALID = "SKEW_INVALID",
  SKEW_LOW = "SKEW_LOW",
  SKEW_MEDIUM = "SKEW_MEDIUM",
  SKEW_NONE = "SKEW_NONE",
}

export enum StopLossTriggerSide {
  INVALID = "INVALID",
  LEADING = "LEADING",
  MID = "MID",
  SL = "SL",
  SL_B = "SL_B",
  SL_S = "SL_S",
  SL_OT = "SL_OT",
  TRAILING = "TRAILING",
}

export enum RateType {
  VWAP = "VWAP",
  WORST = "WORST",
}

/**
 * Trading account - where order will be submitted.
 * Maps directly to backend Account type.
 */
export interface Account {
  sdsId: number; // Account ID as returned by backend
  name: string; // Account display name
}

/**
 * Amount - currency amount with denomination.
 * Maps directly to backend Amount type.
 */
export interface Amount {
  amount: number; // Numeric amount
  ccy: string; // Currency code (e.g., "USD", "GBP")
}

/**
 * Expiry - order expiration configuration.
 * Maps directly to backend Expiry type.
 */
export interface Expiry {
  strategy: ExpiryStrategy; // GTC, GTD, or GTT
  endTime?: string; // HH:mm:ss format
  endDate?: string; // ISO date string (YYYY-MM-DD)
  endTimeZone?: string; // Timezone for the end time
}

/**
 * Liquidity pool - source of market liquidity for order execution.
 * Maps directly to backend LiquidityPool type.
 */
export interface LiquidityPool {
  name: string; // Pool display name (e.g., "Gator Liquid")
  value: string; // Pool ID (e.g., "GATOR_POOL_1")
}

/**
 * Currency pair - asset being traded.
 * Maps directly to backend CcyPair type.
 */
export interface CurrencyPair {
  id: string; // Composite ID (e.g., "GBPUSD_false_true_false_true")
  symbol: string; // Pair symbol (e.g., "GBPUSD")
  ccy1: string; // First currency (e.g., "GBP")
  ccy2: string; // Second currency (e.g., "USD")
  ccy1Deliverable: boolean;
  ccy2Deliverable: boolean;
  ccy1Onshore: boolean;
  ccy2Onshore: boolean;
  spotPrecision: number; // Decimal places for price display
  bigDigits: number;
  bigDigitsOffset: number;
  additionalPrecision: number;
  minPipStep: number;
  defaultPipStep: number;
  defaultTenor: string;
  tenor: string;
  stopLossAllowed: boolean;
}

/**
 * Order Other Comments - optional comments for orders.
 */
export interface OrderOtherComments {
  firstComment?: string;
  secondComment?: string;
  thirdComment?: string;
}

/**
 * Roll Info - information about order rolling/renewal.
 */
export interface RollInfo {
  tenor?: string;
  valueDate?: string; // ISO date string
}

/**
 * Execution Info - information about order execution.
 */
export interface ExecutionInfo {
  agent?: ExecutionAgent;
  averageFillRate?: number;
  rejectReason?: string;
  status: OrderStatus;
  targetEndTime?: number; // Unix epoch milliseconds
  filled?: Amount;
}

/**
 * Order Info - complete order information returned from server.
 * Represents a submitted order with all its details and execution state.
 */
export interface OrderInfo {
  fixingId?: number;
  fixingDate?: string; // ISO date string
  currencyPair: string;
  iceberg?: number;
  level?: number;
  side: OrderSide;
  orderType: OrderType;
  triggerSide?: StopLossTriggerSide;
  liquidityPool?: string;
  targetExecutionRate?: TargetExecutionRate;
  participationRate?: ParticipationRate;
  executionStyle?: ExecutionStyle;
  discretionFactor?: DiscretionFactor;
  delayBehaviour?: DelayBehaviour;
  twapTargetEndTime?: number; // Unix epoch milliseconds
  twapTimeZone?: string;
  timeZone?: string;
  startTime?: number; // Unix epoch milliseconds
  skew?: Skew;
  franchiseExposure?: FranchiseExposure;
  amount: Amount;
  account?: Account;
  expiry?: Expiry;
  execution: ExecutionInfo;
}

/**
 * Order State Data - Server-aligned shape of an order.
 * Uses server-side field naming (currencyPair, side, amount) to avoid
 * translation confusion between UI and API layers.
 *
 * Matches the GraphQL OrderEntry input type and OrderSubscriptionSubscription output.
 *
 * Used throughout the app:
 * - Store: baseValues + dirtyValues merge to this shape
 * - Validation: Valibot schemas validate this shape
 * - Submission: Sent directly to GraphQL mutations (createOrder, amendOrder)
 */
export interface OrderStateData {
  // Identification
  orderId?: string; // Present if amending existing order
  omsOrderId?: string; // OMS order ID from subscription response

  // Core order details (server-aligned naming)
  currencyPair: string; // Currency pair (e.g., "GBPUSD")
  side: OrderSide; // Trade direction (BUY or SELL)
  orderType: OrderType; // Order type from server enums
  amount: Amount; // Amount to trade with currency { amount: number, ccy: string }
  liquidityPool?: string; // Where to route order
  account?: Account; // Which account to use { name: string, sdsId: number }

  // Pricing fields (conditional on order type)
  iceberg?: number; // For TAKE_PROFIT orders
  level?: number; // Price level for TAKE_PROFIT, STOP_LOSS, POUNCE, FLOAT, CALL_LEVEL

  // Advanced order parameters (order-type specific)
  targetExecutionRate?: TargetExecutionRate; // For FLOAT, LIQUIDITY_SEEKER
  participationRate?: ParticipationRate; // For PARTICIPATION
  executionStyle?: ExecutionStyle; // For execution orders
  discretionFactor?: DiscretionFactor; // For PARTICIPATION
  delayBehaviour?: DelayBehaviour; // For PARTICIPATION
  skew?: Skew; // For PARTICIPATION
  franchiseExposure?: FranchiseExposure; // For PARTICIPATION
  triggerSide?: StopLossTriggerSide; // For STOP_LOSS orders

  // Time-related fields
  startTime?: string; // HH:mm:ss format for scheduled orders
  startDate?: string; // ISO date string (YYYY-MM-DD) for scheduled orders
  timeZone?: string; // Timezone for start time
  twapTargetEndTime?: number; // For TWAP orders
  twapTimeZone?: string; // Timezone for TWAP end time

  // Start Mode - controls whether startTime fields are visible/required
  startMode?: StartMode; // START_NOW or START_AT

  // Fixing/Roll fields
  fixingId?: number; // For FIXING orders
  fixingDate?: string; // ISO date for FIXING orders
  tenor?: string; // Tenor for orders with roll info

  // Expiry configuration
  expiry?: Expiry; // Order expiration configuration { strategy, endTime?, endDate?, endTimeZone? }
  expiryTime?: string; // HH:mm:ss format for GTD/GTT expiry
  expiryDate?: string; // ISO date string (YYYY-MM-DD) for GTD/GTT expiry
  expiryTimeZone?: string; // Timezone for expiry time (GTD/GTT)

  // NDF/Onshore flags
  ndf?: boolean; // Non-deliverable forward flag
  onshore?: boolean; // Onshore currency flag

  // Comments and roll info
  orderOtherComments?: OrderOtherComments; // Optional comments { firstComment?, secondComment?, thirdComment? }
  rollInfo?: RollInfo; // Roll info { tenor?, valueDate? }

  // Execution state (from subscription responses)
  execution?: ExecutionInfo; // Execution details from server
}

/**
 * Validation error - returned from server or client validation.
 * Not currently used in UI (we use simple string errors).
 */
export interface ValidationError {
  field: string;
  message: string;
  type: "SOFT" | "HARD"; // SOFT = warning, HARD = blocking error
}
