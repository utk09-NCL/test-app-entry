# FX Order Entry - Frontend

A React/TypeScript order entry application using priority-based layered state management and real-time validation.

## Documentation

Three comprehensive guides are available:

1. **`COMPREHENSIVE_GUIDE.md`** - Deep dive into architecture, state management, validation, FDC3 intents, and advanced features (field ordering, visibility rules, keyboard hotkeys, price updates, testing)
2. **`TECHNICAL_IMPL.md`** - Technical specification and implementation checklist (how the architecture came to be)
3. **`README.md`** (this file) - Quick start and common tasks

**All three guides are now up-to-date with the current codebase (99.85% coverage, 557 tests).** See `../CODE_CHANGES.md` for complete development history across 15 phases.

## Quick Start

### Project Structure

```txt
src/
├── components/          # React components (atoms, molecules, organisms)
├── config/             # Configuration (field registry, validation schemas)
├── graphql/            # GraphQL client, queries, mutations, subscriptions
├── hooks/              # Custom hooks (including field connectors)
├── store/              # Zustand store (slices for state management)
├── styles/             # Global styles and variables
├── types/              # TypeScript type definitions
└── utils/              # Helper functions
```

## Core Architecture

### State Management (Zustand)

The store uses a **slice pattern** with **priority-based layered state**:

```txt
Priority (lowest to highest):
1. Defaults           (hardcoded values)
2. User Preferences   (from server)
3. FDC3 Intent        (from external apps)
4. User Input         (manual edits - highest priority)
```

**Store Slices:**

- `AppSlice` - Lifecycle, UI mode, toasts
- `RefDataSlice` - Accounts, pools, currency pairs (from server)
- `DefaultsSlice` - Hardcoded defaults
- `UserPrefsSlice` - User preferences (server subscription)
- `Fdc3IntentSlice` - FDC3 intent data
- `UserInteractionSlice` - User manual edits
- `DerivedSlice` - Computed form values (merges all layers)
- `ValidationSlice` - Validation state and actions
- `SubmissionSlice` - Order submission/amendment
- `PriceSlice` - Live market prices
- `FieldOrderSlice` - Field ordering preferences

### Form Architecture

**Field Definition** → **FieldRenderer** → **Component**

1. Fields defined in `fieldRegistry.ts` with validation schemas
2. `FieldRenderer.tsx` renders each field using hooks
3. Field connectors provide data and state:
   - `useFieldValue` - Get/set value
   - `useFieldOptions` - Get dropdown options
   - `useFieldState` - Get validation state
   - `useFieldReadOnly` - Compute read-only state
   - `useFieldVisibility` - Check if field should be shown

### Validation

**Three levels:**

1. **Sync (Valibot)** - Schema validation on field change
2. **Async (Server)** - Custom validation via GraphQL subscription
3. **Ref Data** - Check if account/pool/etc. exists

Schema alignment: Valibot schemas match GraphQL enum types exactly.

## Common Tasks

### Add a New Order Field

1. Add field to `OrderStateData` in `types/domain.ts`
2. Add to `FIELD_REGISTRY` in `config/fieldRegistry.ts` with label and component type
3. Add validation schema to `config/validation.ts`
4. Add visibility rule to `config/visibilityRules.ts` (if conditional)
5. Field auto-appears in form

### Update Value Based on Another Field

Example: Update `limitPrice` when `orderType` changes to LIMIT

```typescript
// In a hook or component:
const orderType = useOrderEntryStore((s) => s.getDerivedValues().orderType);

useEffect(() => {
  if (orderType === "LIMIT" && limitPrice === undefined) {
    setFieldValue("limitPrice", currentPrice);
  }
}, [orderType]);
```

Or use derived state in `ComputedSlice` if the dependency is complex.

### Handle FDC3 Intent

1. Intent arrives → stored in `Fdc3IntentSlice`
2. App has pending changes? Show `Fdc3ConfirmDialog`
3. User accepts → Intent data layers over existing form
4. User rejects → Intent discarded

See `fdc3Service.ts` and `intentMapper.ts` for mapping logic.

### Validate Order on Submit

```typescript
// In SubmissionSlice:
const validationResult = validateOrderForSubmission(values);

if (!validationResult.valid) {
  // Show field errors and toast
  set((state) => {
    state.errors = validationResult.errors;
  });
  return;
}

// Proceed with mutation
```

## Key Files to Know

| File | Purpose |
|------|---------|
| `store/index.ts` | Store creation (combines all slices) |
| `config/fieldRegistry.ts` | Field definitions (label, component, validation) |
| `config/validation.ts` | Valibot schemas aligned with GraphQL |
| `config/componentFactory.ts` | Type predicates for component rendering |
| `components/organisms/FieldRenderer.tsx` | Main field rendering logic |
| `hooks/fieldConnectors/` | Hooks for field value, state, options |
| `config/visibilityRules.ts` | Conditional field visibility |
| `types/store.ts` | Zustand store type definitions |

## Debugging

### View Store State

```javascript
// In browser console:
window.__ORDER_STORE__.getState()
```

### Check Validation Errors

```typescript
const errors = useOrderEntryStore((s) => s.errors);
console.log(errors); // { fieldName: "error message" }
```

### Trace FDC3 Intent

```typescript
const fdc3Intent = useOrderEntryStore((s) => s.fdc3Intent);
console.log("Pending intent:", fdc3Intent);
```

## For More Details

See `COMPREHENSIVE_GUIDE.md` for:

- Detailed architecture diagrams
- Complete scenario walkthroughs
- GraphQL integration
- Field visibility conditions
- Validation flow
- FDC3 intent processing
- And much more
