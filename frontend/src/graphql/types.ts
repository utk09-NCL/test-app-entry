/**
 * GraphQL Response Types
 *
 * Type definitions for GraphQL query/mutation/subscription responses.
 * These types strictly match the backend schema.
 */

// ============================================================================
// Query Response Types
// ============================================================================

export interface AccountGQL {
  sdsId: number;
  name: string;
}

export interface AccountsQueryResponse {
  accounts: AccountGQL[];
}

export interface CurrencyPairGQL {
  id: string;
  symbol: string;
  ccy1: string;
  ccy2: string;
  ccy1Deliverable: boolean;
  ccy2Deliverable: boolean;
  ccy1Onshore: boolean;
  ccy2Onshore: boolean;
  spotPrecision: number;
  bigDigits: number;
  bigDigitsOffset: number;
  additionalPrecision: number;
  minPipStep: number;
  defaultPipStep: number;
  defaultTenor: string;
  tenor: string;
  stopLossAllowed: boolean;
}

export interface CcyStaticQueryResponse {
  currencyPairs: CurrencyPairGQL[];
}

export interface LiquidityPoolGQL {
  name: string;
  value: string;
}

export interface FixingCombinationGQL {
  fixingName: string;
  fixingTime: string;
  fixingTimezone: string;
  fixingId: string;
}

export interface OrderTypeWithPoolsGQL {
  name: string;
  orderType: string;
  fixingCombinations: FixingCombinationGQL[];
  liquidityPools: LiquidityPoolGQL[];
}

export interface OrderTypesLiquidityPoolsQueryResponse {
  orderTypesWithPools: OrderTypeWithPoolsGQL[];
}

export interface TenorInfoGQL {
  tenorCode: string;
  valueDate: string;
}

export interface CurrencyPairDetailGQL {
  id: string;
  tenorInfos: TenorInfoGQL[];
}

export interface CurrencyPairInfoQueryResponse {
  currencyPair: CurrencyPairDetailGQL;
}

// ============================================================================
// Subscription Response Types
// ============================================================================

export interface GlobalUserPreferencesGQL {
  defaultGlobalAccount: AccountGQL | null;
}

export interface GlobalUserPreferencesSubscriptionResponse {
  globalUserPreferencesStream: GlobalUserPreferencesGQL;
}

export interface PriceGQL {
  price: number;
  precisionValue: number;
}

export interface GatorDataGQL {
  topOfTheBookBuy: PriceGQL;
  topOfTheBookSell: PriceGQL;
}

export interface GatorDataSubscriptionResponse {
  gatorData: GatorDataGQL;
}

export interface AmountGQL {
  amount: number;
  ccy: string;
}

export interface AccountDetailGQL {
  sdsId: string;
  name: string;
}

export interface ExpiryGQL {
  strategy: string;
  endTime: string | null;
  endTimeZone: string | null;
}

export interface OrderDetailGQL {
  fixingId: string | null;
  fixingDate: string | null;
  amount: AmountGQL;
  currencyPair: string;
  iceberg: number | null;
  level: number | null;
  side: string;
  orderType: string;
  account: AccountDetailGQL;
  triggerSide: string | null;
  liquidityPool: string;
  targetExecutionRate: number | null;
  participationRate: number | null;
  executionStyle: string | null;
  discretionFactor: number | null;
  delayBehaviour: string | null;
  twapTargetEndTime: string | null;
  twapTimeZone: string | null;
  timeZone: string | null;
  startTime: string | null;
  skew: number | null;
  franchiseExposure: number | null;
  expiry: ExpiryGQL | null;
}

export interface ExecutionGQL {
  agent: string;
  averageFillRate: number;
  filled: AmountGQL;
  rejectReason: string | null;
  status: string;
  targetEndTime: string | null;
}

export interface OrderDataGQL {
  orderId: string;
  omsOrderId: string | null;
  order: OrderDetailGQL;
  execution: ExecutionGQL;
}

export interface OrderDataSubscriptionResponse {
  orderData: OrderDataGQL;
}

export interface OrderFailureGQL {
  description: string;
  errorCode: string;
  reason: string;
}

export interface OrderFailureSubscriptionResponse {
  orderFailure: OrderFailureGQL;
}

export interface FieldValidationGQL {
  field: string;
  ok: boolean;
  type: "SOFT" | "HARD" | null;
  message: string | null;
}

export interface ValidateFieldSubscriptionResponse {
  validateField: FieldValidationGQL;
}

// ============================================================================
// Mutation Response Types
// ============================================================================

export interface CreateOrderResponse {
  createOrder: {
    orderId: string;
    result: string;
    failureReason: string | null;
  };
}

export interface AmendOrderResponse {
  amendOrder: {
    orderId: string;
    result: string;
    failureReason: string | null;
  };
}

export interface GlobalUserPreferenceMutationResponse {
  mutateGlobalUserPreferences: GlobalUserPreferencesGQL;
}
