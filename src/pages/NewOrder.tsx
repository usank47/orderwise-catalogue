import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Product, Order } from '@/types/order';
import { saveOrder } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ProductForm from '@/components/ProductForm';
import { Plus, Send } from 'lucide-react';
import { toast } from 'sonner';

const suppliers = ['Tech Supplies Inc.', 'Global Electronics', 'Prime Distributors', 'Elite Tech Solutions'];

const NewOrder = () => {
  const navigate = useNavigate();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [supplier, setSupplier] = useState('');
  const [products, setProducts] = useState<Product[]>([
    {
      id: crypto.randomUUID(),
      name: '',
      quantity: 1,
      price: 0,
      category: '',
      brand: '',
      compatibility: '',
    },
  ]);

  const handleProductChange = (index: number, field: keyof Product, value: string | number) => {
    const updated = [...products];
    updated[index] = { ...updated[index], [field]: value };
    setProducts(updated);
  };

  const addProduct = () => {
    setProducts([
      ...products,
      {
        id: crypto.randomUUID(),
        name: '',
        quantity: 1,
        price: 0,
        category: '',
        brand: '',
        compatibility: '',
      },
    ]);
  };

  const removeProduct = (index: number) => {
    if (products.length > 1) {
      setProducts(products.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!supplier) {
      toast.error('Please select a supplier');
      return;
    }

    const invalidProducts = products.filter(
      (p) => !p.name || !p.category || !p.brand || p.quantity <= 0 || p.price <= 0
    );

    if (invalidProducts.length > 0) {
      toast.error('Please fill in all required product fields');
      return;
    }

    const totalAmount = products.reduce((sum, p) => sum + p.price * p.quantity, 0);

    const order: Order = {
      id: crypto.randomUUID(),
      date,
      supplier,
      products,
      totalAmount,
      createdAt: new Date().toISOString(),
    };

    saveOrder(order);
    toast.success('Order placed successfully!');
    navigate('/order-history');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">New Order</h1>
        <p className="text-muted-foreground">Create and submit a new product order</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1.5"
              required
            />
          </div>

          <div>
            <Label htmlFor="supplier">Supplier</Label>
            <Input
              id="supplier"
              list="suppliers-list"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="Select or type supplier"
              className="mt-1.5"
              required
            />
            <datalist id="suppliers-list">
              {suppliers.map((sup) => (
                <option key={sup} value={sup} />
              ))}
            </datalist>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Products</h2>
          {products.map((product, index) => (
            <ProductForm
              key={product.id}
              product={product}
              index={index}
              onChange={handleProductChange}
              onRemove={removeProduct}
              showRemove={products.length > 1}
            />
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={addProduct}
            className="w-full border-dashed border-2 hover:border-primary hover:text-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>

        <Button type="submit" className="w-full bg-gradient-primary hover:opacity-90 transition-opacity">
          <Send className="w-4 h-4 mr-2" />
          Place Order
        </Button>
      </form>
    </div>
  );
};

export default NewOrder;
