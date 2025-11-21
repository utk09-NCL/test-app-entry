# FX Order Entry Application Requirements

## 1. Overview

Develop a React-based Single Page Application (SPA) for entering Foreign Exchange (FX) trade orders. The application must support dynamic forms, complex state management, and real-time updates, running seamlessly in both standard web browsers and OpenFin containers.

## 2. Core Features

### 2.1. Dynamic Order Form

- **Fields:**
  - **Order Type:** Dropdown (Limit, Market, Stop Loss, Take Profit, Fixing, etc.) populated via WebSocket GraphQL query.
  - **Liquidity Pool:** Dropdown populated via WebSocket GraphQL query.
  - **Direction:** Inline Toggle (Buy/Sell).
  - **Limit Price:** Numeric input.
  - **Notional:** Numeric input.
  - **Iceberg Amount:** Numeric input.
  - **Start Time:** Dropdown (Start Now, Start At).
  - **Good Till:** Dropdown (GTC, GTD, IOC, FOK).
  - **Account:** Dropdown populated via WebSocket GraphQL query.
  - **Actions:** Submit, Cancel, Fill Now, Suspend, Resume.
- **Dynamic Behavior:** The form must adjust fields based on the selected `Order Type`. A configuration object should define visibility, requirement status, and order of fields for each type.

### 2.2. Validation

- **Library:** Use `valibot`.
- **Rules:**
  - Validation rules must be dynamic based on `Order Type`.
  - Support "Soft Validation" (warnings) and "Hard Validation" (errors).
  - Handle server-side validation errors returned upon submission.
- **UX:**
  - Debounced validation (50ms) on field changes.
  - Visual indicators (spinners) for async validation (e.g., price band checks).

### 2.3. State Management (Zustand)

- **No Form Libraries:** Do not use Formik or React Hook Form.
- **Architecture:** Use a "Layered State" approach with a single store `useOrderEntryStore` composed of:
  - **`initialOrderSlice`:** Base data derived from defaults, user preferences (via GraphQL), and FDC3 intents.
  - **`userInteractionSlice`:** Captures user edits (deltas).
  - **`formDataSlice` (Computed):** Merges `initialOrderSlice` + `userInteractionSlice` to produce the final submission payload.

### 2.4. Data Layering & Initialization Flow

1. **Default Launch:**
   - Load default order values.
   - Fetch reference data (Pools, Accounts, Order Types) via WebSocket.
   - Apply User Preferences (Preferred Account/Pool) via WebSocket.
   - **Result:** Populates `initialOrderSlice`.
2. **FDC3 Intent Launch:**
   - Perform all steps from "Default Launch".
   - Apply FDC3 Intent data (e.g., pre-filled Symbol, Notional) on top.
   - **Result:** Updates `initialOrderSlice`.
3. **User Interaction:**
   - User edits are stored in `userInteractionSlice`.
   - **Final Form Data** = `initialOrderSlice` merged with `userInteractionSlice`.

### 2.5. Order Lifecycle

- **Submission:**
  - On Submit, send data to server.
  - Handle server response (OrderId or Validation Errors).
- **Post-Submission (Read-Only):**
  - Upon success, switch UI to Read-Only mode.
  - Subscribe to `Order Status` updates via WebSocket GraphQL (Filled Qty, Status, etc.).
- **Amendment:**
  - User can click "AMEND" to make the form editable again.
  - Re-enables validation and submission logic.

## 3. Technical Constraints

- **Framework:** React (Functional Components, Hooks).
- **Environment:** Browser & OpenFin.
- **Interoperability:** Handle FDC3 Intents (e.g., "ViewInstrument", "NewOrder").

---

## Technical Specification: FX Order Entry SPA

## 1. Architectural Principles

### 1.1. The "Layered State" Philosophy

To manage the complexity of multiple data sources (FDC3, User Prefs, Manual Input) without conflicts, we treat the application state like Photoshop layers.

