export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K];
};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]?: Maybe<T[SubKey]>;
};
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]: Maybe<T[SubKey]>;
};
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  BigDecimal: number;
  Date: string;
  EpochTime: number;
  Long: number;
};

export type AccountInput = {
  name: Scalars["String"];
  sdsId: Scalars["Int"];
};

export type AmendFloatOrder = {
  commonAmendFields: CommonAmendFields;
  executableOrderAmendFields: ExecutableOrderAmendFields;
  expiry?: InputMaybe<ExpiryInput>;
  level?: InputMaybe<Scalars["BigDecimal"]>;
};

export type AmendLiquiditySeekerOrder = {
  commonAmendFields: CommonAmendFields;
  executableOrderAmendFields: ExecutableOrderAmendFields;
  expiry?: InputMaybe<ExpiryInput>;
};

export type AmendOrder = {
  amount?: InputMaybe<AmountInput>;
  delayBehaviour?: InputMaybe<DelayBehaviour>;
  discretionFactor?: InputMaybe<DiscretionFactor>;
  executionStyle?: InputMaybe<ExecutionStyle>;
  expiry?: InputMaybe<ExpiryInput>;
  fixingDate?: InputMaybe<Scalars["Date"]>;
  fixingId?: InputMaybe<Scalars["Int"]>;
  franchiseExposure?: InputMaybe<FranchiseExposure>;
  iceberg?: InputMaybe<Scalars["BigDecimal"]>;
  level?: InputMaybe<Scalars["BigDecimal"]>;
  liquidityPool?: InputMaybe<Scalars["String"]>;
  orderId: Scalars["ID"];
  orderType: OrderType;
  participationRate?: InputMaybe<ParticipationRate>;
  skew?: InputMaybe<Skew>;
  startTime?: InputMaybe<Scalars["EpochTime"]>;
  targetExecutionRate?: InputMaybe<TargetExecutionRate>;
  timeZone?: InputMaybe<Scalars["String"]>;
  triggerSide?: InputMaybe<StopLossTriggerSide>;
  twapTargetEndTime?: InputMaybe<Scalars["EpochTime"]>;
};

export type AmendStopLossOrder = {
  commonAmendFields: CommonAmendFields;
  executableOrderAmendFields: ExecutableOrderAmendFields;
  expiry?: InputMaybe<ExpiryInput>;
  level: Scalars["BigDecimal"];
};

export type AmendTakeProfitOrder = {
  commonAmendFields: CommonAmendFields;
  executableOrderAmendFields: ExecutableOrderAmendFields;
  expiry?: InputMaybe<ExpiryInput>;
  iceberg?: InputMaybe<Scalars["BigDecimal"]>;
  level: Scalars["BigDecimal"];
};

export type AmountInput = {
  amount: Scalars["BigDecimal"];
  ccy: Scalars["String"];
};

export type CcyPairInput = {
  ccy1: Scalars["String"];
  ccy2: Scalars["String"];
  isNdf?: InputMaybe<Scalars["Boolean"]>;
  isOnshore?: InputMaybe<Scalars["Boolean"]>;
};

export type CommonAmendFields = {
  orderId: Scalars["ID"];
  startTime?: InputMaybe<Scalars["EpochTime"]>;
  timeZone?: InputMaybe<Scalars["String"]>;
};

export type ExecutableOrderAmendFields = {
  amount: AmountInput;
};

export type ExpiryInput = {
  endTime?: InputMaybe<Scalars["EpochTime"]>;
  endTimeZone?: InputMaybe<Scalars["String"]>;
  strategy: ExpiryStrategy;
};

export type FloatOrderEntry = {
  account: AccountInput;
  amount: AmountInput;
  currencyPair: Scalars["String"];
  level?: InputMaybe<Scalars["BigDecimal"]>;
  liquidityPool: Scalars["String"];
  ndf: Scalars["Boolean"];
  onshore: Scalars["Boolean"];
  orderOtherComments?: InputMaybe<OrderOtherCommentsInput>;
  rollInfo?: InputMaybe<RollInfoInput>;
  side: OrderSide;
  startTime?: InputMaybe<Scalars["EpochTime"]>;
  targetExecutionRate: TargetExecutionRate;
  tenor: Scalars["String"];
  timeZone?: InputMaybe<Scalars["String"]>;
};

