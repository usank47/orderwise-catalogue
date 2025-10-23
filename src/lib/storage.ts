import { Order } from '@/types/order';

const ORDERS_KEY = 'orders';

// try to initialize native storage in background (if Capacitor plugins installed at runtime)
import { initNativeStorage, isNativeAvailable, nativeSaveOrders, nativeGetOrders } from './nativeStorage';

initNativeStorage().then(async () => {
  if (isNativeAvailable()) {
    // migrate current localStorage data to native storage if native has no data yet
    try {
      const native = await nativeGetOrders();
      if (native && native.length === 0) {
        const current = getOrders();
        await nativeSaveOrders(current);
      }
    } catch (e) {
      // ignore
    }
  }
}).catch(() => {});

export const saveOrder = (order: Order): void => {
  const orders = getOrders();
  orders.push(order);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  // also attempt to write to native storage and sync to Supabase asynchronously
  (async () => {
    try {
      if (isNativeAvailable()) {
        const native = await nativeGetOrders();
        if (native) {
          native.push(order);
          await nativeSaveOrders(native);
        }
      }
      // push to Supabase
      const { pushToSupabase } = await import('./sync');
      await pushToSupabase([order]);
    } catch (e) {
      console.error('sync error:', e);
    }
  })();
};

export const getOrders = (): Order[] => {
  const ordersJson = localStorage.getItem(ORDERS_KEY);
  const local = ordersJson ? JSON.parse(ordersJson) : [];
  // if native is available, attempt to read native data asynchronously and reconcile
  (async () => {
    try {
      if (isNativeAvailable()) {
        const native = await nativeGetOrders();
        if (native && Array.isArray(native) && native.length > 0) {
          // prefer native, and sync it back to localStorage
          localStorage.setItem(ORDERS_KEY, JSON.stringify(native));
        }
      }
    } catch (e) {
      // ignore
    }
  })();
  return local;
};

export const deleteOrder = (orderId: string): void => {
  const orders = getOrders();
  const filtered = orders.filter(order => order.id !== orderId);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(filtered));
  (async () => {
    try {
      if (isNativeAvailable()) {
        await nativeSaveOrders(filtered);
      }
      // sync to Supabase by pushing all orders
      const { pushToSupabase } = await import('./sync');
      await pushToSupabase(filtered);
    } catch (e) {
      console.error('sync error:', e);
    }
  })();
};

export const updateOrder = (order: Order): void => {
  const orders = getOrders();
  const idx = orders.findIndex((o) => o.id === order.id);
  if (idx >= 0) {
    orders[idx] = order;
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  } else {
    // fallback to append if not found
    orders.push(order);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  }
  (async () => {
    try {
      if (isNativeAvailable()) {
        await nativeSaveOrders(orders);
      }
      // sync to Supabase
      const { pushToSupabase } = await import('./sync');
      await pushToSupabase([order]);
    } catch (e) {
      console.error('sync error:', e);
    }
  })();
};