- **Layer 0 (Bottom): Reference Data.** Read-only lists (Accounts, Pools).
- **Layer 1: Base State (`initialOrderSlice`).** The "starting point" for the form. Populated by Defaults, User Prefs, or FDC3 Intents.
- **Layer 2: User Delta (`userInteractionSlice`).** The "changes" made by the user. Only stores what has been touched.
- **Layer 3 (Top): Computed View (`computedSlice`).** The merge of Layer 1 + Layer 2. This is what the UI renders and what executes validation.

### 1.2. Strict Unidirectional Flow

1. **External Event** (User Click, WebSocket Message, FDC3 Context) -> **Triggers Action**.
2. **Action** -> **Updates Store Slice**.
3. **Store Update** -> **Triggers Derived Calculations** (Merge layers, run validation).
4. **UI Components** -> **Subscribe to Specific Selectors** and re-render.

### 1.3. The "No-Routing" SPA

Since this is a single view application (potentially running inside a small OpenFin window):

- We will **not** use `react-router`.
- We will use a **State-Driven View Manager**. The `status` in the `AppSlice` (`INITIALIZING` | `READY` | `SUBMITTING` | `READ_ONLY`) determines which high-level component is visible.

---

## 2. Directory Structure & File Responsibilities

Create exactly this structure. Do not deviate unless necessary for build tooling.

```text
src/
├── api/                        # External Communication
│   ├── fdc3/
│   │   ├── fdc3Service.ts      # Singleton. Abstraction over window.fdc3
│   │   └── intentMapper.ts     # Pure function: FDC3 Context -> Partial<Order>
│   ├── websocket/
│   │   ├── socketService.ts    # Singleton. Wrapper around graphql-ws.
│   │   └── topics.ts           # Enum of subscription topics
│   └── server/
│       └── orderApi.ts         # HTTP methods for POST /submit (if not using WS for submit)
│
├── assets/                     # Static Images/Icons
├── components/
│   ├── atoms/                  # Dumb primitives (Input, Button, Spinner)
│   ├── molecules/              # Composite UI
│   │   ├── RowComponent.tsx    # [Label | Input | Error | Spinner] wrapper
│   │   └── StatusBadge.tsx     # Visual pill for order status
│   ├── organisms/              # Business Logic UI
│   │   ├── OrderForm.tsx       # The Dynamic Form Renderer
│   │   ├── OrderHeader.tsx     # Symbol/Account selection
│   │   └── OrderSummary.tsx    # Post-trade read-only view
│   └── templates/
│       └── MainLayout.tsx      # Global wrapper (Toast providers, etc.)
│
├── config/
│   ├── fieldRegistry.ts        # Mapping: 'limitPrice' -> InputNumberComponent
│   ├── orderConfig.ts          # Rules: Which fields belong to which OrderType
│   └── validation.ts           # Valibot schema definitions
│
├── hooks/
│   ├── useOrderEntryStore.ts   # The BOUND STORE hook (facade)
│   ├── useDebounce.ts          # Standard debounce hook
│   ├── useKeyboardHotkeys.ts           # Keyboard shortcut listener
│   └── useAppInit.ts           # Hook to trigger initial data load
│
├── store/                      # ZUSTAND LOGIC
│   ├── middleware/
│   │   └── logger.ts           # Custom middleware for console logging
│   ├── slices/
│   │   ├── createAppSlice.ts           # InstanceId, View Status
│   │   ├── createRefDataSlice.ts       # Accounts, Pools
│   │   ├── createInitialOrderSlice.ts  # Base Layer
│   │   ├── createUserInteractionSlice.ts # Delta Layer
│   │   └── createComputedSlice.ts      # Merging Logic & Validation State
│   └── index.ts                # Store composition (createBoundStore)
│
├── types/
│   ├── domain.ts               # Business Entities (Order, Account, etc.)
│   └── store.ts                # TypeScript Interfaces for Slices
│
├── utils/
│   ├── idGenerator.ts          # UUID generator
│   └── numberFormats.ts        # FX specific formatting
│
├── App.tsx                     # Root component
└── main.tsx                    # Entry point
```

