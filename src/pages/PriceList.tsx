import { useState, useMemo, useRef, useEffect } from 'react';
import { getOrders } from '@/lib/storage';
import { formatDate, formatDateTime } from '@/lib/utils';
import { Product } from '@/types/order';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Share2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
// pdf generation libs (bundled)
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

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

  useEffect(() => {
    const onToggle = () => setShowSearch((s) => !s);
    window.addEventListener('toggle-search', onToggle as EventListener);
    return () => window.removeEventListener('toggle-search', onToggle as EventListener);
  }, []);

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
          <h1 className="text-xl font-bold">Price List</h1>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Search - controlled by top nav toggle (context-sensitive) */}
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
                      <div className="flex items-center">
                        <div className="flex-shrink-0 text-sm text-muted-foreground w-8">{index + 1}</div>

                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{product.name}</p>
                          <p className="text-sm text-muted-foreground truncate">{product.brand} · {product.supplier}</p>
                        </div>

                        <div className="flex-shrink-0 px-3">
                          <p className="text-sm text-muted-foreground truncate max-w-[90px]">{product.compatibility || '-'}</p>
                        </div>

                        <div className="flex-shrink-0 ml-3 text-right">
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
  const headers = ['S.NO', 'PRODUCT NAME', 'BRAND', 'SUPPLIER', 'COMPATIBILITY', 'CATEGORY', 'ORDER DATE', 'PRICE'];
  const rows = products.map((p, i) => [
    i + 1,
    p.name,
    p.brand,
    p.supplier,
    p.compatibility || '-',
    p.category || '-',
    formatDate(p.orderDate),
    formatPriceForCsv(Number(p.price)),
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

async function exportToPDF(products: any[]) {
  // Try to open print window first (native print). If blocked, fall back to client-side PDF generation using bundled html2canvas + jsPDF.
  const tryOpenPrint = () => {
    try {
      const win = window.open('', '_blank', 'noopener,noreferrer');
      if (!win) return false;

      const styles = `
        <style>
          :root { --muted: #f3f4f6; --muted-2: #eef6fb; --text-muted: #6b7280; --border: #e6e9ed; }
          body { font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial; background: #f7fafc; margin:0; padding:20px 12px; color:#111827 }
          .pdf-wrapper { display:flex; justify-content:center; }
          .pdf-container { background:#fff; width:920px; border-radius:10px; padding:18px; box-shadow: 0 2px 8px rgba(16,24,40,0.06); border:1px solid var(--border); }
          .top-row { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; }
          .title { font-size:18px; font-weight:700; letter-spacing:0.2px }
          .exported { font-size:12px; color:var(--text-muted) }
          .category { margin-top:14px }
          .category-header { background:var(--muted-2); padding:10px 12px; border-radius:6px; margin-bottom:8px; font-weight:700; color:#111827; font-size:13px }
          table { width:100%; border-collapse:separate; border-spacing:0; background:transparent }
          thead th { text-align:left; font-size:12px; color:#374151; padding:12px 14px; background:var(--muted); border-bottom:1px solid var(--border); text-transform:uppercase; letter-spacing:0.6px }
          tbody td { padding:12px 14px; border-bottom:1px solid var(--border); font-size:13px }
          tbody tr:nth-child(even) td { background:#fff }
          tbody tr:nth-child(odd) td { background:#fbfdff }
          .right { text-align:right; }
          .page-footer { text-align:center; margin-top:20px; color:#9aa0a6; font-size:12px }
        </style>
      `;

      const header = `<div class="top-row"><div class="title">OrderFlow</div><div class="exported">Exported on: ${formatDateTime(new Date())}</div></div>`;

      const tableHeader = `
        <tr>
          <th style="width:48px">S. No.</th>
          <th>Product Name</th>
          <th>Brand</th>
          <th>Supplier</th>
          <th>Compatibility</th>
          <th class="right">Price</th>
        </tr>
      `;

      // Group by category to mimic app layout
      const grouped: Record<string, any[]> = {};
      products.forEach((p: any) => {
        const cat = String(p.category || 'Uncategorized');
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(p);
      });

      const tableRowsAll = Object.entries(grouped)
        .map(([cat, items]) => {
          const categoryRow = `
            <tr>
              <td colspan="6" style="padding:10px 14px;background:var(--muted-2);font-weight:700;border-bottom:1px solid var(--border)">Category: ${cat}</td>
            </tr>
          `;

          const rows = items
            .map((p: any, i: number) => `
              <tr class="table-row">
                <td style="padding:10px 14px">${i + 1}</td>
                <td style="padding:10px 14px"><strong>${String(p.name || '-')}</strong></td>
                <td style="padding:10px 14px">${String(p.brand || '-')}</td>
                <td style="padding:10px 14px">${String(p.supplier || '-')}</td>
                <td style="padding:10px 14px">${String(p.compatibility || '-')}</td>
                <td class="right" style="padding:10px 14px">₹${Number(p.price || 0).toFixed(2)}</td>
              </tr>
            `)
            .join('');

          return categoryRow + rows;
        })
        .join('<tr style="height:12px"><td colspan="6"></td></tr>');

      const sections = `<table style="width:100%;border-collapse:collapse">${tableHeader}${tableRowsAll}</table>`;

      const footer = `<div class="page-footer">Page 1 of 1</div>`;

      const html = `<!doctype html><html><head><meta charset="utf-8">${styles}</head><body><div class="pdf-wrapper"><div class="pdf-container">${header}${sections}${footer}</div></div></body></html>`;

      win.document.open();
      win.document.write(html);
      win.document.close();
      return true;
    } catch (e) {
      return false;
    }
  };

  const opened = tryOpenPrint();
  if (opened) return;

  // Fallback: generate PDF client-side using bundled libs
  try {
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '800px';
    container.style.padding = '20px';
    container.style.background = '#fff';

    // Build same HTML as print path
    const tableHeader = `
      <tr>
        <th style="width:48px;text-align:left;font-size:12px;color:#374151;padding:12px 14px;background:#f3f4f6;border-bottom:1px solid #e6e9ed;text-transform:uppercase;letter-spacing:0.6px">S. No.</th>
        <th style="text-align:left;font-size:12px;color:#374151;padding:12px 14px;background:#f3f4f6;border-bottom:1px solid #e6e9ed;text-transform:uppercase;letter-spacing:0.6px">Product Name</th>
        <th style="text-align:left;font-size:12px;color:#374151;padding:12px 14px;background:#f3f4f6;border-bottom:1px solid #e6e9ed;text-transform:uppercase;letter-spacing:0.6px">Brand</th>
        <th style="text-align:left;font-size:12px;color:#374151;padding:12px 14px;background:#f3f4f6;border-bottom:1px solid #e6e9ed;text-transform:uppercase;letter-spacing:0.6px">Supplier</th>
        <th style="text-align:left;font-size:12px;color:#374151;padding:12px 14px;background:#f3f4f6;border-bottom:1px solid #e6e9ed;text-transform:uppercase;letter-spacing:0.6px">Compatibility</th>
        <th style="text-align:right;font-size:12px;color:#374151;padding:12px 14px;background:#f3f4f6;border-bottom:1px solid #e6e9ed;text-transform:uppercase;letter-spacing:0.6px">Price</th>
      </tr>
    `;

    const grouped: Record<string, any[]> = {};
    products.forEach((p: any) => {
      const cat = String(p.category || 'Uncategorized');
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(p);
    });

    const tableRowsAll = Object.entries(grouped)
      .map(([cat, items]) => {
        const categoryRow = `
          <tr>
            <td colspan="6" style="padding:10px 14px;background:#eef6fb;font-weight:700;border-bottom:1px solid #e6e9ed">Category: ${cat}</td>
          </tr>
        `;

        const rows = items
          .map((p: any, i: number) => `
            <tr>
              <td style="padding:10px 14px">${i + 1}</td>
              <td style="padding:10px 14px"><strong>${String(p.name || '-')}</strong></td>
              <td style="padding:10px 14px">${String(p.brand || '-')}</td>
              <td style="padding:10px 14px">${String(p.supplier || '-')}</td>
              <td style="padding:10px 14px">${String(p.compatibility || '-')}</td>
              <td style="padding:10px 14px;text-align:right">₹${Number(p.price || 0).toFixed(2)}</td>
            </tr>
          `)
          .join('');

        return categoryRow + rows;
      })
      .join('<tr style="height:12px"><td colspan="6"></td></tr>');

    const sections = `<table style="width:100%;border-collapse:collapse">${tableHeader}${tableRowsAll}</table>`;

    container.innerHTML = `
      <div style="font-family:system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial; color:#111827">
        <div style="max-width:920px;margin:0 auto;background:#fff;border-radius:10px;padding:18px;border:1px solid #e6e9ed;box-shadow:0 2px 8px rgba(16,24,40,0.06)">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
            <div style="font-size:18px;font-weight:700">OrderFlow</div>
            <div style="font-size:12px;color:#6b7280">Exported on: ${formatDateTime(new Date())}</div>
          </div>
          ${sections}
          <div style="text-align:center;margin-top:18px;color:#9aa0a6;font-size:12px">Page 1 of 1</div>
        </div>
      </div>`;

    document.body.appendChild(container);

    // use imported html2canvas and jsPDF
    // @ts-ignore
    const canvas = await (await import('html2canvas')).default(container as HTMLElement, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    // @ts-ignore
    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF('p', 'pt', 'a4');

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const imgScaledWidth = imgWidth * ratio;
    const imgScaledHeight = imgHeight * ratio;

    pdf.addImage(imgData, 'PNG', 0, 0, imgScaledWidth, imgScaledHeight);
    pdf.save(`price-list-${new Date().toISOString().slice(0,10)}.pdf`);

    container.remove();
  } catch (err) {
    console.error(err);
    alert('Failed to generate PDF. Please try again or allow popups for print.');
  }
}

export default PriceList;
