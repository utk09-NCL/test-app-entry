/**
 * OrderForm Component
 *
 * The main form renderer that dynamically generates input fields based on the selected order type.
 * This component implements the "Configuration-Driven UI" pattern from the specification.
 *
 * Key Concepts:
 * - Uses ORDER_TYPES config to determine which fields to show
 * - Each order type (MARKET, LIMIT, FLOAT, etc.) has its own field list
 * - Fields are rendered by FieldController, which maps field names to components
 * - Form adapts to editMode: "creating", "viewing", or "amending"
 * - Supports drag-and-drop field reordering (when reorder mode enabled)
 *
 * Architecture:
 * 1. Read current orderType from store (derived from baseValues + dirtyValues)
 * 2. Look up field configuration for that order type
 * 3. Apply user's custom field order (from localStorage) if available
 * 4. Render fields via ReorderableFieldList for drag-and-drop support
 * 5. Include OrderFooter with action buttons at the bottom
 *
 * @see ORDER_TYPES in config/orderConfig.ts for field configurations
 * @see FieldController for individual field rendering logic
 * @see useFieldOrder for custom field order management
 */

import { useCallback } from "react";

import { ORDER_TYPES } from "../../config/orderConfig";
import { useOrderEntryStore } from "../../store";
import { OrderStateData, OrderType } from "../../types/domain";
import { Select } from "../atoms/Select";
import { ReorderableFieldList } from "../molecules/ReorderableFieldList";
import { ReorderModeBanner } from "../molecules/ReorderModeBanner";
import { RowComponent } from "../molecules/RowComponent";

import { FieldController } from "./FieldController";
import { OrderFooter } from "./OrderFooter";

import styles from "./OrderForm.module.scss";

export const OrderForm = () => {
  // Get the merged order data (baseValues + dirtyValues)
  // orderType determines which fields are visible
  const orderType = useOrderEntryStore((s) => s.getDerivedValues().orderType);

  // editMode determines field interactivity:
  // - "creating": All fields editable (new order)
  // - "viewing": All fields read-only (after submit)
  // - "amending": Only editableFields are editable (amend mode)
  const editMode = useOrderEntryStore((s) => s.editMode);

  // Get entitled order types from server (user's permissions)
  const entitledOrderTypes = useOrderEntryStore((s) => s.entitledOrderTypes);

  // Order Type selector itself should be disabled in viewing/amending modes
  const isReadOnly = editMode === "viewing" || editMode === "amending";

  // Look up configuration for the current order type
  // Each config contains: fields[], viewFields[], editableFields[], initialFocus
  const config = ORDER_TYPES[orderType as keyof typeof ORDER_TYPES];

  /**
   * Render function for each field in the reorderable list.
   * Memoized via useCallback to prevent unnecessary re-renders.
   * Must be defined before any early returns to satisfy React hooks rules.
   */
  const renderField = useCallback(
    (fieldKey: keyof OrderStateData, index: number) => (
      <FieldController key={fieldKey} fieldKey={fieldKey} rowIndex={index} />
    ),
    []
  );

  // Safety check: If config isn't loaded yet, show loading state
  // This shouldn't happen in normal flow, but guards against edge cases
  if (!config) return <div className={styles.loading}>Loading Order Config...</div>;

  return (
    <div className={styles.container} data-testid="order-form" data-app-state={editMode}>
      {/* Order Type Selector - Always shown first, not reorderable */}
      {/* When user changes this, the entire form re-renders with new fields */}
      <RowComponent label="Order Type" fieldKey="orderType" rowIndex={0}>
        <Select
          id="orderType"
          name="orderType"
          data-testid="select-orderType"
          value={orderType}
          onChange={(e) =>
            // Call store action directly to update order type
            // This triggers form re-render with new field configuration
            useOrderEntryStore.getState().setFieldValue("orderType", e.target.value as OrderType)
          }
          options={
            // In CREATE mode: Show only entitled order types from server
            // In VIEW/AMEND mode: Include current orderType even if not entitled (for viewing orders)
            editMode === "creating"
              ? entitledOrderTypes.map((t) => ({
                  label: t,
                  value: t,
                }))
              : // Add current orderType if not in entitled list (viewing unavailable order)
                Array.from(new Set([orderType, ...entitledOrderTypes])).map((t) => ({
                  label: t,
                  value: t,
                }))
          }
          disabled={isReadOnly}
        />
      </RowComponent>

      {/* Dynamic Field Grid with Drag-and-Drop Support */}
      {/* Uses ReorderableFieldList for drag-and-drop reordering */}
      {/* Field order is determined by useFieldOrder hook (config + localStorage) */}
      <div className={styles.grid} data-testid="order-form-fields">
        <ReorderableFieldList
          orderType={orderType}
          isViewMode={isReadOnly}
          renderField={renderField}
        />
      </div>

      {/* Reorder Mode Banner - Shows when reorder mode is active */}
      <ReorderModeBanner orderType={orderType} />

      {/* Action Buttons (Submit/Amend) */}
      {/* Rendered at the bottom of the form */}
      <OrderFooter />
    </div>
  );
};
