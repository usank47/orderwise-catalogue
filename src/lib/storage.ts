import { Order } from '@/types/order';

const ORDERS_KEY = 'orders';
const DEMO_INITIALIZED_KEY = 'demo_initialized';

const DEMO_DATA: Order[] = [
  {
    id: 'demo-1',
    date: '2024-01-15',
    supplier: 'TechSupply Co.',
    products: [
      { id: 'p1', name: 'Product X', quantity: 10, price: 19.99, category: 'Electronics', brand: 'Brand A' },
      { id: 'p2', name: 'Product Y', quantity: 5, price: 24.50, category: 'Electronics', brand: 'Brand B' },
      { id: 'p3', name: 'Product Z', quantity: 8, price: 15.75, category: 'Electronics', brand: 'Brand A' },
    ],
    totalAmount: 446.65,
    createdAt: new Date('2024-01-15T10:30:00').toISOString(),
  },
  {
    id: 'demo-2',
    date: '2024-01-20',
    supplier: 'Global Parts Ltd.',
    products: [
      { id: 'p4', name: 'Product A', quantity: 15, price: 22.00, category: 'Accessories', brand: 'Brand C' },
      { id: 'p5', name: 'Product B', quantity: 12, price: 18.50, category: 'Accessories', brand: 'Brand B' },
    ],
    totalAmount: 552.00,
    createdAt: new Date('2024-01-20T14:45:00').toISOString(),
  },
  {
    id: 'demo-3',
    date: '2024-02-01',
    supplier: 'TechSupply Co.',
    products: [
      { id: 'p6', name: 'Product C', quantity: 20, price: 21.25, category: 'Components', brand: 'Brand A' },
      { id: 'p7', name: 'Product D', quantity: 7, price: 29.99, category: 'Components', brand: 'Brand D' },
    ],
    totalAmount: 634.93,
    createdAt: new Date('2024-02-01T09:15:00').toISOString(),
  },
  {
    id: 'demo-4',
    date: '2024-02-10',
    supplier: 'Prime Electronics',
    products: [
      { id: 'p8', name: 'Product E', quantity: 25, price: 16.50, category: 'Electronics', brand: 'Brand B' },
      { id: 'p9', name: 'Product F', quantity: 10, price: 32.00, category: 'Accessories', brand: 'Brand C' },
      { id: 'p10', name: 'Product G', quantity: 18, price: 27.75, category: 'Components', brand: 'Brand A' },
    ],
    totalAmount: 1252.00,
    createdAt: new Date('2024-02-10T16:20:00').toISOString(),
  },
];

const initializeDemoData = (): void => {
  const demoInitialized = localStorage.getItem(DEMO_INITIALIZED_KEY);
  if (!demoInitialized) {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(DEMO_DATA));
    localStorage.setItem(DEMO_INITIALIZED_KEY, 'true');
  }
};

// Initialize demo data on module load
initializeDemoData();

// Native storage adapter (optional)
import { initNativeStorage, isNativeAvailable, nativeGetOrders, nativeSaveOrders } from './nativeStorage';
import { isSupabaseEnabled } from './supabase';
import { pushToSupabase } from './sync';

initNativeStorage().then(async () => {
  if (isNativeAvailable()) {
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
  (async () => {
    try {
      if (isNativeAvailable()) {
        const native = await nativeGetOrders();
        if (native) {
          native.push(order);
          await nativeSaveOrders(native);
        }
      }

      if (isSupabaseEnabled()) {
        // push this order to Supabase in background
        try { await pushToSupabase([order]); } catch (e) { console.error('pushToSupabase saveOrder failed', e); }
      }
    } catch (e) {
      // ignore
    }
  })();
};

export const getOrders = (): Order[] => {
  const ordersJson = localStorage.getItem(ORDERS_KEY);
  const local = ordersJson ? JSON.parse(ordersJson) : [];
  (async () => {
    try {
      if (isNativeAvailable()) {
        const native = await nativeGetOrders();
        if (native && Array.isArray(native) && native.length > 0) {
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
    } catch (e) {}
  })();
};

export const updateOrder = (order: Order): void => {
  const orders = getOrders();
  const idx = orders.findIndex((o) => o.id === order.id);
  if (idx >= 0) {
    orders[idx] = order;
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  } else {
    orders.push(order);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  }
  (async () => {
    try {
      if (isNativeAvailable()) {
        await nativeSaveOrders(orders);
      }
    } catch (e) {}
  })();
};
