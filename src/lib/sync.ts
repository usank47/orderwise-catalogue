// Minimal sync helpers to push/pull orders and products to Supabase.
// These are intentionally defensive — they no-op if Supabase isn't configured.

import { supabase } from '@/integrations/supabase/client';
import { getOrders, updateOrder } from './storage';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

function isSupabaseEnabled() {
  return Boolean(SUPABASE_URL && supabase);
}

export async function pullFromSupabase() {
  if (!isSupabaseEnabled()) return;

  try {
    // fetch all orders (for simplicity). In production use incremental fetch by updated_at
    const { data: orders, error: ordersErr } = await supabase.from('orders').select('*');
    if (ordersErr) throw ordersErr;

    for (const o of orders || []) {
      const { data: prods, error: prodErr } = await supabase
        .from('order_products')
        .select('*')
        .eq('order_id', o.id);
      if (prodErr) {
        console.error('pull products error', prodErr);
      }

      const localOrder = {
        id: o.id,
        date: o.date,
        supplier: o.supplier,
        products: (prods || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          quantity: p.quantity,
          price: Number(p.price),
          category: p.category,
          brand: p.brand,
          compatibility: p.compatibility,
        })),
        totalAmount: Number(o.total_amount || 0),
        createdAt: o.created_at,
        updatedAt: o.updated_at,
      };

      try {
        // update local storage (storage.updateOrder is synchronous but imported updateOrder handles it)
        updateOrder(localOrder as any);
      } catch (e) {
        console.error('update local order error', e);
      }
    }
  } catch (err) {
    console.error('pullFromSupabase failed', err);
  }
}

export async function pushToSupabase(localOrders?: any[]) {
  if (!isSupabaseEnabled()) return;
  try {
    const toPush = localOrders ?? getOrders();
    for (const order of toPush) {
      const { error: orderErr } = await supabase.from('orders').upsert({
        id: order.id,
        date: order.date,
        supplier: order.supplier,
        total_amount: order.totalAmount,
        created_at: order.createdAt || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      if (orderErr) console.error('push order error', orderErr);

      for (const p of order.products || []) {
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
        if (prodErr) console.error('push product error', prodErr);
      }
    }
  } catch (err) {
    console.error('pushToSupabase failed', err);
  }
}
