import React, { useState, useMemo, useEffect } from 'react';
import { getOrders, deleteOrder, updateOrder } from '@/lib/storage';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Calendar, Package, Trash2, ChevronDown, ChevronUp, X, Edit3, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Order, Product } from '@/types/order';
import ProductForm from '@/components/ProductForm';
import ComboBox from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatDate } from '@/lib/utils';

const OrderHistory = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // global search (toggled from top nav)
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (showSearch) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [showSearch]);

  React.useEffect(() => {
    const onToggle = () => setShowSearch((s) => !s);
    window.addEventListener('toggle-search', onToggle as EventListener);
    return () => window.removeEventListener('toggle-search', onToggle as EventListener);
  }, []);

  // Load orders
  useEffect(() => {
    const load = async () => {
      try {
        const data = await Promise.resolve(getOrders());
        setOrders(data || []);
      } catch (error) {
        console.error('Error loading orders:', error);
        toast.error('Failed to load orders');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleDelete = async (orderId: string) => {
    try {
      await Promise.resolve(deleteOrder(orderId));
      const data = await Promise.resolve(getOrders());
      setOrders(data);
      toast.success('Order deleted successfully');
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('Failed to delete order');
    }
  };

  const toggleExpand = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const openDetails = (order: Order) => {
    setSelectedOrder(order);
    setEditOrder({ ...order, products: order.products.map(p => ({ ...p })) });
    setEditing(false);
    setDialogOpen(true);
  };

  const closeDetails = () => {
    setDialogOpen(false);
    setSelectedOrder(null);
    setEditOrder(null);
    setEditing(false);
  };

  const [editing, setEditing] = useState(false);
  const [editOrder, setEditOrder] = useState<Order | null>(null);

  // suggestion options (from existing stored orders)
  const suggestionOptions = useMemo(() => {
    const suppliers = new Set<string>();
    const names = new Set<string>();
    const categories = new Set<string>();
    const brands = new Set<string>();
    const comps = new Set<string>();
    orders.forEach(o => {
      if (o.supplier) suppliers.add(o.supplier);
      o.products.forEach(p => {
        if (p.name) names.add(p.name);
        if (p.category) categories.add(p.category);
        if (p.brand) brands.add(p.brand);
        if (p.compatibility) comps.add(p.compatibility);
      });
    });
    return {
      suppliers: Array.from(suppliers),
      names: Array.from(names),
      categories: Array.from(categories),
      brands: Array.from(brands),
      compatibilities: Array.from(comps),
    };
  }, [orders]);

  const handleEditProductChange = (index: number, field: keyof Product, value: string | number) => {
    if (!editOrder) return;
    const updated = { ...editOrder };
    updated.products = updated.products.map((p, i) => (i === index ? { ...p, [field]: value } : p));
    setEditOrder(updated);
  };

  const addEditProduct = () => {
    if (!editOrder) return;
    const updated = { ...editOrder };
    updated.products = [
      ...updated.products,
      { id: crypto.randomUUID(), name: '', quantity: 1, price: 0, category: '', brand: '', compatibility: '' },
    ];
    setEditOrder(updated);
  };

  const removeEditProduct = (index: number) => {
    if (!editOrder) return;
    const updated = { ...editOrder };
    updated.products = updated.products.filter((_, i) => i !== index);
    setEditOrder(updated);
  };

  const saveEditedOrder = async () => {
    if (!editOrder) return;
    // validate
    if (!editOrder.supplier || editOrder.supplier.trim() === '') {
      toast.error('Supplier is required');
      return;
    }
    const invalid = editOrder.products.some(p => !p.name || !p.category || !p.brand || Number(p.quantity) <= 0 || Number(p.price) <= 0);
    if (invalid) {
      toast.error('Please fill all required product fields');
      return;
    }
    const total = editOrder.products.reduce((s, p) => s + Number(p.price || 0) * Number(p.quantity || 0), 0);
    const toSave = { ...editOrder, totalAmount: total } as Order;

    try {
      await Promise.resolve(updateOrder(toSave));
      const data = await Promise.resolve(getOrders());
      setOrders(data);
      setSelectedOrder(toSave);
      setEditOrder(toSave);
      setEditing(false);
      toast.success('Order updated');
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order');
    }
  };

  const [sortBy, setSortBy] = useState<'date' | 'supplier-asc' | 'supplier-desc'>('date');
  const [filterSupplier, setFilterSupplier] = useState<string>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const filterMenuRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(e.target as Node)) {
        setShowFilterMenu(false);
      }
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  const supplierOptions = useMemo(() => {
    const s = new Set<string>();
    orders.forEach((o) => { if (o.supplier) s.add(o.supplier); });
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [orders]);

  const displayedOrders = useMemo(() => {
    let copy = [...orders];

    if (filterSupplier !== 'all') {
      copy = copy.filter((o) => (o.supplier || '') === filterSupplier);
    }

    if (searchQuery && searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      copy = copy.filter((o) => {
        if ((o.supplier || '').toLowerCase().includes(q)) return true;
        if ((formatDate(o.date) || '').toLowerCase().includes(q)) return true;
        if ((o.id || '').toLowerCase().includes(q)) return true;
        if (String(o.totalAmount || '').toLowerCase().includes(q)) return true;
        // search inside product fields
        if (o.products.some(p => (p.name || '').toLowerCase().includes(q) || (p.brand || '').toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q) || (String(p.compatibility || '').toLowerCase().includes(q)))) return true;
        return false;
      });
    }

    if (sortBy === 'date') {
      return copy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    if (sortBy === 'supplier-asc') {
      return copy.sort((a, b) => (a.supplier || '').localeCompare(b.supplier || ''));
    }
    if (sortBy === 'supplier-desc') {
      return copy.sort((a, b) => (b.supplier || '').localeCompare(a.supplier || ''));
    }
    return copy;
  }, [orders, sortBy, filterSupplier, searchQuery]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Order History</h1>
            <p className="text-muted-foreground">View and manage your past orders</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative" ref={filterMenuRef}>
              <label className="sr-only">Filter</label>
              <Button variant="outline" onClick={() => setShowFilterMenu((s) => !s)}>
                Filter
              </Button>

              {showFilterMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-popover border border-border rounded-lg shadow-lg p-2 z-50">
                  <button
                    className={`w-full text-left px-3 py-2 rounded ${filterSupplier === 'all' ? 'bg-muted/50' : ''}`}
                    onClick={() => { setFilterSupplier('all'); setShowFilterMenu(false); }}
                  >
                    All parties
                  </button>
                  <div className="mt-2 max-h-48 overflow-auto">
                    {supplierOptions.map((s) => (
                      <button
                        key={s}
                        className={`w-full text-left px-3 py-2 rounded ${filterSupplier === s ? 'bg-muted/50' : ''}`}
                        onClick={() => { setFilterSupplier(s); setShowFilterMenu(false); }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">Sort</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="border rounded px-2 py-1 bg-background text-sm"
              >
                <option value="date">Date (newest)</option>
                <option value="supplier-asc">Supplier (A → Z)</option>
                <option value="supplier-desc">Supplier (Z → A)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-2">
        {showSearch && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              ref={searchRef}
              type="text"
              placeholder="Search orders, suppliers, products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-muted border-0 h-10"
            />
          </div>
        )}
      </div>

      {displayedOrders.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No orders yet</h3>
          <p className="text-muted-foreground">Create your first order to see it here</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {displayedOrders.map((order) => {
              const isExpanded = expandedOrder === order.id;
              return (
                <div key={order.id}>
                  <Card className="overflow-hidden hover:shadow-medium transition-shadow duration-200 cursor-pointer" onClick={() => openDetails(order)}>
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">{formatDate(order.date)} • {order.supplier}</h3>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-4 h-4" />
                              <span>{formatDate(order.date)}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Package className="w-4 h-4" />
                              <span>{order.products.length} products</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right mr-4">
                            <p className="text-sm text-muted-foreground">Total</p>
                            <p className="text-xl font-bold text-primary">₹{order.totalAmount.toFixed(2)}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); toggleExpand(order.id); }}
                            className="hover:bg-secondary"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="border-t pt-4">
                          <div className="grid grid-cols-6 gap-4 text-sm text-muted-foreground mb-3">
                            <div>Product</div>
                            <div>Brand</div>
                            <div>Category</div>
                            <div>Compatibility</div>
                            <div className="col-span-2 text-right">Price</div>
                          </div>
                          {order.products.map((p: any) => (
                            <div key={p.id} className="grid grid-cols-6 gap-4 py-2 border-b">
                              <div className="font-medium">{p.name}</div>
                              <div>{p.brand}</div>
                              <div>{p.category}</div>
                              <div className="text-muted-foreground">{p.compatibility || '-'}</div>
                              <div className="col-span-2 text-right">₹{Number(p.price || 0).toFixed(2)}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              );
          })}
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {editOrder && (
              <div>
                <Label>Supplier</Label>
                <Input value={editOrder.supplier} onChange={(e) => setEditOrder({ ...editOrder, supplier: e.target.value })} />
                <h3 className="mt-4 font-semibold">Products</h3>
                {editOrder.products.map((p, i) => (
                  <ProductForm key={p.id} product={p} index={i} onChange={(idx, field, val) => handleEditProductChange(idx, field, val)} onRemove={removeEditProduct} showRemove={editOrder.products.length > 1} productNameOptions={suggestionOptions.names} categoryOptions={suggestionOptions.categories} brandOptions={suggestionOptions.brands} compatibilityOptions={suggestionOptions.compatibilities} />
                ))}
                <div className="mt-2">
                  <Button onClick={addEditProduct}>Add Product</Button>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={saveEditedOrder}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderHistory;
