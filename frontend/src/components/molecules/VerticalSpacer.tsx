/**
 * VerticalSpacer - A vertical divider line component.
 *
 * A simple visual separator used between horizontally aligned elements.
 * Commonly used to separate BUY and SELL prices in the TickingPrice component.
 *
 * @example
 * ```tsx
 * <div style={{ display: 'flex' }}>
 *   <PriceBox label="BUY" />
 *   <VerticalSpacer />
 *   <PriceBox label="SELL" />
 * </div>
 * ```
 */

import styles from "./VerticalSpacer.module.scss";

interface VerticalSpacerProps {
  /** Optional custom class name for additional styling */
  className?: string;
  /** Test ID for component testing */
  "data-testid"?: string;
}

export const VerticalSpacer = ({
  className,
  "data-testid": testId = "vertical-spacer",
}: VerticalSpacerProps) => {
  return (
    <div
      className={`${styles.spacer} ${className || ""}`}
      data-testid={testId}
      role="separator"
      aria-orientation="vertical"
    />
  );
};
