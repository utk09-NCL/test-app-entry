import { gql } from "@apollo/client";

export const ACCOUNTS_QUERY = gql`
  query Accounts {
    accounts {
      sdsId
      name
    }
  }
`;

export const CCY_STATIC_QUERY = gql`
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

export const ORDER_TYPES_LIQUIDITY_POOLS_QUERY = gql`
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

export const CURRENCY_PAIR_INFO_QUERY = gql`
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
