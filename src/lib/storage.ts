import { Order } from '@/types/order';
import { supabase } from '@/integrations/supabase/client';

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
    // Save order to Supabase
    const { error: orderErr } = await supabase.from('orders').insert({
      id: order.id,
      date: order.date,
      supplier: order.supplier,
      total_amount: order.totalAmount,
      created_at: order.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    
    if (orderErr) throw orderErr;

    // Save products
    for (const p of order.products) {
      const { error: prodErr } = await supabase.from('order_products').insert({
        id: p.id,
        order_id: order.id,
        name: p.name,
        quantity: p.quantity,
        price: p.price,
        category: p.category,
        brand: p.brand,
        compatibility: p.compatibility,
        updated_at: new Date().toISOString(),
      });
      
      if (prodErr) throw prodErr;
    }
  } catch (error) {
    console.error('Error saving order:', error);
    throw error;
  }
};

export const getOrders = async (): Promise<Order[]> => {
  try {
    const { data: orders, error: ordersErr } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (ordersErr) throw ordersErr;

    const result: Order[] = [];
    
    for (const o of orders || []) {
      const { data: prods, error: prodErr } = await supabase
        .from('order_products')
        .select('*')
        .eq('order_id', o.id);
      
      if (prodErr) {
        console.error('Error fetching products:', prodErr);
        continue;
      }

      const order: Order = {
        id: o.id,
        date: o.date,
        supplier: toTitleCase(o.supplier),
        products: (prods || []).map((p: any) => ({
          id: p.id,
          name: p.name?.trim() || '',
          quantity: p.quantity,
          price: Number(p.price),
          category: toTitleCase(p.category),
          brand: toTitleCase(p.brand),
          compatibility: p.compatibility?.trim() || '',
        })).filter((p: any) => isValidUUID(p.id)),
        totalAmount: Number(o.total_amount || 0),
        createdAt: o.created_at,
        updatedAt: o.updated_at,
      };
      
      if (isValidUUID(order.id)) {
        result.push(order);
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
};

export const deleteOrder = async (orderId: string): Promise<void> => {
  try {
    // Delete products first (foreign key constraint)
    const { error: prodErr } = await supabase
      .from('order_products')
      .delete()
      .eq('order_id', orderId);
    
    if (prodErr) throw prodErr;

    // Delete order
    const { error: orderErr } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId);
    
    if (orderErr) throw orderErr;
  } catch (error) {
    console.error('Error deleting order:', error);
    throw error;
  }
};

export const updateOrder = async (order: Order): Promise<void> => {
  try {
    // Update order
    const { error: orderErr } = await supabase.from('orders').upsert({
      id: order.id,
      date: order.date,
      supplier: order.supplier,
      total_amount: order.totalAmount,
      created_at: order.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    
    if (orderErr) throw orderErr;

    // Delete existing products and re-insert
    await supabase.from('order_products').delete().eq('order_id', order.id);
    
    // Insert updated products
    for (const p of order.products) {
      const { error: prodErr } = await supabase.from('order_products').upsert({
        id: p.id,
        order_id: order.id,
        name: p.name,
        quantity: p.quantity,
        price: p.price,
        category: p.category,
        brand: p.brand,
        compatibility: p.compatibility,
        updated_at: new Date().toISOString(),
      });
      
      if (prodErr) throw prodErr;
    }
  } catch (error) {
    console.error('Error updating order:', error);
    throw error;
  }
};
