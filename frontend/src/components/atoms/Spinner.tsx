import styles from "./Spinner.module.scss";

/**
 * Spinner - A loading indicator atom.
 *
 * Used to show async operations in progress:
 * - Small: inline validation (next to field labels)
 * - Medium: button loading states
 * - Large: full-page loading screens
 *
 * The spinner uses CSS animations for smooth rotation.
 *
 * @example
 * ```tsx
 * // In a button
 * <button disabled={isSubmitting}>
 *   {isSubmitting ? <Spinner size="md" /> : "Submit"}
 * </button>
 *
 * // Inline validation
 * {isValidating && <Spinner size="sm" />}
 * ```
 */
export const Spinner = ({
  size = "sm",
  "data-testid": testId,
}: {
  /** Size of the spinner: sm (16px), md (24px), lg (48px) */
  size?: "sm" | "md" | "lg";
  /** Test ID for component testing */
  "data-testid"?: string;
}) => {
  return (
    <svg
      className={`${styles.spinner} ${styles[size]}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      data-testid={testId || "spinner"}
    >
      {/* Background circle (static) */}
      <circle
        className={styles.track}
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      {/* Foreground arc (animated to rotate) */}
      <path
        className={styles.path}
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );
};
