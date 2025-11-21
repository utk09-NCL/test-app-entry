interface Fdc3Context {
  type: string;
  id?: { [key: string]: string };
  [key: string]: unknown;
}

interface Fdc3Listener {
  unsubscribe: () => void;
}

interface Fdc3Api {
  addIntentListener: (intent: string, handler: (context: Fdc3Context) => void) => Fdc3Listener;
}

declare global {
  interface Window {
    fdc3?: Fdc3Api;
  }
}

// Mocking global fdc3
const mockFdc3: Fdc3Api = {
  addIntentListener: (intent: string, handler: (context: Fdc3Context) => void) => {
    console.log(`[FDC3] Listening for ${intent}`);
    // Simulate an incoming intent after 5 seconds for demo purposes
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

// Attach to window for "Interop"
window.fdc3 = mockFdc3;

export class Fdc3Service {
  private static instance: Fdc3Service;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): Fdc3Service {
    if (!Fdc3Service.instance) {
      Fdc3Service.instance = new Fdc3Service();
    }
    return Fdc3Service.instance;
  }

  public initialize(onContext: (data: Fdc3Context) => void) {
    if (this.isInitialized) return;
    this.isInitialized = true;

    if (window.fdc3) {
      window.fdc3.addIntentListener("OrderEntry", (context: Fdc3Context) => {
        console.log("[FDC3 Service] Received Context:", context);
        onContext(context);
      });

      // Also listen for ViewInstrument to switch symbol
      window.fdc3.addIntentListener("ViewInstrument", (context: Fdc3Context) => {
        onContext(context);
      });
    }
  }
}
