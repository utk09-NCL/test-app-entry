/**
 * OrderFooter Component
 *
 * Renders action buttons at the bottom of the order form.
 * Button visibility and behavior adapts to the current editMode.
 *
 * Button States:
 * - "creating" mode: Shows SUBMIT ORDER button
 * - "viewing" mode: Shows AMEND ORDER button (after successful submit)
 * - "amending" mode: Shows SUBMIT ORDER button (to re-submit changes)
 *
 * The SUBMIT button is disabled when:
 * 1. Form has validation errors (client-side or server-side)
 * 2. Submission is in progress (status === "SUBMITTING")
 *
 * Lifecycle Flow:
 * 1. User fills form → Click SUBMIT → status becomes "SUBMITTING" → button disabled
 * 2. On success → editMode becomes "viewing" → button changes to AMEND
 * 3. Click AMEND → editMode becomes "amending" → only editable fields unlock
 * 4. Make changes → Click SUBMIT → cycle repeats
 *
 * TODO (Future): Add more buttons like CANCEL, FILL NOW, SUSPEND, RESUME
 */

import { useOrderEntryStore } from "../../store";
import { Spinner } from "../atoms/Spinner";

import styles from "./OrderFooter.module.scss";

export const OrderFooter = () => {
  // App lifecycle status: INITIALIZING | READY | SUBMITTING | ERROR
  const status = useOrderEntryStore((s) => s.status);

  // Form interaction mode: "creating" | "viewing" | "amending"
  const editMode = useOrderEntryStore((s) => s.editMode);

  // Actions
  const submitOrder = useOrderEntryStore((s) => s.submitOrder);
  const amendOrder = useOrderEntryStore((s) => s.amendOrder);

  // Validation state
  const errors = useOrderEntryStore((s) => s.errors); // Client-side validation errors
  const serverErrors = useOrderEntryStore((s) => s.serverErrors); // Server-side validation errors

  // Check if form has any errors (disables submit button)
  const hasErrors = Object.keys(errors).length > 0 || Object.keys(serverErrors).length > 0;

  return (
    <div className={styles.footer}>
      {/* Conditional Button Rendering */}
      {editMode === "viewing" ? (
        // After successful submit, show AMEND button
        // Clicking this sets editMode to "amending" and unlocks editable fields
        <button onClick={() => amendOrder()} className={styles.submitBtn}>
          AMEND ORDER
        </button>
      ) : (
        // In "creating" or "amending" mode, show SUBMIT button
        // Disabled if form has errors or submission is in progress
        <button
          onClick={() => submitOrder()}
          disabled={status === "SUBMITTING" || hasErrors}
          className={styles.submitBtn}
        >
          {/* Show spinner during submission, otherwise show text */}
          {status === "SUBMITTING" ? <Spinner size="md" /> : "SUBMIT ORDER"}
        </button>
      )}
    </div>
  );
};