export type GatorSubscription = {
  additionalAmount?: InputMaybe<Scalars["Long"]>;
  cumulativeAmount?: InputMaybe<Scalars["Boolean"]>;
  currencyPair: Scalars["String"];
  markets?: InputMaybe<Array<Scalars["String"]>>;
  ndf?: InputMaybe<Scalars["Boolean"]>;
  onshore?: InputMaybe<Scalars["Boolean"]>;
  orderAmount?: InputMaybe<Scalars["Long"]>;
  pipExtent: Scalars["Int"];
  pipSteps: Scalars["Float"];
  precisionPricing?: InputMaybe<Scalars["Boolean"]>;
  rateType?: InputMaybe<RateType>;
  tosRoundToAmount?: InputMaybe<Scalars["Long"]>;
};

export type LiquiditySeekerOrderEntry = {
  account: AccountInput;
  amount: AmountInput;
  currencyPair: Scalars["String"];
  liquidityPool: Scalars["String"];
  ndf: Scalars["Boolean"];
  onshore: Scalars["Boolean"];
  orderOtherComments?: InputMaybe<OrderOtherCommentsInput>;
  rollInfo?: InputMaybe<RollInfoInput>;
  side: OrderSide;
  startTime?: InputMaybe<Scalars["EpochTime"]>;
  tenor: Scalars["String"];
  timeZone?: InputMaybe<Scalars["String"]>;
};

export type OrderEntry = {
  account?: InputMaybe<AccountInput>;
  amount?: InputMaybe<AmountInput>;
  currencyPair: Scalars["String"];
  delayBehaviour?: InputMaybe<DelayBehaviour>;
  discretionFactor?: InputMaybe<DiscretionFactor>;
  executionStyle?: InputMaybe<ExecutionStyle>;
  expiry?: InputMaybe<ExpiryInput>;
  fixingDate?: InputMaybe<Scalars["Date"]>;
  fixingId?: InputMaybe<Scalars["Int"]>;
  franchiseExposure?: InputMaybe<FranchiseExposure>;
  iceberg?: InputMaybe<Scalars["BigDecimal"]>;
  level?: InputMaybe<Scalars["BigDecimal"]>;
  liquidityPool?: InputMaybe<Scalars["String"]>;
  ndf?: InputMaybe<Scalars["Boolean"]>;
  onshore?: InputMaybe<Scalars["Boolean"]>;
  orderOtherComments?: InputMaybe<OrderOtherCommentsInput>;
  orderType: OrderType;
  participationRate?: InputMaybe<ParticipationRate>;
  rollInfo?: InputMaybe<RollInfoInput>;
  side: OrderSide;
  skew?: InputMaybe<Skew>;
  startTime?: InputMaybe<Scalars["EpochTime"]>;
  targetExecutionRate?: InputMaybe<TargetExecutionRate>;
  tenor?: InputMaybe<Scalars["String"]>;
  timeZone?: InputMaybe<Scalars["String"]>;
  triggerSide?: InputMaybe<StopLossTriggerSide>;
  twapTargetEndTime?: InputMaybe<Scalars["EpochTime"]>;
  twapTimeZone?: InputMaybe<Scalars["String"]>;
};

export type OrderOtherCommentsInput = {
  firstComment?: InputMaybe<Scalars["String"]>;
  secondComment?: InputMaybe<Scalars["String"]>;
  thirdComment?: InputMaybe<Scalars["String"]>;
};

export type PounceOrderEntry = {
  account: AccountInput;
  amount: AmountInput;
  currencyPair: Scalars["String"];
  level: Scalars["BigDecimal"];
  liquidityPool: Scalars["String"];
  ndf: Scalars["Boolean"];
  onshore: Scalars["Boolean"];
  orderOtherComments?: InputMaybe<OrderOtherCommentsInput>;
  rollInfo?: InputMaybe<RollInfoInput>;
  side: OrderSide;
  startTime?: InputMaybe<Scalars["EpochTime"]>;
  tenor: Scalars["String"];
  timeZone?: InputMaybe<Scalars["String"]>;
};

export type RollInfoInput = {
  tenor?: InputMaybe<Scalars["String"]>;
  valueDate?: InputMaybe<Scalars["Date"]>;
};

export type StopLossOrderEntry = {
  account: AccountInput;
  amount: AmountInput;
  currencyPair: Scalars["String"];
  level: Scalars["BigDecimal"];
  liquidityPool: Scalars["String"];
  ndf: Scalars["Boolean"];
  onshore: Scalars["Boolean"];
  orderOtherComments?: InputMaybe<OrderOtherCommentsInput>;
  rollInfo?: InputMaybe<RollInfoInput>;
  side: OrderSide;
  startTime?: InputMaybe<Scalars["EpochTime"]>;
  tenor: Scalars["String"];
  timeZone?: InputMaybe<Scalars["String"]>;
  triggerSide: StopLossTriggerSide;
};

