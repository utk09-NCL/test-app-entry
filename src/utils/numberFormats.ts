/**
 * Number Formatting Utilities
 *
 * Consistent number formatting across the app using Intl.NumberFormat.
 *
 * Why Intl.NumberFormat?
 * - Built-in browser API (no libraries needed)
 * - Locale-aware (handles different currencies, decimal separators)
 * - Performant (caches formatters internally)
 *
 * Used by: AmountWithCurrency (notional display), TickingPrice (price display).
 */

/**
 * Format a number as currency.
 *
 * @param value - Numeric value to format (e.g., 1000000)
 * @param currency - Currency code (e.g., "USD", "GBP")
 * @returns Formatted string (e.g., "$1,000,000")
 *
 * @example
 * formatCurrency(1000000, "USD") → "$1,000,000"
 * formatCurrency(1500000, "GBP") → "£1,500,000"
 */
export const formatCurrency = (value: number, currency: string = "USD"): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0, // No cents for large amounts
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Format a price with specified decimal precision.
 *
 * @param price - Price value to format (e.g., 1.27345)
 * @param precision - Number of decimal places (default 5 for FX pips)
 * @returns Formatted price string (e.g., "1.27345")
 *
 * @example
 * formatPrice(1.27345, 5) → "1.27345"
 * formatPrice(1.5, 2) → "1.50"
 */
export const formatPrice = (price: number, precision: number = 5): string => {
  return price.toFixed(precision);
};
