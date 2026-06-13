import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BarChart3, Wallet, TrendingDown, Settings } from 'lucide-react';

const items = [
  { to: '/', icon: LayoutDashboard, label: 'Home' },
  { to: '/margini', icon: BarChart3, label: 'Margini' },
  { to: '/costi', icon: Wallet, label: 'Costi' },
  { to: '/perdite', icon: TrendingDown, label: 'Perdite' },
  { to: '/impostazioni', icon: Settings, label: 'Altro' },
];

export default function BottomNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border z-30 safe-area-bottom">
      <div className="flex items-center justify-around h-14">
        {items.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] transition-colors ${
                isActive ? 'text-primary font-medium' : 'text-text-muted'
              }`
            }
          >
            <item.icon size={20} />
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
