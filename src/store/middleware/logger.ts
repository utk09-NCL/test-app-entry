import { StateCreator } from "zustand";

export const loggerMiddleware =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  <T>(config: StateCreator<T, any, any>): StateCreator<T, any, any> =>
    (set, get, api) =>
      config(
        (args: T | Partial<T> | ((state: T) => T | Partial<T>)) => {
          console.log("  prev state", get());
          set(args);
          console.log("  new state", get());
          // Lightweight logging
        },
        get,
        api
      );
