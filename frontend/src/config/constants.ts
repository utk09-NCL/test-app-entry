/**
 * Application-wide constants and configuration values.
 *
 * This file centralizes all magic numbers and configuration to:
 * - Improve maintainability (change in one place)
 * - Make values self-documenting
 * - Enable easy configuration per environment
 *
 * All constants use `as const` to ensure type safety and prevent modification.
 */

/**
 * Price Configuration
 * Settings for price display and simulation in the TickingPrice component.
 */
export const PRICE_CONFIG = {
  /** Initial buy price for demo/simulation (e.g., GBP/USD rate) */
  INITIAL_BUY_PRICE: 1.27345,
  /** Initial sell price (typically slightly lower than buy) */
  INITIAL_SELL_PRICE: 1.27115,

  /** How often prices update in milliseconds (1 second) */
  TICK_INTERVAL_MS: 1000,
  /** Maximum price change per tick (0.02% movement) */
  MAX_PRICE_CHANGE: 0.0002,
  /** Minimum price boundary for simulation */
  MIN_PRICE: 0.5,
  /** Maximum price boundary for simulation */
  MAX_PRICE: 2.0,

  /** Step increment for price inputs (0.0001 = 1 pip for most FX pairs) */
  PRICE_STEP: 0.0001,
  /** Number of decimal places to display for prices */
  PRICE_DECIMALS: 5,
  /** Minimum valid price for validation (prevents zero/negative) */
  MIN_VALID_PRICE: 0.00001,
} as const;

/**
 * Amount Configuration
 * Settings for notional amount inputs.
 */
export const AMOUNT_CONFIG = {
  /** Minimum notional amount (e.g., $1,000 minimum trade) */
  MIN_AMOUNT: 1000,
  /** Step increment for amount input (e.g., 100k increments) */
  STEP_AMOUNT: 100000,
  /** Placeholder text shown in amount input */
  DEFAULT_PLACEHOLDER: "1,000,000",
  /** Threshold for server-side "exceeds firm limit" validation */
  MAX_FIRM_LIMIT: 50_000_000,
} as const;

/**
 * Validation Configuration
 * Timing settings for validation debouncing and async operations.
 */
export const VALIDATION_CONFIG = {
  /** Debounce delay for field validation (ms) - prevents validation on every keystroke */
  DEBOUNCE_MS: 300,
  /** Simulated network delay for async validation (ms) */
  SERVER_VALIDATION_DELAY_MS: 300,
} as const;

/**
 * Notional Limits
 * Hard limits for order notional amounts.
 */
export const NOTIONAL_LIMITS = {
  /** Absolute minimum notional (e.g., $1 minimum) */
  MIN: 1,
  /** Absolute maximum notional (e.g., $100 billion cap - client-side hard limit) */
  MAX: 100_000_000_000,
} as const;
