/**
 * Field Connectors - Barrel Export
 *
 * This folder contains hooks that extract specific concerns from the store
 * for use by field components. Each hook has a single responsibility:
 *
 * - useFieldValue: Get/set field value from derived state
 * - useFieldOptions: Get dropdown options for Select fields
 * - useFieldState: Get validation state (errors, warnings, validating)
 * - useFieldReadOnly: Compute read-only state based on editMode and orderType
 * - useFieldVisibility: Check if field should be visible based on form state
 *
 * These hooks replace the monolithic FieldController's state management.
 */

export { useFieldOptions } from "./useFieldOptions";
export { useFieldReadOnly } from "./useFieldReadOnly";
export { useFieldState } from "./useFieldState";
export { useFieldValue } from "./useFieldValue";
export { useFieldVisibility } from "./useFieldVisibility";