---

## 3. The Store Implementation (Step-by-Step Recipe)

This is the heart of the application. We will use the **Slice Pattern**.

### Step 3.1: Define Types (`src/types/store.ts`)

Define the shape of your data before writing logic.

```typescript
export interface OrderStateData {
    // The "Merged" final object used for submission
    symbol: string;
    direction: 'BUY' | 'SELL';
    orderType: string;
    notional: number;
    // ... other fields
}

export interface AppSlice {
    instanceId: string;
    status: 'LOADING' | 'READY' | 'SUBMITTING' | 'SUCCESS' | 'ERROR';
    setStatus: (status: AppSlice['status']) => void;
}

export interface InitialOrderSlice {
    baseValues: Partial<OrderStateData>;
    setBaseValues: (values: Partial<OrderStateData>) => void; // Called by FDC3/Prefs
}

export interface UserInteractionSlice {
    dirtyValues: Partial<OrderStateData>;
    touchedFields: Record<string, boolean>;
    setFieldValue: (field: keyof OrderStateData, value: any) => void;
    resetFormInteractions: () => void;
}

export interface ComputedSlice {
    // Getters
    getDerivedValues: () => OrderStateData; // Merges Base + Dirty

    // Validation State
    errors: Record<string, string>;
    serverErrors: Record<string, string>;
    isValidating: Record<string, boolean>;
    validationRequestIds: Record<string, number>; // For async race condition handling

    // Actions
    validateField: (field: string, value: any) => Promise<void>;
    submitOrder: () => Promise<void>;
}
```

### Step 3.2: Create Slices (`src/store/slices/`)

**File: `createAppSlice.ts`**

- **Do:** Generate `instanceId` immediately.
- **Do:** Use simple setters.

**File: `createInitialOrderSlice.ts`**

- **Logic:** This slice is "dumb". It just holds data pumped in from the outside (WebSockets/FDC3).
- **Warning:** When `setBaseValues` is called (e.g., incoming FDC3 intent), you must generally *also* clear the `UserInteractionSlice` to prevent stale user inputs from overriding the new intent.

**File: `createUserInteractionSlice.ts`**

- **Logic:**

    ```typescript
    setFieldValue: (field, value) => set((state) => ({
        dirtyValues: { ...state.dirtyValues, [field]: value },
        touchedFields: { ...state.touchedFields, [field]: true }
    }))
    ```

**File: `createComputedSlice.ts`** (The Brain)

- **Critical Recipe:**
    1. Inject `get()` into the slice creator to access other slices.
    2. Implement `getDerivedValues`:

        ```typescript
        getDerivedValues: () => {
            const base = get().baseValues;
            const dirty = get().dirtyValues;
            return { ...base, ...dirty }; // Delta wins
        }
        ```

    3. Implement `validateField` (See Section 7.1 for Async Logic).

### Step 3.3: Bind the Store (`src/store/index.ts`)

Follow the exact pattern from your documentation.

```typescript
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { loggerMiddleware } from './middleware/logger';
// import slices...

export const useOrderEntryStore = create<BoundState>()(
  loggerMiddleware(
    devtools(
      (...a) => ({
        ...createAppSlice(...a),
        ...createInitialOrderSlice(...a),
        ...createUserInteractionSlice(...a),
        ...createComputedSlice(...a),
      }),
      { name: 'Order_Entry_UI_Store' }
    )
  )
);

// Expose for debugging
(window as any).__ORDER_STORE__ = useOrderEntryStore;
```

---

## 4. Configuration Engines (The "Dynamic" Part)

Do not hardcode forms in JSX.

### 4.1. Field Registry (`src/config/fieldRegistry.ts`)

A dictionary mapping field names to their definitions.

```typescript
export const FIELD_REGISTRY = {
    notional: {
        label: 'Amount',
        component: 'InputNumber', // String reference to component
        props: { min: 1000, step: 10000 }
    },
    limitPrice: {
        label: 'Limit Price',
        component: 'InputNumber',
        props: { precision: 5 }
    },
    // ...
};
```

