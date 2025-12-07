# FX Order Entry - Comprehensive Developer Guide

A deep dive into the FX Order Entry application architecture, patterns, and workflows.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [State Management Deep Dive](#state-management-deep-dive)
3. [Form System](#form-system)
4. [Validation System](#validation-system)
5. [FDC3 Intent Handling](#fdc3-intent-handling)
6. [Scenarios & Workflows](#scenarios--workflows)
7. [Code Organization](#code-organization)
8. [Unit Testing](#unit-testing)

---

## Architecture Overview

### High-Level Data Flow

```txt
User Input
    │
    ▼
FieldRenderer (renders field component)
    │
    ├─→ useFieldValue (get/set value)
    ├─→ useFieldState (get validation errors)
    ├─→ useFieldOptions (get dropdown options)
    ├─→ useFieldReadOnly (compute read-only state)
    └─→ useFieldVisibility (check if visible)
    │
    ▼
Zustand Store (global state)
    │
    ├─→ DerivedSlice (computed form values)
    ├─→ ValidationSlice (validation state)
    └─→ SubmissionSlice (order submission)
    │
    ▼
GraphQL Mutations (submit order)
```

### Slice Dependency Graph

```txt
Priority Layers:
┌─────────────────────────────────────────────┐
│ DefaultsSlice (Priority 1)                  │
│ Hardcoded default values                    │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│ UserPrefsSlice (Priority 2)                 │
│ User preferences from server subscription   │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│ Fdc3IntentSlice (Priority 3)                │
│ Intent data from external apps              │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│ UserInteractionSlice (Priority 4 - highest) │
│ User manual input (form edits)              │
└─────────────────────────────────────────────┘
                    │
                    ▼
        DerivedSlice (merges all)
                    │
                    ▼
        Final Form Values (OrderStateData)
```

### Why Priority Layers?

**Problem:** Without priority layers, FDC3 intent data would overwrite user edits if the intent loaded after the user started typing.

**Solution:** Higher-priority data (user input) always overrides lower-priority data (FDC3 intent). Loading order doesn't matter.

**Example:**

- User types in Symbol field → stored in UserInteractionSlice (Priority 4)
- FDC3 intent arrives with Symbol → stored in Fdc3IntentSlice (Priority 3)
- `getDerivedValues()` returns user's value because Priority 4 > Priority 3

---

## State Management Deep Dive

### Store Slices

#### 1. AppSlice

Lifecycle and UI state.

```typescript
{
  status: "INITIALIZING" | "READY" | "SUBMITTING" | "ERROR"
  editMode: "creating" | "viewing" | "amending"
  currentOrderId: string | null
  toastMessage: { type: "success" | "error"; text: string } | null
}
```

#### 2. RefDataSlice

Reference data loaded from server (dropdown options).

```typescript
{
  accounts: Account[]
  pools: LiquidityPool[]
  currencyPairs: CurrencyPair[]
  entitledOrderTypes: string[]
  isLoadingRefData: boolean
}
```

#### 3. DefaultsSlice (Priority 1)

Hardcoded defaults - never changes.

```typescript
{
  defaults: {
    symbol: "GBPUSD"
    direction: "BUY"
    orderType: "LIMIT"
    // ... other fields
  }
}
```

#### 4. UserPrefsSlice (Priority 2)

User's preferred defaults from server.

```typescript
{
  userPrefs: {
    defaultAccount: "ACC123"
    defaultLiquidityPool: "POOL456"
    defaultOrderType: "LIMIT"
    defaultTimeInForce: "GTC"
  }
}
```

#### 5. Fdc3IntentSlice (Priority 3)

FDC3 intent data - can be accepted or rejected.

```typescript
{
  fdc3Intent: {
    symbol: "EURUSD"
    direction: "SELL"
    notional: 1000000
    // ... other fields from intent
  } | null
  fdc3Metadata: {
    intentName: "ViewInstrument"
    timestamp: number
  } | null
}
```

#### 6. UserInteractionSlice (Priority 4 - Highest)

User's manual form edits.

```typescript
{
  dirtyValues: {
    symbol: "EURUSD"
    direction: "BUY"
    notional: 500000
    // ... only changed fields
  }
}
```

#### 7. DerivedSlice

Computed values combining all layers.

```typescript
getDerivedValues(): OrderStateData {
  // Merge: defaults + userPrefs + fdc3Intent + userInput
  // Higher priority overrides lower priority
}

isDirty(): boolean {
  // True if user has made any edits
}

isFormValid(): boolean {
  // True if no errors in validation slice
}
```

#### 8. ValidationSlice

All validation state and actions.

```typescript
{
  errors: Record<string, string>           // Sync errors
  serverErrors: Record<string, string>     // Async errors
  warnings: Record<string, string>         // Non-blocking hints
  refDataErrors: Record<string, string>    // Missing accounts/pools
  globalError: string | null
  isValidating: Record<string, boolean>    // Loading indicators
  validationRequestIds: Record<string, number> // Race condition tracking
}
```

#### 9. SubmissionSlice

Order submission and amendment.

```typescript
{
  submitOrder(): Promise<void>  // Create or amend order
  amendOrder(): void             // Enter amend mode
}
```

---

## Form System

### Component Hierarchy

```txt
OrderForm (container)
├─ FieldRenderer (field 1)
│  └─ hooks: useFieldValue, useFieldState, etc.
│     └─ <Input> | <Select> | <Toggle> | <AmountWithCurrency> | <LimitPriceWithCheckbox>
├─ FieldRenderer (field 2)
└─ ... (more fields)
```

### FieldRenderer Hook Composition

**FieldRenderer** doesn't have business logic - it uses hooks:

```typescript
const { value, setValue } = useFieldValue(fieldKey);
const { options, isLoading } = useFieldOptions(fieldKey);
const { hasError, combinedError, warning, isValidating } = useFieldState(fieldKey);
const { isReadOnly, isEditable } = useFieldReadOnly(fieldKey);
```

Each hook:

- Reads from the store
- Provides data or callbacks
- Subscribes to relevant state only (optimized)

### Field Registry

Fields are **defined in configuration**, not hardcoded in JSX:

```typescript
// config/fieldRegistry.ts
export const FIELD_REGISTRY: Record<keyof OrderStateData, FieldDefinition> = {
  symbol: {
    label: "Currency Pair",
    component: "Select",
    order: 1,
  },
  direction: {
    label: "Direction",
    component: "Toggle",
    order: 2,
  },
  orderType: {
    label: "Order Type",
    component: "Select",
    order: 3,
  },
  notional: {
    label: "Amount",
    component: "AmountWithCurrency",
    order: 4,
  },
  limitPrice: {
    label: "Limit Price",
    component: "LimitPriceWithCheckbox",
    order: 5,
  },
  // ... more fields
};
```

### Component Types

| Component | Use Case | Props |
|-----------|----------|-------|
| `Input` | Text/number input | `type`, `value`, `onChange` |
| `Select` | Dropdown selection | `value`, `onChange`, `options` |
| `Toggle` | Binary/ternary choice (BUY/SELL) | `value`, `onChange`, `options` |
| `AmountWithCurrency` | Amount with currency toggle | `value`, `onChange`, `ccy1`, `ccy2` |
| `LimitPriceWithCheckbox` | Price with "grab" button | `value`, `onChange`, `direction` |

---

## Validation System

### Three-Level Validation

#### 1. Sync Validation (Valibot)

Runs immediately when field changes (debounced 300ms).

```typescript
// config/validation.ts - Schemas aligned with GraphQL
export const LimitOrderSchema = v.object({
  symbol: symbolSchema,
  direction: directionSchema,
  orderType: v.literal("LIMIT"),
  notional: notionalSchema,
  limitPrice: priceSchema,  // Required for LIMIT
  account: requiredString,
  // ... other fields
});

export const SCHEMA_MAP = {
  TAKE_PROFIT: TakeProfirOrderSchema,
  STOP_LOSS: StopLossOrderSchema,
  // ... other order types
};
```

Flow:

```typescript
// In ValidationSlice.validateField()
1. Get schema for current orderType
2. Parse field value with schema
3. If error: store in state.errors[fieldKey]
4. Display error on field
```

#### 2. Async Validation (Server)

Runs after sync validation passes.

```typescript
// Server checks firm limits, risk rules, etc.
const result = await graphqlClient.query({
  query: VALIDATE_FIELD_QUERY,
  variables: {
    field: "notional",
    value: 5000000,
    orderType: "LIMIT",
    // ... context
  },
});

// Server returns:
{
  ok: false,
  type: "HARD" | "SOFT",  // HARD = blocking, SOFT = warning
  message: "Exceeds firm limit"
}
```

#### 3. Ref Data Validation

Checks if selected accounts/pools/currencies exist.

```typescript
// In ValidationSlice.validateRefData()
const errors = {};
if (account && !accounts.find(a => a.sdsId === account)) {
  errors.account = "Account not available";
}
if (pool && !pools.find(p => p.value === pool)) {
  errors.liquidityPool = "Pool not available";
}
// ... etc
```

### Submission-Time Validation

When user clicks Submit:

```typescript
// SubmissionSlice.submitOrder()
1. Call validateOrderForSubmission(values)
2. Returns { valid: false, errors: { field: "message" } }
3. If invalid: show errors, don't submit
4. If valid: execute GraphQL mutation
```

---

## FDC3 Intent Handling

### What is FDC3?

Financial Desktop Connectivity Standard - allows apps to communicate. Example: Portfolio app sends "ViewInstrument" intent to order entry app.

### Intent Flow

```txt
Portfolio App
    │
    └─→ Send FDC3 Intent (symbol: "EURUSD")
            │
            ▼
    Order Entry App receives
            │
            ├─→ User has unsaved changes?
            │   └─→ Show Fdc3ConfirmDialog
            │       ├─→ Accept: Merge intent into form
            │       └─→ Reject: Discard intent
            │
            └─→ User has no changes?
                └─→ Auto-accept, apply intent
```

### Intent Mapping

```typescript
// api/fdc3/intentMapper.ts
export const mapFdc3ToOrderData = (intent: FDC3Intent): Partial<OrderStateData> => {
  return {
    symbol: intent.instrument?.id?.ticker || intent.symbol,
    direction: intent.direction === "buy" ? "BUY" : "SELL",
    notional: intent.quantity,
    // ... map other fields
  };
};
```

### Code Flow

1. **Intent Arrives** (`fdc3Service.ts`)

   ```typescript
   fdc3.addIntentListener("ViewInstrument", (intent) => {
     store.setPendingIntent(intent);
   });
   ```

2. **Check for Unsaved Changes** (`App.tsx`)

   ```typescript
   if (isDirty && pendingIntent) {
     showFdc3ConfirmDialog();
   }
   ```

3. **User Accepts/Rejects** (`Fdc3ConfirmDialog.tsx`)

   ```typescript
   // Accept
   setFdc3Intent(mapFdc3ToOrderData(pendingIntent));
   clearPendingIntent();

   // Reject
   clearPendingIntent();
   ```

4. **Form Updates** (automatic via `getDerivedValues()`)
   - Intent data layers into form (Priority 3)
   - User can override with manual edits (Priority 4)

---

## Scenarios & Workflows

### Scenario 1: User Enters an Order

```txt
1. User selects Symbol "GBPUSD" (Select field)
   → setFieldValue("symbol", "GBPUSD")
   → Stored in UserInteractionSlice.dirtyValues

2. useFieldValue hook detects change
   → Triggers debounced validation (300ms)

3. Validation runs
   → Sync: Check schema (valid)
   → Async: Check server (valid)
   → Display on field (no error)

4. User selects Direction "BUY"
   → setFieldValue("direction", "BUY")
   → Same validation flow

5. User enters Amount "1000000"
   → OrderType is "LIMIT", so limitPrice required
   → Validation error: "Limit price required"
   → User sees error on limitPrice field

6. User clicks Submit
   → Call submitOrder()
   → Full validation (all fields)
   → If valid: GraphQL mutation
   → On success: Set currentOrderId, show toast
```

### Scenario 2: FDC3 Intent Arrives

```txt
Before Intent:
Form state: { symbol: "GBPUSD", direction: "BUY", notional: 1000000 }
isDirty: true (user has made edits)

Portfolio app sends: { symbol: "EURUSD", direction: "SELL", quantity: 500000 }

1. Intent received by fdc3Service
   → Store in pendingIntent

2. App detects isDirty && pendingIntent
   → Show Fdc3ConfirmDialog
   → "You have unsaved changes. Accept intent?"

3a. User clicks "Accept"
    → Call setFdc3Intent(mapFdc3ToOrderData(intent))
    → Fdc3IntentSlice.fdc3Intent = { symbol: "EURUSD", ... }
    → getDerivedValues() returns merged data
    → Form updates:
      - symbol: "EURUSD" (from intent, Priority 3)
      - direction: "SELL" (from intent, Priority 3)
      - notional: 500000 (from intent, Priority 3)

3b. User clicks "Reject"
    → Just clear pendingIntent
    → Form unchanged
```

### Scenario 3: Update Field Based on Another Field

**Example:** When orderType changes to LIMIT, show limitPrice field (visibility rule)

```typescript
// config/visibilityRules.ts
export const FIELD_VISIBILITY_RULES: Record<string, (values: OrderStateData) => boolean> = {
  limitPrice: (values) => {
    return ["LIMIT", "TAKE_PROFIT"].includes(values.orderType);
  },
  stopPrice: (values) => {
    return values.orderType === "STOP_LOSS";
  },
  // ... other rules
};

// In ReorderableFieldList.tsx
const visibleFields = fields.filter((f) => {
  return isFieldVisible(f, getDerivedValues());
});
// Only render visible fields
```

**Another Example:** Auto-populate limitPrice when direction changes

```typescript
// In a hook or useEffect
const direction = useOrderEntryStore((s) => s.getDerivedValues().direction);
const currentPrice = useOrderEntryStore((s) => s.currentBuyPrice);

useEffect(() => {
  const currentLimitPrice = useOrderEntryStore((s) => s.getDerivedValues().limitPrice);

  if (!currentLimitPrice && direction === "BUY") {
    setFieldValue("limitPrice", currentPrice);
  }
}, [direction, currentPrice]);
```

### Scenario 4: Amend an Existing Order

```txt
1. User views submitted order (editMode: "viewing")

2. User double-clicks order
   → Call amendOrder()
   → Set editMode to "amending"

3. Form becomes editable
   → Only editable fields enabled (e.g., amount, limitPrice)
   → Symbol, direction locked

4. User changes amount and clicks Submit
   → submitOrder() detects editMode === "amending"
   → Calls AMEND_ORDER_MUTATION (not CREATE)
   → On success: Show "Order amended" toast
```

### Scenario 5: Field Dependency Chain

**Example:** Changing symbol triggers currency pair parsing → updates ccy1/ccy2 → AmountWithCurrency component re-renders

```txt
User changes symbol:
  setFieldValue("symbol", "EURUSD")
    ↓
  Stored in UserInteractionSlice.dirtyValues
    ↓
  useFieldValue detects change → component re-renders
    ↓
  useOrderEntryStore reads updated symbol
    ↓
  currencyPairs.find(p => p.symbol === "EURUSD")
    ↓
  Gets { symbol: "EURUSD", ccy1: "EUR", ccy2: "USD" }
    ↓
  AmountWithCurrency receives updated ccy1/ccy2
    ↓
  Component re-renders with new currency labels
```

---

## Code Organization

### Directory Structure Explained

```txt
src/
├── components/
│   ├── atoms/              # Base components (Input, Select, Spinner)
│   ├── molecules/          # Composed components (AmountWithCurrency, ToggleSwitch)
│   └── organisms/          # Page-level (OrderForm, FieldRenderer, OrderFooter)
│
├── config/
│   ├── fieldRegistry.ts    # Field definitions
│   ├── validation.ts       # Valibot schemas (GraphQL-aligned)
│   ├── visibilityRules.ts  # Conditional field visibility
│   ├── componentFactory.ts # Component type predicates
│   ├── constants.ts        # App constants (debounce, price steps, etc.)
│   └── orderConfig.ts      # Order type configurations
│
├── graphql/
│   ├── client.ts           # Apollo client setup
│   ├── mutations.ts        # createOrder, amendOrder
│   ├── queries.ts          # validateField
│   ├── subscriptions.ts    # orderStatus, user preferences
│   └── types.ts            # GraphQL response types
│
├── hooks/
│   ├── fieldConnectors/    # Hooks for form fields
│   │  ├── useFieldValue.ts
│   │  ├── useFieldState.ts
│   │  ├── useFieldOptions.ts
│   │  ├── useFieldReadOnly.ts
│   │  └── useFieldVisibility.ts
│   ├── useAppInit.ts       # App initialization
│   ├── useDebounce.ts      # Debounce utility
│   └── useOrderTracking.ts # Track submitted order
│
├── store/
│   ├── index.ts            # Store creation
│   ├── slices/             # Individual slices
│   │  ├── createAppSlice.ts
│   │  ├── createDerivedSlice.ts
│   │  ├── createValidationSlice.ts
│   │  ├── createSubmissionSlice.ts
│   │  ├── createFdc3IntentSlice.ts
│   │  ├── createUserInteractionSlice.ts
│   │  ├── createUserPrefsSlice.ts
│   │  ├── createDefaultsSlice.ts
│   │  ├── createRefDataSlice.ts
│   │  ├── createPriceSlice.ts
│   │  └── createFieldOrderSlice.ts
│   └── middleware/
│      └── logger.ts        # Store logging middleware
│
├── types/
│   ├── domain.ts           # OrderStateData and related types
│   ├── store.ts            # Zustand slice interfaces
│   └── layers.ts           # Layer types (Defaults, UserPrefs, etc.)
│
└── utils/
   ├── currencyPairHelpers.ts
   ├── idGenerator.ts
   └── numberFormats.ts
```

### Key Principles

1. **Configuration-Driven UI** - Fields defined in config, not JSX
2. **Hook Composition** - Small, focused hooks over monolithic components
3. **Type Safety** - Valibot schemas, proper TypeScript typing
4. **Separation of Concerns** - Each slice has one responsibility
5. **No Hardcoded Logic** - Constants in `constants.ts`, rules in `visibilityRules.ts`

---

## Common Development Tasks

### Add a New Order Field

1. Add to `OrderStateData` in `types/domain.ts`
2. Add to `FIELD_REGISTRY` in `config/fieldRegistry.ts`
3. Add validation schema to `config/validation.ts`
4. Add visibility rule if conditional in `config/visibilityRules.ts`
5. Done - automatically appears in form

### Add a New Validation Rule

1. Add Valibot schema to `config/validation.ts`
2. Include it in the order type's schema (e.g., `LimitOrderSchema`)
3. Message automatically shown on field if invalid

### Add a New Visibility Condition

1. Add rule to `FIELD_VISIBILITY_RULES` in `config/visibilityRules.ts`
2. Hook checks it automatically
3. Field shows/hides based on condition

### Debug Store State

```javascript
// Browser console
window.__ORDER_STORE__.getState()
// See entire state tree
```

### Check Field Validation

```typescript
const errors = useOrderEntryStore((s) => s.errors);
const serverErrors = useOrderEntryStore((s) => s.serverErrors);
const warnings = useOrderEntryStore((s) => s.warnings);
```

---

## Architecture Decisions

### Why Zustand?

- Lightweight (compared to Redux)
- Simple slice pattern
- Great TypeScript support
- Minimal boilerplate

### Why Valibot?

- Tiny bundle size (~1KB)
- Aligns perfectly with GraphQL schemas
- Type-safe validation

### Why we have Priority Layers?

- Handles async data loading gracefully
- FDC3 intents work regardless of load timing
- User edits always take precedence
- No race condition management needed

### Why FieldRenderer with Hooks?

- Each field concern isolated in a hook
- Easy to test individual behaviors
- Components stay small and readable
- Optimized subscriptions per field

---

### Field Ordering & Reorder Mode

Users can customize the order of fields in the form using drag-and-drop.

**Architecture:**

```typescript
// FieldOrderSlice - Manages per-order-type field ordering
interface FieldOrderSlice {
  fieldOrders: FieldOrderMap;           // Persisted field order from localStorage
  draftFieldOrders: FieldOrderMap;      // Pending changes during reorder mode
  isReorderMode: boolean;               // Whether user is in reorder mode
  getFieldOrder: (orderType) => fields; // Get ordered fields for order type
  updateFieldOrder: (orderType, fields) => void; // Update draft field order
  resetFieldOrderToDefault: (orderType) => void; // Reset draft to default
  saveAndExitReorderMode: () => void;   // Persist draft and exit mode
  toggleReorderMode: () => void;        // Enter/exit reorder mode
}
```

**Flow:**

1. **Enter Reorder Mode**: User clicks "Reorder Fields" button
   - `toggleReorderMode()` sets `isReorderMode: true`
   - `ReorderModeBanner` appears with "Save" and "Reset" buttons
   - `ReorderableFieldList` shows drag handles on each field

2. **Drag Fields**: User reorders fields by dragging
   - `updateFieldOrder()` updates `draftFieldOrders` (not persisted yet)
   - Changes are NOT saved until user clicks "Save"

3. **Save**: User clicks "Save" button
   - `saveAndExitReorderMode()` persists to localStorage
   - Sets `isReorderMode: false` (banner disappears)
   - Form re-renders with new field order

4. **Reset**: User clicks "Reset to Default" button
   - `resetFieldOrderToDefault()` clears draft
   - Form goes back to default order
   - Still in reorder mode (user can retry)

**localStorage Keys:**

- `fx-order-field-order`: `{ "TAKE_PROFIT": [...fields], "STOP_LOSS": [...fields] }`
- `fx-order-reorder-mode`: `"true" | "false"`

**How to extend:**

Field ordering is automatic - just add fields to `fieldRegistry.ts` and `ORDER_TYPES` in `orderConfig.ts`. The order defined in `ORDER_TYPES[orderType].fields` becomes the default, which users can customize.

---

### Field Visibility Rules

Fields can be conditionally shown/hidden based on form state.

**Architecture:**

```typescript
// config/visibilityRules.ts
export const FIELD_VISIBILITY_RULES: Record<string, (values: OrderStateData) => boolean> = {
  limitPrice: (values) => {
    return ["LIMIT", "TAKE_PROFIT"].includes(values.orderType);
  },
  stopPrice: (values) => {
    return values.orderType === "STOP_LOSS";
  },
  startTime: (values) => {
    return values.orderType === "FLOAT";
  },
  iceberg: (values) => {
    return ["TAKE_PROFIT", "STOP_LOSS"].includes(values.orderType);
  },
};
```

**How it works:**

1. `useFieldVisibility(fieldKey)` hook reads the rule
2. Calls the rule function with current form values
3. Returns `true` to show, `false` to hide
4. `FieldRenderer` checks visibility before rendering
5. Hidden fields don't render, but keep their values in store

**Common Patterns:**

```typescript
// Show field for specific order types
myField: (values) => ["LIMIT", "STOP_LOSS"].includes(values.orderType)

// Show field when another field has a value
timeInForce: (values) => values.orderType !== null

// Show field based on direction
stopPrice: (values) => values.direction === "BUY" && values.orderType === "STOP_LOSS"

// Show field when user has entitlements
exoticField: (values) => userEntitlements.includes("EXOTIC_ORDERS")
```

**How to add a visibility rule:**

1. Open `config/visibilityRules.ts`
2. Add a function for your field:

   ```typescript
   myNewField: (values) => {
     return values.someOtherField !== null;
   }
   ```

3. Done - `useFieldVisibility` automatically picks it up

---

### Keyboard Hotkeys

Power users can use keyboard shortcuts for common actions.

**Implemented Hotkeys:**

| Shortcut | Action | Used By |
|----------|--------|---------|
| `Ctrl + Enter` | Submit order | OrderForm |
| `Esc` | Cancel / Reset form | OrderForm |

**Architecture:**

```typescript
// hooks/useKeyboardHotkeys.ts
export const useKeyboardHotkeys = () => {
  const submitOrder = useOrderEntryStore((s) => s.submitOrder);
  const resetFormInteractions = useOrderEntryStore((s) => s.resetFormInteractions);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        submitOrder();
      }
      if (e.key === "Escape") {
        resetFormInteractions();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [submitOrder, resetFormInteractions]);
};
```

**How to add a hotkey:**

1. Open `hooks/useKeyboardHotkeys.ts`
2. Add a new condition in the `handleKeyDown` function
3. Example:

   ```typescript
   if (e.shiftKey && e.key === "f") {
     e.preventDefault();
     store.getState().setFieldValue("notional", "");
     // Focus notional field for speed entry
   }
   ```

---

### Live Price Updates (PriceSlice)

The app subscribes to live market prices and updates the form in real-time.

**Architecture:**

```typescript
// store/slices/createPriceSlice.ts
interface PriceSlice {
  currentBuyPrice: number | null;   // Latest buy (bid) price
  currentSellPrice: number | null;  // Latest sell (ask) price
  priceSubscriptionActive: boolean; // Whether subscription is running
  subscribeToPrices: (symbol: string) => void; // Start subscription
  unsubscribePrices: () => void;    // Stop subscription
}
```

**Flow:**

1. **Subscription Start** - When symbol changes or app initializes
   - `subscribeToPrices(symbol)` calls GraphQL subscription
   - Backend streams price updates via WebSocket
   - Each update: `currentBuyPrice` and `currentSellPrice` are updated

2. **Real-Time Updates** - Components read prices
   - `OrderHeader` displays live ticking prices
   - `LimitPriceWithCheckbox` can auto-fill limit price from current price
   - User sees live updates without manual refresh

3. **Subscription Stop** - When symbol changes or app unmounts
   - `unsubscribePrices()` closes the WebSocket subscription
   - Prevents memory leaks and unnecessary updates

**GraphQL Subscription:**

```typescript
// graphql/subscriptions.ts
export const GATOR_DATA_SUBSCRIPTION = gql`
  subscription GatorData($subscription: GatorSubscription) {
    gatorData(subscription: $subscription) {
      topOfTheBookBuy { price precisionValue }
      topOfTheBookSell { price precisionValue }
    }
  }
`;
```

**Backend Returns:**

```typescript
{
  gatorData: {
    topOfTheBookBuy: { price: 1.27345, precisionValue: 1.27345 },
    topOfTheBookSell: { price: 1.27115, precisionValue: 1.27115 }
  }
}
```

**How prices are used:**

```typescript
// In OrderHeader - Display prices
const { currentBuyPrice, currentSellPrice } = useOrderEntryStore(...);
return (
  <div>Buy: {currentBuyPrice?.toFixed(5)} | Sell: {currentSellPrice?.toFixed(5)}</div>
);

// In LimitPriceWithCheckbox - Grab current price
const onClick = () => {
  const currentPrice = direction === "BUY" ? currentSellPrice : currentBuyPrice;
  setFieldValue("limitPrice", currentPrice);
};
```

---

### Custom Components & Field Types

The app supports various field component types, each with custom behavior.

**Available Components:**

| Component | Purpose | Example |
|-----------|---------|---------|
| `InputNumber` | Numeric input with formatting | Notional, Iceberg |
| `InputText` | Text input (read-only in view mode) | Status |
| `Select` | Dropdown selection | Symbol, Account, Pool |
| `Toggle` | Binary choice (BUY/SELL) | Direction |
| `DateTime` | Date/time picker | Start Time |
| `AmountWithCurrency` | Amount with currency toggle (CCY1/CCY2) | Notional with ccy toggle |
| `LimitPriceWithCheckbox` | Price with "Grab Price" button | Limit Price, Stop Price |

**Component Factory:**

The `componentFactory.ts` provides type predicates for safe component type checking:

```typescript
// config/componentFactory.ts
export const isSelectComponent = (component: string): component is "Select" =>
  component === "Select";

export const isToggleComponent = (component: string): component is "Toggle" =>
  component === "Toggle";

export const isAmountWithCurrencyComponent = (component: string) =>
  component === "AmountWithCurrency";

export const isLimitPriceComponent = (component: string) =>
  component === "LimitPriceWithCheckbox";
```

**How FieldRenderer uses components:**

```typescript
// components/organisms/FieldRenderer.tsx
if (isSelectComponent(component)) {
  return <Select value={value} options={options} onChange={setValue} />;
}

if (isToggleComponent(component)) {
  return <Toggle value={value} options={["BUY", "SELL"]} onChange={setValue} />;
}

if (isAmountWithCurrencyComponent(component)) {
  return <AmountWithCurrency value={value} onChange={setValue} {...amountConfig} />;
}

if (isLimitPriceComponent(component)) {
  return <LimitPriceWithCheckbox value={value} onChange={setValue} {...priceConfig} />;
}
```

**How to add a new component type:**

1. Create the component in `components/atoms/` or `components/molecules/`

   ```typescript
   export const MyCustomComponent: React.FC<MyCustomProps> = ({ value, onChange }) => {
     return <div>...</div>;
   };
   ```

2. Add component type to `FieldDefinition` in `fieldRegistry.ts`:

   ```typescript
   export interface FieldDefinition {
     label: string;
     component: "InputNumber" | "Select" | "Toggle" | "MyCustom"; // Add here
   }
   ```

3. Add type predicate to `componentFactory.ts`:

   ```typescript
   export const isMyCustomComponent = (component: string): component is "MyCustom" =>
     component === "MyCustom";
   ```

4. Add rendering logic to `FieldRenderer.tsx`:

   ```typescript
   if (isMyCustomComponent(component)) {
     return <MyCustomComponent value={value} onChange={setValue} />;
   }
   ```

5. Use in field registry:

   ```typescript
   myField: {
     label: "My Custom Field",
     component: "MyCustom"
   }
   ```

---

## Unit Testing

This application uses **Vitest** with **@testing-library/react** for comprehensive unit testing. Current coverage is **99.85% lines** with **557 passing tests**.

### Testing Strategy

**Three test levels:**

1. **Store Slices** - Test state mutations and actions
2. **Hooks** - Test data selection and effects
3. **Config/Utils** - Test deterministic functions

**No testing for:**

- Components (UI testing is fragile and changes frequently)
- GraphQL queries/mutations (mocked, assume Apollo works)
- API calls (mocked, tested at integration level)

### Store Slice Tests

**Pattern: Test actions and derived state**

```typescript
// Example: createValidationSlice.spec.ts
describe("createValidationSlice", () => {
  it("expect error when notional is negative", () => {
    const store = createStore();
    store.validateField("notional", -1000);
    expect(store.errors.notional).toBe("Amount must be positive");
  });

  it("expect server validation to be called after sync validation", async () => {
    const store = createStore();
    vi.mocked(graphqlClient.query).mockResolvedValue({
      data: { validateField: { ok: false, type: "HARD", message: "Limit exceeded" } }
    });

    await store.validateField("notional", 5000000);

    expect(store.serverErrors.notional).toBe("Limit exceeded");
  });

  it("expect stale validation results to be ignored", async () => {
    const store = createStore();
    // Simulate rapid validation - second one should win
    store.validateField("notional", 1000000);
    store.validateField("notional", 2000000);
    // Wait for async to complete
    await new Promise(r => setTimeout(r, 100));
    // Result should be for 2000000, not 1000000
  });
});
```

**Key Points:**

- Mock external dependencies (`graphqlClient`, `Valibot`)
- Test both positive and negative scenarios
- For async tests: mock Promise resolution/rejection
- For race conditions: verify that stale results are ignored

### Hook Tests

**Pattern: Test derived state and subscriptions**

```typescript
// Example: useFieldOrder.spec.ts
describe("useFieldOrder", () => {
  it("expect field order from localStorage", () => {
    const stored = { LIMIT: ["symbol", "direction", "notional"] };
    vi.stubGlobal("localStorage", {
      getItem: () => JSON.stringify(stored)
    });

    const { getFieldOrder } = useFieldOrder();
    expect(getFieldOrder("LIMIT")).toEqual(["symbol", "direction", "notional"]);
  });

  it("expect reorder mode to toggle", () => {
    const { isReorderMode, toggleReorderMode } = useFieldOrder();
    expect(isReorderMode).toBe(false);
    toggleReorderMode();
    expect(isReorderMode).toBe(true);
  });
});
```

**Key Points:**

- Use `renderHook` from @testing-library/react for custom hooks
- Mock localStorage with `vi.stubGlobal`
- Test state selectors and action invocation
- Don't test re-render behavior (too implementation-specific)

### Config/Utils Tests

**Pattern: Test pure functions**

```typescript
// Example: validation.spec.ts
describe("validation schemas", () => {
  it("expect LIMIT_ORDER_SCHEMA to validate correctly", () => {
    const result = v.safeParse(LIMIT_ORDER_SCHEMA, {
      symbol: "GBPUSD",
      direction: "BUY",
      orderType: "LIMIT",
      notional: 1000000,
      limitPrice: 1.27,
      account: "ACC123"
    });

    expect(result.success).toBe(true);
  });

  it("expect LIMIT_ORDER_SCHEMA to reject missing limitPrice", () => {
    const result = v.safeParse(LIMIT_ORDER_SCHEMA, {
      symbol: "GBPUSD",
      direction: "BUY",
      orderType: "LIMIT",
      notional: 1000000,
      // limitPrice is missing!
      account: "ACC123"
    });

    expect(result.success).toBe(false);
    expect(result.issues[0].path).toContain("limitPrice");
  });
});
```

**Key Points:**

- Test every schema (one per order type)
- Test both valid and invalid inputs
- Verify error messages are clear
- No mocking needed - these are pure functions

### Mocking Patterns

**GraphQL Client:**

```typescript
vi.mock("../../graphql/client", () => ({
  graphqlClient: {
    query: vi.fn(() => Promise.resolve({ data: {} })),
    mutate: vi.fn(() => Promise.resolve({ data: {} })),
    subscribe: vi.fn(() => ({
      subscribe: vi.fn(() => ({ unsubscribe: vi.fn() }))
    }))
  }
}));
```

**Valibot:**

```typescript
vi.mock("valibot", () => ({
  safeParse: vi.fn()
}));

// In test:
vi.mocked(v.safeParse).mockReturnValue({
  success: true,
  output: mockData,
  issues: []
} as never);
```

**localStorage:**

```typescript
vi.stubGlobal("localStorage", {
  getItem: vi.fn(() => JSON.stringify({ key: "value" })),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
});
```

---

---

## Further Reading

- See `CODE_CHANGES.md` for refactoring history and all phases of development
- See `TECHNICAL_IMPL.md` for implementation details
- GraphQL schema: Backend GraphQL types
- FDC3 Spec: <https://github.com/FINOS/fdc3-standard>
