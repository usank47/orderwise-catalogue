import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, List, History, Search, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import InstallPWA from './InstallPWA';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const [isSyncing, setIsSyncing] = useState(false);

  const navItems = [
    { path: '/', label: 'Price List', icon: List },
    { path: '/new-order', label: 'New Order', icon: ShoppingCart },
    { path: '/order-history', label: 'Order History', icon: History },
  ];

  const isPriceList = location.pathname === '/';

  const handleSearchToggle = () => {
    // dispatch a global event that PriceList listens to
    window.dispatchEvent(new CustomEvent('toggle-search'));
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const { pushToSupabase } = await import('@/lib/sync');
      const { getOrders } = await import('@/lib/storage');
      const orders = getOrders();
      await pushToSupabase(orders);
      toast.success('Data synced to database successfully!');
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Failed to sync data to database');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-card border-b border-border sticky top-0 z-50 shadow-soft">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              OrderFlow
            </h1>
            <div className="flex items-center gap-2">
              {/* top nav links hidden on small screens to avoid duplication with bottom nav */}
              <div className="hidden md:flex gap-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200',
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-soft'
                          : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{item.label}</span>
                    </Link>
                  );
                })}
              </div>

              {/* Install PWA button */}
              <InstallPWA />

              {/* Sync button */}
              <button
                aria-label="Sync to database"
                onClick={handleManualSync}
                disabled={isSyncing}
                className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-muted-foreground hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={cn("w-5 h-5", isSyncing && "animate-spin")} />
              </button>

              {/* Search button available on all pages; PriceList listens for toggle-search event */}
              <button
                aria-label="Toggle search"
                onClick={handleSearchToggle}
                className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-muted-foreground hover:bg-secondary"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="container mx-auto px-4 py-8 pb-24">{children}</main>

      {/* Bottom navigation for mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-soft md:hidden z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex-1 flex flex-col items-center justify-center py-2 text-xs',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  <Icon className="w-5 h-5 mb-0.5" />
                  <span className="text-[11px] leading-none">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Layout;
