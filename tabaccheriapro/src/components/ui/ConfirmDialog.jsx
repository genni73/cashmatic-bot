import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title = 'Conferma', message = 'Sei sicuro?', confirmLabel = 'Elimina', danger = true }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="flex flex-col items-center text-center py-2">
        <div className={`p-3 rounded-full mb-3 ${danger ? 'bg-red-50' : 'bg-amber-50'}`}>
          <AlertTriangle size={24} className={danger ? 'text-danger' : 'text-warning'} />
        </div>
        <p className="text-text-secondary mb-6">{message}</p>
        <div className="flex gap-3 w-full">
          <button onClick={onClose} className="btn-secondary flex-1">Annulla</button>
          <button onClick={() => { onConfirm(); onClose(); }} className={`flex-1 px-4 py-2 rounded-lg font-medium text-white transition-colors ${danger ? 'bg-danger hover:bg-red-700' : 'bg-warning hover:bg-amber-600'}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
