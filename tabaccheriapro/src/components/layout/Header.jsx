import { Bell, Menu } from 'lucide-react';
import { useTabaccheria } from '../../contexts/TabaccheriaContext';

export default function Header({ onMenuToggle }) {
  const { tabaccheria } = useTabaccheria();

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-border px-4 py-3 flex items-center justify-between lg:px-6">
      <div className="flex items-center gap-3">
        <button onClick={onMenuToggle} className="lg:hidden p-1.5 rounded-lg hover:bg-surface-2">
          <Menu size={22} className="text-text-primary" />
        </button>
        <div className="lg:hidden">
          <h1 className="text-base font-bold text-primary">TabaccheriaPro</h1>
        </div>
        <div className="hidden lg:block">
          <h2 className="text-sm font-medium text-text-secondary">{tabaccheria?.nome || 'La tua tabaccheria'}</h2>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button className="p-2 rounded-lg hover:bg-surface-2 relative">
          <Bell size={20} className="text-text-secondary" />
        </button>
      </div>
    </header>
  );
}
