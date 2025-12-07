/**
 * Layer Types - Priority-Based State Management
 *
 * This file defines types for the layered state architecture where multiple
 * data sources are merged with a defined priority order.
 *
 * Priority Order (lowest to highest):
 * 1. DEFAULTS - Hardcoded application defaults
 * 2. USER_PREFS - User preferences from server
 * 3. FDC3_INTENT - Data from FDC3 intents (external apps)
 * 4. USER_INPUT - Manual user input in the form
 *
 * Higher priority values override lower priority values.
 * The final form state is computed by merging all layers.
 *
 * Why this architecture?
 * - FDC3 intents can arrive at any time (before or after other data loads)
 * - User preferences should override defaults but not FDC3 intents
 * - User input should override everything (they're actively editing)
 * - New FDC3 intents should override user input (it's a new action)
 */

import { OrderStateData } from "./domain";

/**
 * Priority levels for state layers.
 * Used for debugging and logging, not runtime logic.
 */
export enum LayerPriority {
  DEFAULTS = 1,
  USER_PREFS = 2,
  FDC3_INTENT = 3,
  USER_INPUT = 4,
}

/**
 * Fields that can come from hardcoded defaults.
 * These are always present as fallback values.
 * Uses server-aligned naming (currencyPair, side, amount).
 */
export type DefaultsLayerData = Pick<
  OrderStateData,
  "currencyPair" | "side" | "orderType" | "amount" | "liquidityPool" | "startMode" | "expiry"
>;

/**
 * Fields that can come from user preferences.
 * Server-provided defaults for the specific user.
 */
export interface UserPrefsLayerData {
  /** Default account from user preferences */
  defaultAccount?: string;
  /** Default liquidity pool preference */
  defaultLiquidityPool?: string;
  /** Default order type preference */
  defaultOrderType?: string;
  /** Default time in force preference */
  defaultTimeInForce?: string;
}

/**
 * Fields that can come from FDC3 intents.
 * External applications send this data to pre-populate the form.
 * Uses server-aligned naming (currencyPair, side, amount).
 */
export interface Fdc3IntentLayerData {
  /** Currency pair from intent */
  currencyPair?: string;
  /** Trade direction from intent */
  side?: string;
  /** Order type from intent */
  orderType?: string;
  /** Amount from intent */
  amount?: { amount: number; ccy: string };
  /** Level/price from intent */
  level?: number;
  /** Account from intent */
  account?: { name: string; sdsId: number };
  /** Liquidity pool from intent */
  liquidityPool?: string;
  /** Order ID for amending */
  orderId?: string;
  /** Timestamp when intent was received */
  receivedAt?: number;
  /** Whether this intent has been acknowledged by the user */
  acknowledged?: boolean;
}

/**
 * Fields that come from user manual input.
 * Partial because user may not have edited all fields.
 */
export type UserInputLayerData = Partial<OrderStateData>;

/**
 * Metadata about an FDC3 intent for tracking and confirmation.
 */
export interface Fdc3IntentMetadata {
  /** Unique ID for this intent */
  intentId: string;
  /** Timestamp when intent was received */
  receivedAt: number;
  /** Source application (if available) */
  sourceApp?: string | undefined;
  /** Whether intent was auto-applied or waiting for confirmation */
  status: "pending" | "applied" | "rejected";
}

/**
 * Result of merging all layers.
 * Includes the final values and source information for debugging.
 */
export interface MergedFormState {
  /** Final merged values for the form */
  values: OrderStateData;
  /** Which layer each field value came from (for debugging) */
  sources: Partial<Record<keyof OrderStateData, LayerPriority>>;
}
