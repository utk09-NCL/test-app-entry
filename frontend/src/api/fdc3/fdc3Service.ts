/**
 * FDC3 Service - Financial Desktop Interoperability Protocol
 *
 * FDC3 enables applications to communicate and share context across a desktop.
 * Example: Clicking a symbol in a Bloomberg terminal → auto-populates order entry.
 *
 * What is FDC3?
 * - Industry standard for desktop app interoperability (Finsemble, OpenFin)
 * - Apps broadcast "intents" (actions like "ViewInstrument", "OrderEntry")
 * - Other apps listen for intents and respond
 *
 * This Service:
 * - Initializes FDC3 connection
 * - Listens for "OrderEntry" and "ViewInstrument" intents
 * - Maps FDC3 context to order state (via intentMapper)
 * - Singleton pattern (one instance per app)
 *
 * Mock Implementation:
 * - Simulates FDC3 API for demo (real apps use window.fdc3 from container)
 * - Sends fake "NewOrder" intent after 8 seconds
 *
 * Used by: useAppInit to initialize interop on app start.
 */

/**
 * FDC3 context - data passed between apps.
 * Standard shape defined by FDC3 spec.
 */
interface Fdc3Context {
  /** Context type (e.g., "fdc3.instrument", "fdc3.order") */
  type: string;
  /** Identifiers (e.g., ticker, ISIN, CUSIP) */
  id?: { [key: string]: string };
  /** Custom data (app-specific) */
  [key: string]: unknown;
}

/**
 * FDC3 listener - returned when registering intent listener.
 * Used to unsubscribe from intents.
 */
interface Fdc3Listener {
  unsubscribe: () => void;
}

/**
 * FDC3 API - subset of the full FDC3 spec.
 * Real implementation has more methods (broadcast, raiseIntent, etc.).
 */
interface Fdc3Api {
  /** Register a listener for a specific intent */
  addIntentListener: (intent: string, handler: (context: Fdc3Context) => void) => Fdc3Listener;
}

/**
 * Global type augmentation - add fdc3 to Window.
 * In production, this is injected by FDC3 container (Finsemble, OpenFin).
 */
declare global {
  interface Window {
    fdc3?: Fdc3Api;
  }
}

// ========================================
// Mock FDC3 API (for demo purposes)
// ========================================
const mockFdc3: Fdc3Api = {
  addIntentListener: (intent: string, handler: (context: Fdc3Context) => void) => {
    console.log(`[FDC3] Listening for ${intent}`);

    // Simulate an incoming intent after 8 seconds (demo)
    // In real app, this would come from another application
    setTimeout(() => {
      console.log('[FDC3] Simulating incoming "NewOrder" intent...');
      handler({
        type: "fdc3.instrument",
        id: { ticker: "GBP/USD" },
        customData: {
          amount: 2500000,
          side: "SELL",
          type: "LIMIT",
          limitPrice: 1.245,
        },
      });
    }, 8000);

    return { unsubscribe: () => {} };
  },
};

// Attach mock to window (in production, container provides this)
window.fdc3 = mockFdc3;

/**
 * FDC3 Service - Singleton for managing FDC3 connection.
 */
export class Fdc3Service {
  private static instance: Fdc3Service;
  private isInitialized = false;

  /** Private constructor (Singleton pattern) */
  private constructor() {}

  /**
   * Get singleton instance.
   * Ensures only one FDC3 connection per app.
   */
  public static getInstance(): Fdc3Service {
    if (!Fdc3Service.instance) {
      Fdc3Service.instance = new Fdc3Service();
    }
    return Fdc3Service.instance;
  }

  /**
   * Initialize FDC3 connection and register intent listeners.
   *
   * @param onContext - Callback when FDC3 context received
   */
  public initialize(onContext: (data: Fdc3Context) => void) {
    // Prevent double-initialization
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Check if FDC3 is available (injected by container)
    if (window.fdc3) {
      // Listen for "OrderEntry" intent (other app wants us to pre-fill order)
      window.fdc3.addIntentListener("OrderEntry", (context: Fdc3Context) => {
        console.log("[FDC3 Service] Received Context:", context);
        onContext(context);
      });

      // Listen for "ViewInstrument" intent (other app wants us to switch symbol)
      window.fdc3.addIntentListener("ViewInstrument", (context: Fdc3Context) => {
        onContext(context);
      });
    }
  }
}
