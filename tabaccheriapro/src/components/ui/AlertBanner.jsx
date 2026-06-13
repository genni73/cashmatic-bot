import { AlertTriangle, AlertCircle, CheckCircle, Info, X } from 'lucide-react';

const variants = {
  warning: { icon: AlertTriangle, bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800', iconColor: 'text-amber-500' },
  danger: { icon: AlertCircle, bg: 'bg-red-50 border-red-200', text: 'text-red-800', iconColor: 'text-red-500' },
  success: { icon: CheckCircle, bg: 'bg-green-50 border-green-200', text: 'text-green-800', iconColor: 'text-green-500' },
  info: { icon: Info, bg: 'bg-blue-50 border-blue-200', text: 'text-blue-800', iconColor: 'text-blue-500' }
};

export default function AlertBanner({ type = 'info', message, onDismiss }) {
  const v = variants[type] || variants.info;
  const Icon = v.icon;

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border ${v.bg}`}>
      <Icon size={18} className={v.iconColor} />
      <span className={`flex-1 text-sm ${v.text}`}>{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className={`p-0.5 rounded ${v.text} hover:opacity-70`}>
          <X size={16} />
        </button>
      )}
    </div>
  );
}
