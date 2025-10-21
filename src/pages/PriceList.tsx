import { useState, useMemo, useRef, useEffect } from 'react';
import { getOrders } from '@/lib/storage';
import { Product } from '@/types/order';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Share2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type GroupBy = 'category' | 'brand' | 'supplier';

interface ProductWithSupplier extends Product {
  supplier: string;
  orderDate: string;
}

const PriceList = () => {
  const navigate = useNavigate();
  const [groupBy, setGroupBy] = useState<GroupBy>('category');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const orders = getOrders();

  const searchRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (showSearch) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [showSearch]);

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

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return allProducts;
    
    const query = searchQuery.toLowerCase();
    return allProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.brand.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        p.supplier.toLowerCase().includes(query)
    );
  }, [allProducts, searchQuery]);

  const groupedProducts = useMemo(() => {
    const groups: Record<string, ProductWithSupplier[]> = {};
    
    filteredProducts.forEach((product) => {
      const key = product[groupBy];
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(product);
    });

    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredProducts, groupBy]);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center justify-center py-4 px-4 relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="absolute left-4"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>

          <h1 className="text-xl font-bold">Price List</h1>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSearch((s) => !s)}
            className="absolute right-4"
            aria-label="Toggle search"
          >
            <Search className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Search - hidden by default, shown when search button toggled */}
        {showSearch && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              ref={searchRef}
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-muted border-0 h-12"
            />
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-3">
          <Button
            onClick={() => setGroupBy('category')}
            variant={groupBy === 'category' ? 'default' : 'secondary'}
            className="flex-1"
          >
            Category
          </Button>
          <Button
            onClick={() => setGroupBy('brand')}
            variant={groupBy === 'brand' ? 'default' : 'secondary'}
            className="flex-1"
          >
            Brand
          </Button>
          <Button
            onClick={() => setGroupBy('supplier')}
            variant={groupBy === 'supplier' ? 'default' : 'secondary'}
            className="flex-1"
          >
            Supplier
          </Button>
        </div>

        {/* Grouped Products */}
        <div className="space-y-4">
          {groupedProducts.length === 0 ? (
            <Card className="p-8">
              <p className="text-center text-muted-foreground">
                No products found. Create your first order to get started.
              </p>
            </Card>
          ) : (
            groupedProducts.map(([groupName, products]) => (
              <Card key={groupName} className="overflow-hidden">
                <div className="bg-muted px-4 py-3">
                  <h2 className="font-bold text-sm uppercase tracking-wide">
                    {groupName}
                  </h2>
                </div>
                {/* Desktop table - visible on md and up */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-16 text-xs">S.NO</TableHead>
                        <TableHead className="text-xs">PRODUCT NAME</TableHead>
                        <TableHead className="text-xs">BRAND</TableHead>
                        <TableHead className="text-xs">SUPPLIER</TableHead>
                        <TableHead className="text-xs">COMPATIBILITY</TableHead>
                        <TableHead className="text-right text-xs">PRICE</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product, index) => (
                        <TableRow key={product.id}>
                          <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>{product.brand}</TableCell>
                          <TableCell>{product.supplier}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {product.compatibility || '-'}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ₹{product.price.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile stacked list - visible below md */}
                <div className="md:hidden p-2 space-y-2">
                  {products.map((product, index) => (
                    <div key={product.id} className="bg-muted/20 rounded-lg p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <div className="text-sm text-muted-foreground w-8">{index + 1}</div>
                            <div className="min-w-0">
                              <p className="font-medium truncate">{product.name}</p>
                              <p className="text-sm text-muted-foreground truncate">{product.brand} · {product.supplier}</p>
                              <p className="text-sm text-muted-foreground truncate">{product.compatibility || '-'}</p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right ml-3">
                          <p className="font-medium">₹{product.price.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Floating Action Button with export options */}
      <div className="fixed bottom-24 right-6 z-50">
        <div className="relative">
          <Button
            size="icon"
            className="h-14 w-14 rounded-full shadow-lg"
            onClick={() => setShowShareMenu((s) => !s)}
          >
            <Share2 className="w-6 h-6" />
          </Button>

          {showShareMenu && (
            <div className="absolute right-0 bottom-full mb-4 w-56 bg-popover border border-border rounded-lg shadow-lg p-2">
              <p className="text-sm font-medium px-2 py-1">Export Price List</p>
              <div className="flex flex-col gap-2 mt-2">
                <button
                  className="text-left px-3 py-2 rounded hover:bg-muted/50"
                  onClick={() => {
                    exportToCSV(allProducts);
                    setShowShareMenu(false);
                  }}
                >
                  Download Excel (CSV)
                </button>
                <button
                  className="text-left px-3 py-2 rounded hover:bg-muted/50"
                  onClick={() => {
                    exportToPDF(allProducts);
                    setShowShareMenu(false);
                  }}
                >
                  Download PDF (Print)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function escapeCsv(value: any) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function formatPriceForCsv(price: number) {
  // Keep numeric value but prefix with rupee symbol for readability
  return `₹${price.toFixed(2)}`;
}

function exportToCSV(products: any[]) {
  const headers = ['S.NO', 'PRODUCT NAME', 'BRAND', 'SUPPLIER', 'COMPATIBILITY', 'CATEGORY', 'PRICE', 'ORDER DATE'];
  const rows = products.map((p, i) => [
    i + 1,
    p.name,
    p.brand,
    p.supplier,
    p.compatibility || '-',
    p.category || '-',
    formatPriceForCsv(Number(p.price)),
    new Date(p.orderDate).toLocaleDateString(),
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map(escapeCsv).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `price-list-${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function exportToPDF(products: any[]) {
  // Open a new window and render a printable table, user can Save as PDF via print dialog
  const win = window.open('', '_blank', 'noopener,noreferrer');
  if (!win) {
    alert('Unable to open print window. Please disable popup blockers and try again.');
    return;
  }

  const styles = `
    <style>
      body { font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial; padding: 20px; }
      table { width: 100%; border-collapse: collapse; }
      th, td { padding: 8px 10px; border: 1px solid #e5e7eb; text-align: left; }
      th { background: #f3f4f6; }
      .right { text-align: right; }
    </style>
  `;

  const header = `<h1>Price List</h1><p>Generated on ${new Date().toLocaleString()}</p>`;

  const tableHeader = `
    <tr>
      <th>S.NO</th>
      <th>PRODUCT NAME</th>
      <th>BRAND</th>
      <th>SUPPLIER</th>
      <th>COMPATIBILITY</th>
      <th>CATEGORY</th>
      <th class="right">PRICE</th>
      <th>ORDER DATE</th>
    </tr>
  `;

  const tableRows = products
    .map((p, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${String(p.name || '-')}</td>
        <td>${String(p.brand || '-')}</td>
        <td>${String(p.supplier || '-')}</td>
        <td>${String(p.compatibility || '-')}</td>
        <td>${String(p.category || '-')}</td>
        <td class="right">₹${Number(p.price || 0).toFixed(2)}</td>
        <td>${new Date(p.orderDate).toLocaleDateString()}</td>
      </tr>
    `)
    .join('');

  const html = `<!doctype html><html><head><meta charset="utf-8">${styles}</head><body>${header}<table>${tableHeader}${tableRows}</table><script>window.onload = function(){ setTimeout(() => { window.print(); }, 200); };</script></body></html>`;

  win.document.open();
  win.document.write(html);
  win.document.close();
}

export default PriceList;
