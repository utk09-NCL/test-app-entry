# FX Order Entry - GraphQL WebSocket Backend

Simple GraphQL server with WebSocket support for FX order entry application.

## Setup

```bash
npm install
npm start
```

Server runs on `http://localhost:4000` with WebSocket endpoint at `ws://localhost:4000/graphql`.

## Features

- **Queries**: Accounts, Currency Pairs, Order Types with Liquidity Pools
- **Mutations**: Create/Amend/Cancel/Fill Orders, User Preferences
- **Subscriptions**: Real-time Order Updates, Price Streaming, User Preferences
- **Data Storage**: JSON files in `/data` directory for easy mocking

## Testing with Hoppscotch.io

1. Connect to `ws://localhost:4000/graphql`
2. Use GraphQL subscriptions/queries from the schema

### Example Query

```graphql
query GetAccounts {
  accounts {
    sdsId
    name
  }
}
```

### Example Subscription

```graphql
subscription PriceStream {
  gatorData(subscription: { currencyPair: "GBPUSD" }) {
    topOfTheBookBuy {
      price
      precisionValue
    }
    topOfTheBookSell {
      price
      precisionValue
    }
  }
}
```

### Example Mutation

```graphql
mutation CreateOrder {
  createOrder(
    orderEntry: {
      currencyPair: "GBPUSD"
      side: BUY
      orderType: TAKE_PROFIT
      amount: 1000000
      ccy: "GBP"
      limitPrice: 1.27
      liquidityPool: "GATOR_POOL_1"
      account: "ACC-001"
      timeInForce: GTC
    }
  ) {
    orderId
    result
    failureReason
  }
}
```

## Data Files

All data is stored in `/data` folder as JSON:

- `accounts.json` - Trading accounts
- `currencyPairs.json` - Available currency pairs
- `orderTypesWithPools.json` - Order types and liquidity pools
- `orders.json` - Created orders (persisted)
- `userPreferences.json` - User preferences

Edit these files to simulate different scenarios.
