// TODO: Wrap using gql from src/__generated__ by adding codegen step in postinstall

export const CREATE_ORDER_MUTATION = `
  mutation createOrder($orderEntry: OrderEntry!) {
    createOrder(orderEntry: $orderEntry) {
      orderId
      result
      failureReason
    }
  }
`;

export const AMEND_ORDER_MUTATION = `
  mutation AmendOrder($amendOrder: AmendOrder!) {
    amendOrder(amendOrder: $amendOrder) {
      orderId
      result
      failureReason
    }
  }
`;

export const GLOBAL_USER_PREFERENCE_MUTATION = `
  mutation mutateGlobalUserPreferences($updateGlobalUserPreferenceRequest: UpdateGlobalUserPreferenceRequest!) {
    mutateGlobalUserPreferences(updateGlobalUserPreferenceRequest: $updateGlobalUserPreferenceRequest) {
      defaultGlobalAccount
    }
  }
`;
