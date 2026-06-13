import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { formatDateTime } from '../../utils/formatters';

export default function SyncStatus({ lastSync, isOnline = true, isSyncing = false }) {
  const statusColor = isSyncing ? 'text-warning' : isOnline ? 'text-success' : 'text-danger';
  const statusText = isSyncing ? 'Sincronizzazione...' : isOnline ? 'Connesso' : 'Non connesso';
  const Icon = isSyncing ? RefreshCw : isOnline ? Wifi : WifiOff;

  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon size={16} className={`${statusColor} ${isSyncing ? 'animate-spin' : ''}`} />
      <span className={statusColor}>{statusText}</span>
      {lastSync && (
        <span className="text-text-muted">| Ultimo sync: {formatDateTime(lastSync)}</span>
      )}
    </div>
  );
}
