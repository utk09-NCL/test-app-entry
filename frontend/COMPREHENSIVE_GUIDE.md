# FX Order Entry - Developer Guide

**Quick reference for the FX Order Entry frontend application. Organized by common scenarios with clear "which files to change" guidance.**

---

## Table of Contents

1. [Quick Reference - Common Scenarios](#quick-reference---common-scenarios)
2. [Architecture Overview](#architecture-overview)
3. [File Organization](#file-organization)
4. [State Management](#state-management)
5. [Testing Guide](#testing-guide)
6. [Debugging Tips](#debugging-tips)

---

## Quick Reference - Common Scenarios

### Scenario 1: Add a New Field to All Order Types

**Files to Change:**

1. **`src/types/domain.ts`** - Add field to `OrderStateData` interface

   ```typescript
   export interface OrderStateData {
     // ... existing fields
     myNewField?: string;  // Add here
   }
   ```

2. **`src/config/fieldRegistry.ts`** - Register the field with label and component

   ```typescript
   export const FIELD_REGISTRY = {
     // ... existing fields
     myNewField: {
       label: "My New Field",
       component: "InputText",  // or Select, Toggle, etc.
       order: 100,  // Display order
     }
   };
   ```

3. **`src/config/validation.ts`** - Add validation schema

   ```typescript
   // In sharedOptional or specific order schemas
   const sharedOptional = {
     // ... existing
     myNewField: optionalString,  // or required schema
   };
   ```

4. **`src/config/orderConfig.ts`** - Add to relevant order types

   ```typescript
   export const ORDER_TYPES = {
     [OrderType.FLOAT]: {
       fields: [
         "currencyPair", "side", "orderType",
         "myNewField",  // Add here
         // ... other fields
       ],
       editableFields: ["myNewField"],  // If amendable
     }
   };
   ```

**Optional Files (if needed):**

5. **`src/config/visibilityRules.ts`** - Add if field should be conditionally visible

   ```typescript
   myNewField: (values) => values.orderType === OrderType.FLOAT
   ```

6. **`src/hooks/fieldConnectors/useFieldOptions.ts`** - Add if field is a Select dropdown

   ```typescript
   if (field === "myNewField") {
     return {
       options: [
         { value: "OPTION1", label: "Option 1" },
         { value: "OPTION2", label: "Option 2" }
       ],
       isLoading: false
     };
   }
   ```

**That's it!** The field will automatically appear in the form.

---

### Scenario 2: Add a New Order Type

**Files to Change:**

1. **`src/types/domain.ts`** - Add enum value

   ```typescript
   export enum OrderType {
     // ... existing types
     MY_NEW_TYPE = "MY_NEW_TYPE",
   }
   ```

2. **`src/config/orderConfig.ts`** - Add configuration

   ```typescript
   export const ORDER_TYPES: Record<OrderType, OrderConfig> = {
     // ... existing
     [OrderType.MY_NEW_TYPE]: {
       label: "My New Type",
       fields: ["currencyPair", "side", "orderType", "amount", "level"],
       editableFields: ["amount", "level"],
     }
   };
   ```

3. **`src/config/validation.ts`** - Add validation schema

   ```typescript
   export const MyNewTypeOrderSchema = v.object({
     ...commonBase,
     ...sharedOptional,
     level: priceSchema,  // Example: require level
   });

   export const SCHEMA_MAP: Record<OrderType, v.GenericSchema> = {
     // ... existing
     [OrderType.MY_NEW_TYPE]: MyNewTypeOrderSchema,
   };
   ```

4. **`src/config/visibilityRules.ts`** - Add visibility rules if needed

   ```typescript
   // Example: show special field only for this type
   mySpecialField: (values) => values.orderType === OrderType.MY_NEW_TYPE
   ```

5. **Backend** - Add to GraphQL schema (`backend/schema/typeDefs.js`)

   ```javascript
   enum OrderType {
     # ... existing
     MY_NEW_TYPE
   }
   ```

**Optional:** Update `backend/data/orderTypesWithPools.json` with liquidity pools

---

### Scenario 3: Add/Change Field Validation

**For Sync Validation (Client-Side):**

**File: `src/config/validation.ts`**

```typescript
// Example: Add custom validation for startMode
if (values.startMode === "START_AT") {
  if (!values.startTime || values.startTime === "") {
    errors.startTime = "Start time is required when Start Mode is 'Start At'";
  }
  if (!values.startDate || values.startDate === "") {
    errors.startDate = "Start date is required when Start Mode is 'Start At'";
  }
}
```

**For Async Validation (Server-Side):**

**File: `backend/schema/resolvers.js`**

```javascript
Query: {
  validateField: async (_, { input }) => {
    // Add server-side validation logic
    if (input.field === "amount") {
      if (input.value > firmLimit) {
        return {
          field: "amount",
          ok: false,
          type: "HARD",  // Blocking error
          message: "Exceeds firm limit"
        };
      }
    }
  }
}
```

---

### Scenario 4: Change Field Visibility Conditionally

**File: `src/config/visibilityRules.ts`**

```typescript
export const FIELD_VISIBILITY_RULES: Record<string, (values: OrderStateData) => boolean> = {
  // Show field for specific order types
  level: (values) => {
    const requiresLevel = [OrderType.TAKE_PROFIT, OrderType.STOP_LOSS];
    return requiresLevel.includes(values.orderType);
  },

  // Show field based on another field's value
  startTime: (values) => values.startMode === "START_AT",

  // Complex condition
  liquidityPool: (values) => {
    if (values.orderType === OrderType.FIXING) return false;
    if (values.orderType === OrderType.STOP_LOSS && values.liquidityPool === "Float Pool") {
      return false;  // Hide level for STOP_LOSS with Float Pool
    }
    return true;
  }
};
```

**That's it!** The `useFieldVisibility` hook automatically applies these rules.

---

### Scenario 5: Add Dropdown Options for a Select Field

**File: `src/hooks/fieldConnectors/useFieldOptions.ts`**

```typescript
export const useFieldOptions = (field: keyof OrderStateData) => {
  // ... existing code

  // Add static options
  if (field === "startMode") {
    return {
      options: [
        { value: "START_NOW", label: "Start Now" },
        { value: "START_AT", label: "Start At" }
      ],
      isLoading: false
    };
  }

  // Add dynamic options from ref data
  if (field === "account") {
    return {
      options: accounts.map(acc => ({
        value: acc.sdsId,
        label: acc.name
      })),
      isLoading: isLoadingRefData
    };
  }

  // Add conditional options based on other fields
  if (field === "triggerSide") {
    const side = currentSide;
    if (side === "BUY") {
      return {
        options: [
          { value: "TRAILING_BID", label: "Trailing Bid" },
          { value: "MID", label: "Mid" },
          { value: "LEADING_OFFER", label: "Leading Offer" }
        ],
        isLoading: false
      };
    }
    // ... different options for SELL
  }
};
```

---

### Scenario 6: Modify Order Submission Logic

**File: `src/store/slices/createSubmissionSlice.ts`**

**Key sections to modify:**

1. **Pre-submission validation** (lines 329-362)

   ```typescript
   // Add custom validation before submit
   const validationResult = validateOrderForSubmit(values);
   if (!validationResult.valid) {
     // Handle errors
   }
   ```

2. **Build mutation variables** (lines 58-89 for CREATE, 94-116 for AMEND)

   ```typescript
   const buildCreateOrderVariables = (values: OrderStateData) => ({
     orderEntry: {
       // Add new field to mutation
       myNewField: values.myNewField,
     }
   });
   ```

3. **Handle success/failure** (lines 207-261)

   ```typescript
   if (mutationResult.success) {
     // Custom success handling
   } else {
     // Custom failure handling
   }
   ```

**GraphQL Mutation: `src/graphql/mutations.ts`**

```typescript
export const CREATE_ORDER_MUTATION = gql`
  mutation CreateOrder($orderEntry: OrderEntry!) {
    createOrder(orderEntry: $orderEntry) {
      result
      orderId
      myNewField  # Add if server returns it
    }
  }
`;
```

---

### Scenario 7: Add Read-Only Rules for Fields

**File: `src/config/orderConfig.ts`**

```typescript
export const ORDER_TYPES = {
  [OrderType.FLOAT]: {
    fields: ["currencyPair", "side", "amount", "level"],
    editableFields: ["amount", "level"],  // Only these can be amended
    // currencyPair and side are read-only when amending
  }
};
```

**Alternative: Always read-only fields**

**File: `src/hooks/fieldConnectors/useFieldReadOnly.ts`**

```typescript
// Add to ALWAYS_READONLY constant
const ALWAYS_READONLY: (keyof OrderStateData)[] = [
  "orderId",
  "execution",
  "myAlwaysReadOnlyField"  // Add here
];
```

---

### Scenario 8: Add Custom Component for a Field

**Step 1: Create Component**

**File: `src/components/atoms/MyCustomInput.tsx`**

```typescript
interface MyCustomInputProps {
  value: string | undefined;
  onChange: (value: string) => void;
  hasError?: boolean;
  readOnly?: boolean;
}

export const MyCustomInput: React.FC<MyCustomInputProps> = ({
  value,
  onChange,
  hasError,
  readOnly
}) => {
  return (
    <div className={hasError ? styles.error : ""}>
      <input
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        readOnly={readOnly}
      />
    </div>
  );
};
```

**Step 2: Add Type Predicate**

**File: `src/config/componentFactory.ts`**

```typescript
export const isMyCustomInputComponent = (component: string): boolean =>
  component === "MyCustomInput";

export const isSpecialComponent = (component: string): boolean => {
  return (
    // ... existing
    isMyCustomInputComponent(component)
  );
};
```

**Step 3: Render in FieldRenderer**

**File: `src/components/organisms/FieldRenderer.tsx`**

```typescript
import { MyCustomInput } from "../atoms/MyCustomInput";
import { isMyCustomInputComponent } from "../../config/componentFactory";

// In component render logic
if (isMyCustomInputComponent(component)) {
  return (
    <MyCustomInput
      value={value as string}
      onChange={setValue}
      hasError={hasError}
      readOnly={isReadOnly}
    />
  );
}
```

**Step 4: Use in Field Registry**

**File: `src/config/fieldRegistry.ts`**

```typescript
myField: {
  label: "My Field",
  component: "MyCustomInput",
  order: 50
}
```

---

### Scenario 9: Add Keyboard Shortcut

**File: `src/hooks/useKeyboardHotkeys.ts`**

```typescript
export const useKeyboardHotkeys = () => {
  // ... existing hooks

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Existing shortcuts
      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        submitOrder();
      }

      // Add new shortcut
      if (e.shiftKey && e.key === "F") {
        e.preventDefault();
        // Focus on amount field
        document.getElementById("field-amount")?.focus();
      }

      // Add another shortcut
      if (e.altKey && e.key === "r") {
        e.preventDefault();
        resetFormInteractions();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [submitOrder, resetFormInteractions]);
};
```

---

### Scenario 10: Change Default Values

**File: `src/store/slices/createDefaultsSlice.ts`**

```typescript
export const HARDCODED_DEFAULTS: DefaultsLayerData = {
  currencyPair: "GBPUSD",  // Change default currency pair
  side: OrderSide.BUY,      // Change default side
  orderType: OrderType.FLOAT,  // Change default order type
  amount: { amount: 1000000, ccy: "GBP" },  // Change default amount
  liquidityPool: "POOL1",   // Change default pool
  // ... add other defaults
};
```

---

### Scenario 11: Add FDC3 Intent Mapping

**File: `src/api/fdc3/intentMapper.ts`**

```typescript
export const mapFdc3ToOrderData = (
  intent: FDC3Intent
): Partial<OrderStateData> => {
  return {
    currencyPair: intent.instrument?.id?.ticker || intent.symbol,
    side: intent.direction === "buy" ? OrderSide.BUY : OrderSide.SELL,
    amount: intent.quantity ? {
      amount: intent.quantity,
      ccy: getCurrencyFromSymbol(intent.symbol)
    } : undefined,

    // Add new field mapping
    myNewField: intent.customField,  // Map from FDC3 intent
  };
};
```

---

### Scenario 12: Add GraphQL Subscription for Real-Time Updates

**Step 1: Define Subscription**

**File: `src/graphql/subscriptions.ts`**

```typescript
export const MY_SUBSCRIPTION = gql`
  subscription MySubscription($input: MyInput!) {
    myData(input: $input) {
      field1
      field2
    }
  }
`;
```

**Step 2: Create Hook**

**File: `src/hooks/useMySubscription.ts`**

```typescript
import { useSubscription } from "@apollo/client";
import { MY_SUBSCRIPTION } from "../graphql/subscriptions";
import { useOrderEntryStore } from "../store";

export const useMySubscription = () => {
  const setMyData = useOrderEntryStore((s) => s.setMyData);

  useSubscription(MY_SUBSCRIPTION, {
    variables: { input: { id: "123" } },
    onData: ({ data }) => {
      if (data.data?.myData) {
        setMyData(data.data.myData);
      }
    },
    onError: (error) => {
      console.error("Subscription error:", error);
    }
  });
};
```

**Step 3: Use in App**

**File: `src/App.tsx`**

```typescript
import { useMySubscription } from "./hooks/useMySubscription";

function App() {
  useMySubscription();  // Add here
  // ... rest of app
}
```

---

### Scenario 13: Add Custom Validation Error Handling

**File: `src/store/slices/createSubmissionSlice.ts`**

Modify the validation error handling (lines 336-354):

```typescript
if (!validationResult.valid) {
  const errorCount = Object.keys(validationResult.errors).length;

  // Custom error summary logic
  let errorSummary: string;
  if (errorCount === 1) {
    const [field, message] = Object.entries(validationResult.errors)[0];
    errorSummary = `${field}: ${message}`;
  } else if (errorCount <= 3) {
    errorSummary = Object.entries(validationResult.errors)
      .map(([field, msg]) => `${field}: ${msg}`)
      .join(", ");
  } else {
    errorSummary = `${errorCount} validation errors found`;
  }

  set((state) => {
    state.status = "READY";
    state.errors = {};
    Object.entries(validationResult.errors).forEach(([fieldKey, errorMessage]) => {
      state.errors[fieldKey] = errorMessage;
    });
    state.toastMessage = {
      type: "error",
      text: errorSummary,
    };
  });

  return;
}
```

---

## Architecture Overview

### Data Flow Diagram

```txt
User Input → Field Component → useFieldValue hook → Store (UserInteractionSlice)
                                                           ↓
                                              DerivedSlice.getDerivedValues()
                                                           ↓
                                    Merges: Defaults + UserPrefs + FDC3 + UserInput
                                                           ↓
                                              Final Form Values (OrderStateData)
                                                           ↓
                                            submitOrder() validates & submits
                                                           ↓
                                              GraphQL CREATE_ORDER_MUTATION
```

### Priority Layers (Important!)

Data sources are merged in priority order (higher overrides lower):

```txt
Priority 1 (Lowest):  DefaultsSlice        - Hardcoded defaults
Priority 2:           UserPrefsSlice       - User preferences from server
Priority 3:           Fdc3IntentSlice      - FDC3 intent data
Priority 4 (Highest): UserInteractionSlice - User manual edits (always wins!)
```

**Why this matters:**

- FDC3 intent arriving late won't overwrite user edits
- User preferences load async but don't override manual input
- getDerivedValues() always returns the highest priority value for each field

---

## File Organization

### Critical Files by Function

**Configuration (Define fields, validation, visibility):**

- `src/config/fieldRegistry.ts` - Field definitions (label, component, order)
- `src/config/orderConfig.ts` - Order type configurations (fields, editable fields)
- `src/config/validation.ts` - Valibot validation schemas (GraphQL-aligned)
- `src/config/visibilityRules.ts` - Conditional field visibility
- `src/config/constants.ts` - App constants (debounce, limits, steps)
- `src/config/componentFactory.ts` - Component type predicates

**Store Slices (State management):**

- `src/store/slices/createDerivedSlice.ts` - Merged form values (getDerivedValues)
- `src/store/slices/createValidationSlice.ts` - All validation state (errors, warnings)
- `src/store/slices/createSubmissionSlice.ts` - Order submission (create/amend)
- `src/store/slices/createUserInteractionSlice.ts` - User edits (Priority 4)
- `src/store/slices/createFdc3IntentSlice.ts` - FDC3 data (Priority 3)
- `src/store/slices/createUserPrefsSlice.ts` - User preferences (Priority 2)
- `src/store/slices/createDefaultsSlice.ts` - Hardcoded defaults (Priority 1)
- `src/store/slices/createAppSlice.ts` - App lifecycle (status, editMode, toast)
- `src/store/slices/createRefDataSlice.ts` - Reference data (accounts, pools, symbols)

**Hooks (Reusable logic):**

- `src/hooks/fieldConnectors/useFieldValue.ts` - Get/set field value
- `src/hooks/fieldConnectors/useFieldState.ts` - Get validation errors/warnings
- `src/hooks/fieldConnectors/useFieldOptions.ts` - Get dropdown options
- `src/hooks/fieldConnectors/useFieldReadOnly.ts` - Compute read-only state
- `src/hooks/fieldConnectors/useFieldVisibility.ts` - Check field visibility
- `src/hooks/useAppInit.ts` - App initialization (ref data, subscriptions, FDC3)
- `src/hooks/useOrderTracking.ts` - Track submitted order status
- `src/hooks/useKeyboardHotkeys.ts` - Keyboard shortcuts

**Components:**

- `src/components/organisms/FieldRenderer.tsx` - Renders individual field
- `src/components/organisms/OrderForm.tsx` - Main form container
- `src/components/molecules/ReorderableFieldList.tsx` - Drag-drop field list
- `src/components/molecules/AmountWithCurrency.tsx` - Amount with ccy toggle
- `src/components/atoms/Input.tsx` - Base input component
- `src/components/atoms/Select.tsx` - Base select component

**GraphQL:**

- `src/graphql/mutations.ts` - CREATE_ORDER_MUTATION, AMEND_ORDER_MUTATION
- `src/graphql/queries.ts` - VALIDATE_FIELD_QUERY
- `src/graphql/subscriptions.ts` - ORDER_SUBSCRIPTION, USER_PREFS_SUBSCRIPTION

**Types:**

- `src/types/domain.ts` - OrderStateData, OrderType, OrderSide, all enums
- `src/types/store.ts` - Zustand slice interfaces
- `src/types/layers.ts` - Layer types (DefaultsLayerData, etc.)

---

## State Management

### Store Structure

```typescript
interface BoundState {
  // App lifecycle
  status: "INITIALIZING" | "READY" | "SUBMITTING" | "ERROR";
  editMode: "creating" | "viewing" | "amending";
  currentOrderId: string | null;
  toastMessage: { type: "success" | "error"; text: string } | null;

  // Reference data (dropdown options)
  accounts: Account[];
  pools: LiquidityPool[];
  currencyPairs: CurrencyPair[];
  entitledOrderTypes: OrderType[];

  // Priority layers (merged by DerivedSlice)
  defaults: DefaultsLayerData;           // Priority 1
  userPrefs: UserPrefsLayerData | null;  // Priority 2
  fdc3Intent: Fdc3IntentLayerData | null;// Priority 3
  dirtyValues: Record<string, unknown>;  // Priority 4

  // Derived state
  getDerivedValues: () => OrderStateData;  // Merges all layers
  isDirty: () => boolean;
  isFormValid: () => boolean;

  // Validation state
  errors: Record<string, string>;         // Client-side sync errors
  serverErrors: Record<string, string>;   // Server-side async errors
  warnings: Record<string, string>;       // Non-blocking warnings
  refDataErrors: Record<string, string>;  // Missing accounts/pools
  globalError: string | null;

  // Actions
  setFieldValue: (field, value) => void;
  validateField: (field, value) => Promise<void>;
  submitOrder: () => Promise<void>;
  amendOrder: () => void;
}
```

### How to Access Store

```typescript
// In components/hooks
import { useOrderEntryStore } from "../store";

// Select specific state
const status = useOrderEntryStore((s) => s.status);
const errors = useOrderEntryStore((s) => s.errors);

// Select action
const setFieldValue = useOrderEntryStore((s) => s.setFieldValue);
const submitOrder = useOrderEntryStore((s) => s.submitOrder);

// Get derived values
const formValues = useOrderEntryStore((s) => s.getDerivedValues());
```

---

## Testing Guide

### Test File Locations

All test files are co-located with source files:

- `src/config/validation.spec.ts` - Tests `validation.ts`
- `src/hooks/useFieldValue.spec.ts` - Tests `useFieldValue.ts`
- `src/store/slices/createDerivedSlice.spec.ts` - Tests `createDerivedSlice.ts`

### Test Naming Convention

Use "expect X when Y" pattern:

```typescript
describe("validation", () => {
  it("expect error when amount is below minimum", () => {
    // Test code
  });

  it("expect valid when all required fields present", () => {
    // Test code
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

### Writing a New Test

**Example: Test a validation rule**

```typescript
// src/config/validation.spec.ts
import { describe, expect, it } from "vitest";
import { validateOrderForSubmission } from "./validation";
import { OrderType } from "../types/domain";

describe("validateOrderForSubmission", () => {
  it("expect error when startMode is START_AT but startTime is missing", () => {
    const order = {
      currencyPair: "GBPUSD",
      side: "BUY",
      orderType: OrderType.FLOAT,
      amount: { amount: 1000000, ccy: "GBP" },
      startMode: "START_AT",
      startDate: "2024-01-01",
      timeZone: "America/New_York",
      // startTime is missing!
    };

    const result = validateOrderForSubmission(order);

    expect(result.valid).toBe(false);
    expect(result.errors.startTime).toBe("Start time is required when Start Mode is 'Start At'");
  });
});
```

---

## Debugging Tips

### View Store State in Browser Console

```javascript
// In browser console (app must be running)
window.__ORDER_STORE__.getState()
```

Returns entire store state - useful for debugging layer merging issues.

### Check Derived Values

```javascript
window.__ORDER_STORE__.getState().getDerivedValues()
```

Shows final merged form values after applying all layers.

### Check Validation State

```javascript
const state = window.__ORDER_STORE__.getState();
console.log("Errors:", state.errors);
console.log("Server Errors:", state.serverErrors);
console.log("Warnings:", state.warnings);
console.log("Ref Data Errors:", state.refDataErrors);
```

### Debug Field Visibility

Add this to `ReorderableFieldList.tsx`:

```typescript
const visibleFields = useMemo(() => {
  const values = getDerivedValues();
  const filtered = fields.filter((fieldKey) => {
    const isVisible = isFieldVisible(fieldKey, values);
    console.log(`Field ${fieldKey}:`, isVisible ? "VISIBLE" : "HIDDEN");
    return isVisible;
  });
  return filtered;
}, [fields, orderType, expiry, startMode, liquidityPool]);
```

### Debug Validation Flow

Add logging to `createValidationSlice.ts`:

```typescript
validateField: async <K extends keyof OrderStateData>(
  field: K,
  value: OrderStateData[K],
  orderType: string
) => {
  console.log(`Validating ${String(field)}:`, value);

  // ... validation logic

  console.log(`Validation result for ${String(field)}:`, result);
}
```

### Common Issues

**Issue: Field not showing up**

- Check `FIELD_REGISTRY` - is field registered?
- Check `ORDER_TYPES[orderType].fields` - is field in list?
- Check `visibilityRules.ts` - is field hidden by rule?

**Issue: Field value not updating**

- Check `setFieldValue` is called with correct field name
- Check `getDerivedValues()` - is value in dirtyValues?
- Check if field is read-only (viewing mode, not in editableFields)

**Issue: Validation not working**

- Check `SCHEMA_MAP` has schema for order type
- Check field name matches schema definition
- Check async validation - server might be returning different error

**Issue: FDC3 intent not applying**

- Check `Fdc3IntentSlice.fdc3Intent` - is intent stored?
- Check `isDirty` - if true, confirmation dialog should show
- Check `mapFdc3ToOrderData` - is mapping correct?

---

## Performance Tips

### Optimize Store Selectors

**Bad:**

```typescript
// Re-renders on ANY store change
const store = useOrderEntryStore();
const value = store.getDerivedValues().currencyPair;
```

**Good:**

```typescript
// Only re-renders when currencyPair changes
const value = useOrderEntryStore((s) => s.getDerivedValues().currencyPair);
```

### Debounce Validation

Validation is already debounced (300ms) in `useFieldState.ts`. Don't add extra debouncing.

### Memoize Expensive Calculations

```typescript
const visibleFields = useMemo(() => {
  return fields.filter((f) => isFieldVisible(f, formValues));
}, [fields, formValues]);
```

---

## Best Practices

### 1. Never Mutate Store State Directly

**Bad:**

```typescript
const state = useOrderEntryStore.getState();
state.errors.currencyPair = "Invalid";  // DON'T DO THIS
```

**Good:**

```typescript
useOrderEntryStore.getState().setFieldError("currencyPair", "Invalid");
```

### 2. Use Type-Safe Field Names

**Bad:**

```typescript
setFieldValue("curencyPair", "GBPUSD");  // Typo! Runtime error
```

**Good:**

```typescript
setFieldValue("currencyPair", "GBPUSD");  // TypeScript catches typos
```

### 3. Don't Hardcode Order Types

**Bad:**

```typescript
if (values.orderType === "LIMIT") {  // String literal
```

**Good:**

```typescript
if (values.orderType === OrderType.TAKE_PROFIT) {  // Enum
```

### 4. Co-locate Tests with Source Files

- `useFieldValue.ts` → `useFieldValue.spec.ts` (same directory)
- Makes tests easy to find and maintain

### 5. Use Configuration, Not Hardcoded Logic

**Bad:**

```typescript
// Hardcoded in component
if (orderType === "FLOAT") {
  return <FloatSpecificField />;
}
```

**Good:**

```typescript
// Defined in visibilityRules.ts
floatSpecificField: (values) => values.orderType === OrderType.FLOAT
```

---

## Further Reading

- [FDC3 Intents Spec](https://fdc3.finos.org/docs/intents/spec)
- [Zustand Documentation](https://zustand.docs.pmnd.rs/getting-started/introduction)
- [Valibot Validation Library](https://valibot.dev/guides/introduction/)