### 4.2. Order Logic (`src/config/orderConfig.ts`)

Defines the form structure per Order Type.

```typescript
export const ORDER_TYPES = {
  TAKE_PROFIT: {
        fields: ['direction', 'liquidityPool', 'notional', 'limitPrice', 'timeInForce', 'account'],
        validationSchema: TakeProfitOrderSchema,
        initialFocus: 'limitPrice' // Field to focus when this type is selected
    },
    LIMIT: {
        fields: ['direction', 'liquidityPool', 'notional', 'limitPrice', 'timeInForce', 'account'],
        validationSchema: LimitOrderSchema,
        initialFocus: 'limitPrice' // Field to focus when this type is selected
    },
    MARKET: {
        fields: ['direction', 'liquidityPool', 'notional', 'account'],
        validationSchema: MarketOrderSchema,
        initialFocus: 'notional'
    }
};
```

---

## 5. Component Implementation Details

### 5.1. `RowComponent` (Layout)

- **Responsibility:** Consistent spacing, label alignment, and error rendering.

- **Props:** `label`, `error` (string | null), `isValidating` (boolean), `children`.
- **Visuals:** Use CSS Grid/Flexbox to ensure labels align perfectly vertically.
- **Do:** Show a small spinner icon if `isValidating` is true.

### 5.2. `OrderForm` (The Renderer)

- **Recipe:**
    1. Connect to store: `const { orderType } = useOrderEntryStore(state => state.getDerivedValues())`.
    2. Connect to actions: `const update = useOrderEntryStore(state => state.setFieldValue)`.
    3. Lookup config: `const config = ORDER_TYPES[orderType]`.
    4. **Loop:** Map over `config.fields`.
    5. **Render:**

        ```tsx
        return config.fields.map(fieldKey => {
            const def = FIELD_REGISTRY[fieldKey];
            const value = derivedValues[fieldKey];
            const error = errors[fieldKey];
            const validating = isValidating[fieldKey];

            return (
                <RowComponent key={fieldKey} label={def.label} error={error} isValidating={validating}>
                    <InputComponent
                        value={value}
                        onChange={(v) => update(fieldKey, v)}
                        {...def.props}
                    />
                </RowComponent>
            )
        })
        ```

### 5.3. Accessibility & Shortcuts

- **Focus Management:**
  - When `OrderType` changes, the form structure changes. We must programmatically move focus to the `initialFocus` field defined in `ORDER_TYPES`.
  - Use a `useEffect` in `OrderForm` that triggers on `orderType` change.

- **Global Shortcuts (useKeyboardHotkeys hook):**
  - `Ctrl + Enter`: Trigger `submitOrder()`.
  - `Esc`: Trigger `resetFormInteractions()` (if dirty) or Cancel.
  - `Shift + F`: Focus the 'Notional' field (speed entry).
  - **Tab Index:** Ensure the `OrderConfig` fields array order is respected by the DOM order for natural tabbing.

---

## 6. External Integrations (FDC3 & WebSocket)

### 6.1. FDC3 Service

- **Pattern:** Singleton Class.

- **Initialization:** Called in `useAppInit` hook.
- **Logic:**
  - Calls `fdc3.addIntentListener('OrderEntry', ctx => handleContext(ctx))`.
  - `handleContext` parses the object, then calls `store.getState().setBaseValues(parsedData)` AND `store.getState().resetFormInteractions()`.
  - **Why reset interactions?** As per requirements, Intents are user-initiated and must always take priority over current manual inputs.

### 6.2. WebSocket (GraphQL)

