// TODO: Wrap using gql from src/__generated__ by adding codegen step in postinstall

export const ACCOUNTS_QUERY = `
  query Accounts {
    accounts {
      sdsId
      name
    }
  }
`;

export const CCY_STATIC_QUERY = `
  query getCcyStatic($orderType: OrderType) {
    currencyPairs(orderType: $orderType) {
      id
      symbol
      ccy1
      ccy2
      ccy1Deliverable
      ccy2Deliverable
      ccy1Onshore
      ccy2Onshore
      spotPrecision
      bigDigits
      bigDigitsOffset
      additionalPrecision
      minPipStep
      defaultPipStep
      defaultTenor
      tenor
      stopLossAllowed
    }
  }
`;

export const ORDER_TYPES_LIQUIDITY_POOLS_QUERY = `
  query OrderTypeLiquidity {
    orderTypesWithPools {
      name
      orderType
      fixingCombinations {
        fixingName
        fixingTime
        fixingTimezone
        fixingId
      }
      liquidityPools {
        name
        value
      }
    }
  }
`;

export const CURRENCY_PAIR_INFO_QUERY = `
  query getCurrencyPairInfo($currencyPairId: ID!) {
    currencyPair(currencyPairId: $currencyPairId) {
      id
      tenorInfos {
        tenorCode
        valueDate
      }
    }
  }
`;
