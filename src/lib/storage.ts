import { Order } from '@/types/order';
import { indexedDBService } from './indexedDB';

// UUID validation regex
const isValidUUID = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

// Normalize text to title case
const toTitleCase = (text: string): string => {
  if (!text) return '';
  return text.trim().toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
};

export const saveOrder = async (order: Order): Promise<void> => {
  try {
    // Normalize data before saving
    const normalizedOrder = {
      ...order,
      supplier: toTitleCase(order.supplier),
      products: order.products.map(p => ({
        ...p,
        name: p.name?.trim() || '',
        category: toTitleCase(p.category),
        brand: toTitleCase(p.brand),
        compatibility: p.compatibility?.trim() || '',
      })),
    };
    
    await indexedDBService.saveOrder(normalizedOrder);
  } catch (error) {
    console.error('Error saving order:', error);
    throw error;
  }
};

export const getOrders = async (): Promise<Order[]> => {
  try {
    const orders = await indexedDBService.getOrders();
    
    // Filter and normalize orders
    return orders
      .filter(order => isValidUUID(order.id))
      .filter(order => order.products.every(p => isValidUUID(p.id)))
      .map(order => ({
        ...order,
        supplier: toTitleCase(order.supplier),
        products: order.products.map(p => ({
          ...p,
          name: p.name?.trim() || '',
          category: toTitleCase(p.category),
          brand: toTitleCase(p.brand),
          compatibility: p.compatibility?.trim() || '',
          price: Number(p.price),
          quantity: Number(p.quantity),
        })),
        totalAmount: Number(order.totalAmount),
      }));
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
};

export const deleteOrder = async (orderId: string): Promise<void> => {
  try {
    await indexedDBService.deleteOrder(orderId);
  } catch (error) {
    console.error('Error deleting order:', error);
    throw error;
  }
};

export const updateOrder = async (order: Order): Promise<void> => {
  try {
    // Normalize data before updating
    const normalizedOrder = {
      ...order,
      supplier: toTitleCase(order.supplier),
      products: order.products.map(p => ({
        ...p,
        name: p.name?.trim() || '',
        category: toTitleCase(p.category),
        brand: toTitleCase(p.brand),
        compatibility: p.compatibility?.trim() || '',
      })),
      updatedAt: new Date().toISOString(),
    };
    
    await indexedDBService.updateOrder(normalizedOrder);
  } catch (error) {
    console.error('Error updating order:', error);
    throw error;
  }
};
