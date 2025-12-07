/**
 * Zustand Store - Global State Management
 *
 * This is the single source of truth for the entire application.
 * The store uses the "slice pattern" to organize state into logical units.
 *
 * Middleware Stack (applied from inside-out):
 * 1. immer: Enables mutable state updates (drafts) for cleaner code
 * 2. devtools: Integration with Redux DevTools for state inspection
 * 3. loggerMiddleware: Console logging (currently disabled, see middleware/logger.ts)
 *
 * Architecture:
 * - Slices are independent state modules (like Redux reducers)
 * - Each slice has state + actions
 * - Slices can call actions from other slices (they see BoundState)
 * - TypeScript ensures type safety across slice boundaries
 *
 * Priority-Based State Layers:
 * The form state uses a layered architecture where multiple data sources
 * are merged with a defined priority order:
 * 1. Defaults (lowest) → 2. User Prefs → 3. FDC3 Intent → 4. User Input (highest)
 *
 * Why this architecture?
 * - FDC3 intents can arrive at any time (before or after other data)
 * - User preferences should override defaults but not FDC3 intents
 * - User input should override everything (they're actively editing)
 * - New FDC3 intents should reset user input (it's a new action)
 *
 * Debugging:
 * - Use Redux DevTools extension to inspect state and time-travel
 * - Access store directly in console: window.__ORDER_STORE__.getState()
 * - Enable logger middleware for console output (see middleware/logger.ts)
 *
 * Adding New Slices:
 * 1. Create slice file in slices/ folder
 * 2. Define slice interface in types/store.ts
 * 3. Add to BoundState intersection in types/store.ts
 * 4. Import and spread in store creation below
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

import { BoundState } from "../types/store";

import { loggerMiddleware } from "./middleware/logger";
import { createAppSlice } from "./slices/createAppSlice";
import { createDefaultsSlice } from "./slices/createDefaultsSlice";
import { createDerivedSlice } from "./slices/createDerivedSlice";
import { createFdc3IntentSlice } from "./slices/createFdc3IntentSlice";
import { createFieldOrderSlice } from "./slices/createFieldOrderSlice";
import { createPriceSlice } from "./slices/createPriceSlice";
import { createRefDataSlice } from "./slices/createRefDataSlice";
import { createSubmissionSlice } from "./slices/createSubmissionSlice";
import { createUserInteractionSlice } from "./slices/createUserInteractionSlice";
import { createUserPrefsSlice } from "./slices/createUserPrefsSlice";
import { createValidationSlice } from "./slices/createValidationSlice";

/**
 * Main Order Entry Store
 *
 * Slice Organization:
 * - AppSlice: Application lifecycle (INITIALIZING → READY → SUBMITTING)
 * - RefDataSlice: Server-loaded dropdown options (accounts, pools, currencies)
 * - DefaultsSlice: Hardcoded defaults (Priority 1)
 * - UserPrefsSlice: User preferences from server (Priority 2)
 * - Fdc3IntentSlice: FDC3 intent data from external apps (Priority 3)
 * - UserInteractionSlice: User manual input (Priority 4, highest)
 * - DerivedSlice: Computed form state (merges all layers)
 * - ValidationSlice: Client/server validation errors and warnings
 * - SubmissionSlice: Order submission and amendment logic
 * - PriceSlice: Current market prices (from TickingPrice)
 * - FieldOrderSlice: User's custom field ordering preferences
 *
 * Middleware stack visualization:
 * loggerMiddleware(
 *   devtools(
 *     immer(storeContent)
 *   )
 * )
 *
 * This means:
 * - State updates go through immer first (mutable drafts)
 * - Then devtools records the change
 * - Then logger (if enabled) logs it
 */
export const useOrderEntryStore = create<BoundState>()(
  loggerMiddleware(
    devtools(
      immer((...a) => ({
        // Order matters for readability, not functionality
        // (all slices are combined into single object)
        ...createAppSlice(...a),
        ...createRefDataSlice(...a),
        ...createDefaultsSlice(...a),
        ...createUserPrefsSlice(...a),
        ...createFdc3IntentSlice(...a),
        ...createUserInteractionSlice(...a),
        ...createDerivedSlice(...a),
        ...createValidationSlice(...a),
        ...createSubmissionSlice(...a),
        ...createPriceSlice(...a),
        ...createFieldOrderSlice(...a),
      })),
      { name: "Order_Entry_Store" } // Name shown in Redux DevTools
    )
  )
);

/**
 * Global store access for debugging.
 * Enables console access: window.__ORDER_STORE__.getState()
 */
declare global {
  interface Window {
    __ORDER_STORE__: typeof useOrderEntryStore;
  }
}

window.__ORDER_STORE__ = useOrderEntryStore;
