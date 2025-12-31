# Popup System

A cross-platform popup system that works seamlessly in both OpenFin and standard web browser environments.

## How It Works

### Environment Detection

When `PopupProvider` mounts, it detects the runtime environment:

```typescript
const isOpenFin = globalThis.fin !== undefined;
```

Based on this, it creates the appropriate adapter:

- **OpenFin**: Uses native `showPopupWindow` API
- **Web Browser**: Uses iframe inside a modal overlay

### Web Browser Implementation

```txt
┌─────────────────────────────────────────────────────────────────┐
│  Parent Window                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  PopupProvider (context)                                    ││
│  │  ┌─────────────────────────────────────────────────────────┐││
│  │  │  Your App                                               │││
│  │  │  ┌─────────────────┐                                    │││
│  │  │  │ Trigger Button  │  ←── onClick opens popup           │││
│  │  │  └─────────────────┘                                    │││
│  │  └─────────────────────────────────────────────────────────┘││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Overlay (fixed, z-index: 9999)                             ││
│  │  ┌─────────────────────────────────────────────────────────┐││
│  │  │  Popup Container (positioned relative to trigger)       │││
│  │  │  ┌─────────────────────────────────────────────────────┐│││
│  │  │  │  iframe (sandbox) OR React Portal (component)       ││││
│  │  │  │                                                     ││││
│  │  │  │  Content: URL, HTML, or React Component             ││││
│  │  │  └─────────────────────────────────────────────────────┘│││
│  │  └─────────────────────────────────────────────────────────┘││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

**Communication Flow:**

1. Parent creates a `BroadcastChannel` with unique ID
2. Popup receives channel ID via URL params or React context
3. Messages flow through BroadcastChannel (with postMessage fallback)
4. Theme changes are automatically synced via `MutationObserver`

### OpenFin Implementation

```txt
┌─────────────────────────────────────────┐     ┌─────────────────────────────────────────┐
│  Parent Window (OpenFin View)           │     │  Popup Window (OpenFin Native)          │
│  ┌─────────────────────────────────────┐│     │  ┌─────────────────────────────────────┐│
│  │  PopupProvider                      ││     │  │  Popup Content                      ││
│  │  ┌─────────────────────────────────┐││     │  │                                     ││
│  │  │  Your App                       │││     │  │  Loaded from URL or component route ││
│  │  │  ┌─────────────────┐            │││     │  │                                     ││
│  │  │  │ Trigger Button  │────────────┼┼┼────▶│  │  Communicates via:                  ││
│  │  │  └─────────────────┘            │││     │  │  - dispatchPopupResult()            ││
│  │  └─────────────────────────────────┘││     │  │  - customData from parent           ││
│  └─────────────────────────────────────┘│     │  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘     └─────────────────────────────────────────┘
              │                                                   │
              │                                                   │
              └───────────────────────────────────────────────────┘
                        OpenFin IPC (showPopupWindow API)
```

**Key Differences from Web:**

- Popup is a **native OS window** (not an iframe)
- Positioned in **screen coordinates** (not viewport)
- Uses OpenFin's `showPopupWindow` with `blurBehavior` options
- Communication via `dispatchPopupResult` and `customData`

## Content Types

| Type | Web Browser | OpenFin |
| ------ | ------------- | --------- |
| `url` | iframe with src | Native window with URL |
| `component` | React Portal | Route with serialized props |
| `html` | iframe with srcdoc | Blob URL |

## Positioning

Both implementations use the same positioning logic:

1. Calculate position relative to anchor element
2. Apply offset from anchor
3. **Flip** if not enough space (e.g., bottom → top)
4. **Shift** to stay within viewport boundaries
5. Convert to screen coordinates (OpenFin only)

## Theme Synchronization

The popup inherits and tracks parent theme:

```typescript
// Parent observes theme changes
const observer = new MutationObserver(() => {
  popup.send('THEME_CHANGE', { theme: getCurrentTheme() });
});
observer.observe(document.documentElement, {
  attributes: true,
  attributeFilter: ['data-theme']
});

// Child applies theme
window.addEventListener('message', (event) => {
  if (event.data.type === 'THEME_CHANGE') {
    document.documentElement.setAttribute('data-theme', event.data.payload.theme);
  }
});
```

## Quick Reference

### Opening a Popup (Imperative)

```tsx
const { open, triggerRef } = usePopup({
  content: { type: 'component', component: MyContent },
  position: { placement: 'bottom-start' }
});

<button ref={triggerRef} onClick={() => open()}>Open</button>
```

### Opening a Popup (Declarative)

```tsx
<Popup
  content={{ type: 'url', url: '/popup/calendar' }}
  position={{ placement: 'bottom' }}
>
  <button>Open Calendar</button>
</Popup>
```

### Inside the Popup

```tsx
const { close, sendToParent, theme } = usePopupChild();

<button onClick={() => close({ data: selectedValue })}>
  Confirm
</button>
```

## File Structure

```txt
popup/
├── index.ts           # Barrel exports
├── types.ts           # TypeScript interfaces
├── context.ts         # React context
├── hooks.ts           # Context hooks
├── PopupProvider.tsx  # Provider component
├── usePopup.ts        # Imperative hook API
├── Popup.tsx          # Declarative component API
└── utils/
    ├── positioning.ts    # Position calculations
    ├── communication.ts  # BroadcastChannel + postMessage
    ├── openfinAdapter.ts # OpenFin implementation
    └── webAdapter.ts     # Web browser implementation
```
