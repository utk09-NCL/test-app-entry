import { ORDER_TYPES } from "../../config/orderConfig";
import { useOrderEntryStore } from "../../store";
import { OrderType } from "../../types/domain";
import { Select } from "../atoms/Select";
import { RowComponent } from "../molecules/RowComponent";

import { FieldController } from "./FieldController";
import { OrderFooter } from "./OrderFooter";

import styles from "./OrderForm.module.scss";

/**
 * OrderForm is the main form renderer.
 * It dynamically renders fields based on the selected order type configuration.
 */
export const OrderForm = () => {
  const orderType = useOrderEntryStore((s) => s.getDerivedValues().orderType);
  const editMode = useOrderEntryStore((s) => s.editMode);
  const isReadOnly = editMode === "viewing" || editMode === "amending";
  const config = ORDER_TYPES[orderType as keyof typeof ORDER_TYPES];

  // If order type is invalid or not loaded yet
  if (!config) return <div className={styles.loading}>Loading Order Config...</div>;

  return (
    <div className={styles.container} data-testid="order-form">
      {/* Always show Order Type Selector first */}
      <RowComponent label="Order Type" fieldKey="orderType" rowIndex={0}>
        <Select
          id="orderType"
          name="orderType"
          data-testid="select-orderType"
          value={orderType}
          onChange={(e) =>
            useOrderEntryStore.getState().setFieldValue("orderType", e.target.value as OrderType)
          }
          options={Object.keys(ORDER_TYPES).map((t) => ({
            label: t,
            value: t,
          }))}
          disabled={isReadOnly}
        />
      </RowComponent>

      <div className={styles.grid} data-testid="order-form-fields">
        {config.fields.map((fieldKey, index) => (
          <FieldController key={fieldKey} fieldKey={fieldKey} rowIndex={index + 1} />
        ))}
      </div>

      <OrderFooter />
    </div>
  );
};