export type TakeProfitOrderEntry = {
  account: AccountInput;
  amount: AmountInput;
  currencyPair: Scalars["String"];
  iceberg?: InputMaybe<Scalars["BigDecimal"]>;
  level: Scalars["BigDecimal"];
  liquidityPool: Scalars["String"];
  ndf: Scalars["Boolean"];
  onshore: Scalars["Boolean"];
  orderOtherComments?: InputMaybe<OrderOtherCommentsInput>;
  rollInfo?: InputMaybe<RollInfoInput>;
  side: OrderSide;
  startTime?: InputMaybe<Scalars["EpochTime"]>;
  tenor: Scalars["String"];
  timeZone?: InputMaybe<Scalars["String"]>;
};

export type UpdateGlobalUserPreferenceRequest = {
  defaultGlobalAccount?: InputMaybe<Scalars["String"]>;
};

export enum ActionResult {
  FAILURE = "FAILURE",
  SUCCESS = "SUCCESS",
}

export enum ActionType {
  AMEND_ORDER = "AMEND_ORDER",
  AMEND_ORDER_V1 = "AMEND_ORDER_V1",
  CANCEL_ORDER = "CANCEL_ORDER",
  FILL_ORDER = "FILL_ORDER",
  LOCK_ORDER = "LOCK_ORDER",
  MANUAL_FILL_ORDER = "MANUAL_FILL_ORDER",
  MOVE_TO_AUTO_ORDER = "MOVE_TO_AUTO_ORDER",
  MOVE_TO_MANUAL_ORDER = "MOVE_TO_MANUAL_ORDER",
  MOVE_TO_MANUAL_ORDER_FORCED = "MOVE_TO_MANUAL_ORDER_FORCED",
  NEW_ORDER = "NEW_ORDER",
  RESUME_ORDER = "RESUME_ORDER",
  SUSPEND_ORDER = "SUSPEND_ORDER",
  UNLOCK_ORDER = "UNLOCK_ORDER",
}

export enum DelayBehaviour {
  CONSTANT = "CONSTANT",
  SPEED_UP_CANCEL = "SPEED_UP_CANCEL",
  SPEED_UP_EXTEND = "SPEED_UP_EXTEND",
}

export enum DiscretionFactor {
  AGGRESSIVE = "AGGRESSIVE",
  NEUTRAL = "NEUTRAL",
  PASSIVE = "PASSIVE",
}

export enum ExecutionAgent {
  EXECUTION_AGENT_AUTO = "EXECUTION_AGENT_AUTO",
  EXECUTION_AGENT_BENCHMARK = "EXECUTION_AGENT_BENCHMARK",
  EXECUTION_AGENT_INVALID = "EXECUTION_AGENT_INVALID",
  EXECUTION_AGENT_MANUAL = "EXECUTION_AGENT_MANUAL",
}

export enum ExecutionStyle {
  EXECUTION_STYLE_AGGRESSIVE = "EXECUTION_STYLE_AGGRESSIVE",
  EXECUTION_STYLE_INVALID = "EXECUTION_STYLE_INVALID",
  EXECUTION_STYLE_NEUTRAL = "EXECUTION_STYLE_NEUTRAL",
  EXECUTION_STYLE_PASSIVE = "EXECUTION_STYLE_PASSIVE",
}

export enum ExpiryStrategy {
  GTC = "GTC",
  GTD = "GTD",
  GTT = "GTT",
}

export enum FixingName {
  BFIX = "BFIX",
  MUFG = "MUFG",
  WMR = "WMR",
}

