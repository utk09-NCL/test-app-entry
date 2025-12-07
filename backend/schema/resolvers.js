import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = join(__dirname, "../data");

// Helper to read/write JSON files
const readJSON = (filename) => {
  const path = join(DATA_DIR, filename);
  if (!existsSync(path)) {
    return null;
  }
  return JSON.parse(readFileSync(path, "utf-8"));
};

const writeJSON = (filename, data) => {
  const path = join(DATA_DIR, filename);
  writeFileSync(path, JSON.stringify(data, null, 2));
};

// Price simulation
const generatePrice = (base, variance = 0.0002) => {
  const change = (Math.random() - 0.5) * variance;
  return Math.max(0.5, Math.min(2.0, base + change));
};

// Active subscriptions storage
const priceSubscriptions = new Map(); // currencyPair -> interval
const orderSubscriptions = new Map(); // orderId -> interval

// Global User Preferences subscription management.
// We store subscriber iterator objects that expose an emit(payload) method so we can
// push real-time updates (e.g. immediately after mutateGlobalUserPreferences).
const userPrefsSubscriptions = new Set();

export const resolvers = {
  Query: {
    accounts: () => {
      return readJSON("accounts.json") || [];
    },

    currencyPairs: (_, { orderType }) => {
      const pairs = readJSON("currencyPairs.json") || [];
      // In a real system, you'd filter by orderType, currently just log orderType and return all
      console.log(`[QUERY] currencyPairs with orderType: ${orderType}`);
      return pairs;
    },

    orderTypesWithPools: () => {
      return readJSON("orderTypesWithPools.json") || [];
    },

    currencyPair: (_, { currencyPairId }) => {
      const pairs = readJSON("currencyPairs.json") || [];
      const pair = pairs.find((p) => p.id === currencyPairId);
      if (!pair) {
        throw new Error(`Currency pair ${currencyPairId} not found`);
      }

      // Generate tenor info
      const tenors = ["SPOT", "1W", "1M", "3M", "6M", "1Y"];
      const tenorInfos = tenors.map((tenor) => ({
        tenorCode: tenor,
        valueDate: new Date(
          Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000
        )
          .toISOString()
          .split("T")[0],
      }));

      return {
        id: pair.id,
        tenorInfos,
      };
    },

    validateField: async (_, { input }) => {
      const { field, value, orderType, symbol, account, liquidityPool } =
        input || {};

      const fail = (message, type = "HARD") => ({
        field,
        ok: false,
        type,
        message,
      });

      const pass = () => ({ field, ok: true, type: null, message: null });

      // Basic field-level checks
      try {
        // Number helpers
        const toNum = (v) =>
          v === null || v === undefined || v === "" ? NaN : Number(v);

        if (field === "notional") {
          const n = toNum(value);
          if (!Number.isFinite(n)) {
            return fail("Amount must be a number");
          }
          if (n <= 0) {
            return fail("Amount must be positive");
          }
          if (n > 1_000_000_000) {
            return fail("Exceeds firm trading limit", "SOFT");
          }
          return pass();
        }

        if (field === "limitPrice" || field === "stopPrice") {
          const p = toNum(value);
          if (!Number.isFinite(p)) {
            return fail("Price must be a number");
          }
          if (p <= 0) {
            return fail("Price must be positive");
          }
          return pass();
        }

        if (field === "account" && account) {
          const accounts = readJSON("accounts.json") || [];
          const exists = accounts.some(
            (a) => String(a.sdsId) === String(account)
          );
          if (!exists) {
            return fail("Account not available");
          }
          return pass();
        }

        if (field === "liquidityPool" && liquidityPool) {
          const otp = readJSON("orderTypesWithPools.json") || [];
          const allPools = new Set();
          otp.forEach((ot) =>
            (ot.liquidityPools || []).forEach((p) => allPools.add(p.value))
          );
          if (!allPools.has(liquidityPool)) {
            return fail("Liquidity pool not available");
          }
          return pass();
        }

        if (field === "symbol" && symbol) {
          const ccy = readJSON("currencyPairs.json") || [];
          const exists = ccy.some((cp) => cp.symbol === symbol);
          if (!exists) {
            return fail("Currency pair not available");
          }
          return pass();
        }

        // Default: pass
        return pass();
      } catch (e) {
        console.error("[validateField] Error:", e);
        return fail("Validation error, please retry");
      }
    },
  },

  Mutation: {
    createOrder: (_, { orderEntry }) => {
      const orderId = uuidv4();
      const orders = readJSON("orders.json") || {};

      orders[orderId] = {
        orderId,
        omsOrderId: `OMS-${orderId.substring(0, 8)}`,
        order: {
          ...orderEntry,
          amount: {
            amount: orderEntry.amount,
            ccy: orderEntry.ccy,
          },
          account: {
            sdsId: orderEntry.account,
            name: "Account Name", // Would lookup from accounts
          },
        },
        execution: {
          agent: "GATOR",
          averageFillRate: 0,
          filled: {
            amount: 0,
            ccy: orderEntry.ccy,
          },
          status: "PENDING",
          targetEndTime: null,
        },
        createdAt: new Date().toISOString(),
      };

      writeJSON("orders.json", orders);

      console.log(`[CREATE ORDER] Order ${orderId} created`);

      return {
        orderId,
        result: "SUCCESS",
        failureReason: null,
      };
    },

    amendOrder: (_, { amendOrder }) => {
      const orders = readJSON("orders.json") || {};
      const order = orders[amendOrder.orderId];

      if (!order) {
        return {
          orderId: amendOrder.orderId,
          result: "FAILURE",
          failureReason: "Order not found",
        };
      }

      // Update order fields
      if (amendOrder.amount !== undefined) {
        order.order.amount.amount = amendOrder.amount;
      }
      if (amendOrder.limitPrice !== undefined) {
        order.order.level = amendOrder.limitPrice;
      }
      if (amendOrder.timeInForce !== undefined) {
        order.order.expiry = { strategy: amendOrder.timeInForce };
      }

      writeJSON("orders.json", orders);

      console.log(`[AMEND ORDER] Order ${amendOrder.orderId} amended`);

      return {
        orderId: amendOrder.orderId,
        result: "SUCCESS",
        failureReason: null,
      };
    },

    cancelOrder: (_, { orderId }) => {
      const orders = readJSON("orders.json") || {};
      const order = orders[orderId];

      if (!order) {
        return {
          orderId,
          result: "FAILURE",
          failureReason: "Order not found",
        };
      }

      order.execution.status = "CANCELLED";
      writeJSON("orders.json", orders);

      console.log(`[CANCEL ORDER] Order ${orderId} cancelled`);

      return {
        orderId,
        result: "SUCCESS",
        failureReason: null,
      };
    },

    fillOrder: (_, { orderId }) => {
      const orders = readJSON("orders.json") || {};
      const order = orders[orderId];

      if (!order) {
        return {
          orderId,
          result: "FAILURE",
          failureReason: "Order not found",
        };
      }

      order.execution.status = "FILLED";
      order.execution.filled.amount = order.order.amount.amount;
      order.execution.averageFillRate = order.order.level || 1.27;

      writeJSON("orders.json", orders);

      console.log(`[FILL ORDER] Order ${orderId} filled`);

      return {
        orderId,
        result: "SUCCESS",
        failureReason: null,
      };
    },

    cancelInstrumentAction: (_, { ccyPair }) => {
      console.log(`[CANCEL INSTRUMENT] ${ccyPair.symbol}`);

      return {
        userId: "user-123",
        result: "SUCCESS",
        failureReason: null,
      };
    },

    mutateGlobalUserPreferences: (_, { updateGlobalUserPreferenceRequest }) => {
      const prefs = readJSON("userPreferences.json") || {
        defaultGlobalAccount: null,
      };

      if (updateGlobalUserPreferenceRequest.defaultGlobalAccount) {
        prefs.defaultGlobalAccount = {
          sdsId: updateGlobalUserPreferenceRequest.defaultGlobalAccount,
          name: "Default Account",
        };
      }

      writeJSON("userPreferences.json", prefs);

      console.log("[USER PREFS] Updated global preferences");
      // Immediately broadcast new preferences to all active subscribers
      const payload = { globalUserPreferencesStream: prefs };
      userPrefsSubscriptions.forEach((sub) => {
        if (typeof sub.emit === "function") {
          sub.emit(payload);
        }
      });
      return prefs;
    },
  },

  Subscription: {
    orderData: {
      subscribe: async function* (_, { orderId }) {
        console.log(`[SUB] Order data subscription for ${orderId}`);

        const orders = readJSON("orders.json") || {};
        let order = orders[orderId];

        if (!order) {
          throw new Error(`Order ${orderId} not found`);
        }

        // Send initial state
        yield { orderData: order };

        // Simulate order lifecycle
        const interval = setInterval(() => {
          const currentOrders = readJSON("orders.json") || {};
          const currentOrder = currentOrders[orderId];

          if (currentOrder) {
            // Simulate partial fills
            if (currentOrder.execution.status === "PENDING") {
              currentOrder.execution.status = "WORKING";
            } else if (currentOrder.execution.status === "WORKING") {
              const fillPercent = Math.min(
                currentOrder.execution.filled.amount /
                  currentOrder.order.amount.amount +
                  0.1,
                1
              );
              currentOrder.execution.filled.amount =
                currentOrder.order.amount.amount * fillPercent;

              if (fillPercent >= 1) {
                currentOrder.execution.status = "FILLED";
              } else if (fillPercent > 0) {
                currentOrder.execution.status = "PARTIALLY_FILLED";
              }
            }

            writeJSON("orders.json", currentOrders);
          }
        }, 2000);

        // Store subscription
        orderSubscriptions.set(orderId, interval);

        // Stream updates
        while (true) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          const currentOrders = readJSON("orders.json") || {};
          const currentOrder = currentOrders[orderId];

          if (currentOrder) {
            yield { orderData: currentOrder };

            if (
              currentOrder.execution.status === "FILLED" ||
              currentOrder.execution.status === "CANCELLED"
            ) {
              clearInterval(interval);
              orderSubscriptions.delete(orderId);
              break;
            }
          }
        }
      },
    },

    orderFailure: {
      subscribe: async function* (_, { orderId }) {
        console.log(`[SUB] Order failure subscription for ${orderId}`);

        // Simulate random failures (10% chance)
        await new Promise((resolve) => setTimeout(resolve, 3000));

        if (Math.random() < 0.1) {
          yield {
            orderFailure: {
              description: "Liquidity pool unavailable",
              errorCode: "ERR_LIQUIDITY",
              reason: "TEMPORARY",
            },
          };
        }
      },
    },

    gatorData: {
      subscribe: async function* (_, { subscription }) {
        const currencyPair = subscription?.currencyPair || "GBPUSD";
        console.log(`[SUB] Gator data subscription for ${currencyPair}`);

        let buyPrice = 1.27345;
        let sellPrice = 1.27115;

        const interval = setInterval(() => {
          buyPrice = generatePrice(buyPrice);
          sellPrice = generatePrice(sellPrice, 0.00015);
        }, 1000);

        priceSubscriptions.set(currencyPair, interval);

        while (true) {
          yield {
            gatorData: {
              topOfTheBookBuy: {
                price: buyPrice,
                precisionValue: Math.round(buyPrice * 100000) / 100000,
              },
              topOfTheBookSell: {
                price: sellPrice,
                precisionValue: Math.round(sellPrice * 100000) / 100000,
              },
            },
          };

          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      },
    },

    globalUserPreferencesStream: {
      // Custom async iterator allowing push-based and interval updates
      subscribe: () => {
        console.log("[SUB] Global user preferences subscription (registered)");

        // Queue + push pattern for backpressure friendly async iterator
        const queue = [];
        let pendingResolve = null;
        let active = true;

        // Helper to enqueue or immediately resolve next value
        const push = (value) => {
          if (!active) return;
          if (pendingResolve) {
            const resolve = pendingResolve;
            pendingResolve = null;
            resolve({ value, done: false });
          } else {
            queue.push(value);
          }
        };

        // Emit method exposed for mutations to broadcast immediately
        const iterator = {
          next: () => {
            if (!active)
              return Promise.resolve({ value: undefined, done: true });
            if (queue.length > 0) {
              return Promise.resolve({ value: queue.shift(), done: false });
            }
            return new Promise((resolve) => {
              pendingResolve = resolve;
            });
          },
          return: () => {
            active = false;
            clearInterval(intervalId);
            userPrefsSubscriptions.delete(iterator);
            return Promise.resolve({ value: undefined, done: true });
          },
          throw: (err) => {
            active = false;
            clearInterval(intervalId);
            userPrefsSubscriptions.delete(iterator);
            return Promise.reject(err);
          },
          [Symbol.asyncIterator]() {
            return this;
          },
          emit: (payload) => push(payload),
        };

        // Register subscriber
        userPrefsSubscriptions.add(iterator);

        // Initial immediate payload
        const initialPrefs = readJSON("userPreferences.json") || {
          defaultGlobalAccount: null,
        };
        push({ globalUserPreferencesStream: initialPrefs });

        // Periodic polling every 5s to refresh (so manual edits to JSON file also appear)
        const intervalId = setInterval(() => {
          const prefs = readJSON("userPreferences.json") || {
            defaultGlobalAccount: null,
          };
          push({ globalUserPreferencesStream: prefs });
        }, 5000);

        return iterator;
      },
    },
  },
};
