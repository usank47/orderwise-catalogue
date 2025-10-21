import { useState, useMemo, useRef, useEffect } from 'react';
import { getOrders } from '@/lib/storage';
import { formatDate } from '@/lib/utils';
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
  const headers = ['S.NO', 'PRODUCT NAME', 'BRAND', 'SUPPLIER', 'COMPATIBILITY', 'CATEGORY', 'PRICE', 'ORDER DATE'];
  const rows = products.map((p, i) => [
    i + 1,
    p.name,
    p.brand,
    p.supplier,
    p.compatibility || '-',
    p.category || '-',
    formatPriceForCsv(Number(p.price)),
    formatDate(p.orderDate),
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
  // Try to open print window first (native print). If blocked, fall back to client-side PDF generation using html2canvas + jsPDF.
  const tryOpenPrint = () => {
    try {
      const win = window.open('', '_blank', 'noopener,noreferrer');
      if (!win) return false;

      const styles = `
        <style>
          body { font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial; padding: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 8px 10px; border: 1px solid #e5e7eb; text-align: left; }
          th { background: #f3f4f6; }
          .right { text-align: right; }
        </style>
      `;

      const header = `<h1>Price List</h1><p>Generated on ${formatDate(new Date())}</p>`;

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
            <td>${formatDate(p.orderDate)}</td>
          </tr>
        `)
        .join('');

      const html = `<!doctype html><html><head><meta charset="utf-8">${styles}</head><body>${header}<table>${tableHeader}${tableRows}</table><script>window.onload = function(){ setTimeout(() => { window.print(); }, 200); };</script></body></html>`;

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

  // Fallback: generate PDF client-side
  const loadScript = (src: string) =>
    new Promise<void>((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) return resolve();
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('Failed to load ' + src));
      document.head.appendChild(s);
    });

  try {
    // load html2canvas and jsPDF UMD from multiple CDNs for reliability
    const tryLoad = async (urls: string[]) => {
      for (const u of urls) {
        try {
          // eslint-disable-next-line no-await-in-loop
          await loadScript(u);
          return true;
        } catch (e) {
          // try next
        }
      }
      return false;
    };

    const ok1 = await tryLoad([
      'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
    ]);
    const ok2 = await tryLoad([
      'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    ]);

    if (!ok1 || !ok2) {
      alert('Failed to load PDF libraries from CDN. Please check your network or allow loading external scripts, then try again.');
      return;
    }

    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '800px';
    container.style.padding = '20px';
    container.style.background = '#fff';
    container.innerHTML = (() => {
      const header = `<h1 style="font-size:18px;margin-bottom:8px">Price List</h1><p style="font-size:12px;margin-bottom:12px">Generated on ${formatDate(new Date())}</p>`;
      const tableHeader = `
        <tr>
          <th style="padding:8px 10px;border:1px solid #e5e7eb;background:#f3f4f6">S.NO</th>
          <th style="padding:8px 10px;border:1px solid #e5e7eb;background:#f3f4f6">PRODUCT NAME</th>
          <th style="padding:8px 10px;border:1px solid #e5e7eb;background:#f3f4f6">BRAND</th>
          <th style="padding:8px 10px;border:1px solid #e5e7eb;background:#f3f4f6">SUPPLIER</th>
          <th style="padding:8px 10px;border:1px solid #e5e7eb;background:#f3f4f6">COMPATIBILITY</th>
          <th style="padding:8px 10px;border:1px solid #e5e7eb;background:#f3f4f6">CATEGORY</th>
          <th style="padding:8px 10px;border:1px solid #e5e7eb;background:#f3f4f6">PRICE</th>
          <th style="padding:8px 10px;border:1px solid #e5e7eb;background:#f3f4f6">ORDER DATE</th>
        </tr>
      `;
      const rows = products
        .map((p: any, i: number) => `
          <tr>
            <td style="padding:8px 10px;border:1px solid #e5e7eb">${i + 1}</td>
            <td style="padding:8px 10px;border:1px solid #e5e7eb">${String(p.name || '-')}</td>
            <td style="padding:8px 10px;border:1px solid #e5e7eb">${String(p.brand || '-')}</td>
            <td style="padding:8px 10px;border:1px solid #e5e7eb">${String(p.supplier || '-')}</td>
            <td style="padding:8px 10px;border:1px solid #e5e7eb">${String(p.compatibility || '-')}</td>
            <td style="padding:8px 10px;border:1px solid #e5e7eb">${String(p.category || '-')}</td>
            <td style="padding:8px 10px;border:1px solid #e5e7eb">₹${Number(p.price || 0).toFixed(2)}</td>
            <td style="padding:8px 10px;border:1px solid #e5e7eb">${formatDate(p.orderDate)}</td>
          </tr>
        `)
        .join('');
      return `<div>${header}<table style="width:100%;border-collapse:collapse">${tableHeader}${rows}</table></div>`;
    })();

    document.body.appendChild(container);

    // @ts-ignore
    const html2canvas = (window as any).html2canvas || (window as any).html2canvas?.default;
    const rawJsPdf = (window as any).jsPDF || (window as any).jspdf || (window as any).jspdf?.jsPDF || null;
    const JsPdfConstructor = typeof rawJsPdf === 'function' ? rawJsPdf : (rawJsPdf && rawJsPdf.jsPDF) ? rawJsPdf.jsPDF : null;
    if (!html2canvas || !JsPdfConstructor) {
      alert('Failed to load PDF libraries. Please try again.');
      container.remove();
      return;
    }

    const canvas = await html2canvas(container as HTMLElement, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');

    const pdf = new JsPdfConstructor('p', 'pt', 'a4');
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
