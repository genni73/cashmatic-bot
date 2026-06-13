import { useState, useRef, useEffect } from 'react';
import { Download, FileSpreadsheet, FileText, ChevronDown } from 'lucide-react';

export default function ExportMenu({ onExportExcel, onExportCSV, onExportPDF }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="btn-secondary flex items-center gap-2 text-sm">
        <Download size={16} /> Esporta <ChevronDown size={14} />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-border z-20 py-1">
          {onExportExcel && (
            <button onClick={() => { onExportExcel(); setOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-surface-2">
              <FileSpreadsheet size={16} className="text-success" /> Excel (.xlsx)
            </button>
          )}
          {onExportCSV && (
            <button onClick={() => { onExportCSV(); setOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-surface-2">
              <FileText size={16} className="text-info" /> CSV (.csv)
            </button>
          )}
          {onExportPDF && (
            <button onClick={() => { onExportPDF(); setOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-surface-2">
              <FileText size={16} className="text-danger" /> PDF
            </button>
          )}
        </div>
      )}
    </div>
  );
}
