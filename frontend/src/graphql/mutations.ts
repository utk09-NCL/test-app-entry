import { gql } from "@apollo/client";

export const CREATE_ORDER_MUTATION = gql`
  mutation createOrder($orderEntry: OrderEntry!) {
    createOrder(orderEntry: $orderEntry) {
      orderId
      result
      failureReason
    }
  }
`;

export const AMEND_ORDER_MUTATION = gql`
  mutation AmendOrder($amendOrder: AmendOrder!) {
    amendOrder(amendOrder: $amendOrder) {
      orderId
      result
      failureReason
    }
  }
`;

export const GLOBAL_USER_PREFERENCE_MUTATION = gql`
  mutation mutateGlobalUserPreferences(
    $updateGlobalUserPreferenceRequest: UpdateGlobalUserPreferenceRequest!
  ) {
    mutateGlobalUserPreferences(
      updateGlobalUserPreferenceRequest: $updateGlobalUserPreferenceRequest
    ) {
      defaultGlobalAccount {
        sdsId
        name
      }
    }
  }
`;
