import { useState } from 'react';
import { getOrders, deleteOrder } from '@/lib/storage';
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
import { Calendar, Package, Trash2, ChevronDown, ChevronUp, X } from 'lucide-react';
import { toast } from 'sonner';

const OrderHistory = () => {
  const [orders, setOrders] = useState(getOrders());
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleDelete = (orderId: string) => {
    deleteOrder(orderId);
    setOrders(getOrders());
    toast.success('Order deleted successfully');
  };

  const toggleExpand = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const openDetails = (order: any) => {
    setSelectedOrder(order);
    setDialogOpen(true);
  };

  const closeDetails = () => {
    setDialogOpen(false);
    setSelectedOrder(null);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Order History</h1>
        <p className="text-muted-foreground">View and manage your past orders</p>
      </div>

      {orders.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No orders yet</h3>
          <p className="text-muted-foreground">Create your first order to see it here</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map((order) => {
              const isExpanded = expandedOrder === order.id;
              return (
                <div key={order.id}>
                  <Card className="overflow-hidden hover:shadow-medium transition-shadow duration-200 cursor-pointer" onClick={() => openDetails(order)}>
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">Order #{order.id.slice(0, 8)}</h3>
                            <Badge variant="outline">{order.supplier}</Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-4 h-4" />
                              <span>{new Date(order.date).toLocaleDateString()}</span>
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

                      <div className="mt-4">
                        <p className="text-sm text-muted-foreground">Supplier</p>
                        <p className="font-medium mb-2">{order.supplier}</p>

                        <p className="text-sm text-muted-foreground">Date</p>
                        <p className="font-medium mb-2">{new Date(order.date).toLocaleString()}</p>

                        <div className="mt-4">
                          <h4 className="font-semibold mb-2">Products</h4>
                          <div className="space-y-2">
                            {order.products.map((p) => (
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
                          <p className="font-bold text-xl">₹{order.totalAmount.toFixed(2)}</p>
                        </div>
                      </div>

                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="outline"><X className="w-4 h-4 mr-2"/>Close</Button>
                        </DialogClose>
                      </DialogFooter>
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
