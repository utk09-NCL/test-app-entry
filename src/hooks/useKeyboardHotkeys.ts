/**
 * useKeyboardHotkeys Hook - Global Keyboard Shortcuts
 *
 * Registers global keyboard shortcuts for quick actions.
 * Improves trader efficiency by enabling keyboard-only workflows.
 *
 * Shortcuts:
 * - Ctrl/Cmd + Enter: Submit order (faster than clicking button)
 * - Escape: Reset form (if dirty)
 * - Shift + F: Focus notional field (quick entry for experienced traders)
 *
 * Why global shortcuts?
 * - Traders use keyboard more than mouse (speed)
 * - Reduces repetitive clicking
 * - Enables power-user workflows
 *
 * Implementation:
 * - Listens to global keydown events
 * - Calls store actions directly
 * - Cleans up on unmount (prevents memory leaks)
 *
 * Used by: App.tsx (registered once at root level).
 */

import { useEffect } from "react";

import { useOrderEntryStore } from "../store";

export const useKeyboardHotkeys = () => {
  // Store selectors
  const submitOrder = useOrderEntryStore((s) => s.submitOrder);
  const resetForm = useOrderEntryStore((s) => s.resetFormInteractions);
  const isDirty = useOrderEntryStore((s) => s.isDirty);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter: Submit Order
      // Works on both Mac (metaKey) and Windows/Linux (ctrlKey)
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault(); // Prevent default browser behavior
        submitOrder();
      }

      // Escape: Reset Form (only if user has unsaved changes)
      if (e.key === "Escape") {
        e.preventDefault();
        if (isDirty()) {
          resetForm();
        }
      }

      // Shift + F: Focus Notional Field
      // Quick access to most commonly edited field
      if (e.shiftKey && (e.key === "F" || e.key === "f")) {
        e.preventDefault();
        const notionalInput = document.querySelector('input[name="notional"]') as HTMLInputElement;
        if (notionalInput) {
          notionalInput.focus();
          notionalInput.select(); // Select existing value for quick replacement
        }
      }
    };

    // Register global keydown listener
    window.addEventListener("keydown", handleKeyDown);

    // Cleanup: Remove listener on unmount (prevents memory leaks)
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [submitOrder, resetForm, isDirty]); // Re-register if actions change
};
