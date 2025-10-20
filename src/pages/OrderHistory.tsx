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
import { Calendar, Package, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

const OrderHistory = () => {
  const [orders, setOrders] = useState(getOrders());
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const handleDelete = (orderId: string) => {
    deleteOrder(orderId);
    setOrders(getOrders());
    toast.success('Order deleted successfully');
  };

  const toggleExpand = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
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
                <Card key={order.id} className="overflow-hidden hover:shadow-medium transition-shadow duration-200">
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
                          onClick={() => toggleExpand(order.id)}
                          className="hover:bg-secondary"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
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
              );
            })}
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
