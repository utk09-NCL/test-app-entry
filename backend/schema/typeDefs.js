export const typeDefs = `#graphql
  # Enums
  enum OrderType {
    LIMIT
    MARKET
    STOP_LOSS
    TAKE_PROFIT
    FLOAT
  }

  enum OrderSide {
    BUY
    SELL
  }

  enum OrderStatus {
    PENDING
    WORKING
    FILLED
    PARTIALLY_FILLED
    CANCELLED
    REJECTED
  }

  enum TimeInForce {
    GTC
    GTD
    IOC
    FOK
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
    strategy: String!
    endTime: String
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
    triggerSide: OrderSide
    liquidityPool: String!
    targetExecutionRate: Float
    participationRate: Float
    executionStyle: String
    discretionFactor: Float
    delayBehaviour: String
    twapTargetEndTime: String
    twapTimeZone: String
    timeZone: String
    startTime: String
    skew: Float
    franchiseExposure: Float
    expiry: Expiry
  }

  type Execution {
    agent: String!
    averageFillRate: Float!
    filled: Amount!
    rejectReason: String
    status: OrderStatus!
    targetEndTime: String
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
    startTime: String
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
