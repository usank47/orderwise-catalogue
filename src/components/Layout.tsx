import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, List, History, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'New Order', icon: ShoppingCart },
    { path: '/price-list', label: 'Price List', icon: List },
    { path: '/order-history', label: 'Order History', icon: History },
  ];

  const isPriceList = location.pathname === '/price-list';

  const handleSearchToggle = () => {
    // dispatch a global event that PriceList listens to
    window.dispatchEvent(new CustomEvent('toggle-search'));
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
              <div className="flex gap-2">
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

              {/* Context-sensitive search button for Price List page */}
              {isPriceList && (
                <button
                  aria-label="Toggle search"
                  onClick={handleSearchToggle}
                  className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-muted-foreground hover:bg-secondary"
                >
                  <Search className="w-5 h-5" />
                </button>
              )}
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