export enum FranchiseExposure {
  FRANCHISE_EXPOSURE_FAST = "FRANCHISE_EXPOSURE_FAST",
  FRANCHISE_EXPOSURE_INVALID = "FRANCHISE_EXPOSURE_INVALID",
  FRANCHISE_EXPOSURE_MEDIUM = "FRANCHISE_EXPOSURE_MEDIUM",
  FRANCHISE_EXPOSURE_MEDIUM_MINUS = "FRANCHISE_EXPOSURE_MEDIUM_MINUS",
  FRANCHISE_EXPOSURE_MEDIUM_PLUS = "FRANCHISE_EXPOSURE_MEDIUM_PLUS",
  FRANCHISE_EXPOSURE_SLOW = "FRANCHISE_EXPOSURE_SLOW",
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

export enum TargetExecutionRate {
  TARGET_EXECUTION_RATE_FAST = "TARGET_EXECUTION_RATE_FAST",
  TARGET_EXECUTION_RATE_INVALID = "TARGET_EXECUTION_RATE_INVALID",
  TARGET_EXECUTION_RATE_MEDIUM = "TARGET_EXECUTION_RATE_MEDIUM",
  TARGET_EXECUTION_RATE_MEDIUM_MINUS = "TARGET_EXECUTION_RATE_MEDIUM_MINUS",
  TARGET_EXECUTION_RATE_MEDIUM_PLUS = "TARGET_EXECUTION_RATE_MEDIUM_PLUS",
  TARGET_EXECUTION_RATE_SLOW = "TARGET_EXECUTION_RATE_SLOW",
}

export enum RateType {
  VWAP = "VWAP",
  WORST = "WORST",
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

export enum ParticipationRate {
  PARTICIPATION_RATE_FAST = "PARTICIPATION_RATE_FAST",
  PARTICIPATION_RATE_INVALID = "PARTICIPATION_RATE_INVALID",
  PARTICIPATION_RATE_MEDIUM = "PARTICIPATION_RATE_MEDIUM",
  PARTICIPATION_RATE_MEDIUM_MINUS = "PARTICIPATION_RATE_MEDIUM_MINUS",
  PARTICIPATION_RATE_MEDIUM_PLUS = "PARTICIPATION_RATE_MEDIUM_PLUS",
  PARTICIPATION_RATE_SLOW = "PARTICIPATION_RATE_SLOW",
}

export type OrderSubscriptionSubscription = {
  __typename?: "Subscription";
  orderData?: {
    __typename?: "OrderUpdate";
    orderId: string;
    omsOrderId?: string | null;
    order?: {
      __typename?: "OrderInfo";
      fixingId?: number | null;
      fixingDate?: string | null;
      currencyPair: string;
      iceberg?: number | null;
      level?: number | null;
      side: OrderSide;
      orderType: OrderType;
      triggerSide?: StopLossTriggerSide | null;
      liquidityPool?: string | null;
      targetExecutionRate?: TargetExecutionRate | null;
      participationRate?: ParticipationRate | null;
      executionStyle?: ExecutionStyle | null;
      discretionFactor?: DiscretionFactor | null;
      delayBehaviour?: DelayBehaviour | null;
      twapTargetEndTime?: number | null;
      twapTimeZone?: string | null;
      timeZone?: string | null;
      startTime?: number | null;
      skew?: Skew | null;
      franchiseExposure?: FranchiseExposure | null;
      amount: {
        __typename?: "Amount";
        amount: AmountInput["amount"];
        ccy: AmountInput["ccy"];
      };
      account?: {
        __typename?: "Account";
        name: AccountInput["name"];
        sdsId: AccountInput["sdsId"];
      } | null;
      expiry?: {
        __typename?: "Expiry";
        strategy: ExpiryStrategy;
        endTime?: number | null;
        endTimeZone?: string | null;
      } | null;
      execution: {
        __typename?: "ExecutionInfo";
        agent?: ExecutionAgent | null;
        averageFillRate?: number | null;
        rejectReason?: string | null;
        status: OrderStatus;
        targetEndTime?: number | null;
        filled?: {
          __typename?: "Amount";
          ccy: AmountInput["ccy"];
          amount: AmountInput["amount"];
        } | null;
      } | null;
    } | null;
  } | null;
};

export type CreateOrderMutation = {
  __typename?: "Mutation";
  createOrder?: {
    __typename?: "OrderActionReply";
    orderId: string;
    result: ActionResult;
    failureReason?: string | null;
  } | null;
};

export type AmendOrderMutation = {
  __typename?: "Mutation";
  amendOrder?: {
    __typename?: "OrderActionReply";
    orderId: string;
    result: ActionResult;
    failureReason?: string | null;
  } | null;
};

export type CcyPair = {
  __typename?: "CcyPair";
  additionalPrecision: Scalars["Int"];
  bigDigits: Scalars["Int"];
  bigDigitsOffset: Scalars["Int"];
  ccy1: Scalars["String"];
  ccy1Deliverable: Scalars["Boolean"];
  ccy1Onshore: Scalars["Boolean"];
  ccy2: Scalars["String"];
  ccy2Deliverable: Scalars["Boolean"];
  ccy2Onshore: Scalars["Boolean"];
  defaultPipStep: Scalars["Float"];
  defaultTenor: Scalars["String"];
  id: Scalars["String"];
  minPipStep: Scalars["Float"];
  spotPrecision: Scalars["Int"];
  stopLossAllowed: Scalars["Boolean"];
  symbol: Scalars["String"];
  tenor: Scalars["String"];
};
