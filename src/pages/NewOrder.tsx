import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Product, Order } from '@/types/order';
import { getOrders, saveOrder } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import ComboBox from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ProductForm from '@/components/ProductForm';
import { Plus, Send } from 'lucide-react';
import { toast } from 'sonner';

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

  // suggestion options derived from saved orders (price list DB)
  const [supplierOptions, setSupplierOptions] = useState<string[]>([]);
  const [productNameOptions, setProductNameOptions] = useState<string[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [brandOptions, setBrandOptions] = useState<string[]>([]);
  const [compatibilityOptions, setCompatibilityOptions] = useState<string[]>([]);

  React.useEffect(() => {
    const orders = getOrders();
    const suppliersSet = new Set<string>();
    const productSet = new Set<string>();
    const categorySet = new Set<string>();
    const brandSet = new Set<string>();
    const compSet = new Set<string>();

    orders.forEach((o) => {
      if (o.supplier) suppliersSet.add(o.supplier);
      o.products?.forEach((p) => {
        if (p.name) productSet.add(p.name);
        if (p.category) categorySet.add(p.category);
        if (p.brand) brandSet.add(p.brand);
        if (p.compatibility) compSet.add(p.compatibility);
      });
    });

    setSupplierOptions(Array.from(suppliersSet));
    setProductNameOptions(Array.from(productSet));
    setCategoryOptions(Array.from(categorySet));
    setBrandOptions(Array.from(brandSet));
    setCompatibilityOptions(Array.from(compSet));
  }, []);

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

  const totalAmount = React.useMemo(() => {
    return products.reduce((sum, p) => sum + Number(p.price || 0) * Number(p.quantity || 0), 0);
  }, [products]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!supplier || supplier.trim() === '') {
      toast.error('Please select a supplier');
      return;
    }

    const invalidProducts = products.filter(
      (p) => !p.name || !p.category || !p.brand || Number(p.quantity) <= 0 || Number(p.price) <= 0
    );

    if (invalidProducts.length > 0) {
      toast.error('Please fill in all required product fields');
      return;
    }

    const order: Order = {
      id: crypto.randomUUID(),
      date,
      supplier,
      products: products.map(p => ({ ...p, quantity: Number(p.quantity), price: Number(p.price) })),
      totalAmount,
      createdAt: new Date().toISOString(),
    };

    saveOrder(order);

    // After saving, update suggestion lists immediately
    const orders = getOrders();
    const suppliersSet = new Set(supplierOptions);
    const productSet = new Set(productNameOptions);
    const categorySet = new Set(categoryOptions);
    const brandSet = new Set(brandOptions);
    const compSet = new Set(compatibilityOptions);

    suppliersSet.add(order.supplier);
    order.products.forEach((p) => {
      if (p.name) productSet.add(p.name);
      if (p.category) categorySet.add(p.category);
      if (p.brand) brandSet.add(p.brand);
      if (p.compatibility) compSet.add(p.compatibility || '');
    });

    // also include any values from existing orders
    orders.forEach((o) => {
      if (o.supplier) suppliersSet.add(o.supplier);
      o.products.forEach((p) => {
        if (p.name) productSet.add(p.name);
        if (p.category) categorySet.add(p.category);
        if (p.brand) brandSet.add(p.brand);
        if (p.compatibility) compSet.add(p.compatibility || '');
      });
    });

    setSupplierOptions(Array.from(suppliersSet).filter(Boolean));
    setProductNameOptions(Array.from(productSet).filter(Boolean));
    setCategoryOptions(Array.from(categorySet).filter(Boolean));
    setBrandOptions(Array.from(brandSet).filter(Boolean));
    setCompatibilityOptions(Array.from(compSet).filter(Boolean));

    toast.success('Order uploaded successfully!');
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
            <ComboBox
              id="supplier"
              value={supplier}
              onChange={(val) => {
                setSupplier(val);
                if (val && !supplierOptions.includes(val)) setSupplierOptions((s) => [...s, val]);
              }}
              options={supplierOptions}
              placeholder="Select or type supplier"
            />
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
              productNameOptions={productNameOptions}
              categoryOptions={categoryOptions}
              brandOptions={brandOptions}
              compatibilityOptions={compatibilityOptions}
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

        <div className="mt-4 p-4 bg-muted/20 rounded-lg">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="font-bold text-lg">₹{totalAmount.toFixed(2)}</p>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
          disabled={products.some(p => !p.name || !p.category || !p.brand || Number(p.quantity) <= 0 || Number(p.price) <= 0) || !supplier}
        >
          <Send className="w-4 h-4 mr-2" />
          Upload Order
        </Button>
      </form>
    </div>
  );
};

export default NewOrder;
