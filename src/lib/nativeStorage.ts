// Lightweight native storage adapter that attempts to use Capacitor Storage when available.
// Falls back to no-op if Capacitor Storage is not installed or not running in native environment.

const ORDERS_KEY = 'orders';

let available = false;
let Storage: any = null;

export async function initNativeStorage() {
  try {
    // dynamic import so web builds without plugin still work
    // Use @vite-ignore so Vite doesn't try to pre-bundle this optional native plugin
    // The import will fail gracefully at runtime in the browser when plugin isn't installed.
    // @ts-ignore
    const mod = await import(/* @vite-ignore */ '@capacitor/storage');
    Storage = mod.Storage;
    // quick availability check
    if (Storage && typeof Storage.get === 'function') {
      available = true;
    }
  } catch (e) {
    // plugin not installed or not available; silently fallback
    available = false;
  }
}

export const isNativeAvailable = () => available;

export async function nativeGetOrders() {
  if (!available) return null;
  try {
    const res = await Storage.get({ key: ORDERS_KEY });
    return res && res.value ? JSON.parse(res.value) : [];
  } catch (e) {
    console.error('nativeGetOrders error', e);
    return null;
  }
}

export async function nativeSaveOrders(orders: any[]) {
  if (!available) return false;
  try {
    await Storage.set({ key: ORDERS_KEY, value: JSON.stringify(orders) });
    return true;
  } catch (e) {
    console.error('nativeSaveOrders error', e);
    return false;
  }
}

export async function nativeClear() {
  if (!available) return false;
  try {
    await Storage.remove({ key: ORDERS_KEY });
    return true;
  } catch (e) {
    console.error('nativeClear error', e);
    return false;
  }
}
