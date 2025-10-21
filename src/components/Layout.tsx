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
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
};

export default Layout;