- **Library:** Already using `graphql-ws` with Apollo Client. Utilise `useQuery` and `useSubscription` and `useMutation` hooks as needed. I have codegen as well for queries, subscriptions, and mutations which generates types. Use `<ApolloProvider> client={GATOR_CLIENT}` at the root of the app. Assume `GATOR_CLIENT` is already configured, connected, and authenticated. Assume all queries/subscriptions/mutations are already defined in the backend. Name as you like for all queries/subscriptions/mutations related to Order Entry and add comment explaining what you're using them for. I can swap them with actual one's later. For naming, use the following conventions:
  - Queries: `GET_<DATA>_QUERY` (e.g., `GET_ACCOUNTS_QUERY`)
  - Subscriptions: `ON_<EVENT>_SUBSCRIPTION` (e.g., `ON_ORDER_STATUS_UPDATE_SUBSCRIPTION`)
  - Mutations: `<ACTION>_MUTATION` (e.g., `SUBMIT_ORDER_MUTATION`)

---

## 7. Validation & Debounce Strategy

- **Problem:** We don't want to validate on every keystroke (expensive server checks).
- **Solution:**
    1. **Input Component:** Calls `store.setFieldValue` immediately on change. (UI updates instantly).
    2. **Debounce Hook:** Create a `useEffect` in a "Validation Controller" (or inside the input component) that watches the value.
    3. **Effect:**

        ```typescript
        useEffect(() => {
            const timer = setTimeout(() => {
                store.validateField(fieldName, value); // Triggers Sync + Async
            }, 50); // 50ms delay - create a const on top for easy tuning
            return () => clearTimeout(timer);
        }, [value]);
        ```

### 7.1. Handling Async Race Conditions

To prevent stale validation responses (e.g., "100" response arriving after "1000" request) from overwriting newer states:

- **Mechanism:** The `ComputedSlice` maintains a `validationRequestIds` map (field -> counter).
- **Logic in `validateField`:**
  1. Increment `requestId` for the specific field.
  2. Capture this `currentId` in a local variable.
  3. Perform Sync Validation (Valibot). If fail, return immediately.
  4. Perform Async Validation (Server check).
  5. **On Promise Resolve:** Compare `currentId` with `store.validationRequestIds[field]`.
  6. **Update Store:** Only if IDs match. If they differ, a newer validation has started, so discard this result.

---

## 8. Implementation Checklist (The "Go" Order)

Follow this exact sequence to build the app.

1. **Project Setup:** Initialize Vite/React/TS/Sass.
2. **Type Definition:** Create `src/types/store.ts` and `src/types/domain.ts`.
3. **Store Core:** Create the 4 slices with basic setters. Create the `createBoundStore` function.
4. **Middleware:** Implement the Logger middleware to see state changes in Console.
5. **UI Atoms:** Create basic `Input`, `Select`, `Toggle` components.
6. **Config Layer:** Populate `fieldRegistry` and `orderConfig` with dummy data.
7. **Dynamic Form:** Build `OrderForm` to render based on config.
8. **Logic Injection:** Implement `getDerivedValues` in the store to merge layers.
9. **Validation Logic:** Integrate Valibot and the async race condition handling.
10. **FDC3 Mock:** Implement the service and wire it to `window.fdc3` (mocked).
11. **Lifecycle:** Handle the `SUBMIT` -> `READ_ONLY` -> `AMEND` -> `SUBMIT` -> `READ_ONLY` flow.

---

## 9. Important "Do's and Don'ts"

- **DO** use `useShallow` from `zustand/react/shallow` when selecting multiple values to prevent unnecessary re-renders.
  - *Example:* `const { notional, account } = useStore(useShallow(state => ({ notional: state.computed.notional, ... })))`
- **DON'T** put complex UI logic (like JSX) inside the Store. The Store holds *data*, Components hold *UI*.
- **DON'T** mutate state directly. Always return a new object in Zustand `set` functions. Use `immer` ( `import { immer } from 'zustand/middleware/immer'` ), so you can write mutable-looking code safely.
- **DO** ensure that `appInstanceId` is attached to every single console log.
- **DO** handle empty states gracefully for `liquidityPool`, `accounts`, `orderTypes`, and `currencyPairs` lists (show loading or empty states).
- **DO** handle dynamic `currencyPairs` updates:
  - When `orderType` changes, fetch the allowed `currencyPairs` for that type.
  - If the currently selected symbol is invalid for the new order type, keep the value but display an inline error: "Invalid symbol for selected order type".
  - Similarly, for FDC3 intents (new or existing orders), if the user lacks entitlements for the symbol, order type, or liquidity pool, display the value with a clear validation error explaining the issue.
