import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { formatMonth } from '../../utils/formatters';

export default function PeriodSelector({ value, onChange }) {
  const navigateMonth = (direction) => {
    const [year, month] = value.split('-').map(Number);
    const date = new Date(year, month - 1 + direction, 1);
    const newValue = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    onChange(newValue);
  };

  return (
    <div className="flex items-center gap-2">
      <button onClick={() => navigateMonth(-1)} className="p-1.5 rounded-lg hover:bg-surface-2 transition-colors">
        <ChevronLeft size={18} className="text-text-secondary" />
      </button>
      <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-2 rounded-lg min-w-[160px] justify-center">
        <Calendar size={16} className="text-text-muted" />
        <span className="font-medium text-sm text-text-primary">{formatMonth(value)}</span>
      </div>
      <button onClick={() => navigateMonth(1)} className="p-1.5 rounded-lg hover:bg-surface-2 transition-colors">
        <ChevronRight size={18} className="text-text-secondary" />
      </button>
    </div>
  );
}
