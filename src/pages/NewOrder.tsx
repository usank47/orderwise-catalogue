import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Product, Order } from '@/types/order';
import { getOrders, saveOrder } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import ComboBox from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ProductForm from '@/components/ProductForm';
import { Plus, Send, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

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
      // Normalize supplier to title case for display
      if (o.supplier) {
        const normalized = o.supplier.trim().toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
        suppliersSet.add(normalized);
      }
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

    // if user typed a new suggestion, add it locally so it appears for other rows immediately
    if (typeof value === 'string') {
      const v = value.trim();
      if (!v) return;
      if (field === 'name' && !productNameOptions.includes(v)) setProductNameOptions((s) => [...s, v]);
      if (field === 'category' && !categoryOptions.includes(v)) setCategoryOptions((s) => [...s, v]);
      if (field === 'brand' && !brandOptions.includes(v)) setBrandOptions((s) => [...s, v]);
      if (field === 'compatibility' && !compatibilityOptions.includes(v)) setCompatibilityOptions((s) => [...s, v]);
    }
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

  const downloadSampleExcel = () => {
    const sampleData = [
      {
        'Product Name': 'Sample Product 1',
        'Quantity': 10,
        'Price': 100,
        'Category': 'Electronics',
        'Brand': 'Sample Brand',
        'Compatibility': 'Universal'
      },
      {
        'Product Name': 'Sample Product 2',
        'Quantity': 5,
        'Price': 250,
        'Category': 'Accessories',
        'Brand': 'Another Brand',
        'Compatibility': 'Model XYZ'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');
    XLSX.writeFile(workbook, 'order_template.xlsx');
    toast.success('Sample template downloaded!');
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet) as any[];

        if (jsonData.length === 0) {
          toast.error('Excel file is empty');
          return;
        }

        const parsedProducts: Product[] = jsonData.map((row) => ({
          id: crypto.randomUUID(),
          name: row['Product Name'] || '',
          quantity: Number(row['Quantity']) || 1,
          price: Number(row['Price']) || 0,
          category: row['Category'] || '',
          brand: row['Brand'] || '',
          compatibility: row['Compatibility'] || '',
        }));

        const invalidCount = parsedProducts.filter(
          (p) => !p.name || !p.category || !p.brand || p.quantity <= 0 || p.price <= 0
        ).length;

        if (invalidCount > 0) {
          toast.error(`${invalidCount} product(s) have missing or invalid data. Please check the file.`);
          return;
        }

        setProducts(parsedProducts);
        toast.success(`${parsedProducts.length} products loaded from Excel!`);
        
        // Reset file input
        e.target.value = '';
      } catch (error) {
        console.error('Excel parsing error:', error);
        toast.error('Failed to parse Excel file. Please check the format.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

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

    // Normalize supplier name to title case
    const normalizedSupplier = supplier.trim().toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
    
    const order: Order = {
      id: crypto.randomUUID(),
      date,
      supplier: normalizedSupplier,
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

    suppliersSet.add(normalizedSupplier);
    order.products.forEach((p) => {
      if (p.name) productSet.add(p.name);
      if (p.category) categorySet.add(p.category);
      if (p.brand) brandSet.add(p.brand);
      if (p.compatibility) compSet.add(p.compatibility || '');
    });

    // also include any values from existing orders
    orders.forEach((o) => {
      if (o.supplier) {
        const norm = o.supplier.trim().toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
        suppliersSet.add(norm);
      }
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

        <div className="mt-8 pt-8 border-t">
          <h3 className="text-lg font-semibold mb-4">Or Upload from Excel</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Button
              type="button"
              variant="outline"
              onClick={downloadSampleExcel}
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Sample Template
            </Button>
            
            <div className="relative">
              <Input
                id="excel-upload"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleExcelUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('excel-upload')?.click()}
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Excel File
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            Download the sample template, fill in your products, and upload it to quickly add multiple products at once.
          </p>
        </div>
      </form>
    </div>
  );
};

export default NewOrder;
