/**
 * Apollo Client Configuration with Split Link (HTTP + WebSocket)
 *
 * This file sets up the Apollo Client for the FX Order Entry application.
 *
 * Architecture:
 * - HTTP Link: Used for queries and mutations (standard request/response)
 * - WebSocket Link: Used for subscriptions (real-time streaming data)
 * - Split Link: Routes operations to appropriate transport based on operation type
 *
 * Why Split Link?
 * GraphQL subscriptions require persistent connections (WebSocket), while
 * queries/mutations work better over HTTP. The split link automatically
 * routes each operation to the correct transport.
 *
 * Cache Policies:
 * - Default: cache-first (use cached data if available, good for reference data)
 * - Can be overridden per query with fetchPolicy option
 *
 * Environment Variables:
 * - VITE_GATOR_BFF_HTTP: HTTP endpoint for queries/mutations
 * - VITE_GATOR_BFF_SUBSCRIPTION: WebSocket endpoint for subscriptions
 */

import { createClient } from "graphql-ws";

import { ApolloClient, HttpLink, InMemoryCache, split } from "@apollo/client";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { getMainDefinition } from "@apollo/client/utilities";

// HTTP endpoint for queries and mutations
const httpUri = import.meta.env.VITE_GATOR_BFF_HTTP || "http://localhost:4000/graphql";

// WebSocket endpoint for subscriptions
const wsUri = import.meta.env.VITE_GATOR_BFF_SUBSCRIPTION || "ws://localhost:4000/graphql";

/**
 * HTTP Link
 * Handles queries and mutations over standard HTTP
 * Uses POST requests with JSON payload
 */
const httpLink = new HttpLink({
  uri: httpUri,
  // Credentials: 'include' would be needed for cookie-based auth
  // Currently disabled as backend has no auth
});

/**
 * WebSocket Link
 * Handles subscriptions over persistent WebSocket connection
 * Automatically reconnects on disconnect
 */
const wsLink = new GraphQLWsLink(
  createClient({
    url: wsUri,
    // Connection params can be used for auth tokens in future
    // connectionParams: () => ({ token: getAuthToken() }),

    // Retry connection on failure
    retryAttempts: 5,

    // Lazy connection: only connect when first subscription is made
    lazy: true,

    // Log connection events for debugging
    on: {
      connected: () => console.log("[GraphQL WS] Connected"),
      closed: () => console.log("[GraphQL WS] Connection closed"),
      error: (error) => console.error("[GraphQL WS] Error:", error),
    },
  })
);

/**
 * Split Link
 * Routes operations based on their type:
 * - subscription -> WebSocket Link
 * - query/mutation -> HTTP Link
 */
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return definition.kind === "OperationDefinition" && definition.operation === "subscription";
  },
  wsLink, // Route subscriptions through WebSocket
  httpLink // Route queries/mutations through HTTP
);

/**
 * Apollo Cache Configuration
 *
 * InMemoryCache settings:
 * - typePolicies: Define how specific types are cached and merged
 * - Default merge behavior: Replace entire object (not deep merge)
 *
 * Cache Policies Used:
 * - Reference data (accounts, currencyPairs): cache-first (rarely changes)
 * - Order data: network-only (must be fresh)
 * - Subscriptions: no-cache (real-time, don't cache)
 */
const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        // Cache accounts for 5 minutes (reference data, infrequent changes)
        accounts: {
          // cache-first policy applied at query level, not here
          // This field configuration can be used for custom merge logic
        },
        // Currency pairs are static per order type, cache them
        currencyPairs: {
          // Merge strategy: replace old data with new when orderType changes
          merge(existing, incoming) {
            return incoming; // Always use fresh data
          },
        },
      },
    },
  },
});

/**
 * Apollo Client Instance
 *
 * Default Options:
 * - watchQuery: cache-first (good for reference data dropdowns)
 * - query: cache-first (same as watchQuery for consistency)
 * - mutate: no-cache (always fresh, don't pollute cache with mutation results)
 */
export const graphqlClient = new ApolloClient({
  link: splitLink,
  cache,
  defaultOptions: {
    watchQuery: {
      // cache-first: Use cache if available, fetch from network if not
      // Good for reference data that doesn't change often (accounts, pools)
      fetchPolicy: "cache-first",
      errorPolicy: "all", // Return partial data + errors (useful for debugging)
    },
    query: {
      fetchPolicy: "cache-first",
      errorPolicy: "all",
    },
    mutate: {
      // network-only: Always execute mutation, never read from cache
      fetchPolicy: "no-cache",
      errorPolicy: "all",
    },
  },
  // Enable Apollo DevTools in development
  connectToDevTools: import.meta.env.DEV,
});

// Expose client globally for debugging (dev only)
if (import.meta.env.DEV) {
  (window as any).__APOLLO_CLIENT__ = graphqlClient;
}
