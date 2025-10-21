import React, { useState, useMemo } from 'react';
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
  const [orders, setOrders] = useState(getOrders());
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // global search (toggled from top nav)
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = React.useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (showSearch) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [showSearch]);

  useEffect(() => {
    const onToggle = () => setShowSearch((s) => !s);
    window.addEventListener('toggle-search', onToggle as EventListener);
    return () => window.removeEventListener('toggle-search', onToggle as EventListener);
  }, []);

  const handleDelete = (orderId: string) => {
    deleteOrder(orderId);
    setOrders(getOrders());
    toast.success('Order deleted successfully');
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
  const suggestionOptions = React.useMemo(() => {
    const orders = getOrders();
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

  const saveEditedOrder = () => {
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
    updateOrder(toSave);
    setOrders(getOrders());
    setSelectedOrder(toSave);
    setEditOrder(toSave);
    setEditing(false);
    toast.success('Order updated');
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
  }, [orders, sortBy, filterSupplier]);

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
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={(e) => e.stopPropagation()}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Order</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this order? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(order.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-border">
                          <div className="space-y-3">
                            {order.products.map((product) => (
                              <div
                                key={product.id}
                                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                              >
                                <div className="flex-1">
                                  <p className="font-medium">{product.name}</p>
                                  <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                                    <span>{product.category}</span>
                                    <span>•</span>
                                    <span>{product.brand}</span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium">
                                    ₹{product.price.toFixed(2)} × {product.quantity}
                                  </p>
                                  <p className="text-sm text-primary font-semibold">
                                    ₹{(product.price * product.quantity).toFixed(2)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>

                  {/* Dialog for details */}
                  <Dialog open={dialogOpen && selectedOrder?.id === order.id} onOpenChange={(open) => { if (!open) closeDetails(); }}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Order Details - #{order.id.slice(0,8)}</DialogTitle>
                      </DialogHeader>

                      <div className="mt-4 flex flex-col">
                        <div className="max-h-[60vh] overflow-auto pr-2 space-y-4">
                          {!editing && (
                            <>
                              <p className="text-sm text-muted-foreground">Supplier</p>
                              <p className="font-medium mb-2">{selectedOrder?.supplier}</p>

                              <p className="text-sm text-muted-foreground">Date</p>
                              <p className="font-medium mb-2">{selectedOrder ? formatDate(selectedOrder.date) : ''}</p>

                              <div className="mt-4">
                                <h4 className="font-semibold mb-2">Products</h4>
                                <div className="space-y-2">
                                  {selectedOrder?.products.map((p) => (
                                    <div key={p.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                      <div>
                                        <p className="font-medium">{p.name}</p>
                                        <p className="text-sm text-muted-foreground">{p.category} • {p.brand} {p.compatibility ? `• ${p.compatibility}` : ''}</p>
                                      </div>
                                      <div className="text-right">
                                        <p className="font-medium">₹{p.price.toFixed(2)} × {p.quantity}</p>
                                        <p className="text-sm text-primary font-semibold">₹{(p.price * p.quantity).toFixed(2)}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="mt-4 text-right">
                                <p className="text-sm text-muted-foreground">Total</p>
                                <p className="font-bold text-xl">₹{selectedOrder?.totalAmount.toFixed(2)}</p>
                              </div>
                            </>
                          )}

                          {editing && editOrder && (
                            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); saveEditedOrder(); }}>
                              <div>
                                <Label htmlFor="edit-supplier">Supplier</Label>
                                <ComboBox
                                  id="edit-supplier"
                                  value={editOrder.supplier}
                                  onChange={(v) => setEditOrder({ ...editOrder, supplier: v })}
                                  options={suggestionOptions.suppliers}
                                  placeholder="Supplier"
                                />
                              </div>

                              <div>
                                <Label htmlFor="edit-date">Date</Label>
                                <Input id="edit-date" type="datetime-local" value={new Date(editOrder.date).toISOString().slice(0,16)} onChange={(e) => setEditOrder({ ...editOrder, date: new Date(e.target.value).toISOString() })} className="mt-1.5" />
                              </div>

                              <div>
                                <h4 className="font-semibold mb-2">Products</h4>
                                <div className="space-y-2">
                                  {editOrder.products.map((p, idx) => (
                                    <ProductForm
                                      key={p.id}
                                      product={p}
                                      index={idx}
                                      onChange={handleEditProductChange}
                                      onRemove={removeEditProduct}
                                      showRemove={editOrder.products.length > 1}
                                      productNameOptions={suggestionOptions.names}
                                      categoryOptions={suggestionOptions.categories}
                                      brandOptions={suggestionOptions.brands}
                                      compatibilityOptions={suggestionOptions.compatibilities}
                                    />
                                  ))}
                                  <Button type="button" variant="outline" onClick={addEditProduct} className="w-full">
                                    Add Product
                                  </Button>
                                </div>
                              </div>

                              <div className="mt-4 text-right">
                                <p className="text-sm text-muted-foreground">Total</p>
                                <p className="font-bold text-xl">₹{editOrder.products.reduce((s, p) => s + Number(p.price || 0) * Number(p.quantity || 0), 0).toFixed(2)}</p>
                              </div>
                            </form>
                          )}
                        </div>

                        <DialogFooter>
                          {!editing && (
                            <div className="flex gap-2 ml-auto">
                              <Button variant="ghost" onClick={() => { setEditing(true); setEditOrder(selectedOrder ? { ...selectedOrder } as Order : null); }}>
                                <Edit3 className="w-4 h-4 mr-2" /> Edit
                              </Button>
                              <DialogClose asChild>
                                <Button variant="outline"><X className="w-4 h-4 mr-2"/>Close</Button>
                              </DialogClose>
                            </div>
                          )}

                          {editing && (
                            <div className="flex gap-2 ml-auto">
                              <Button variant="outline" onClick={() => { setEditing(false); setEditOrder(selectedOrder ? { ...selectedOrder } as Order : null); }}>Cancel</Button>
                              <Button onClick={saveEditedOrder} className="bg-gradient-primary">Save</Button>
                            </div>
                          )}
                        </DialogFooter>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
