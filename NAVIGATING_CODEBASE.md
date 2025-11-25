# Navigating the FX Order Entry Codebase

> **Purpose:** This document serves as the single source of truth for understanding, navigating, and modifying the FX Order Entry application. Whether you're a developer making changes or an LLM analyzing the codebase, this guide explains the architecture, workflows, and conventions used throughout the project.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [How to Add Features](#how-to-add-features)
3. [State Management Deep Dive](#state-management-deep-dive)
4. [GraphQL Integration](#graphql-integration)
5. [Application Workflows](#application-workflows)
6. [File Directory Guide](#file-directory-guide)
7. [Configuration-Driven UI System](#configuration-driven-ui-system)
8. [Field Reordering System](#field-reordering-system)
9. [Validation System](#validation-system)
10. [Toast Notification System](#toast-notification-system)
11. [Mock Data & Placeholders](#mock-data--placeholders)
12. [Server-Side Validation Structure](#server-side-validation-structure)
13. [Things to Remember](#things-to-remember)
14. [Upcoming Features](#upcoming-features)

---

## Architecture Overview

### Core Principles

This application follows a **Configuration-Driven UI** pattern with **Layered State Management**:

1. **Configuration-Driven UI**: Forms are defined in configuration files, not hardcoded in JSX
2. **Layered State**: Multiple data sources (FDC3, User Prefs, Manual Input) are merged without conflicts
3. **Zustand Store**: Single source of truth with slice-based architecture
4. **Real-Time Updates**: GraphQL subscriptions for live price and order status updates
5. **No Routing**: Single-view application driven by state machines

### Layered State Philosophy

Think of the state like Photoshop layers:

- **Layer 0 (Reference Data)**: Read-only lists (Accounts, Pools, Currency Pairs)
- **Layer 1 (Base Values)**: Starting point for the form (Defaults, User Prefs, FDC3 Intents)
- **Layer 2 (Dirty Values)**: User edits - only stores what's been touched
- **Layer 3 (Computed/Derived)**: Merge of Layer 1 + Layer 2 - this is what the UI renders

**Priority**: Layer 2 (User Edits) always wins over Layer 1 (Base Values)

---

## How to Add Features

### How to Add a New Field

#### Example: Adding a "Stop Loss Trigger Price" field

#### Step 1: Update Domain Types

**File:** `/src/types/domain.ts`

```typescript
export interface OrderStateData {
  // ... existing fields
  stopLossTriggerPrice?: number; // Add new field
}
```

#### Step 2: Register the Field

**File:** `/src/config/fieldRegistry.ts`

```typescript
export const FIELD_REGISTRY: Record<string, FieldDefinition> = {
  // ... existing fields
  stopLossTriggerPrice: {
    label: "Stop Loss Trigger",
    component: "InputNumber",
    props: { precision: 5, step: 0.0001, min: 0 },
  },
};
```

#### Step 3: Add to Order Type Configuration

**File:** `/src/config/orderConfig.ts`

```typescript
export const ORDER_TYPES: Record<OrderType, OrderConfig> = {
  STOP_LOSS: {
    fields: [
      "direction",
      "liquidityPool",
      "notional",
      "stopPrice",
      "stopLossTriggerPrice", // Add field here
      "timeInForce",
      "account"
    ],
    initialFocus: "stopPrice",
    editableFields: ["notional", "stopPrice", "stopLossTriggerPrice", "timeInForce"],
  },
  // ... other order types
};
```

#### Step 4: Add Validation (Optional)

**File:** `/src/config/validation.ts`

```typescript
const stopLossTriggerPriceSchema = v.pipe(
  v.number("Trigger price must be a number"),
  v.minValue(0, "Trigger price must be positive")
);

export const StopLossOrderSchema = v.object({
  // ... existing fields
  stopLossTriggerPrice: v.optional(v.nullish(stopLossTriggerPriceSchema)),
});
```

**That's it!** The field will automatically:

- ✅ Render in the form for STOP_LOSS orders
- ✅ Connect to the store
- ✅ Validate on change (debounced)
- ✅ Be included in submission payload
- ✅ Support read-only and amend modes

---

### How to Add a New Order Type

#### Example: Adding a "FIXING" order type

#### Step 1: Update Domain Types

**File:** `/src/types/domain.ts`

```typescript
export type OrderType =
  | "MARKET"
  | "LIMIT"
  | "TAKE_PROFIT"
  | "STOP_LOSS"
  | "FLOAT"
  | "FIXING"; // Add new type
```

#### Step 2: Define Configuration

**File:** `/src/config/orderConfig.ts`

```typescript
export const ORDER_TYPES: Record<OrderType, OrderConfig> = {
  // ... existing types
  FIXING: {
    fields: ["direction", "liquidityPool", "notional", "trailingDistance", "timeInForce", "account"],
    initialFocus: "trailingDistance",
    editableFields: ["notional", "trailingDistance", "timeInForce"],
  },
};
```

#### Step 3: Create Validation Schema

**File:** `/src/config/validation.ts`

```typescript
export const FixingOrderSchema = v.object({
  symbol: requiredString,
  direction: requiredString,
  orderType: requiredString,
  notional: notionalSchema,
  trailingDistance: v.pipe(
    v.number("Trailing distance must be a number"),
    v.minValue(0.0001, "Minimum trailing distance is 0.0001")
  ),
  account: requiredString,
  liquidityPool: requiredString,
  timeInForce: v.optional(v.nullish(requiredString)),
  // ... optional fields
});

export const SCHEMA_MAP: Record<string, v.GenericSchema> = {
  // ... existing schemas
  FIXING: FixingOrderSchema,
};
```

**That's it!** The new order type will:

- ✅ Appear in the Order Type dropdown
- ✅ Show the correct fields when selected
- ✅ Validate according to its schema

---

### How to Add a New Component Type

#### Example: Adding a "RangeSlider" component

#### Step 1: Create the Component

**File:** `/src/components/atoms/RangeSlider.tsx`

```typescript
interface RangeSliderProps {
  id: string;
  name: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  hasError?: boolean;
  readOnly?: boolean;
}

export const RangeSlider = ({ id, name, value, onChange, min, max, step = 1, hasError, readOnly }: RangeSliderProps) => {
  return (
    <input
      type="range"
      id={id}
      name={name}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      min={min}
      max={max}
      step={step}
      disabled={readOnly}
      className={hasError ? 'error' : ''}
    />
  );
};
```

#### Step 2: Register in FieldController

**File:** `/src/components/organisms/FieldController.tsx`

Add a new case in the switch statement:

```typescript
switch (def.component) {
  // ... existing cases

  case "RangeSlider":
    inputEl = (
      <RangeSlider
        id={fieldKey}
        name={fieldKey}
        value={value as number}
        onChange={handleChange}
        hasError={!!error}
        readOnly={isReadOnly}
        {...def.props} // Spread min, max, step from field definition
      />
    );
    break;
}
```

#### Step 3: Update Field Registry Types

**File:** `/src/config/fieldRegistry.ts`

```typescript
export interface FieldDefinition {
  label: string;
  component:
    | "InputNumber"
    | "InputText"
    | "Select"
    | "Toggle"
    | "DateTime"
    | "AmountWithCurrency"
    | "LimitPriceWithCheckbox"
    | "RangeSlider"; // Add new type
  props?: Record<string, unknown>;
}
```

#### Step 4: Use in Field Registry

**File:** `/src/config/fieldRegistry.ts`

```typescript
export const FIELD_REGISTRY: Record<string, FieldDefinition> = {
  // ... existing fields
  participationRate: {
    label: "Participation Rate",
    component: "RangeSlider",
    props: { min: 0, max: 100, step: 5 },
  },
};
```

**That's it!** The new component type is now available for use in any field definition.

---

## State Management Deep Dive

### Zustand Store Structure

The store is composed of **6 slices**, each with a specific responsibility:

```text
useOrderEntryStore (Bound Store)
├── AppSlice             - App lifecycle & status
├── RefDataSlice         - Reference data (accounts, pools, currency pairs)
├── InitialOrderSlice    - Base values (Layer 1)
├── UserInteractionSlice - User edits (Layer 2)
├── ComputedSlice        - Derived state, validation, submission (Layer 3)
└── PriceSlice           - Real-time price data
```

### Slice Responsibilities

#### 1. AppSlice (`createAppSlice.ts`)

**Purpose**: Application lifecycle and global state

**State**:

- `instanceId`: Unique ID for this app instance (for logging and sending to server)
- `status`: `"INITIALIZING"` | `"READY"` | `"SUBMITTING"` | `"ERROR"`
- `editMode`: `"creating"` | `"viewing"` | `"amending"`
- `toastMessage`: Notification message to display

**Actions**:

- `setStatus(status)`: Update app status
- `setEditMode(mode)`: Change edit mode
- `setCurrentOrderId(orderId)`: Set order ID after submission
- `setOrderStatus(status)`: Update order status from subscription
- `setToast(message)`: Display notification toast

**When to use**:

- Starting/stopping the app
- Showing loading states
- Transitioning between create/view/amend modes

---

#### 2. RefDataSlice (`createRefDataSlice.ts`)

**Purpose**: Store reference data loaded from server

**State**:

- `accounts`: Array of trading accounts
- `pools`: Array of liquidity pools
- `currencyPairs`: Array of currency pairs
- `entitledOrderTypes`: Order types user can create

**Actions**:

- `setRefData({ accounts, pools, currencyPairs, entitledOrderTypes })`

**When to use**:

- During app initialization (`useAppInit`)
- Populating dropdowns (Account, Pool, Symbol)
- Validating if user has entitlements

---

#### 3. InitialOrderSlice (`createInitialOrderSlice.ts`)

**Purpose**: The "base layer" of order data (Layer 1)

**State**:

- `baseValues`: Default order data (from prefs, FDC3, or defaults)

**Actions**:

- `setBaseValues(values)`: Update base values (called by FDC3, User Prefs)

**When to use**:

- FDC3 intent received → update baseValues
- User preferences loaded → set default account
- Never modified directly by user input

**Important**: When baseValues change (e.g., FDC3 intent), you should also call `resetFormInteractions()` to clear user edits.

---

#### 4. UserInteractionSlice (`createUserInteractionSlice.ts`)

**Purpose**: Track user edits (Layer 2)

**State**:

- `dirtyValues`: Fields the user has edited
- `touchedFields`: Fields the user has interacted with (tracked but not used for error gating - errors shown immediately)

**Actions**:

- `setFieldValue(field, value)`: Update a field (called by FieldController)
- `resetFormInteractions()`: Clear all user edits (dirtyValues, touchedFields, errors, serverErrors, warnings)

**When to use**:

- User types in an input → `setFieldValue("notional", 1000000)`
- User clicks "New Order" → `resetFormInteractions()`
- Checking if form is dirty → `Object.keys(dirtyValues).length > 0`

---

#### 5. ComputedSlice (`createComputedSlice.ts`)

**Purpose**: The "brain" - merging, validation, submission (Layer 3)

**State**:

- `errors`: Client-side validation errors
- `serverErrors`: Server-side validation errors
- `refDataErrors`: Reference data unavailable errors
- `warnings`: Non-blocking advisory messages
- `isValidating`: Fields currently being validated
- `validationRequestIds`: Race condition tracking
- `globalError`: Global error message (above submit button)

**Actions**:

- `getDerivedValues()`: Merge baseValues + dirtyValues
- `isDirty()`: Check if user made edits
- `isFormValid()`: Check if form has no errors
- `validateField(field, value)`: Run validation on a field
- `validateRefData()`: Check if reference data is available
- `submitOrder()`: Final validation + API call
- `amendOrder()`: Switch to amend mode

**When to use**:

- Rendering form → `getDerivedValues()` to get merged state
- Before submit → `isFormValid()` to check if valid
- On field change → `validateField(field, value)` (debounced)
- After loading ref data → `validateRefData()`

---

#### 6. PriceSlice (`createPriceSlice.ts`)

**Purpose**: Store real-time price data for "Grab Limit Price" feature

**State**:

- `currentBuyPrice`: Latest BUY price
- `currentSellPrice`: Latest SELL price

**Actions**:

- `setCurrentPrices(buy, sell)`: Update prices (called by TickingPrice)

**When to use**:

- "Grab Limit Price" checkbox in LimitPriceWithCheckbox → uses current prices
- Displaying live prices in OrderHeader

---

### Data Flow Example: User Edits Notional

```text
User types "1000000" in Notional input
                ↓
Input.onChange fires
                ↓
FieldController calls setFieldValue("notional", 1000000)
                ↓
UserInteractionSlice updates:
  dirtyValues = { notional: 1000000 }
  touchedFields = { notional: true }
  Clears errors/serverErrors for notional (if any)
                ↓
useDebounce hook waits 50ms
                ↓
Calls validateField("notional", 1000000)
                ↓
ComputedSlice runs:
  1. Sync validation (Valibot schema)
  2. Async validation (GraphQL subscription to server)
  3. Updates errors/serverErrors/warnings based on result
                ↓
FieldController re-renders showing error/warning (if any)
```

---

### Data Flow Example: FDC3 Intent Arrives

```text
Another app broadcasts FDC3 "OrderEntry" intent
                ↓
fdc3Service receives context
                ↓
intentMapper converts context → Partial<OrderStateData>
                ↓
Calls setBaseValues({ symbol: "EURUSD", notional: 500000, ... })
                ↓
InitialOrderSlice updates baseValues
                ↓
Calls resetFormInteractions()
                ↓
UserInteractionSlice clears dirtyValues & touchedFields
                ↓
getDerivedValues() now returns only baseValues (no user edits)
                ↓
Form re-renders with FDC3 data
```

**Key Insight**: FDC3 intents ALWAYS take priority by resetting user interactions.

---

## GraphQL Integration

### Apollo Client Setup

**File**: `/src/graphql/client.ts`

The app uses Apollo Client with WebSocket subscriptions.

**Usage**: Wrap app in `<ApolloProvider client={apolloClient}>` in `App.tsx`

---

### Queries

**File**: `/src/graphql/queries.ts`

| Query | Called In | When | Purpose |
|-------|-----------|------|---------|
| `ACCOUNTS_QUERY` | `useAppInit` | App mount | Load trading accounts for dropdown |
| `CCY_STATIC_QUERY` | `useAppInit` | App mount, order type change | Load currency pairs for symbol dropdown |
| `ORDER_TYPES_LIQUIDITY_POOLS_QUERY` | `useAppInit` | App mount | Load order types and liquidity pools |
| `CURRENCY_PAIR_INFO_QUERY` | Header | When symbol selected | Load tenor info for a currency pair |

**Example Usage**:

```typescript
const { data, loading, error } = useQuery<AccountsQueryResponse>(ACCOUNTS_QUERY);

useEffect(() => {
  if (!loading && data) {
    setRefData({ accounts: data.accounts });
  }
}, [data, loading]);
```

---

### Mutations

**File**: `/src/graphql/mutations.ts`

| Mutation | Called In | When | Purpose |
|----------|-----------|------|---------|
| `CREATE_ORDER_MUTATION` | `submitOrder()` (ComputedSlice) | User clicks Submit (new order) | Submit order to server |
| `AMEND_ORDER_MUTATION` | `submitOrder()` (ComputedSlice) | User clicks Submit (amend mode) | Update existing order |
| `GLOBAL_USER_PREFERENCE_MUTATION` | Future feature | User changes default account | Update user preferences |

**Implementation Details**:

The `submitOrder()` function in ComputedSlice uses `graphqlClient.mutate()` directly:

```typescript
// For new orders
const { data } = await graphqlClient.mutate<CreateOrderResponse>({
  mutation: CREATE_ORDER_MUTATION,
  variables: {
    orderEntry: {
      currencyPair: values.symbol,
      side: values.direction,
      orderType: values.orderType,
      amount: values.notional,
      ccy: values.symbol.substring(0, 3),
      limitPrice: values.limitPrice,
      stopPrice: values.stopPrice,
      liquidityPool: values.liquidityPool,
      account: values.account,
      timeInForce: values.timeInForce,
      startTime: values.startTime,
    },
  },
});

// On success, store orderId for ORDER_SUBSCRIPTION tracking
if (response?.result === "SUCCESS" && response.orderId) {
  state.currentOrderId = response.orderId;
  state.editMode = "viewing";
}

// For amendments
const { data } = await graphqlClient.mutate<AmendOrderResponse>({
  mutation: AMEND_ORDER_MUTATION,
  variables: {
    amendOrder: {
      orderId: values.orderId,
      amount: values.notional,
      limitPrice: values.limitPrice,
      stopPrice: values.stopPrice,
      timeInForce: values.timeInForce,
    },
  },
});
```

**Error Handling**:

- If mutation returns `result: "FAILURE"`, shows error toast and transitions to viewing mode (if orderId exists)
- Network errors are caught and displayed as toast notifications
- If order was submitted but tracking fails, user stays in viewing mode

---

### Subscriptions

**File**: `/src/graphql/subscriptions.ts`

| Subscription | Called In | When | Purpose |
|--------------|-----------|------|---------|
| `GATOR_DATA_SUBSCRIPTION` | `TickingPrice` component | When component mounts | Stream live BUY/SELL prices |
| `ORDER_SUBSCRIPTION` | `useOrderTracking` hook | After order submitted | Stream order status updates |
| `ORDER_FAILURE_SUBSCRIPTION` | `useOrderTracking` hook | After order submitted | Receive order failure notifications |
| `GLOBAL_USER_PREFERENCES_SUBSCRIPTION` | `useAppInit` hook | App mount | Receive default account updates |

**Implementation Details**:

#### GATOR_DATA_SUBSCRIPTION (Price Feed)

**File**: `/src/components/molecules/TickingPrice.tsx`

```typescript
// Helper functions determine subscription parameters
const currentPair = currencyPairs.find((cp) => cp.symbol === symbol);

const { data: priceData } = useSubscription(GATOR_DATA_SUBSCRIPTION, {
  variables: {
    input: {
      currencyPair: symbol,
      ndf: isNdf(currentPair),
      onshore: isOnshore(currentPair),
      pipExtent: currentPair?.spotPrecision || 5,
      pipSteps: 1,
      markets: ["GATOR"],
    },
  },
  fetchPolicy: "no-cache",
});

// Update local state and store when prices arrive
useEffect(() => {
  if (priceData?.gatorData) {
    const newBuyPrice = priceData.gatorData.topOfTheBookBuy.precisionValue;
    const newSellPrice = priceData.gatorData.topOfTheBookSell.precisionValue;
    setBuyPrice(newBuyPrice);
    setSellPrice(newSellPrice);
    setCurrentPrices(newBuyPrice, newSellPrice);
  }
}, [priceData]);
```

**Helper Functions** (`/src/utils/currencyPairHelpers.ts`):

```typescript
export const isNdf = (currencyPair: CurrencyPair | undefined): boolean => {
  if (!currencyPair) return false;
  return !currencyPair.ccy1Deliverable || !currencyPair.ccy2Deliverable;
};

export const isOnshore = (currencyPair: CurrencyPair | undefined): boolean => {
  if (!currencyPair) return false;
  return currencyPair.ccy1Onshore || currencyPair.ccy2Onshore;
};
```

#### ORDER_SUBSCRIPTION (Order Status Tracking)

**File**: `/src/hooks/useOrderTracking.ts`

```typescript
const currentOrderId = useOrderEntryStore((s) => s.currentOrderId);
const setOrderStatus = useOrderEntryStore((s) => s.setOrderStatus);

const { data: orderData } = useSubscription<OrderDataSubscriptionResponse>(
  ORDER_SUBSCRIPTION,
  {
    variables: { orderId: currentOrderId },
    skip: !currentOrderId, // Only subscribe when orderId exists
    fetchPolicy: "no-cache",
  }
);

// Update status in store and show toasts for terminal states
useEffect(() => {
  if (orderData?.orderData) {
    const status = orderData.orderData.execution.status;
    setOrderStatus(status);

    if (status === "FILLED") {
      setToast({ type: "success", text: "Order Filled Successfully!" });
    } else if (status === "REJECTED") {
      const reason = orderData.orderData.execution.rejectReason;
      setToast({ type: "error", text: `Order Rejected: ${reason}` });
    }
  }
}, [orderData]);
```

**Status Display**:

The status field is shown in view/amend mode:

- Added to `fieldRegistry` as read-only InputText
- Included in `viewFields` array for all order types in `orderConfig`
- Populated from `orderStatus` in store's `getDerivedValues()`

#### Example: Subscribing to Price Data

```typescript
const { data } = useSubscription<GatorDataSubscriptionResponse>(
  GATOR_DATA_SUBSCRIPTION,
  {
    variables: {
      input: {
        currencyPair: symbol,
        ndf: isNdf(currentPair),
        onshore: isOnshore(currentPair),
        pipExtent: currentPair?.spotPrecision || 5,
        pipSteps: 1,
        markets: ["GATOR"],
      },
    },
    fetchPolicy: "no-cache",
    onError: (err) => console.error("Price subscription error:", err),
  }
);

useEffect(() => {
  if (data?.gatorData) {
    const { topOfTheBookBuy, topOfTheBookSell } = data.gatorData;
    setCurrentPrices(topOfTheBookBuy.price, topOfTheBookSell.price);
  }
}, [data]);

```

---

## Application Workflows

### Workflow 1: Application Initialization

```text
1. User opens application
                ↓
2. App.tsx renders, calls useAppInit()
                ↓
3. useAppInit hook executes:
   a. Query accounts → setRefData({ accounts })
   b. Query currencyPairs → setRefData({ currencyPairs })
   c. Query orderTypesWithPools → setRefData({ pools, entitledOrderTypes })
   d. Subscribe to globalUserPreferencesStream
                ↓
4. When all queries complete:
   - setStatus("READY")
   - validateRefData() to check for unavailable data
                ↓
5. FDC3 service initializes
   - Listens for "OrderEntry" and "ViewInstrument" intents
                ↓
6. UI renders OrderForm with default values
```

**Files Involved**:

- `/src/hooks/useAppInit.ts` - Orchestration
- `/src/store/slices/createAppSlice.ts` - Status management
- `/src/store/slices/createRefDataSlice.ts` - Data storage
- `/src/api/fdc3/fdc3Service.ts` - FDC3 setup

---

### Workflow 2: User Creates New Order

```text
1. User selects Order Type → "LIMIT"
                ↓
2. setFieldValue("orderType", "LIMIT")
                ↓
3. OrderForm re-renders with fields from ORDER_TYPES.LIMIT
                ↓
4. User fills fields:
   - Direction: BUY
   - Notional: 1000000
   - Limit Price: 1.2735
                ↓
5. Each field change triggers:
   - setFieldValue(field, value)
   - Debounced validateField() after 50ms
                ↓
6. User clicks "SUBMIT ORDER"
                ↓
7. submitOrder() in ComputedSlice:
   a. setStatus("SUBMITTING")
   b. Run full validation (all fields)
   c. If invalid → show errors, return to "READY"
   d. If valid → call CREATE_ORDER_MUTATION
                ↓
8. Server responds with { orderId, result: "SUCCESS" }
                ↓
9. Update state:
   - setStatus("READY")
   - setEditMode("viewing")
   - setBaseValues({ orderId }) - add orderId to base
   - resetFormInteractions() - clear dirtyValues, touchedFields, errors, serverErrors, warnings
                ↓
10. UI switches to ReadOnlyView
    - Shows order details
    - Subscribes to ORDER_SUBSCRIPTION for status updates
```

**Files Involved**:

- `/src/components/organisms/OrderForm.tsx` - Form rendering
- `/src/components/organisms/FieldController.tsx` - Field logic
- `/src/store/slices/createUserInteractionSlice.ts` - User edits
- `/src/store/slices/createComputedSlice.ts` - Validation & submission
- `/src/components/organisms/OrderFooter.tsx` - Submit button
- `/src/components/organisms/ReadOnlyView.tsx` - Post-submit view

---

### Workflow 3: User Amends Submitted Order

```text
1. Order is in "viewing" mode (read-only)
                ↓
2. User double-clicks on editable field (e.g., Notional)
   OR clicks "AMEND ORDER" button
                ↓
3. amendOrder() in ComputedSlice:
   - Check for refDataErrors (prevent amend if data unavailable)
   - setEditMode("amending")
                ↓
4. UI updates:
   - OrderForm re-renders
   - Only editableFields (from ORDER_TYPES config) become editable
   - Other fields remain read-only
                ↓
5. User edits Notional: 1000000 → 2000000
                ↓
6. setFieldValue("notional", 2000000)
                ↓
7. Validation runs on changed field
                ↓
8. User clicks "SUBMIT ORDER"
                ↓
9. submitOrder() detects orderId exists:
   - Calls AMEND_ORDER_MUTATION instead of CREATE_ORDER_MUTATION
   - Payload includes only changed fields + orderId
                ↓
10. Server responds with { orderId, result: "SUCCESS" }
                ↓
11. Update state:
    - setEditMode("viewing")
    - resetFormInteractions() - clear dirtyValues, touchedFields, errors, serverErrors, warnings
                ↓
12. UI returns to ReadOnlyView
```

**Files Involved**:

- `/src/components/organisms/ReadOnlyView.tsx` - Double-click handler
- `/src/store/slices/createComputedSlice.ts` - Amend logic
- `/src/components/organisms/OrderForm.tsx` - Editable fields

---

### Workflow 4: FDC3 Intent Received

```text
1. External app broadcasts FDC3 intent
   Example: { type: "fdc3.instrument", id: { ticker: "EUR/USD" } }
                ↓
2. window.fdc3.addIntentListener callback fires
                ↓
3. fdc3Service.ts receives context
                ↓
4. intentMapper.ts converts context:
   FDC3 format → Internal format
   { ticker: "EUR/USD" } → { symbol: "EURUSD" }
                ↓
5. Calls:
   a. setBaseValues({ symbol: "EURUSD", notional: 1000000, ... })
   b. resetFormInteractions() - clear dirtyValues, touchedFields, errors, serverErrors, warnings
                ↓
6. getDerivedValues() now returns only baseValues (Layer 1)
                ↓
7. OrderForm re-renders with FDC3 data
                ↓
8. validateRefData() checks if symbol is entitled
   - If not → refDataErrors.symbol = "Currency pair not available"
```

**Files Involved**:

- `/src/api/fdc3/fdc3Service.ts` - FDC3 listener
- `/src/api/fdc3/intentMapper.ts` - Context mapping
- `/src/store/slices/createInitialOrderSlice.ts` - Base values
- `/src/store/slices/createUserInteractionSlice.ts` - Reset edits
- `/src/hooks/useAppInit.ts` - FDC3 initialization

---

### Workflow 5: User Preferences Applied

```text
1. globalUserPreferencesStream subscription emits:
   { defaultGlobalAccount: { sdsId: "123", name: "Default" } }
                ↓
2. useAppInit receives subscription data
                ↓
3. setBaseValues({ account: "123" })
                ↓
4. validateRefData() checks if account exists
   - If not → refDataErrors.account = "Account not available"
                ↓
5. OrderForm re-renders with default account selected
```

**Files Involved**:

- `/src/hooks/useAppInit.ts` - Subscription handler
- `/src/store/slices/createInitialOrderSlice.ts` - Base values

---

### Workflow 6: Real-Time Price Updates

```text
1. TickingPrice component mounts
                ↓
2. Subscribes to GATOR_DATA_SUBSCRIPTION
   Variables: { input: { currencyPair: symbol } }
                ↓
3. Subscription callback receives:
   { topOfTheBookBuy: { price: 1.2735 }, topOfTheBookSell: { price: 1.2733 } }
                ↓
4. setCurrentPrices(1.2735, 1.2733)
                ↓
5. PriceSlice updates currentBuyPrice and currentSellPrice
                ↓
6. TickingPrice component re-renders with new prices
                ↓
7. If user clicks "Grab Limit Price" in LimitPriceWithCheckbox:
   - Reads currentBuyPrice or currentSellPrice from store
   - setFieldValue("limitPrice", currentSellPrice)
```

**Files Involved**:

- `/src/components/molecules/TickingPrice.tsx` - Subscription
- `/src/components/molecules/LimitPriceWithCheckbox.tsx` - Grab Limit Price feature
- `/src/store/slices/createPriceSlice.ts` - Price storage

---

### Workflow 7: Validation Lifecycle

```text
1. User types in Notional field: "100"
                ↓
2. onChange fires → setFieldValue("notional", 100)
                ↓
3. useDebounce hook starts 50ms timer
                ↓
4. User types more: "100" → "1000000"
                ↓
5. Timer resets, waits another 50ms
                ↓
6. User stops typing, 50ms elapses
                ↓
7. validateField("notional", 1000000) fires
                ↓
8. Generate requestId = 1, store in validationRequestIds.notional
                ↓
9. Sync validation (Valibot):
   - Check min (1), max (100000000)
   - If fail → errors.notional = "Minimum amount is 1"
   - If pass → continue to async
                ↓
10. Async validation (server check - mocked):
    - setTimeout(300ms) to simulate network delay
    - Check if requestId still matches (race condition guard)
    - If exceeds firm limit → errors.notional = "Exceeds firm limit"
                ↓
11. Set isValidating.notional = false
                ↓
12. FieldController re-renders:
    - If error → show red border + error message
    - If no error → show green checkmark (optional)
```

**Files Involved**:

- `/src/components/organisms/FieldController.tsx` - Trigger
- `/src/hooks/useDebounce.ts` - Debouncing
- `/src/store/slices/createComputedSlice.ts` - Validation logic
- `/src/config/validation.ts` - Valibot schemas
- `/src/components/molecules/RowComponent.tsx` - Error display

---

## File Directory Guide

### Where to Go to Make Changes

#### To Change Field Appearance

- **Input styling**: `/src/components/atoms/Input.module.scss`
- **Select styling**: `/src/components/atoms/Select.module.scss`
- **Custom components**: `/src/components/molecules/`

#### To Change Field Behavior

- **Field rendering logic**: `/src/components/organisms/FieldController.tsx`
- **Form layout**: `/src/components/organisms/OrderForm.tsx`

#### To Change Validation Rules

- **Sync validation**: `/src/config/validation.ts` (Valibot schemas)
- **Async validation**: `/src/store/slices/createComputedSlice.ts` (validateField)
- **Reference data validation**: `/src/store/slices/createComputedSlice.ts` (validateRefData)

#### To Change Form Configuration

- **Add/remove fields**: `/src/config/fieldRegistry.ts`
- **Change order type fields**: `/src/config/orderConfig.ts`
- **Change validation timing**: `/src/config/constants.ts` (VALIDATION_CONFIG)

#### To Change State Management

- **App status**: `/src/store/slices/createAppSlice.ts`
- **Reference data**: `/src/store/slices/createRefDataSlice.ts`
- **Base values**: `/src/store/slices/createInitialOrderSlice.ts`
- **User edits**: `/src/store/slices/createUserInteractionSlice.ts`
- **Validation/submission**: `/src/store/slices/createComputedSlice.ts`
- **Price data**: `/src/store/slices/createPriceSlice.ts`

#### To Change GraphQL Integration

- **Queries**: `/src/graphql/queries.ts`
- **Mutations**: `/src/graphql/mutations.ts`
- **Subscriptions**: `/src/graphql/subscriptions.ts`
- **Apollo setup**: `/src/graphql/client.ts`
- **GraphQL types**: `/src/graphql/types.ts`

#### To Change Order Tracking

- **Order subscription hook**: `/src/hooks/useOrderTracking.ts`
- **Order status in store**: `/src/store/slices/createAppSlice.ts` (currentOrderId, orderStatus)
- **Status field display**: `/src/config/fieldRegistry.ts` (status field), `/src/config/orderConfig.ts` (viewFields)

#### To Change Price Feed

- **Price component**: `/src/components/molecules/TickingPrice.tsx`
- **Currency pair helpers**: `/src/utils/currencyPairHelpers.ts` (isNdf, isOnshore)
- **Price subscription**: Uses `GATOR_DATA_SUBSCRIPTION` from `/src/graphql/subscriptions.ts`

#### To Change FDC3 Integration

- **FDC3 service**: `/src/api/fdc3/fdc3Service.ts`
- **Context mapping**: `/src/api/fdc3/intentMapper.ts`

#### To Change Styling

- **Global styles**: `/src/styles/global.scss`
- **Design tokens**: `/src/styles/variables.scss`
- **Component styles**: `/src/components/**/*.module.scss`

#### To Change Field Reordering

- **Field order hook**: `/src/hooks/useFieldOrder.ts`
- **Drag handle**: `/src/components/atoms/DragHandle.tsx`
- **Sortable wrapper**: `/src/components/molecules/SortableFieldItem.tsx`
- **Reorderable list**: `/src/components/molecules/ReorderableFieldList.tsx`
- **Reorder mode banner**: `/src/components/molecules/ReorderModeBanner.tsx`
- **LocalStorage key (mode)**: `fx-order-reorder-mode`
- **LocalStorage key (orders)**: `fx-order-field-order`

---

## Configuration-Driven UI System

### The "What and How" Pattern

The codebase separates **WHAT** fields exist from **HOW** they render:

- **WHAT**: `fieldRegistry.ts` - Defines all possible fields
- **HOW**: `orderConfig.ts` - Defines which fields appear for each order type
- **WHERE**: `FieldController.tsx` - Renders the appropriate component

### Field Registry Structure

```typescript
export const FIELD_REGISTRY: Record<string, FieldDefinition> = {
  [fieldName]: {
    label: "Human-readable label",
    component: "ComponentType", // String reference
    props: { /* Component-specific props */ }
  }
}
```

**Available Component Types**:

- `InputNumber` - Numeric input with step/min/max
- `InputText` - Text input
- `Select` - Dropdown selector
- `Toggle` - Inline toggle switch (BUY/SELL)
- `DateTime` - Date/time picker
- `AmountWithCurrency` - Amount with CCY1/CCY2 toggle
- `LimitPriceWithCheckbox` - Price input with "Grab Limit Price" checkbox

### Order Config Structure

```typescript
export const ORDER_TYPES: Record<OrderType, OrderConfig> = {
  [orderType]: {
    fields: ["field1", "field2", ...], // Fields to show (in order)
    initialFocus: "field1", // Field to focus on order type change
    editableFields: ["field1", "field2", ...] // Fields editable in amend mode
  }
}
```

### How FieldController Works

```text
1. Receives fieldKey prop (e.g., "notional")
                ↓
2. Looks up definition in FIELD_REGISTRY
                ↓
3. Determines which component to render based on definition.component
                ↓
4. Connects component to store:
   - value = getDerivedValues()[fieldKey]
   - onChange = setFieldValue(fieldKey, value)
                ↓
5. Wraps in RowComponent for consistent layout
                ↓
6. Applies read-only logic based on editMode and editableFields
```

---

## Field Reordering System

### Overview

Users can customize the order of form fields per order type via drag-and-drop. This feature allows traders to arrange fields according to their workflow preferences.

**Key Features**:

- **Per Order Type**: Each order type (LIMIT, MARKET, etc.) has its own field order
- **Drag and Drop**: Uses `@dnd-kit` for smooth drag-and-drop interactions
- **Persistent**: Custom orders are saved to localStorage
- **Intelligent Merging**: When config changes (new fields added), user preferences are preserved and new fields are appended

### Enabling Reorder Mode

Reorder mode is controlled via localStorage flag:

```javascript
// Enable reorder mode
localStorage.setItem('fx-order-reorder-mode', 'true');

// Disable reorder mode
localStorage.setItem('fx-order-reorder-mode', 'false');
```

When enabled:

- Drag handles (⠿) appear next to each field label
- A blue banner appears above the Submit button
- Fields can be dragged to new positions

### Architecture

#### Files Involved

| File | Purpose |
|------|---------|
| `/src/store/slices/createFieldOrderSlice.ts` | Zustand slice with field order state and actions |
| `/src/hooks/useFieldOrder.ts` | Thin wrapper hook around Zustand store |
| `/src/components/molecules/ReorderableFieldList.tsx` | DndContext wrapper with sortable logic |
| `/src/components/molecules/SortableFieldItem.tsx` | Individual draggable field wrapper |
| `/src/components/atoms/DragHandle.tsx` | SVG drag handle icon (6 dots) |
| `/src/components/molecules/ReorderModeBanner.tsx` | Banner with Reset/Save buttons |

#### localStorage Structure

```json
{
  "fx-order-field-order": {
    "LIMIT": ["notional", "direction", "limitPrice", "account", "liquidityPool", "timeInForce"],
    "MARKET": ["direction", "notional", "liquidityPool", "timeInForce", "account"]
  },
  "fx-order-reorder-mode": "true"
}
```

### Zustand Store Integration

Field order state is managed in the Zustand store via `createFieldOrderSlice.ts`:

```typescript
interface FieldOrderState {
  // Persisted state (saved to localStorage)
  fieldOrders: FieldOrderMap;

  // Draft state (pending changes during reorder mode)
  draftFieldOrders: FieldOrderMap;

  // Mode flag
  isReorderMode: boolean;
}
```

**Key Actions**:

| Action | Purpose |
|--------|---------|
| `updateFieldOrder(orderType, newOrder)` | Updates draft only (no persist) |
| `saveFieldOrderAndExit()` | Persists draft to localStorage and exits reorder mode |
| `cancelReorderMode()` | Discards draft changes and exits reorder mode |
| `resetFieldOrderToDefault(orderType)` | Resets draft for order type to empty (uses config default) |

### Draft State Architecture

The system uses a **two-state pattern** for safe editing:

1. **`fieldOrders`** - Persisted state saved to localStorage
2. **`draftFieldOrders`** - Pending changes shown during reorder mode

**Workflow**:

1. User enables reorder mode → `draftFieldOrders` initialized from `fieldOrders`
2. User drags fields → `updateFieldOrder()` updates draft only
3. User clicks **Save** → `saveFieldOrderAndExit()` persists draft and exits
4. User clicks **Reset** → `resetFieldOrderToDefault()` clears draft (shows config default)
5. User clicks outside/closes → `cancelReorderMode()` discards draft

This ensures changes are only persisted when explicitly saved.

### useFieldOrder Hook

**Purpose**: Thin wrapper around Zustand store for field order management

**Returns**:

```typescript
{
  // State
  isReorderMode: boolean;           // Whether reorder mode is enabled

  // Getters
  getFieldOrder(orderType, isViewMode): string[];  // Get ordered fields (uses draft in reorder mode)
  hasCustomOrder(orderType): boolean;              // Check if custom order exists in draft

  // Actions
  updateFieldOrder(orderType, newOrder): void;     // Update draft field order
  resetToDefault(orderType): void;                 // Reset draft to config default
  saveAndExit(): void;                             // Persist draft and exit reorder mode
  cancelReorder(): void;                           // Discard draft and exit reorder mode
}
```

### ReorderModeBanner UX

When reorder mode is active, a banner displays with **two buttons**:

| Button | Action | Description |
|--------|--------|-------------|
| **Reset to Default** | `resetToDefault()` | Resets draft to config order (does NOT persist) |
| **Save** | `saveAndExit()` | Persists current draft order and exits reorder mode |

Both buttons are always visible. The Reset button updates the draft immediately (user sees fields snap to config order), but changes are only persisted when Save is clicked.

### Intelligent Merging

When the config (`orderConfig.ts`) adds a new field, the merge logic preserves user preferences:

```typescript
// User's saved order for LIMIT
const savedOrder = ["notional", "direction", "limitPrice", "account", "liquidityPool", "timeInForce"];

// Config adds "slippage" field
const configOrder = ["direction", "liquidityPool", "notional", "limitPrice", "slippage", "timeInForce", "account"];

// Merge result: user order preserved, new field appended
const result = ["notional", "direction", "limitPrice", "account", "liquidityPool", "timeInForce", "slippage"];
```

**Logic**:

1. Keep fields from savedOrder that still exist in configOrder
2. Find new fields in configOrder that weren't saved
3. Append new fields at the end

### Non-Reorderable Fields

Some fields are pinned and cannot be reordered:

- **Order Type**: Always rendered first, outside the reorderable list
- **Status**: Always pinned at top in viewing/amending modes

### Restrictions

- **Creating Mode Only**: Reordering is only available in `creating` mode
- **Not in View/Amend**: Drag handles are hidden in viewing/amending modes
- **TickingPrice & Footer**: These components are outside the reorderable area

### Usage Example

```tsx
// In OrderForm.tsx
import { ReorderableFieldList } from "../molecules/ReorderableFieldList";
import { ReorderModeBanner } from "../molecules/ReorderModeBanner";

const renderField = useCallback(
  (fieldKey: keyof OrderStateData, index: number) => (
    <FieldController key={fieldKey} fieldKey={fieldKey} rowIndex={index} />
  ),
  []
);

return (
  <div>
    {/* Order Type selector - always first, not reorderable */}
    <RowComponent label="Order Type" fieldKey="orderType">
      <Select ... />
    </RowComponent>

    {/* Reorderable field list */}
    <ReorderableFieldList
      orderType={orderType}
      isViewMode={isReadOnly}
      renderField={renderField}
    />

    {/* Banner shows when reorder mode active */}
    <ReorderModeBanner orderType={orderType} />

    <OrderFooter />
  </div>
);
```

### Future Enhancements

- **Reorder Mode Toggle Button**: UI button to enter reorder mode (currently localStorage only)
- **Server Persistence**: Save field order preferences to server instead of localStorage
- **User-Specific**: Store orders per user when authentication is implemented
- **Keyboard Shortcuts**: Arrow keys to reorder fields without drag-and-drop

---

## Validation System

### Multi-Layer Validation

The app uses **4 layers of validation**:

#### 1. Synchronous (Client-Side)

- **Library**: Valibot
- **When**: On field change (debounced 50ms)
- **Where**: `/src/config/validation.ts`
- **Storage**: `errors[field]` in ComputedSlice
- **Examples**:
  - Required field check
  - Min/max value check
  - Number format validation

```typescript
const notionalSchema = v.pipe(
  v.number("Amount must be a number"),
  v.minValue(1, "Minimum amount is 1"),
  v.maxValue(100000000, "Amount exceeds pool limit")
);
```

#### 2. Asynchronous (Server-Side via Subscription)

- **Status**: ✅ **IMPLEMENTED**
- **When**: After sync validation passes (debounced)
- **Where**: `/src/store/slices/createComputedSlice.ts` (validateField)
- **Storage**: `serverErrors[field]` for HARD errors, `warnings[field]` for SOFT warnings
- **How**: GraphQL subscription to `validateField(input: ValidateFieldInput!)`
- **Examples**:
  - Firm trading limit check
  - Price band validation
  - Account/pool/symbol availability in backend
  - Positive number and range checks

**Implementation Details**:

The validation flow uses a short-lived GraphQL subscription per field validation:

```typescript
const result = await new Promise<ValidateFieldSubscriptionResponse>((resolve, reject) => {
  const sub = graphqlClient
    .subscribe<ValidateFieldSubscriptionResponse>({
      query: VALIDATE_FIELD_SUBSCRIPTION,
      variables: {
        input: {
          field,
          value: value == null ? null : String(value),
          orderType: derived.orderType,
          symbol: derived.symbol,
          account: derived.account,
          liquidityPool: derived.liquidityPool,
          timeInForce: derived.timeInForce,
        },
      },
    })
    .subscribe({
      next: (event) => {
        resolve(event.data as ValidateFieldSubscriptionResponse);
        sub.unsubscribe();
      },
      error: (err) => {
        reject(err);
        sub.unsubscribe();
      },
    });
});

const payload = result?.validateField;
if (payload && !payload.ok) {
  if (payload.type === "HARD") {
    state.serverErrors[field] = payload.message || "Invalid";
  } else if (payload.type === "SOFT") {
    state.warnings[field] = payload.message || "Check value";
  }
}
```

**Backend Implementation** (`backend/schema/resolvers.js`):

The `validateField` subscription resolver performs basic checks and yields one result:

- **notional**: Must be a number, positive, and below firm limit (soft warning if above $1B)
- **limitPrice/stopPrice**: Must be a number and positive
- **account**: Must exist in `accounts.json`
- **liquidityPool**: Must exist in `orderTypesWithPools.json`
- **symbol**: Must exist in `currencyPairs.json`

**Validation Types**:

- `HARD`: Blocking error (prevents submission) → stored in `serverErrors[field]`
- `SOFT`: Advisory warning (allows submission) → stored in `warnings[field]`

#### 3. Reference Data Validation

- **When**: After data loads, after field changes
- **Where**: `/src/store/slices/createComputedSlice.ts` (validateRefData)
- **Storage**: `refDataErrors[field]` in ComputedSlice
- **Examples**:
  - Account exists in accounts list
  - Order type in entitledOrderTypes
  - Symbol exists in currencyPairs
  - Pool exists in pools list

```typescript
if (values.account && !accounts.some(a => a.sdsId === values.account)) {
  newRefDataErrors.account = "Account not available";
}
```

#### 4. Warnings (Non-Blocking)

- **Status**: ✅ **IMPLEMENTED**
- **When**: From server validation (SOFT type)
- **Where**: `/src/store/slices/createComputedSlice.ts`
- **Storage**: `warnings[field]` in ComputedSlice
- **Display**: Yellow text below field (only shown if no errors present)
- **Examples**:
  - Large trade notification
  - Price outside typical range
  - Advisory messages that don't block submission

**UI Behavior**:

Warnings are displayed in `RowComponent` with a subtle yellow color (`$oe-color-status-warning`) and only appear when there are no errors on that field:

```typescript
// In FieldController
<RowComponent
  error={serverError || error || refDataError}
  warning={!serverError && !error && !refDataError ? warning : undefined}
/>
```

### Validation Timing

```text
User types → setFieldValue (immediate) → UI updates (immediate)
                                              ↓
                                        useDebounce waits 50ms
                                              ↓
                                        validateField fires
                                              ↓
                                 1. Sync validation (Valibot - instant)
                                              ↓
                        2. Async validation (GraphQL subscription - ~100-300ms)
                                              ↓
                       Open subscription → Receive FieldValidation → Close
                                              ↓
                        Update serverErrors/warnings based on type
                                              ↓
                                    FieldController re-renders
                                              ↓
               Error (red) or Warning (yellow) displayed below field
```

### Validation State Management

**State Structure** (in ComputedSlice):

```typescript
{
  errors: Record<string, string>;           // Client-side (Valibot)
  serverErrors: Record<string, string>;     // Server HARD errors
  refDataErrors: Record<string, string>;    // Reference data unavailable
  warnings: Record<string, string>;         // Server SOFT warnings
  isValidating: Record<string, boolean>;    // Per-field validation in progress
  validationRequestIds: Record<string, number>; // Race condition tracking
}
```

**Display Priority** (in UI):

1. Server errors (`serverErrors[field]`) - Shown in red, blocks submission
2. Client errors (`errors[field]`) - Shown in red, blocks submission
3. Reference data errors (`refDataErrors[field]`) - Shown in red, blocks submission
4. Warnings (`warnings[field]`) - Shown in yellow, allows submission

### Race Condition Handling

**Problem**: User types "100", then "1000000" quickly. The "100" async validation might return after "1000000", overwriting the correct result.

**Solution**: Request ID tracking

```typescript
// Increment request ID
const currentId = (get().validationRequestIds[field] || 0) + 1;
state.validationRequestIds[field] = currentId;

// Perform async validation
await serverCheck();

// Only update if this is still the latest request
if (get().validationRequestIds[field] === currentId) {
  state.errors[field] = errorMessage;
}
```

---

## Toast Notification System

### Overview

The application uses a **global toast notification system** to provide user feedback for actions like order submission, validation errors, and system events. Toast notifications appear at the bottom of the main card and can be dismissed by clicking the close button.

### Current Implementation

**Location**: Rendered in `MainLayout.tsx` (template component)

**State Management**: Stored in AppSlice (`toastMessage`)

**Display**: Positioned absolutely at bottom of card, slides up with animation

### Toast Structure

**Type Definition** (`types/store.ts`):

```typescript
interface AppSlice {
  toastMessage: {
    type: "success" | "error" | "info";
    text: string;
  } | null;

  setToast: (msg: { type: "success" | "error" | "info"; text: string } | null) => void;
}
```

**State**:

- `null`: No toast displayed
- `{ type, text }`: Toast displayed with specific styling

### Usage Examples

#### Setting a Toast

```typescript
// From any component with store access
const setToast = useOrderEntryStore((s) => s.setToast);

// Success notification
setToast({ type: "success", text: "Order submitted successfully" });

// Error notification
setToast({ type: "error", text: "Submission failed - invalid notional" });

// Info notification
setToast({ type: "info", text: "Price updated" });
```

#### Clearing a Toast

```typescript
// User clicks X button or programmatic dismissal
setToast(null);
```

### Current Usage in Codebase

| Location | Trigger | Type | Message |
|----------|---------|------|---------|
| `createComputedSlice.ts` (submitOrder) | Order created successfully | `success` | "Order Created: ORD-XXXX-X" |
| `createComputedSlice.ts` (submitOrder) | Order amendment success | `success` | "Order Updated: ORD-XXXX-X" |
| `createComputedSlice.ts` (submitOrder) | GraphQL mutation returns FAILURE | `error` | "Submission Failed" |
| `createComputedSlice.ts` (submitOrder) | Network/GraphQL error | `error` | "Submission Failed" |
| `useOrderTracking.ts` | Order status REJECTED | `error` | "Order Rejected: {reason}" |
| `useOrderTracking.ts` | Order status FILLED | `success` | "Order Filled" |
| `useOrderTracking.ts` | Order status CANCELLED | `info` | "Order Cancelled" |

### Visual Design

**Styling** (`MainLayout.module.scss`):

```scss
.toast {
  position: absolute;
  bottom: $oe-spacing-lg;
  left: $oe-spacing-lg;
  right: $oe-spacing-lg;
  padding: $oe-spacing-md;
  border-radius: $oe-radius-sm;
  box-shadow: $oe-shadow-lg;
  animation: slideUp $oe-transition-normal ease-out;

  &.error {
    background-color: $oe-color-error-bg;
    color: $oe-color-error-light;
  }

  &.success {
    background-color: $oe-color-success-bg;
    color: $oe-color-success-light;
  }

  &.info {
    background-color: $oe-color-info-bg;
    color: $oe-color-info-light;
  }
}
```

**Animation**: Slides up from bottom with fade-in effect

**Dismissal**: User must click X button (no auto-dismiss currently)

### Migration Strategies for Future Enhancements

#### Option 1: Convert Toast to Inline Error (Field-Level)

**Use Case**: When server validation returns a blocking error that should be displayed inline

**Implementation**:

```typescript
// Instead of:
setToast({ type: "error", text: "Invalid notional amount" });

// Use inline error:
state.serverErrors.notional = "Invalid notional amount";
```

**Benefits**:

- Error appears next to the problematic field
- Follows existing validation pattern
- No modal/toast dismissal needed

**Considerations**:

- Only works for field-specific errors
- Global errors (network failures, auth errors) still need toast/modal

---

#### Option 2: Add Modal Dialog for Critical Actions

**Use Case**: Server sends SOFT warning that requires user acknowledgment before proceeding

**Example Scenario**:

1. User submits large notional (e.g., $100M)
2. Server returns SOFT warning: "Trade exceeds typical size for this pair"
3. Show modal: "Are you sure you want to proceed with this large trade?"
4. User confirms → resubmit with acknowledgment flag
5. User cancels → stay in form

**Implementation Approach**:

Add new state to AppSlice:

```typescript
interface AppSlice {
  // Existing toast
  toastMessage: { type: "success" | "error" | "info"; text: string } | null;
  setToast: (msg) => void;

  // New modal state
  modalDialog: {
    type: "confirm" | "alert" | "warning";
    title: string;
    message: string;
    onConfirm?: () => void;
    onCancel?: () => void;
  } | null;
  setModal: (dialog) => void;
}
```

Create modal component in `organisms/`:

```tsx
// organisms/ModalDialog.tsx
export const ModalDialog = () => {
  const modal = useOrderEntryStore((s) => s.modalDialog);
  const setModal = useOrderEntryStore((s) => s.setModal);

  if (!modal) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h3>{modal.title}</h3>
        <p>{modal.message}</p>
        <div className={styles.actions}>
          {modal.onCancel && (
            <button onClick={() => { modal.onCancel?.(); setModal(null); }}>
              Cancel
            </button>
          )}
          {modal.onConfirm && (
            <button onClick={() => { modal.onConfirm?.(); setModal(null); }}>
              Confirm
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
```

Usage for warning acknowledgment:

```typescript
// In submitOrder when server returns SOFT warnings:
if (hasWarnings) {
  setModal({
    type: "warning",
    title: "Confirm Large Trade",
    message: "Your notional exceeds typical trade size. Continue?",
    onConfirm: () => {
      // Resubmit with acknowledgment
      submitOrderMutation({
        ...orderData,
        acknowledgeWarnings: true
      });
    },
    onCancel: () => {
      // Stay in form, keep warnings visible
      console.log("User cancelled large trade");
    }
  });
}
```

**Benefits**:

- Forces explicit user acknowledgment
- Prevents accidental submission of flagged orders
- Provides clear call-to-action buttons
- Can include detailed warning messages

**Considerations**:

- Need to update GraphQL mutation to accept `acknowledgeWarnings` flag
- Backend must track which warnings were shown vs acknowledged
- More intrusive than inline warnings (appropriate for critical issues)

---

#### Option 3: Hybrid Approach (Recommended)

**Strategy**: Use different feedback mechanisms based on severity:

| Severity | Feedback Mechanism | When to Use |
|----------|-------------------|-------------|
| **Field Validation (Client)** | Inline error (red) | Invalid input format, type errors |
| **Field Validation (Server HARD)** | Inline error (red) | Blocking business rules (exceeds limit) |
| **Field Validation (Server SOFT)** | Inline warning (yellow) | Advisory messages (large trade) |
| **Critical Warnings** | Modal dialog | Requires explicit acknowledgment |
| **Success Messages** | Toast notification | Non-blocking feedback |
| **Network/System Errors** | Toast notification | Global errors not tied to fields |

**Implementation**:

```typescript
// Decision tree in submitOrder:
if (hasHardErrors) {
  // Show inline errors (already implemented)
  return;
}

if (hasCriticalWarnings) {
  // Show modal for acknowledgment
  setModal({
    type: "warning",
    title: "Confirm Action",
    message: criticalWarning,
    onConfirm: () => submitWithAcknowledgment()
  });
  return;
}

if (hasSoftWarnings) {
  // Show inline warnings (already implemented)
  // User can still submit
}

// On success
setToast({ type: "success", text: "Order submitted" });
```

---

### Files to Modify for Migration

| Change | Files to Update |
|--------|----------------|
| Add modal state | `types/store.ts`, `createAppSlice.ts` |
| Create modal component | `organisms/ModalDialog.tsx`, `organisms/ModalDialog.module.scss` |
| Render modal in layout | `templates/MainLayout.tsx` |
| Update submission logic | `createComputedSlice.ts` (submitOrder) |
| Backend acknowledgment | `backend/schema/resolvers.js` (createOrder mutation) |
| GraphQL schema | `backend/schema/typeDefs.js` (add acknowledgeWarnings field) |

---

## Mock Data & Placeholders

**Implementation Status Summary**:

| Feature | Status | File(s) |
|---------|--------|---------|
| Price Feed | ✅ IMPLEMENTED | `TickingPrice.tsx`, `currencyPairHelpers.ts` |
| Order Submission | ✅ IMPLEMENTED | `createComputedSlice.ts` |
| Order Status Tracking | ✅ IMPLEMENTED | `useOrderTracking.ts`, `createAppSlice.ts` |
| Async Field Validation | ✅ IMPLEMENTED | `createComputedSlice.ts`, `backend/schema/resolvers.js` |
| Warning Display | ✅ IMPLEMENTED | `RowComponent.tsx`, `FieldController.tsx` |
| FDC3 Integration | ❌ MOCK | `fdc3Service.ts` |

---

### What's Currently Mocked

#### 1. FDC3 API

**File**: `/src/api/fdc3/fdc3Service.ts`

**Mock Implementation**:

```typescript
const mockFdc3: Fdc3Api = {
  addIntentListener: (intent, handler) => {
    // Simulates incoming intent after 8 seconds
    setTimeout(() => {
      handler({
        type: "fdc3.instrument",
        id: { ticker: "GBP/USD" },
        customData: { amount: 2500000, side: "SELL" }
      });
    }, 8000);
    return { unsubscribe: () => {} };
  }
};

window.fdc3 = mockFdc3;
```

**Replace With**:

- Remove mock implementation
- Use real `window.fdc3` from OpenFin container
- Remove `window.fdc3 = mockFdc3` line
- Keep the service class structure (it's container-agnostic)

---

#### 2. Price Ticking

**Status**: ✅ **IMPLEMENTED**

**File**: `/src/components/molecules/TickingPrice.tsx`

**Previous Mock Implementation**:

```typescript
useEffect(() => {
  const interval = setInterval(() => {
    setBuyPrice(prev => prev + (Math.random() - 0.5) * 0.0001);
    setSellPrice(prev => prev + (Math.random() - 0.5) * 0.0001);
  }, 1000);
  return () => clearInterval(interval);
}, [symbol]);
```

**Current Implementation**:

Now uses GraphQL `GATOR_DATA_SUBSCRIPTION` for real-time price updates. See [Workflow 6: Real-Time Price Updates](#workflow-6-real-time-price-updates) for details.

---

#### 3. Async Validation (Server-Side)

**Status**: ✅ **IMPLEMENTED**

**File**: `/src/store/slices/createComputedSlice.ts`

**Previous Mock Implementation**:

```typescript
// Simulate network delay
await new Promise(resolve => setTimeout(resolve, 300));

// Mock firm limit check
if (field === "notional" && value > MAX_FIRM_LIMIT) {
  state.errors[field] = "Exceeds firm trading limit (Server)";
}
```

**Current Implementation**:

Now uses GraphQL subscription-based validation. See [Validation System](#validation-system) for full details on the subscription flow, error/warning handling, and backend resolver implementation.

---

#### 4. Order Submission → Real GraphQL Mutations

**Status**: ✅ **IMPLEMENTED**

**File**: `/src/store/slices/createComputedSlice.ts`

**Implementation**:

Replaced mock `setTimeout` with actual GraphQL mutations:

```typescript
const isAmending = currentEditMode === "amending" && values.orderId;

if (isAmending) {
  // AMEND ORDER
  const { data } = await graphqlClient.mutate<AmendOrderResponse>({
    mutation: AMEND_ORDER_MUTATION,
    variables: {
      amendOrder: {
        orderId: values.orderId,
        amount: values.notional,
        limitPrice: values.limitPrice,
        stopPrice: values.stopPrice,
        timeInForce: values.timeInForce,
      },
    },
  });

  if (response?.result === "SUCCESS") {
    state.editMode = "viewing";
    state.toastMessage = { type: "success", text: `Order ${values.symbol} Amended!` };
  }
} else {
  // CREATE ORDER
  const { data } = await graphqlClient.mutate<CreateOrderResponse>({
    mutation: CREATE_ORDER_MUTATION,
    variables: {
      orderEntry: {
        currencyPair: values.symbol,
        side: values.direction,
        orderType: values.orderType,
        amount: values.notional,
        ccy: values.symbol.substring(0, 3),
        limitPrice: values.limitPrice,
        stopPrice: values.stopPrice,
        liquidityPool: values.liquidityPool,
        account: values.account,
        timeInForce: values.timeInForce,
        startTime: values.startTime,
      },
    },
  });

  if (response?.result === "SUCCESS" && response.orderId) {
    state.currentOrderId = response.orderId; // Store for ORDER_SUBSCRIPTION
    state.editMode = "viewing";
    state.toastMessage = { type: "success", text: `Order ${values.direction} ${values.symbol} Placed!` };
  }
}
```

**Key Changes**:

- Removed `setTimeout` mock
- Uses `graphqlClient.mutate()` directly (not React hooks, since we're in store)
- Stores `orderId` in `AppSlice.currentOrderId` for subscription tracking
- Handles both create and amend flows
- Shows error toasts if submission fails
- Transitions to viewing mode even on error if orderId exists (order was submitted)

**Order Status Tracking**:

After successful submission, `useOrderTracking` hook automatically subscribes to `ORDER_SUBSCRIPTION`:

```typescript
// In useOrderTracking.ts
const { data: orderData } = useSubscription(ORDER_SUBSCRIPTION, {
  variables: { orderId: currentOrderId },
  skip: !currentOrderId,
});

// Updates store with real-time status
useEffect(() => {
  if (orderData?.orderData) {
    setOrderStatus(orderData.orderData.execution.status);
  }
}, [orderData]);
```

**Status Field Display**:

- Added `status` field to `fieldRegistry` as read-only InputText
- Added `viewFields` array to `orderConfig` for all order types
- `OrderForm` uses `viewFields` instead of `fields` in viewing/amending mode
- Status is populated from `orderStatus` in `getDerivedValues()`
- `status` now exists on the `OrderStateData` type (UI-only, not sent to backend mutations)

```typescript
  try {
    if (isAmending) {
      // AMEND ORDER mutation call
    } else {
      // CREATE ORDER mutation call
    }
      state.globalError = reason;
    }  catch (e) {
    state.status = "ERROR";
    state.toastMessage = { type: "error", text: "Submission Failed" };
  }
  ```

---

### Placeholders in UI

#### Placeholder Text

**Files**: `/src/config/fieldRegistry.ts`, `/src/components/atoms/Input.tsx`

**Examples**:

- `placeholder="1,000,000"` - Amount input
- `placeholder="0.00000"` - Price input
- `placeholder="Select Pool"` - Pool dropdown
- `placeholder="Select Account"` - Account dropdown

**Purpose**: Visual hints for expected input format. No need to replace - these are standard UX.

---

#### TODO Comments

**File**: `/src/components/molecules/TickingPrice.tsx`

```typescript
// TODO: Replace with a vertical separator
```

**File**: `/src/components/organisms/OrderHeader.tsx`

```typescript
// TODO (Phase 5): This will subscribe to WebSocket price updates
```

**File**: `/src/components/organisms/OrderFooter.tsx`

```typescript
// TODO (Future): Add more buttons like CANCEL, FILL NOW, SUSPEND, RESUME
```

---

## Server-Side Validation Structure

### Current Approach

Currently, all validation happens **client-side** using Valibot schemas. The server accepts orders and returns success/failure.

### Planned Server-Side Validation

#### Where to Add It

**File**: `/src/store/slices/createComputedSlice.ts` → `validateField()` function

**When to Call**: After sync validation passes (currently mocked)

#### Implementation Plan

#### Step 1: Create GraphQL Query

**File**: `/src/graphql/queries.ts`

```typescript
export const VALIDATE_FIELD_QUERY = gql`
  query ValidateField($field: String!, $value: String!, $orderType: OrderType!) {
    validateField(field: $field, value: $value, orderType: $orderType) {
      field
      valid
      error
      warning
    }
  }
`;
```

#### Step 2: Integrate into Validation Flow

**File**: `/src/store/slices/createComputedSlice.ts`

Replace mock async validation:

```typescript
validateField: async (field, value) => {
  // ... sync validation (existing)

  // Async server validation (NEW)
  if (field === "limitPrice" || field === "notional") {
    const orderType = get().getDerivedValues().orderType;

    const { data } = await apolloClient.query({
      query: VALIDATE_FIELD_QUERY,
      variables: {
        field,
        value: value?.toString() || "",
        orderType
      }
    });

    // Race condition guard
    if (get().validationRequestIds[field] !== currentId) return;

    const result = data.validateField;

    set(state => {
      if (!result.valid) {
        state.errors[field] = result.error;
      }
      if (result.warning) {
        state.warnings[field] = result.warning;
      }
      state.isValidating[field] = false;
    });
  }
}
```

#### Server Validation Triggers

**On Blur**: Add blur handler to inputs

```typescript
// In FieldController.tsx
<Input
  onBlur={() => validateField(fieldKey, value)}
  // ... other props
/>
```

**On Submit**: Already implemented (full validation before submission)

---

### Validation Error Types

#### Client Errors (`errors`)

- **Source**: Valibot schemas
- **Examples**: Required field, min/max, format
- **Display**: Red border + error message below field
- **Blocking**: Yes - prevents submission

#### Server Errors (`serverErrors`)

- **Source**: Server validation endpoint
- **Examples**: Firm limits, price bands, balance checks
- **Display**: Red border + error message below field
- **Blocking**: Yes - prevents submission

#### Reference Data Errors (`refDataErrors`)

- **Source**: Local validation against loaded reference data
- **Examples**: Account unavailable, order type not entitled
- **Display**: Red border + error message below field
- **Blocking**: Yes - prevents submission (cannot amend)

#### Warnings (`warnings`)

- **Source**: Server validation (soft validation)
- **Examples**: Large trade, price outside typical range
- **Display**: Yellow border + warning message below field
- **Blocking**: No - allows submission with confirmation

---

## Things to Remember

### Critical Rules

1. **Layered State Priority**: User edits (dirtyValues) ALWAYS override base values (baseValues)

2. **FDC3 Intents Override Everything**: When FDC3 intent arrives:
   - Update baseValues
   - **MUST** call `resetFormInteractions()` to clear user edits
   - This ensures intents take priority

3. **Order Submission Flow**: After successful order creation:
   - `currentOrderId` is stored in AppSlice
   - `useOrderTracking` hook automatically subscribes to `ORDER_SUBSCRIPTION`
   - Status updates are displayed in real-time in the status field
   - Terminal states (FILLED/CANCELLED/REJECTED) show toast notifications

4. **Status Field Display**:
   - Status field only appears in "viewing" or "amending" modes
   - Uses `viewFields` array from orderConfig instead of `fields`
   - Populated from `orderStatus` in store (updated via ORDER_SUBSCRIPTION)

5. **Price Feed Integration**:
   - `TickingPrice` subscribes to `GATOR_DATA_SUBSCRIPTION` on mount
   - Uses `isNdf()` and `isOnshore()` helpers to determine subscription parameters
   - Automatically re-subscribes when symbol changes
   - No more mock setInterval - all prices are real-time from server
   - Uses Apollo `onData` callback to update prices, setting directional flags in the subscription callback
   - Directional movement (up/down) now tracked via boolean state (`buyIsUp`, `sellIsUp`)

6. **Race Condition Handling**: Always use `validationRequestIds` for async validation to prevent stale results

7. **Edit Mode Transitions**:
   - `"creating"` → User building new order
   - `"viewing"` → After submit (all fields read-only)
   - `"amending"` → After clicking Amend (only editableFields unlocked)

8. **Reference Data Errors Prevent Amend**: Cannot enter amend mode if `refDataErrors` exist

9. **Order Type Determines Fields**: Changing order type completely re-renders form with new fields from `ORDER_TYPES[orderType]`

10. **Validation is Debounced**: Wait 50ms after last keystroke before validating (prevents excessive server calls)

11. **Subscription Cleanup**: Always unsubscribe from GraphQL subscriptions on component unmount

12. **Instance ID in Logs**: All console.log statements should include `instanceId` for debugging multi-window scenarios

13. **Store Selectors**: Use granular selectors to prevent unnecessary re-renders

   ```typescript
   // Good - only re-renders when notional changes
   const notional = useOrderEntryStore(s => s.getDerivedValues().notional);

   // Bad - re-renders on ANY state change
   const state = useOrderEntryStore(s => s);
   ```

---

### Configuration-Driven Principles

1. **Never Hardcode Form Structure**: Always use `fieldRegistry` and `orderConfig`

2. **Component Types in FieldController**: Add new components to switch statement in `FieldController.tsx`

3. **Field Props Are Flexible**: Pass component-specific props via `fieldRegistry.props`

4. **Order Type Config Determines**:
   - Which fields show
   - Field order (top to bottom)
   - Initial focus
   - Which fields are editable after submit

5. **Validation Schema Per Order Type**: Each order type has its own Valibot schema in `validation.ts`

---

### State Management Best Practices

1. **One Store, Multiple Slices**: Never create multiple Zustand stores

2. **Immer for Immutability**: Use `immer` middleware to write mutable-looking code safely

3. **Computed Values via Getters**: Use `getDerivedValues()` instead of storing merged state

4. **Actions Return Void**: Store actions should update state, not return values

5. **No Side Effects in Selectors**: Selectors should be pure functions (no API calls)

---

### GraphQL Best Practices

1. **Query for Initial Data**: Use `useQuery` for accounts, pools, currency pairs

2. **Mutations for Actions**: Use `useMutation` for create/amend/cancel orders

3. **Subscriptions for Real-Time**: Use `useSubscription` for prices, order status

4. **Error Handling**: Always provide `onError` callback for subscriptions

5. **Cache Policy**:
   - Queries: `cache-first` (reference data rarely changes)
   - Subscriptions: `no-cache` (real-time data, don't cache)

---

### Styling Best Practices

1. **Use Variables**: All colors, spacing, fonts from `variables.scss`

2. **CSS Modules**: All component styles use `.module.scss` suffix

3. **No Inline Styles**: Use CSS classes, not `style={{}}` prop

4. **Size Variants**: Use CSS custom properties (`--app-width`, `--app-max-height`) for responsive sizing

5. **Dark Mode Ready**: All colors defined as CSS variables in `:root`

---

## Upcoming Features

### 1. Server-Side Validation on Blur

**Status**: Planned
**Implementation**: See [Server-Side Validation Structure](#server-side-validation-structure)

**Changes Needed**:

- Frontend query integration
- Blur event handlers on inputs
- Warning vs. error distinction

---

### 2. Additional Order Actions

**Status**: TODO (commented in code)
**File**: `/src/components/organisms/OrderFooter.tsx`

**Actions to Add**:

- **CANCEL**: Cancel an active order
- **FILL NOW**: Force immediate fill (market order conversion)
- **SUSPEND**: Pause order execution
- **RESUME**: Resume suspended order

**Implementation**:

- Create mutations in `mutations.ts`
- Add button components in `OrderFooter.tsx`
- Add actions to `ComputedSlice`

---

### 3. Advanced Time In Force Options

**Status**: Partial implementation
**Current**: Basic GTC, IOC, FOK, GTD options exist
**Planned**: Add date/time picker for GTD orders

**Implementation**:

- Add `startTime` field rendering
- Integrate with DateTime component
- Add to editable fields

---

### 4. Multi-Leg Orders

**Status**: Future feature
**Description**: Create orders with multiple legs (e.g., FX swap)

**Implementation**:

- New order type: `MULTI_LEG`
- Array of legs in `OrderStateData`
- Repeatable field group in UI
- Complex validation (legs must balance)

---

### 5. Keyboard Shortcuts

**Status**: Hook exists, not fully implemented
**File**: `/src/hooks/useKeyboardHotkeys.ts`

**Planned Shortcuts**:

- `Ctrl + Enter`: Submit order
- `Esc`: Reset form (if dirty) or close
- `Shift + F`: Focus notional field
- `Shift + L`: Focus limitPrice field

**Implementation**:

- Complete `useKeyboardHotkeys` hook
- Add to `OrderForm` component
- Document shortcuts in UI (tooltip or help dialog)

---

### 6. Accessibility Improvements

**Status**: Partial implementation
**Planned**:

- ARIA labels on all inputs
- Keyboard navigation (Tab order)
- Screen reader announcements for validation errors
- High contrast mode
- Focus indicators

---

## Summary: Quick Reference

### Quick Guides for Common Tasks

#### To Add a New Field

1. Update `types/domain.ts`
2. Add to `fieldRegistry.ts`
3. Add to `orderConfig.ts` fields array
4. (Optional) Add validation in `validation.ts`

#### To Add a New Order Type

1. Update `types/domain.ts`
2. Add config in `orderConfig.ts`
3. Create Valibot schema in `validation.ts`

#### To Add a New Component Type

1. Create component in `components/atoms/` or `components/molecules/`
2. Add case in `FieldController.tsx` switch statement
3. Update `FieldDefinition` type in `fieldRegistry.ts`

#### To Modify Validation

- **Sync**: Edit Valibot schemas in `validation.ts`
- **Async**: Backend resolver is in `backend/schema/resolvers.js` (validateField subscription)
- **Reference Data**: Edit `validateRefData()` in `createComputedSlice.ts`

#### To Modify State Management

- **App status**: `createAppSlice.ts`
- **User edits**: `createUserInteractionSlice.ts`
- **Base values**: `createInitialOrderSlice.ts`
- **Validation/submission**: `createComputedSlice.ts`

#### To Modify GraphQL Integration

- **Queries**: `graphql/queries.ts`
- **Mutations**: `graphql/mutations.ts`
- **Subscriptions**: `graphql/subscriptions.ts`

#### To Replace Remaining Mocks

- **FDC3**: Remove mock in `fdc3Service.ts`, use real `window.fdc3`
