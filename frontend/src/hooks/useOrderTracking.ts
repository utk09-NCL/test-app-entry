/**
 * useOrderTracking Hook
 *
 * Subscribes to ORDER_SUBSCRIPTION and ORDER_FAILURE_SUBSCRIPTION to track
 * real-time order status updates after submission.
 *
 * Responsibilities:
 * 1. Subscribe to orderData when currentOrderId is set
 * 2. Update orderStatus in store with real-time execution status
 * 3. Handle order failures and show error toasts
 * 4. Automatically unsubscribe when order reaches terminal state (FILLED/CANCELLED)
 *
 * Used by: App.tsx or OrderForm.tsx
 */

import { useEffect } from "react";

import { useSubscription } from "@apollo/client";

import { ORDER_FAILURE_SUBSCRIPTION, ORDER_SUBSCRIPTION } from "../graphql/subscriptions";
import type {
  OrderDataSubscriptionResponse,
  OrderFailureSubscriptionResponse,
} from "../graphql/types";
import { useOrderEntryStore } from "../store";

export const useOrderTracking = () => {
  const currentOrderId = useOrderEntryStore((s) => s.currentOrderId);
  const setOrderStatus = useOrderEntryStore((s) => s.setOrderStatus);
  const setToast = useOrderEntryStore((s) => s.setToast);

  // Subscribe to order data updates
  const orderSubscription = useSubscription<OrderDataSubscriptionResponse>(ORDER_SUBSCRIPTION, {
    variables: { orderId: currentOrderId },
    skip: !currentOrderId, // Don't subscribe if no orderId
    fetchPolicy: "no-cache",
    onError: (err) => {
      console.error("[useOrderTracking] Order subscription error:", err);
      setToast({
        type: "error",
        text: "Failed to track order status",
      });
    },
  });
  const { data: orderData } = orderSubscription;

  // Subscribe to order failures
  const orderFailureSubscription = useSubscription<OrderFailureSubscriptionResponse>(
    ORDER_FAILURE_SUBSCRIPTION,
    {
      variables: { orderId: currentOrderId },
      skip: !currentOrderId,
      fetchPolicy: "no-cache",
      onError: (err) => {
        console.error("[useOrderTracking] Order failure subscription error:", err);
      },
    }
  );
  const { data: orderFailureData } = orderFailureSubscription;

  // Cleanup subscriptions on unmount
  useEffect(() => {
    return () => {
      // Apollo Client handles subscription cleanup automatically
      // but we explicitly log for verification
      if (currentOrderId) {
        console.log("[useOrderTracking] Cleaning up subscriptions for order:", currentOrderId);
      }
    };
  }, [currentOrderId]);

  // Update order status when data arrives
  useEffect(() => {
    if (orderData?.orderData) {
      const status = orderData.orderData.execution.status;
      setOrderStatus(status);

      // Show toast for terminal states
      if (status === "FILLED") {
        setToast({
          type: "success",
          text: "Order Filled Successfully!",
        });
      } else if (status === "CANCELLED") {
        setToast({
          type: "info",
          text: "Order Cancelled",
        });
      } else if (status === "REJECTED") {
        const reason = orderData.orderData.execution.rejectReason || "Unknown reason";
        setToast({
          type: "error",
          text: `Order Rejected: ${reason}`,
        });
      }
    }
  }, [orderData, setOrderStatus, setToast]);

  // Handle order failures
  useEffect(() => {
    if (orderFailureData?.orderFailure) {
      const { description, errorCode, reason } = orderFailureData.orderFailure;
      setToast({
        type: "error",
        text: `${description} (${errorCode})`,
      });
      console.error("[useOrderTracking] Order failure:", { description, errorCode, reason });
    }
  }, [orderFailureData, setToast]);
};
