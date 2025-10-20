import { useState, useMemo } from 'react';
import { getOrders } from '@/lib/storage';
import { Product } from '@/types/order';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Package, DollarSign } from 'lucide-react';

type SortOption = 'category' | 'brand' | 'supplier' | 'none';

interface ProductWithSupplier extends Product {
  supplier: string;
  orderDate: string;
}

const PriceList = () => {
  const [sortBy, setSortBy] = useState<SortOption>('none');
  const orders = getOrders();

  const allProducts = useMemo(() => {
    const products: ProductWithSupplier[] = [];
    orders.forEach((order) => {
      order.products.forEach((product) => {
        products.push({
          ...product,
          supplier: order.supplier,
          orderDate: order.date,
        });
      });
    });
    return products;
  }, [orders]);

  const sortedProducts = useMemo(() => {
    if (sortBy === 'none') return allProducts;

    return [...allProducts].sort((a, b) => {
      const aValue = a[sortBy].toLowerCase();
      const bValue = b[sortBy].toLowerCase();
      return aValue.localeCompare(bValue);
    });
  }, [allProducts, sortBy]);

  const stats = useMemo(() => {
    const totalValue = allProducts.reduce((sum, p) => sum + p.price * p.quantity, 0);
    const totalItems = allProducts.reduce((sum, p) => sum + p.quantity, 0);
    return { totalValue, totalItems };
  }, [allProducts]);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Price List</h1>
        <p className="text-muted-foreground">View and organize all products from your orders</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Package className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Items</p>
              <p className="text-2xl font-bold">{stats.totalItems}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <DollarSign className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Value</p>
              <p className="text-2xl font-bold">${stats.totalValue.toFixed(2)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <Label htmlFor="sort">Sort By</Label>
          <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
            <SelectTrigger id="sort" className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="none">Default</SelectItem>
              <SelectItem value="category">Category</SelectItem>
              <SelectItem value="brand">Brand</SelectItem>
              <SelectItem value="supplier">Supplier</SelectItem>
            </SelectContent>
          </Select>
        </Card>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No products found. Create your first order to get started.
                  </TableCell>
                </TableRow>
              ) : (
                sortedProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>{product.brand}</TableCell>
                    <TableCell>{product.supplier}</TableCell>
                    <TableCell className="text-right">{product.quantity}</TableCell>
                    <TableCell className="text-right">${product.price.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-medium">
                      ${(product.price * product.quantity).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

export default PriceList;
