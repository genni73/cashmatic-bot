import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatCurrency, formatPercent } from '../../utils/formatters';

export default function KpiCard({ label, value, format = 'currency', change, icon: Icon, color = 'primary' }) {
  const formattedValue = format === 'currency' ? formatCurrency(value)
    : format === 'percent' ? formatPercent(value)
    : typeof value === 'number' ? value.toLocaleString('it-IT') : value;

  const colorMap = {
    primary: 'bg-primary/10 text-primary',
    accent: 'bg-accent/10 text-accent',
    success: 'bg-green-50 text-success',
    danger: 'bg-red-50 text-danger',
    warning: 'bg-amber-50 text-warning',
    info: 'bg-blue-50 text-info'
  };

  return (
    <div className="card p-4 min-w-[180px] flex-1">
      <div className="flex items-start justify-between mb-2">
        <div className={`p-2 rounded-lg ${colorMap[color] || colorMap.primary}`}>
          {Icon && <Icon size={20} />}
        </div>
        {change != null && (
          <TrendBadge value={change} />
        )}
      </div>
      <p className="text-2xl font-bold text-text-primary mt-2">{formattedValue}</p>
      <p className="text-sm text-text-muted mt-1">{label}</p>
    </div>
  );
}

export function TrendBadge({ value }) {
  if (value == null) return null;
  const isPositive = value > 0;
  const isZero = value === 0;
  const Icon = isZero ? Minus : isPositive ? TrendingUp : TrendingDown;
  const color = isZero ? 'text-text-muted bg-gray-100' : isPositive ? 'text-success bg-green-50' : 'text-danger bg-red-50';

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      <Icon size={12} />
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}
