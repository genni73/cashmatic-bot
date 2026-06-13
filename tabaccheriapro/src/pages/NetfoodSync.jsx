import { useState, useMemo, useCallback } from 'react';
import { useNetfoodImport } from '../hooks/useNetfood';
import { useCollection } from '../hooks/useFirestore';
import { useTabaccheria } from '../contexts/TabaccheriaContext';
import { formatDate, formatCurrency } from '../utils/formatters';
import { CATEGORIE_VENDITA } from '../utils/constants';
import SyncStatus from '../components/ui/SyncStatus';
import DataTable from '../components/ui/DataTable';
import EmptyState from '../components/ui/EmptyState';
import { Upload, RefreshCw, FileSpreadsheet, CheckCircle, XCircle, Clock, AlertTriangle, ArrowRight, Settings } from 'lucide-react';
import toast from 'react-hot-toast';

const DEFAULT_MAPPING = {
  'TABACCHI': 'tabacchi',
  'GRATTA E VINCI': 'gratta_vinci',
  'LOTTO': 'lotto',
  'SUPERENALOTTO': 'superenalotto',
  'VALORI BOLLATI': 'valori_bollati',
  'RICARICHE': 'ricariche_telefoniche',
  'BAR': 'bar_consumazioni',
  'ALIMENTARI': 'alimentari',
  'BEVANDE': 'bevande',
  'CARTOLERIA': 'cartoleria',
  'GIORNALI': 'giornali_riviste',
  'SERVIZI': 'servizi_pagamento'
};

