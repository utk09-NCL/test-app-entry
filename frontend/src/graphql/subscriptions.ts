import { gql } from "@apollo/client";

export const ORDER_SUBSCRIPTION = gql`
  subscription OrderSubscription($orderId: ID!) {
    orderData(orderId: $orderId) {
      orderId
      omsOrderId
      order {
        fixingId
        fixingDate
        amount {
          amount
          ccy
        }
        currencyPair
        iceberg
        level
        side
        orderType
        account {
          sdsId
          name
        }
        triggerSide
        liquidityPool
        targetExecutionRate
        participationRate
        executionStyle
        discretionFactor
        delayBehaviour
        twapTargetEndTime
        twapTimeZone
        timeZone
        startTime
        skew
        franchiseExposure
        expiry {
          strategy
          endTime
          endTimeZone
        }
      }
      execution {
        agent
        averageFillRate
        filled {
          ccy
          amount
        }
        rejectReason
        status
        targetEndTime
      }
    }
  }
`;

export const ORDER_FAILURE_SUBSCRIPTION = gql`
  subscription OrderFailure($orderId: ID!) {
    orderFailure(orderId: $orderId) {
      description
      errorCode
      reason
    }
  }
`;

export const GATOR_DATA_SUBSCRIPTION = gql`
  subscription GatorSubscription($input: GatorSubscription) {
    gatorData(subscription: $input) {
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
`;

export const GLOBAL_USER_PREFERENCES_SUBSCRIPTION = gql`
  subscription globalUserPreferencesStream {
    globalUserPreferencesStream {
      defaultGlobalAccount {
        sdsId
        name
      }
    }
  }
`;

export const VALIDATE_FIELD_SUBSCRIPTION = gql`
  subscription ValidateField($input: ValidateFieldInput!) {
    validateField(input: $input) {
      field
      ok
      type
      message
    }
  }
`;
