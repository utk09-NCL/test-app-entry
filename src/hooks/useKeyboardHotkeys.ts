import { useEffect } from "react";

import { useOrderEntryStore } from "../store";

export const useKeyboardHotkeys = () => {
  const submitOrder = useOrderEntryStore((s) => s.submitOrder);
  const resetForm = useOrderEntryStore((s) => s.resetFormInteractions);
  const isDirty = useOrderEntryStore((s) => s.isDirty);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + Enter: Submit
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        submitOrder();
      }

      // Esc: Reset
      if (e.key === "Escape") {
        e.preventDefault();
        if (isDirty()) {
          resetForm();
        }
      }

      // Shift + F: Focus Notional
      if (e.shiftKey && (e.key === "F" || e.key === "f")) {
        e.preventDefault();
        const notionalInput = document.querySelector('input[name="notional"]') as HTMLInputElement;
        if (notionalInput) {
          notionalInput.focus();
          notionalInput.select();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [submitOrder, resetForm, isDirty]);
};