- **DO** ensure that every piece of state is strongly typed with TypeScript interfaces, is unit testable, and documented. Do not leave any `any` types.
- **DO** write unit tests for critical logic (merging layers, validation engine, FDC3 context mapping). Use vitest + testing-library/react.
- **DON'T** hardcode any form structure in JSX. Always use the config-driven approach. Keep config files simple; favor clarity over cleverness.
- **DO** ensure that the `RowComponent` is flexible enough to accommodate future drag-and-drop functionality without major refactoring.
- **DO** ensure that all asynchronous operations (like validation and WebSocket messages) are properly handled with error catching and state updates to reflect loading/error states in the UI.
- **DO** understand that the only difference between a new order and an amendment is presence of "orderId" in intent payload and submission payload. The form logic remains the same. And for any data that comes from FDC3 intent - if it does not have an orderId, it is a new order; if it does, it goes into a read-only view until the user clicks "Amend". We also want to allow double-click on a field in read-only view to switch to amend mode.
- **DON'T** use enums, hardcoded strings, or magic numbers scattered throughout the code. Centralize such constants in a dedicated `constants.ts` file for maintainability.
- **DO** ensure accessibility standards are met in all UI components (e.g., proper ARIA attributes, keyboard navigation support).
- **DO** expose `isEditing`, `isDirty`, `isSubmitting`, `isSubmitted`, `isReadOnly`, `isAmending`, `isValid` and any other relevant flags in the store facade for easy UI state management.

## 10. UI Structure Overview

|-- HEADER WITH CURRENCY SELECTOR --                                                      |
|-- LIVE TICKING PRICE DISPLAY --                                                         |
|-- ORDER TYPE SELECTOR --                                                                |
|-- DYNAMIC FORM RENDERER --                                                              |
|-- ORDER FOOTER WITH SUBMIT/CANCEL/ETC. BUTTONS --                                       |

## 11. Code Implementation Plan

We will build this application in 7 distinct phases. Each phase builds upon the previous one, ensuring a stable foundation before adding complexity.

### Phase 1: Project Scaffolding & Static UI Shell

**Goal:** Initialize the project, set up the directory structure, and create the static visual layout without any logic.

- **Tasks:**
  - Initialize Vite + React + TypeScript project.
  - Install dependencies: `zustand`, `valibot`, `sass`, `clsx`.
  - Create the exact directory structure defined in Section 2.
  - Build the `MainLayout` template (Header, Footer, Content Area).
  - Create dummy `OrderHeader` and `OrderSummary` components.
  - Implement the `RowComponent` for form rows.
- **Outcome:** A "hollow" application running in the browser. You see the layout, the header, and the footer, but no form fields or interactivity.
- **Acceptance Criteria:**
  - `npm run dev` starts without errors.
  - The layout matches the "UI Structure Overview".
  - Directory structure matches the specification exactly.

### Phase 2: The Store Foundation (Zustand)

**Goal:** Implement the "Layered State" architecture with Zustand.

- **Tasks:**
  - Create `src/types/store.ts` and `src/types/domain.ts`.
  - Implement `createAppSlice` (Instance ID, Status).
  - Implement `createInitialOrderSlice` (Base Layer).
  - Implement `createUserInteractionSlice` (Delta Layer).
  - Implement `createComputedSlice` (Merge Logic).
  - Create the bound store in `src/store/index.ts` with Logger middleware.
- **Outcome:** No visual change, but the Redux DevTools (or console logs) show the store initializing with the correct default state structure.
- **Acceptance Criteria:**
  - `window.__ORDER_STORE__.getState()` returns the complete state tree in the console.
  - Changing a value in `initialOrderSlice` via the console reflects in `computedSlice`.