export default function NetfoodSync() {
  const { tabaccheria } = useTabaccheria();
  const { importCSV, importFromApi, loading: importLoading, progress } = useNetfoodImport();
  const { data: syncLogs } = useCollection('sync_logs');
  const [csvFile, setCsvFile] = useState(null);
  const [mapping, setMapping] = useState(DEFAULT_MAPPING);
  const [editingMapping, setEditingMapping] = useState(false);

  const hasApiConfig = tabaccheria?.netfoodEndpoint && tabaccheria?.netfoodApiKey;

  const lastSync = useMemo(() => {
    if (!syncLogs.length) return null;
    const sorted = [...syncLogs].sort((a, b) => {
      const da = a.data?.toDate ? a.data.toDate() : new Date(a.data);
      const db = b.data?.toDate ? b.data.toDate() : new Date(b.data);
      return db - da;
    });
    return sorted[0];
  }, [syncLogs]);

  const recentLogs = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return syncLogs
      .filter(log => {
        const d = log.data?.toDate ? log.data.toDate() : new Date(log.data);
        return d >= sevenDaysAgo;
      })
      .sort((a, b) => {
        const da = a.data?.toDate ? a.data.toDate() : new Date(a.data);
        const db = b.data?.toDate ? b.data.toDate() : new Date(b.data);
        return db - da;
      });
  }, [syncLogs]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && (file.name.endsWith('.csv') || file.name.endsWith('.xlsx'))) {
      setCsvFile(file);
    } else {
      toast.error('Seleziona un file CSV o Excel valido');
    }
  };

  const handleImportCSV = async () => {
    if (!csvFile) {
      toast.error('Seleziona un file da importare');
      return;
    }
    try {
      const result = await importCSV(csvFile, mapping);
      toast.success(`Importate ${result.imported} vendite da Netfood`);
      setCsvFile(null);
    } catch (err) {
      toast.error(`Errore nell'importazione: ${err.message}`);
    }
  };

  const handleSyncApi = async () => {
    if (!hasApiConfig) {
      toast.error('Configura endpoint e API Key nelle Impostazioni');
      return;
    }
    try {
      const result = await importFromApi();
      toast.success(`Sincronizzate ${result.imported} vendite da Netfood`);
    } catch (err) {
      toast.error(`Errore nella sincronizzazione: ${err.message}`);
    }
  };

  const updateMapping = (netfoodKey, tabaccheriaValue) => {
    setMapping(prev => ({ ...prev, [netfoodKey]: tabaccheriaValue }));
  };

  const logColumns = [
    {
      header: 'Data/Ora',
      accessorFn: (row) => {
        const d = row.data?.toDate ? row.data.toDate() : new Date(row.data);
        return d.toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      }
    },
    {
      header: 'Tipo',
      accessorKey: 'tipo',
      cell: ({ getValue }) => (
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          getValue() === 'api' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
        }`}>
          {getValue() === 'api' ? 'API' : 'CSV'}
        </span>
      )
    },
    {
      header: 'Stato',
      accessorKey: 'stato',
      cell: ({ getValue }) => {
        const stato = getValue();
        if (stato === 'completato') return <span className="flex items-center gap-1 text-success text-sm"><CheckCircle size={14} /> Completato</span>;
        if (stato === 'errore') return <span className="flex items-center gap-1 text-danger text-sm"><XCircle size={14} /> Errore</span>;
        return <span className="flex items-center gap-1 text-warning text-sm"><Clock size={14} /> In corso</span>;
      }
    },
    {
      header: 'Righe Importate',
      accessorKey: 'righeImportate',
      cell: ({ getValue }) => getValue() || 0
    },
    {
      header: 'Totale Importato',
      accessorKey: 'totaleImportato',
      cell: ({ getValue }) => getValue() ? formatCurrency(getValue()) : '-'
    },
    {
      header: 'Note',
      accessorKey: 'note',
      cell: ({ getValue }) => <span className="text-sm text-text-muted">{getValue() || '-'}</span>
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-text-primary">Sincronizzazione Netfood</h1>
        {hasApiConfig && (
          <button
            onClick={handleSyncApi}
            disabled={importLoading}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <RefreshCw size={16} className={importLoading ? 'animate-spin' : ''} />
            Sincronizza Ora
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-4">
          <h3 className="text-sm font-medium text-text-muted mb-2">Stato Connessione</h3>
          <SyncStatus connected={!!hasApiConfig} lastSync={lastSync?.data} />
          {!hasApiConfig && (
            <p className="text-xs text-warning mt-2 flex items-center gap-1">
              <AlertTriangle size={12} /> Configura API nelle Impostazioni
            </p>
          )}
        </div>
        <div className="card p-4">
          <h3 className="text-sm font-medium text-text-muted mb-2">Ultima Sincronizzazione</h3>
          {lastSync ? (
            <div>
              <p className="text-lg font-semibold text-text-primary">
                {formatDate(lastSync.data?.toDate ? lastSync.data.toDate() : new Date(lastSync.data))}
              </p>
              <p className="text-sm text-text-secondary">
                {lastSync.righeImportate || 0} righe - {lastSync.stato === 'completato' ? 'Completato' : lastSync.stato}
              </p>
            </div>
          ) : (
            <p className="text-text-muted">Nessuna sincronizzazione effettuata</p>
          )}
        </div>
        <div className="card p-4">
          <h3 className="text-sm font-medium text-text-muted mb-2">Totale Importato (7gg)</h3>
          <p className="text-lg font-semibold text-text-primary">
            {formatCurrency(recentLogs.reduce((a, l) => a + (l.totaleImportato || 0), 0))}
          </p>
          <p className="text-sm text-text-secondary">
            {recentLogs.filter(l => l.stato === 'completato').length} sincronizzazioni riuscite
          </p>
        </div>
      </div>

      <div className="card p-4">
        <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Upload size={18} /> Importazione CSV / Excel
        </h3>
        <div className="space-y-4">
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
            <FileSpreadsheet size={40} className="mx-auto text-text-muted mb-3" />
            <p className="text-sm text-text-secondary mb-3">
              Carica il file delle vendite esportato da Netfood (formato CSV o XLSX)
            </p>
            <input
              type="file"
              accept=".csv,.xlsx"
              onChange={handleFileChange}
              className="hidden"
              id="csv-upload"
            />
            <label htmlFor="csv-upload" className="btn-secondary cursor-pointer inline-flex items-center gap-2">
              <Upload size={16} /> Seleziona File
            </label>
            {csvFile && (
              <p className="text-sm text-success mt-2">
                <CheckCircle size={14} className="inline mr-1" />
                {csvFile.name} ({(csvFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          {importLoading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">Importazione in corso...</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <div className="w-full bg-border rounded-full h-2.5">
                <div
                  className="bg-primary h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {csvFile && !importLoading && (
            <button onClick={handleImportCSV} className="btn-primary flex items-center gap-2">
              <Upload size={16} /> Importa Dati
            </button>
          )}
        </div>
      </div>

      <div className="card p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-text-primary flex items-center gap-2">
            <Settings size={18} /> Mappatura Categorie
          </h3>
          <button
            onClick={() => setEditingMapping(!editingMapping)}
            className="btn-secondary text-sm"
          >
            {editingMapping ? 'Chiudi' : 'Modifica'}
          </button>
        </div>
        <p className="text-sm text-text-muted mb-4">
          Associa i reparti di Netfood alle categorie di TabaccheriaPro per un'importazione corretta.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 text-text-muted font-medium">Reparto Netfood</th>
                <th className="text-center py-2 px-3 text-text-muted font-medium w-12"></th>
                <th className="text-left py-2 px-3 text-text-muted font-medium">Categoria TabaccheriaPro</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(mapping).map(([netfoodKey, tabValue]) => {
                const cat = CATEGORIE_VENDITA.find(c => c.id === tabValue);
                return (
                  <tr key={netfoodKey} className="border-b border-border/50">
                    <td className="py-2.5 px-3 font-medium">{netfoodKey}</td>
                    <td className="py-2.5 px-3 text-center"><ArrowRight size={14} className="text-text-muted mx-auto" /></td>
                    <td className="py-2.5 px-3">
                      {editingMapping ? (
                        <select
                          value={tabValue}
                          onChange={e => updateMapping(netfoodKey, e.target.value)}
                          className="select-field text-sm"
                        >
                          <option value="">Non mappato</option>
                          {CATEGORIE_VENDITA.map(c => (
                            <option key={c.id} value={c.id}>{c.label}</option>
                          ))}
                        </select>
                      ) : (
                        <span className={cat ? 'text-text-primary' : 'text-warning'}>
                          {cat?.label || 'Non mappato'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card p-4">
        <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Clock size={18} /> Log Sincronizzazioni (ultimi 7 giorni)
        </h3>
        {recentLogs.length > 0 ? (
          <DataTable data={recentLogs} columns={logColumns} searchPlaceholder="Cerca nei log..." />
        ) : (
          <EmptyState
            title="Nessun log di sincronizzazione"
            description="I log verranno mostrati qui dopo la prima importazione."
          />
        )}
      </div>
    </div>
  );
}
