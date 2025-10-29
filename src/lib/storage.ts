import { Order } from '@/types/order';
import { databases, ID, Query, DATABASE_ID, ORDERS_COLLECTION_ID } from './appwrite';

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
    
    await databases.createDocument(
      DATABASE_ID,
      ORDERS_COLLECTION_ID,
      normalizedOrder.id,
      normalizedOrder
    );
  } catch (error) {
    console.error('Error saving order:', error);
    throw error;
  }
};

export const getOrders = async (): Promise<Order[]> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      ORDERS_COLLECTION_ID,
      [Query.orderDesc('createdAt')]
    );
    
    const orders = response.documents as any[];
    
    // Filter and normalize orders
    return orders
      .filter(order => isValidUUID(order.id))
      .filter(order => order.products.every((p: any) => isValidUUID(p.id)))
      .map(order => ({
        ...order,
        supplier: toTitleCase(order.supplier),
        products: order.products.map((p: any) => ({
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
    await databases.deleteDocument(
      DATABASE_ID,
      ORDERS_COLLECTION_ID,
      orderId
    );
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
    
    await databases.updateDocument(
      DATABASE_ID,
      ORDERS_COLLECTION_ID,
      order.id,
      normalizedOrder
    );
  } catch (error) {
    console.error('Error updating order:', error);
    throw error;
  }
};
