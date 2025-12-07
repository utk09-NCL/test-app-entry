export const typeDefs = `#graphql
  # Enums
  enum ValidationType {
    SOFT
    HARD
  }
  enum OrderType {
    ADAPT
    AGGRESSIVE
    CALL_LEVEL
    FIXING
    FLOAT
    IOC
    LIQUIDITY_SEEKER
    PARTICIPATION
    PEG
    POUNCE
    STOP_LOSS
    TAKE_PROFIT
    TWAP
  }

  enum OrderSide {
    BUY
    SELL
  }

  enum OrderStatus {
    CANCELLED
    EXPIRED
    FILLED
    LIVE
    LIVE_DELAYED
    LIVE_SUSPENDED
    LOADING
    PENDING_AMEND
    PENDING_CANCEL
    PENDING_EXPIRY
    PENDING_FILL
    PENDING_LIVE
    PENDING_MOVE_TO_MANUAL
    PENDING_RESUME
    PENDING_SUSPEND
    REJECTED
    UNSPECIFIED
  }

  enum TimeInForce {
    GTC
    GTD
    IOC
    FOK
  }

  enum ExpiryStrategy {
    GTC
    GTD
    GTT
  }

  enum DelayBehaviour {
    CONSTANT
    SPEED_UP_CANCEL
    SPEED_UP_EXTEND
  }

  enum DiscretionFactor {
    AGGRESSIVE
    NEUTRAL
    PASSIVE
  }

  enum ExecutionStyle {
    EXECUTION_STYLE_AGGRESSIVE
    EXECUTION_STYLE_INVALID
    EXECUTION_STYLE_NEUTRAL
    EXECUTION_STYLE_PASSIVE
  }

  enum ExecutionAgent {
    EXECUTION_AGENT_AUTO
    EXECUTION_AGENT_BENCHMARK
    EXECUTION_AGENT_INVALID
    EXECUTION_AGENT_MANUAL
  }

  enum FranchiseExposure {
    FRANCHISE_EXPOSURE_FAST
    FRANCHISE_EXPOSURE_INVALID
    FRANCHISE_EXPOSURE_MEDIUM
    FRANCHISE_EXPOSURE_MEDIUM_MINUS
    FRANCHISE_EXPOSURE_MEDIUM_PLUS
    FRANCHISE_EXPOSURE_SLOW
  }

  enum TargetExecutionRate {
    TARGET_EXECUTION_RATE_FAST
    TARGET_EXECUTION_RATE_INVALID
    TARGET_EXECUTION_RATE_MEDIUM
    TARGET_EXECUTION_RATE_MEDIUM_MINUS
    TARGET_EXECUTION_RATE_MEDIUM_PLUS
    TARGET_EXECUTION_RATE_SLOW
  }

  enum ParticipationRate {
    PARTICIPATION_RATE_FAST
    PARTICIPATION_RATE_INVALID
    PARTICIPATION_RATE_MEDIUM
    PARTICIPATION_RATE_MEDIUM_MINUS
    PARTICIPATION_RATE_MEDIUM_PLUS
    PARTICIPATION_RATE_SLOW
  }

  enum Skew {
    SKEW_HIGH
    SKEW_INVALID
    SKEW_LOW
    SKEW_MEDIUM
    SKEW_NONE
  }

  enum StopLossTriggerSide {
    INVALID
    LEADING
    MID
    SL
    SL_B
    SL_S
    SL_OT
    TRAILING
  }

  enum RateType {
    VWAP
    WORST
  }
  # Validation Types
  type FieldValidation {
    field: String!
    ok: Boolean!
    type: ValidationType
    message: String
  }

  input ValidateFieldInput {
    field: String!
    value: String
    orderType: OrderType!
    symbol: String
    account: String
    liquidityPool: String
    timeInForce: TimeInForce
  }

  # Basic Types
  type Account {
    sdsId: ID!
    name: String!
  }

  type LiquidityPool {
    name: String!
    value: String!
  }

  type FixingCombination {
    fixingName: String!
    fixingTime: String!
    fixingTimezone: String!
    fixingId: ID!
  }

  type OrderTypeWithPools {
    name: String!
    orderType: OrderType!
    fixingCombinations: [FixingCombination!]!
    liquidityPools: [LiquidityPool!]!
  }

  type CurrencyPair {
    id: ID!
    symbol: String!
    ccy1: String!
    ccy2: String!
    ccy1Deliverable: Boolean!
    ccy2Deliverable: Boolean!
    ccy1Onshore: Boolean!
    ccy2Onshore: Boolean!
    spotPrecision: Int!
    bigDigits: Int!
    bigDigitsOffset: Int!
    additionalPrecision: Int!
    minPipStep: Float!
    defaultPipStep: Float!
    defaultTenor: String!
    tenor: String!
    stopLossAllowed: Boolean!
  }

  type TenorInfo {
    tenorCode: String!
    valueDate: String!
  }

  type CurrencyPairDetail {
    id: ID!
    tenorInfos: [TenorInfo!]!
  }

  # Price Types
  type Price {
    price: Float!
    precisionValue: Float!
  }

  type GatorData {
    topOfTheBookBuy: Price!
    topOfTheBookSell: Price!
  }

  # Order Types
  type Amount {
    amount: Float!
    ccy: String!
  }

  type AccountDetail {
    sdsId: ID!
    name: String!
  }

  type Expiry {
    strategy: ExpiryStrategy!
    endTime: Float
    endTimeZone: String
  }

  type OrderDetail {
    fixingId: ID
    fixingDate: String
    amount: Amount!
    currencyPair: String!
    iceberg: Float
    level: Float
    side: OrderSide!
    orderType: OrderType!
    account: AccountDetail!
    triggerSide: StopLossTriggerSide
    liquidityPool: String!
    targetExecutionRate: TargetExecutionRate
    participationRate: ParticipationRate
    executionStyle: ExecutionStyle
    discretionFactor: DiscretionFactor
    delayBehaviour: DelayBehaviour
    twapTargetEndTime: String
    twapTimeZone: String
    timeZone: String
    startTime: String
    skew: Skew
    franchiseExposure: FranchiseExposure
    expiry: Expiry
  }

  type Execution {
    agent: ExecutionAgent!
    averageFillRate: Float!
    filled: Amount!
    rejectReason: String
    status: OrderStatus!
    targetEndTime: Float
  }

  type OrderData {
    orderId: ID!
    omsOrderId: ID
    order: OrderDetail!
    execution: Execution!
  }

  type OrderFailure {
    description: String!
    errorCode: String!
    reason: String!
  }

  # Mutation Response Types
  type CreateOrderResponse {
    orderId: ID!
    result: String!
    failureReason: String
  }

  type AmendOrderResponse {
    orderId: ID!
    result: String!
    failureReason: String
  }

  type CancelOrderResponse {
    orderId: ID!
    result: String!
    failureReason: String
  }

  type FillOrderResponse {
    orderId: ID!
    result: String!
    failureReason: String
  }

  type CancelInstrumentResponse {
    userId: ID!
    result: String!
    failureReason: String
  }

  type GlobalUserPreferences {
    defaultGlobalAccount: Account
  }

  # Input Types
  input OrderEntry {
    currencyPair: String!
    side: OrderSide!
    orderType: OrderType!
    amount: Float!
    ccy: String!
    limitPrice: Float
    stopPrice: Float
    liquidityPool: String!
    account: String!
    timeInForce: TimeInForce
    startTime: Float
    fixingId: ID
  }

  input AmendOrder {
    orderId: ID!
    amount: Float
    limitPrice: Float
    stopPrice: Float
    timeInForce: TimeInForce
  }

  input CcyPairInput {
    symbol: String!
    onshore: Boolean!
    deliverable: Boolean!
  }

  input UpdateGlobalUserPreferenceRequest {
    defaultGlobalAccount: String
  }

  input GatorSubscription {
    currencyPair: String!
    ndf: Boolean
    onshore: Boolean
    pipExtent: Int
    pipSteps: Int
    markets: [String!]
  }

  # Queries
  type Query {
    accounts: [Account!]!
    currencyPairs(orderType: OrderType): [CurrencyPair!]!
    orderTypesWithPools: [OrderTypeWithPools!]!
    currencyPair(currencyPairId: ID!): CurrencyPairDetail!
    validateField(input: ValidateFieldInput!): FieldValidation!
  }

  # Mutations
  type Mutation {
    createOrder(orderEntry: OrderEntry!): CreateOrderResponse!
    amendOrder(amendOrder: AmendOrder!): AmendOrderResponse!
    cancelOrder(orderId: ID!): CancelOrderResponse!
    fillOrder(orderId: ID!): FillOrderResponse!
    cancelInstrumentAction(ccyPair: CcyPairInput!): CancelInstrumentResponse!
    mutateGlobalUserPreferences(
      updateGlobalUserPreferenceRequest: UpdateGlobalUserPreferenceRequest!
    ): GlobalUserPreferences!
  }

  # Subscriptions
  type Subscription {
    orderData(orderId: ID!): OrderData!
    orderFailure(orderId: ID!): OrderFailure!
    gatorData(subscription: GatorSubscription): GatorData!
    globalUserPreferencesStream: GlobalUserPreferences!
  }
`;
