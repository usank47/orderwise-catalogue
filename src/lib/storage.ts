import { Order } from '@/types/order';

const ORDERS_KEY = 'orders';

export const saveOrder = (order: Order): void => {
  const orders = getOrders();
  orders.push(order);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
};

export const getOrders = (): Order[] => {
  const ordersJson = localStorage.getItem(ORDERS_KEY);
  return ordersJson ? JSON.parse(ordersJson) : [];
};

export const deleteOrder = (orderId: string): void => {
  const orders = getOrders();
  const filtered = orders.filter(order => order.id !== orderId);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(filtered));
};
