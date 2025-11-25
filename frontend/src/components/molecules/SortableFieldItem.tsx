/**
 * SortableFieldItem Component - Wrapper for drag-sortable form fields
 *
 * Uses @dnd-kit/sortable to make individual form fields draggable.
 * Provides the drag handle and visual feedback during drag operations.
 *
 * Features:
 * - Smooth drag animations via CSS transforms
 * - Visual feedback when dragging (opacity, shadow)
 * - Accessible with keyboard support
 * - Only shows drag handle in reorder mode
 *
 * Used by: ReorderableFieldList to wrap each FieldController
 */

import React from "react";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { OrderStateData } from "../../types/domain";
import { DragHandle } from "../atoms/DragHandle";

import styles from "./SortableFieldItem.module.scss";

interface SortableFieldItemProps {
  /** Unique identifier for this sortable item (field key) */
  id: keyof OrderStateData;
  /** Whether reorder mode is enabled */
  isReorderMode: boolean;
  /** Whether this field can be reordered (status field cannot) */
  isReorderable: boolean;
  /** The field content (FieldController) */
  children: React.ReactNode;
}

/**
 * SortableFieldItem - Makes a form field draggable
 */
export const SortableFieldItem = ({
  id,
  isReorderMode,
  isReorderable,
  children,
}: SortableFieldItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: !isReorderMode || !isReorderable,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : "auto",
  };

  // Show drag handle only when reorder mode is active and field is reorderable
  const showHandle = isReorderMode && isReorderable;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.item} ${isDragging ? styles.dragging : ""} ${showHandle ? styles.reorderMode : ""}`}
      data-testid={`sortable-field-${id}`}
    >
      <DragHandle visible={showHandle} listeners={listeners} attributes={attributes} />
      <div className={styles.content}>{children}</div>
    </div>
  );
};
