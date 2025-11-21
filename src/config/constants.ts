/**
 * Application-wide constants and magic values
 */

// Price Configuration
export const PRICE_CONFIG = {
  // Initial prices for ticking price simulation
  INITIAL_BUY_PRICE: 1.27345,
  INITIAL_SELL_PRICE: 1.27115,

  // Price tick configuration
  TICK_INTERVAL_MS: 1000,
  MAX_PRICE_CHANGE: 0.0002, // Maximum change per tick
  MIN_PRICE: 0.5,
  MAX_PRICE: 2.0,

  // Price input configuration
  PRICE_STEP: 0.0001,
  PRICE_DECIMALS: 5,
  MIN_VALID_PRICE: 0.00001,
} as const;

// Amount Configuration
export const AMOUNT_CONFIG = {
  MIN_AMOUNT: 1000,
  STEP_AMOUNT: 100000,
  DEFAULT_PLACEHOLDER: "1,000,000",
  MAX_FIRM_LIMIT: 50_000_000, // Server-side validation threshold
} as const;

// Validation Configuration
export const VALIDATION_CONFIG = {
  DEBOUNCE_MS: 300,
  SERVER_VALIDATION_DELAY_MS: 300, // Simulated network delay
} as const;

// Notional Limits
export const NOTIONAL_LIMITS = {
  MIN: 1,
  MAX: 1_000_000_000,
} as const;
