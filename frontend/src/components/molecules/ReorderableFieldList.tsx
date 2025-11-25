/**
 * ReorderableFieldList Component - Drag-and-drop container for form fields
 *
 * Wraps form fields in a DndContext to enable drag-and-drop reordering.
 * Handles the sortable logic and auto-saves changes to localStorage.
 *
 * Features:
 * - Drag and drop reordering of form fields
 * - Smooth animations during drag operations
 * - Auto-save to localStorage on reorder
 * - Collision detection for accurate drop targets
 * - Keyboard accessibility support
 *
 * Used by: OrderForm to render the dynamic field grid
 */

import React, { useCallback } from "react";

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

import { useFieldOrder } from "../../hooks/useFieldOrder";
import { OrderStateData, OrderType } from "../../types/domain";

import { SortableFieldItem } from "./SortableFieldItem";

interface ReorderableFieldListProps {
  /** Current order type (determines which fields to show) */
  orderType: OrderType;
  /** Whether in view mode (affects which fields are shown) */
  isViewMode: boolean;
  /** Render function for each field */
  renderField: (fieldKey: keyof OrderStateData, index: number) => React.ReactNode;
}

/**
 * ReorderableFieldList - Container for drag-sortable form fields
 */
export const ReorderableFieldList = ({
  orderType,
  isViewMode,
  renderField,
}: ReorderableFieldListProps) => {
  const { isReorderMode, getFieldOrder, updateFieldOrder } = useFieldOrder();

  // Get current field order for this order type
  const fields = getFieldOrder(orderType, isViewMode);

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
   */
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = fields.indexOf(active.id as keyof OrderStateData);
        const newIndex = fields.indexOf(over.id as keyof OrderStateData);

        if (oldIndex !== -1 && newIndex !== -1) {
          // Create new array with reordered fields
          const newFields = [...fields];
          const [movedItem] = newFields.splice(oldIndex, 1);
          newFields.splice(newIndex, 0, movedItem);

          // Save to localStorage
          updateFieldOrder(orderType, newFields);
        }
      }
    },
    [fields, orderType, updateFieldOrder]
  );

  // Check if reordering should be enabled (only in create mode, not view mode)
  const canReorder = isReorderMode && !isViewMode;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={fields as string[]} strategy={verticalListSortingStrategy}>
        {fields.map((fieldKey, index) => {
          // 'status' field cannot be reordered (always pinned at top)
          const isReorderable = fieldKey !== "status";

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
