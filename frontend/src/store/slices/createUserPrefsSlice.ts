/**
 * User Preferences Slice - Server-Provided User Defaults (Priority 2)
 *
 * This slice stores user-specific preferences loaded from the server.
 * These override hardcoded defaults but are overridden by FDC3 intents and user input.
 *
 * Priority: 2
 * Overrides: Defaults
 * Overridden by: FDC3 Intents, User Input
 *
 * Data Sources:
 * - globalUserPreferencesStream subscription (real-time updates)
 * - Could be extended to include persisted UI preferences
 *
 * Why separate from InitialOrderSlice?
 * - User prefs load asynchronously (subscription)
 * - They have different priority than defaults or FDC3 data
 * - Clear separation enables predictable state merging
 */

import { StateCreator } from "zustand";

import { UserPrefsLayerData } from "../../types/layers";
import { BoundState } from "../../types/store";

/**
 * User Preferences Slice Interface
 */
export interface UserPrefsSlice {
  /** User preferences from server */
  userPrefs: UserPrefsLayerData;
  /** Whether user preferences have been loaded */
  userPrefsLoaded: boolean;
  /** Set user preferences (called when subscription data arrives) */
  setUserPrefs: (prefs: Partial<UserPrefsLayerData>) => void;
  /** Mark user preferences as loaded (even if empty) */
  markUserPrefsLoaded: () => void;
  /** Clear user preferences (for testing or logout) */
  clearUserPrefs: () => void;
}

export const createUserPrefsSlice: StateCreator<
  BoundState,
  [["zustand/immer", never]],
  [],
  UserPrefsSlice
> = (set) => ({
  userPrefs: {},
  userPrefsLoaded: false,

  setUserPrefs: (prefs) =>
    set((state) => {
      state.userPrefs = { ...state.userPrefs, ...prefs };
      state.userPrefsLoaded = true;
    }),

  markUserPrefsLoaded: () =>
    set((state) => {
      state.userPrefsLoaded = true;
    }),

  clearUserPrefs: () =>
    set((state) => {
      state.userPrefs = {};
      state.userPrefsLoaded = false;
    }),
});
