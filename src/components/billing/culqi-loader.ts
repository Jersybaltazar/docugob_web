/**
 * DocuGob — Culqi Checkout v4 dynamic loader.
 *
 * Loads the Culqi.js bundle once per page lifecycle and resolves a
 * promise with the global `Culqi` once it's available. We don't ship
 * Culqi.js with our bundle because (a) it's a third-party tag they
 * may bump at any time, and (b) the loader only runs after the user
 * clicks "Suscribirme", so it never blocks the initial dashboard
 * paint.
 */

// Culqi Checkout V4 — current official URL.
// Docs: https://docs.culqi.com/docs/integraciones-checkout-v4
// The previous `https://js.culqi.com/checkout-js` URL was an older
// alias that no longer exposes `window.Culqi` correctly with v4
// payloads, surfacing as "Culqi.js no se pudo inicializar" at click time.
const CULQI_SRC = "https://checkout.culqi.com/js/v4";

declare global {
  interface Window {
    // The Culqi Checkout client. Typed loosely on purpose — see
    // https://docs.culqi.com/docs/culqi-checkout-v4 for the full shape.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Culqi?: any;
    /** Global callback Culqi calls after a successful tokenization. */
    culqi?: () => void;
  }
}

let loadingPromise: Promise<void> | null = null;

export function loadCulqi(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Culqi can only load in the browser"));
  }
  if (window.Culqi) return Promise.resolve();
  if (loadingPromise) return loadingPromise;

  loadingPromise = new Promise<void>((resolve, reject) => {
    // Reuse a tag already present on the page (HMR re-renders may
    // double-mount this loader during dev).
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${CULQI_SRC}"]`
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Failed to load Culqi.js"))
      );
      return;
    }
    const script = document.createElement("script");
    script.src = CULQI_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loadingPromise = null;
      reject(new Error("Failed to load Culqi.js"));
    };
    document.head.appendChild(script);
  });
  return loadingPromise;
}
