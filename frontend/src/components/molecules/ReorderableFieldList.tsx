/**
 * ReorderableFieldList Component - Drag-and-drop container for form fields
 *
 * Wraps form fields in a DndContext to enable drag-and-drop reordering.
 * Handles the sortable logic and auto-saves changes via the field order hook.
 *
 * Features:
 * - Drag and drop reordering of form fields
 * - Dynamic field visibility based on form state
 * - Smooth animations during drag operations
 * - Auto-save on reorder via props callback
 * - Collision detection for accurate drop targets
 * - Keyboard accessibility support
 *
 * Props pattern: Receives field order state/actions via props from OrderForm
 * to ensure single source of truth (fixes state sync issues).
 *
 * Used by: OrderForm to render the dynamic field grid
 */

import React, { useCallback, useMemo } from "react";

import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { filterVisibleFields } from "../../config/visibilityRules";
import { FieldOrderHookReturn } from "../../hooks/useFieldOrder";
import { useOrderEntryStore } from "../../store";
import { OrderStateData, OrderType } from "../../types/domain";

import { SortableFieldItem } from "./SortableFieldItem";

interface ReorderableFieldListProps {
  /** Current order type (determines which fields to show) */
  orderType: OrderType;
  /** Whether in view mode (affects which fields are shown) */
  isViewMode: boolean;
  /** Render function for each field */
  renderField: (fieldKey: keyof OrderStateData, index: number) => React.ReactNode;
  /** Field order state and actions (passed from parent for single source of truth) */
  fieldOrder: FieldOrderHookReturn;
}

/**
 * ReorderableFieldList - Container for drag-sortable form fields
 */
export const ReorderableFieldList = ({
  orderType,
  isViewMode,
  renderField,
  fieldOrder,
}: ReorderableFieldListProps) => {
  const { isReorderMode, getFieldOrder, updateFieldOrder } = fieldOrder;

  // Get only the specific form values needed for visibility rules
  // Using individual selectors prevents infinite re-render loop
  const currentOrderType = useOrderEntryStore((s) => s.getDerivedValues().orderType);
  const expiry = useOrderEntryStore((s) => s.getDerivedValues().expiry);
  const startMode = useOrderEntryStore((s) => s.getDerivedValues().startMode);
  const liquidityPool = useOrderEntryStore((s) => s.getDerivedValues().liquidityPool);

  // Get current field order for this order type
  const allFields = getFieldOrder(orderType, isViewMode);

  // Filter fields by visibility rules (e.g., hide level for non-STOP_LOSS orders)
  // Memoize form values for visibility check to prevent unnecessary recalculations
  const formValuesForVisibility = useMemo<Partial<OrderStateData>>(
    () => ({
      orderType: currentOrderType,
      ...(expiry && { expiry }),
      ...(startMode && { startMode }),
      ...(liquidityPool && { liquidityPool }),
    }),
    [currentOrderType, expiry, startMode, liquidityPool]
  );

  const fields = useMemo(
    () => filterVisibleFields(allFields, formValuesForVisibility),
    [allFields, formValuesForVisibility]
  );

  // Memoize sortable items array to avoid re-creating on every render
  // This is properly typed as string[] which SortableContext expects
  const sortableItems = useMemo<string[]>(() => fields.map((f) => f as string), [fields]);

  // Configure sensors for drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Require some movement before starting drag (prevents accidental drags)
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  /**
   * Handle drag end - update field order
   * Uses allFields (unfiltered) to preserve order of hidden fields
   */
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        // Use allFields for reordering to preserve hidden fields
        const oldIndex = allFields.indexOf(active.id as keyof OrderStateData);
        const newIndex = allFields.indexOf(over.id as keyof OrderStateData);

        if (oldIndex !== -1 && newIndex !== -1) {
          // Create new array with reordered fields
          const newFields = [...allFields];
          const [movedItem] = newFields.splice(oldIndex, 1);
          newFields.splice(newIndex, 0, movedItem);

          // Save via hook callback
          updateFieldOrder(orderType, newFields);
        }
      }
    },
    [allFields, orderType, updateFieldOrder]
  );

  // Check if reordering should be enabled (only in create mode, not view mode)
  const canReorder = isReorderMode && !isViewMode;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={sortableItems} strategy={verticalListSortingStrategy}>
        {fields.map((fieldKey, index) => {
          // 'execution' field cannot be reordered (always pinned at top in view mode)
          const isReorderable = fieldKey !== "execution";

          return (
            <SortableFieldItem
              key={fieldKey}
              id={fieldKey}
              isReorderMode={canReorder}
              isReorderable={isReorderable}
            >
              {renderField(fieldKey, index + 1)}
            </SortableFieldItem>
          );
        })}
      </SortableContext>
    </DndContext>
  );
};
