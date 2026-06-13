import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BarChart3, Wallet, TrendingDown, ShoppingCart, Link2, FileText, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTabaccheria } from '../../contexts/TabaccheriaContext';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/margini', icon: BarChart3, label: 'Analisi Margini' },
  { to: '/costi', icon: Wallet, label: 'Costi' },
  { to: '/perdite', icon: TrendingDown, label: 'Perdite' },
  { to: '/vendite', icon: ShoppingCart, label: 'Vendite' },
  { to: '/netfood', icon: Link2, label: 'Netfood Sync' },
  { to: '/report', icon: FileText, label: 'Report' },
  { to: '/impostazioni', icon: Settings, label: 'Impostazioni' },
];

export default function Sidebar() {
  const { logout, userProfile } = useAuth();
  const { tabaccheria } = useTabaccheria();

  return (
    <aside className="hidden lg:flex flex-col w-60 bg-primary text-white h-screen sticky top-0">
      <div className="p-4 border-b border-white/10">
        <h1 className="text-lg font-bold text-accent-light">TabaccheriaPro</h1>
        <p className="text-[10px] text-white/50 mt-0.5">by G.F. Technological System</p>
        {tabaccheria && (
          <p className="text-xs text-white/70 mt-2 truncate">{tabaccheria.nome}</p>
        )}
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm transition-colors ${
                isActive ? 'bg-white/15 text-accent-light font-medium' : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="text-xs text-white/50 mb-2 truncate">{userProfile?.nome || userProfile?.email}</div>
        <button onClick={logout} className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors w-full">
          <LogOut size={16} /> Esci
        </button>
      </div>
    </aside>
  );
}