### Phase 3: Configuration Engine & Dynamic Form Renderer

**Goal:** Render the form fields dynamically based on the selected Order Type.

- **Tasks:**
  - Create `src/config/fieldRegistry.ts` (Input definitions).
  - Create `src/config/orderConfig.ts` (Order Type definitions).
  - Implement `OrderForm.tsx` to map over the config and render `RowComponent` + Inputs.
  - Connect inputs to `store.setFieldValue`.
- **Outcome:** You can select "Limit" or "Market" from a dropdown (mocked), and the form fields below change instantly. Typing in a field updates the Zustand store (visible in logs).
- **Acceptance Criteria:**
  - Switching Order Type changes the visible fields.
  - Input values persist when switching types (if the field exists in both).
  - The "Layered State" works: User input overrides default values.

### Phase 4: Validation Engine (Sync & Async)

**Goal:** Implement Valibot schemas and the async race-condition handling.

- **Tasks:**
  - Define Valibot schemas in `src/config/validation.ts`.
  - Implement `validateField` action in `ComputedSlice`.
  - Add the `validationRequestIds` logic for async concurrency.
  - Create the `useDebounce` hook and integrate it into the Input components.
  - Display error messages in `RowComponent`.
- **Outcome:** Typing an invalid value (e.g., negative Notional) shows an error message after 50ms.
- **Acceptance Criteria:**
  - Sync validation works immediately (debounced).
  - Async validation (mocked with `setTimeout`) shows a spinner and then the result.
  - Rapid typing does not result in stale error messages (Race condition test).

### Phase 5: External Integrations (WebSocket & Reference Data)

**Goal:** Replace hardcoded dropdowns with data from the "Server" (Mocked or Real).

- **Tasks:**
  - Implement `socketService.ts` (wrapper around `graphql-ws`).
  - Create `useAppInit` hook to fetch Reference Data (Accounts, Pools) on mount.
  - Populate `RefDataSlice` in the store.
  - Connect Dropdowns (Account, Pool) to this dynamic data.
- **Outcome:** The "Account" and "Liquidity Pool" dropdowns are populated from the (mock) WebSocket connection.
- **Acceptance Criteria:**
  - App shows a "Loading..." state on startup.
  - Data is correctly loaded into the store.
  - Connection status indicator works (Connected/Disconnected).

### Phase 6: FDC3 Intents & Context Linking

**Goal:** Allow the app to be driven by external FDC3 messages.

- **Tasks:**
  - Implement `fdc3Service.ts`.
  - Add `fdc3.addIntentListener` for 'OrderEntry'.
  - Implement `intentMapper.ts` to convert FDC3 context to `Partial<Order>`.
  - Wire up the listener to `store.setBaseValues` and `store.resetFormInteractions`.
- **Outcome:** You can simulate an FDC3 intent (via console or FDC3 workbench), and the form auto-populates with the intent data, overriding any defaults.
- **Acceptance Criteria:**
  - Incoming Intent updates the form.
  - Incoming Intent clears previous user "dirty" state (as per requirements).
  - "ViewInstrument" context updates the Symbol.

### Phase 7: Lifecycle Management (Submit, Read-Only, Amend)

**Goal:** Complete the loop: Submit Order -> View Status -> Amend.

- **Tasks:**
  - Implement `submitOrder` action (Mock API call).
  - Handle success response (transition `AppSlice.status` to `READ_ONLY`).
  - Build `OrderSummary.tsx` for the Read-Only view.
  - Implement "Amend" button logic (transition `AppSlice.status` back to `READY`, preserve `orderId`).
  - Subscribe to `ORDER_UPDATE` for live status changes in Read-Only mode.
- **Outcome:** A fully functional trading ticket. You can place an order, see it "Fill" (mocked), and click Amend to modify it.
- **Acceptance Criteria:**
  - Successful submit locks the form.
  - "Amend" unlocks the form with previous values.
  - Order Status updates (e.g., "Filled") are reflected in real-time.
