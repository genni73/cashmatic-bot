import { useState, useMemo } from 'react';
import { useCollection } from '../hooks/useFirestore';
import { getCurrentYearMonth, formatCurrency, formatDate } from '../utils/formatters';
import { calcolaImportoNetto } from '../utils/calculations';
import { CATEGORIE_COSTI } from '../utils/constants';
import KpiCard from '../components/ui/KpiCard';
import PeriodSelector from '../components/ui/PeriodSelector';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import CategoryBadge from '../components/ui/CategoryBadge';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import ExportMenu from '../components/ui/ExportMenu';
import { exportCostiExcel } from '../services/export';
import { Plus, Pencil, Trash2, Wallet, ArrowDownCircle, ArrowUpCircle, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const EMPTY_COSTO = {
  data: new Date().toISOString().slice(0, 10),
  tipologia: 'fisso',
  categoria: '',
  descrizione: '',
  importo: '',
  ivaPerc: 22,
  fornitore: '',
  scadenza: '',
  ricorrente: false,
  periodoRicorrenza: null,
  note: ''
};

export default function Costi() {
  const [period, setPeriod] = useState(getCurrentYearMonth());
  const { data: costi, loading, addItem, updateItem, deleteItem } = useCollection('costi', period);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState(EMPTY_COSTO);
  const [filterTipo, setFilterTipo] = useState('tutti');

  const filteredCosti = useMemo(() => {
    if (filterTipo === 'tutti') return costi;
    return costi.filter(c => c.tipologia === filterTipo);
  }, [costi, filterTipo]);

  const totals = useMemo(() => ({
    fissi: costi.filter(c => c.tipologia === 'fisso').reduce((a, c) => a + (c.importo || 0), 0),
    variabili: costi.filter(c => c.tipologia === 'variabile').reduce((a, c) => a + (c.importo || 0), 0),
    straordinari: costi.filter(c => c.tipologia === 'straordinario').reduce((a, c) => a + (c.importo || 0), 0),
    totale: costi.reduce((a, c) => a + (c.importo || 0), 0)
  }), [costi]);

  const openAdd = () => {
    setEditItem(null);
    setForm(EMPTY_COSTO);
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      data: item.data?.toDate ? item.data.toDate().toISOString().slice(0, 10) : item.data?.slice?.(0, 10) || '',
      tipologia: item.tipologia || 'fisso',
      categoria: item.categoria || '',
      descrizione: item.descrizione || '',
      importo: item.importo || '',
      ivaPerc: item.ivaPerc ?? 22,
      fornitore: item.fornitore || '',
      scadenza: item.scadenza?.toDate ? item.scadenza.toDate().toISOString().slice(0, 10) : item.scadenza || '',
      ricorrente: item.ricorrente || false,
      periodoRicorrenza: item.periodoRicorrenza || null,
      note: item.note || ''
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const importo = parseFloat(form.importo);
      const ivaPerc = parseFloat(form.ivaPerc) || 0;
      const costoData = {
        data: new Date(form.data),
        tipologia: form.tipologia,
        categoria: form.categoria,
        descrizione: form.descrizione,
        importo,
        ivaPerc,
        importoNetto: calcolaImportoNetto(importo, ivaPerc),
        fornitore: form.fornitore,
        scadenza: form.scadenza ? new Date(form.scadenza) : null,
        ricorrente: form.ricorrente,
        periodoRicorrenza: form.ricorrente ? form.periodoRicorrenza : null,
        note: form.note
      };

      if (editItem) {
        await updateItem(editItem.id, costoData);
        toast.success('Costo aggiornato');
      } else {
        await addItem(costoData);
        toast.success('Costo aggiunto');
      }
      setModalOpen(false);
    } catch (err) {
      toast.error('Errore nel salvataggio');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteItem(deleteId);
      toast.success('Costo eliminato');
      setDeleteId(null);
    } catch (err) {
      toast.error("Errore nell'eliminazione");
    }
  };

  const columns = [
    {
      header: 'Data',
      accessorFn: (row) => {
        const d = row.data?.toDate ? row.data.toDate() : new Date(row.data);
        return formatDate(d);
      },
      sortingFn: (a, b) => {
        const da = a.original.data?.toDate ? a.original.data.toDate() : new Date(a.original.data);
        const db = b.original.data?.toDate ? b.original.data.toDate() : new Date(b.original.data);
        return da - db;
      }
    },
    {
      header: 'Categoria',
      accessorKey: 'categoria',
      cell: ({ getValue }) => <CategoryBadge categoryId={getValue()} type="costo" />
    },
    { header: 'Descrizione', accessorKey: 'descrizione' },
    {
      header: 'Importo',
      accessorKey: 'importo',
      cell: ({ getValue }) => <span className="font-medium">{formatCurrency(getValue())}</span>
    },
    {
      header: 'IVA %',
      accessorKey: 'ivaPerc',
      cell: ({ getValue }) => `${getValue() || 0}%`
    },
    {
      header: 'Netto',
      accessorKey: 'importoNetto',
      cell: ({ getValue }) => formatCurrency(getValue())
    },
    {
      header: 'Azioni',
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <button onClick={() => openEdit(row.original)} className="p-1.5 rounded hover:bg-surface-2">
            <Pencil size={15} className="text-text-muted" />
          </button>
          <button onClick={() => setDeleteId(row.original.id)} className="p-1.5 rounded hover:bg-red-50">
            <Trash2 size={15} className="text-danger" />
          </button>
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-text-primary">Costi</h1>
        <div className="flex items-center gap-3">
          <PeriodSelector value={period} onChange={setPeriod} />
          <ExportMenu onExportExcel={() => exportCostiExcel(costi, period)} />
          <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={16} /> Nuovo Costo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Costi Fissi" value={totals.fissi} icon={ArrowDownCircle} color="info" />
        <KpiCard label="Costi Variabili" value={totals.variabili} icon={ArrowUpCircle} color="warning" />
        <KpiCard label="Straordinari" value={totals.straordinari} icon={AlertTriangle} color="danger" />
        <KpiCard label="Totale Costi" value={totals.totale} icon={Wallet} color="primary" />
      </div>

      <div className="flex gap-2">
        {[
          { id: 'tutti', label: 'Tutti' },
          { id: 'fisso', label: 'Fissi' },
          { id: 'variabile', label: 'Variabili' },
          { id: 'straordinario', label: 'Straordinari' }
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilterTipo(f.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterTipo === f.id ? 'bg-primary text-white' : 'bg-surface-2 text-text-secondary hover:bg-border'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="card p-4">
        <DataTable data={filteredCosti} columns={columns} searchPlaceholder="Cerca costi..." />
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Modifica Costo' : 'Nuovo Costo'} size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Data</label>
              <input type="date" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} className="input-field" required />
            </div>
            <div>
              <label className="label">Tipologia</label>
              <select value={form.tipologia} onChange={e => setForm({ ...form, tipologia: e.target.value, categoria: '' })} className="select-field">
                <option value="fisso">Fisso</option>
                <option value="variabile">Variabile</option>
                <option value="straordinario">Straordinario</option>
              </select>
            </div>
            <div>
              <label className="label">Categoria</label>
              <select value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })} className="select-field" required>
                <option value="">Seleziona...</option>
                {CATEGORIE_COSTI.filter(c => c.tipologia === form.tipologia).map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Fornitore</label>
              <input type="text" value={form.fornitore} onChange={e => setForm({ ...form, fornitore: e.target.value })} className="input-field" placeholder="Nome fornitore" />
            </div>
          </div>
          <div>
            <label className="label">Descrizione</label>
            <input type="text" value={form.descrizione} onChange={e => setForm({ ...form, descrizione: e.target.value })} className="input-field" placeholder="Descrizione del costo" required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Importo (&#8364;)</label>
              <input type="number" step="0.01" value={form.importo} onChange={e => setForm({ ...form, importo: e.target.value })} className="input-field" required />
            </div>
            <div>
              <label className="label">IVA %</label>
              <input type="number" value={form.ivaPerc} onChange={e => setForm({ ...form, ivaPerc: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="label">Scadenza</label>
              <input type="date" value={form.scadenza} onChange={e => setForm({ ...form, scadenza: e.target.value })} className="input-field" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.ricorrente} onChange={e => setForm({ ...form, ricorrente: e.target.checked })} className="rounded border-border" />
              <span className="text-sm text-text-secondary">Costo ricorrente</span>
            </label>
            {form.ricorrente && (
              <select value={form.periodoRicorrenza || ''} onChange={e => setForm({ ...form, periodoRicorrenza: e.target.value })} className="select-field w-auto">
                <option value="mensile">Mensile</option>
                <option value="trimestrale">Trimestrale</option>
                <option value="annuale">Annuale</option>
              </select>
            )}
          </div>
          <div>
            <label className="label">Note</label>
            <textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} className="input-field" rows={2} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Annulla</button>
            <button type="submit" className="btn-primary">{editItem ? 'Salva Modifiche' : 'Aggiungi Costo'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        message="Eliminare questo costo? L'operazione non è reversibile."
      />
    </div>
  );
}
