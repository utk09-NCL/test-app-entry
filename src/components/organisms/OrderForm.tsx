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
 *
 * Architecture:
 * 1. Read current orderType from store (derived from baseValues + dirtyValues)
 * 2. Look up field configuration for that order type
 * 3. Map over fields array and render FieldController for each
 * 4. Include OrderFooter with action buttons at the bottom
 *
 * @see ORDER_TYPES in config/orderConfig.ts for field configurations
 * @see FieldController for individual field rendering logic
 */

import { ORDER_TYPES } from "../../config/orderConfig";
import { useOrderEntryStore } from "../../store";
import { OrderType } from "../../types/domain";
import { Select } from "../atoms/Select";
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

  // Order Type selector itself should be disabled in viewing/amending modes
  const isReadOnly = editMode === "viewing" || editMode === "amending";

  // Look up configuration for the current order type
  // Each config contains: fields[], editableFields[], initialFocus
  const config = ORDER_TYPES[orderType as keyof typeof ORDER_TYPES];

  // Safety check: If config isn't loaded yet, show loading state
  // This shouldn't happen in normal flow, but guards against edge cases
  if (!config) return <div className={styles.loading}>Loading Order Config...</div>;

  return (
    <div className={styles.container} data-testid="order-form">
      {/* Order Type Selector - Always shown first */}
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
          options={Object.keys(ORDER_TYPES).map((t) => ({
            label: t,
            value: t,
          }))}
          disabled={isReadOnly}
        />
      </RowComponent>

      {/* Dynamic Field Grid */}
      {/* Maps over config.fields array and renders each field */}
      {/* Example: LIMIT order shows [direction, liquidityPool, notional, limitPrice, ...] */}
      <div className={styles.grid} data-testid="order-form-fields">
        {config.fields.map((fieldKey, index) => (
          <FieldController key={fieldKey} fieldKey={fieldKey} rowIndex={index + 1} />
        ))}
      </div>

      {/* Action Buttons (Submit/Amend) */}
      {/* Rendered at the bottom of the form */}
      <OrderFooter />
    </div>
  );
};
