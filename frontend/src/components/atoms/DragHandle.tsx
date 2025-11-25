/**
 * DragHandle Component - Visual indicator for draggable items
 *
 * Displays a six-dot grip icon that indicates an item can be dragged.
 * Only visible when reorder mode is enabled.
 *
 * Used by: SortableFieldItem to provide drag affordance
 */

import React from "react";

import { DraggableAttributes } from "@dnd-kit/core";
import { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";

import styles from "./DragHandle.module.scss";

interface DragHandleProps {
  /** Whether the handle is visible (reorder mode enabled) */
  visible: boolean;
  /** Props from useSortable for drag functionality */
  listeners: SyntheticListenerMap | undefined;
  /** Props from useSortable for accessibility */
  attributes: DraggableAttributes;
}

/**
 * DragHandle - Six-dot grip icon for drag and drop
 */
export const DragHandle = React.forwardRef<HTMLButtonElement, DragHandleProps>(
  ({ visible, listeners, attributes }, ref) => {
    if (!visible) return null;

    return (
      <button
        ref={ref}
        type="button"
        className={styles.handle}
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        {/* Six dots arranged in 2 columns x 3 rows */}
        <svg
          width="12"
          height="18"
          viewBox="0 0 12 18"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="3" cy="3" r="1.5" />
          <circle cx="9" cy="3" r="1.5" />
          <circle cx="3" cy="9" r="1.5" />
          <circle cx="9" cy="9" r="1.5" />
          <circle cx="3" cy="15" r="1.5" />
          <circle cx="9" cy="15" r="1.5" />
        </svg>
      </button>
    );
  }
);

DragHandle.displayName = "DragHandle";
