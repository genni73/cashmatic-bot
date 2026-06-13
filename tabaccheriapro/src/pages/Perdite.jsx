import { useState, useMemo } from 'react';
import { useCollection } from '../hooks/useFirestore';
import { getCurrentYearMonth, formatCurrency, formatDate } from '../utils/formatters';
import { TIPOLOGIE_PERDITE, CATEGORIE_VENDITA } from '../utils/constants';
import KpiCard from '../components/ui/KpiCard';
import PeriodSelector from '../components/ui/PeriodSelector';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import ExportMenu from '../components/ui/ExportMenu';
import { exportPerditeExcel } from '../services/export';
import { Plus, Pencil, Trash2, TrendingDown, AlertTriangle, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

const EMPTY = {
  data: new Date().toISOString().slice(0, 10),
  tipologia: '',
  categoria: '',
  descrizione: '',
  valorePerdita: '',
  quantita: 1,
  rilevato_da: '',
  denunciato: false,
  note: ''
};

export default function Perdite() {
  const [period, setPeriod] = useState(getCurrentYearMonth());
  const { data: perdite, loading, addItem, updateItem, deleteItem } = useCollection('perdite', period);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [filterTipo, setFilterTipo] = useState('tutti');

  const filtered = useMemo(() => {
    if (filterTipo === 'tutti') return perdite;
    return perdite.filter(p => p.tipologia === filterTipo);
  }, [perdite, filterTipo]);

  const totale = useMemo(() => perdite.reduce((a, p) => a + (p.valorePerdita || 0), 0), [perdite]);
  const ammanchi = useMemo(() => perdite.filter(p => p.tipologia === 'ammanchi_cassa').reduce((a, p) => a + (p.valorePerdita || 0), 0), [perdite]);
  const furti = useMemo(() => perdite.filter(p => p.tipologia === 'furto').reduce((a, p) => a + (p.valorePerdita || 0), 0), [perdite]);

  const openAdd = () => {
    setEditItem(null);
    setForm(EMPTY);
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      data: item.data?.toDate ? item.data.toDate().toISOString().slice(0, 10) : item.data?.slice?.(0, 10) || '',
      tipologia: item.tipologia || '',
      categoria: item.categoria || '',
      descrizione: item.descrizione || '',
      valorePerdita: item.valorePerdita || '',
      quantita: item.quantita || 1,
      rilevato_da: item.rilevato_da || '',
      denunciato: item.denunciato || false,
      note: item.note || ''
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const data = {
        data: new Date(form.data),
        tipologia: form.tipologia,
        categoria: form.categoria,
        descrizione: form.descrizione,
        valorePerdita: parseFloat(form.valorePerdita),
        quantita: parseInt(form.quantita) || 1,
        rilevato_da: form.rilevato_da,
        denunciato: form.denunciato,
        note: form.note
      };
      if (editItem) {
        await updateItem(editItem.id, data);
        toast.success('Perdita aggiornata');
      } else {
        await addItem(data);
        toast.success('Perdita registrata');
      }
      setModalOpen(false);
    } catch (err) {
      toast.error('Errore nel salvataggio');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteItem(deleteId);
      toast.success('Perdita eliminata');
      setDeleteId(null);
    } catch (err) {
      toast.error("Errore nell'eliminazione");
    }
  };

  const columns = [
    {
      header: 'Data',
      accessorFn: (row) => formatDate(row.data?.toDate ? row.data.toDate() : new Date(row.data))
    },
    {
      header: 'Tipologia',
      accessorKey: 'tipologia',
      cell: ({ getValue }) => {
        const t = TIPOLOGIE_PERDITE.find(tp => tp.id === getValue());
        return <span className="text-sm font-medium">{t?.label || getValue()}</span>;
      }
    },
    {
      header: 'Categoria',
      accessorKey: 'categoria',
      cell: ({ getValue }) => {
        const c = CATEGORIE_VENDITA.find(cat => cat.id === getValue());
        return c ? c.label : getValue();
      }
    },
    { header: 'Descrizione', accessorKey: 'descrizione' },
    {
      header: 'Valore',
      accessorKey: 'valorePerdita',
      cell: ({ getValue }) => <span className="font-medium text-danger">{formatCurrency(getValue())}</span>
    },
    {
      header: 'Denunciato',
      accessorKey: 'denunciato',
      cell: ({ getValue }) => getValue()
        ? <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Si</span>
        : <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">No</span>
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
        <h1 className="text-2xl font-bold text-text-primary">Perdite</h1>
        <div className="flex items-center gap-3">
          <PeriodSelector value={period} onChange={setPeriod} />
          <ExportMenu onExportExcel={() => exportPerditeExcel(perdite, period)} />
          <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={16} /> Registra Perdita
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard label="Totale Perdite" value={totale} icon={TrendingDown} color="danger" />
        <KpiCard label="Ammanchi Cassa" value={ammanchi} icon={AlertTriangle} color="warning" />
        <KpiCard label="Furti" value={furti} icon={ShieldAlert} color="danger" />
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterTipo('tutti')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            filterTipo === 'tutti' ? 'bg-primary text-white' : 'bg-surface-2 text-text-secondary hover:bg-border'
          }`}
        >
          Tutti
        </button>
        {TIPOLOGIE_PERDITE.map(t => (
          <button
            key={t.id}
            onClick={() => setFilterTipo(t.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterTipo === t.id ? 'bg-primary text-white' : 'bg-surface-2 text-text-secondary hover:bg-border'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="card p-4">
        <DataTable data={filtered} columns={columns} searchPlaceholder="Cerca perdite..." />
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Modifica Perdita' : 'Registra Perdita'} size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Data</label>
              <input type="date" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} className="input-field" required />
            </div>
            <div>
              <label className="label">Tipologia</label>
              <select value={form.tipologia} onChange={e => setForm({ ...form, tipologia: e.target.value })} className="select-field" required>
                <option value="">Seleziona...</option>
                {TIPOLOGIE_PERDITE.map(t => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Categoria Prodotto</label>
              <select value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })} className="select-field">
                <option value="">Seleziona...</option>
                {CATEGORIE_VENDITA.map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Rilevato da</label>
              <input type="text" value={form.rilevato_da} onChange={e => setForm({ ...form, rilevato_da: e.target.value })} className="input-field" />
            </div>
          </div>
          <div>
            <label className="label">Descrizione</label>
            <input type="text" value={form.descrizione} onChange={e => setForm({ ...form, descrizione: e.target.value })} className="input-field" required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Valore Perdita (&#8364;)</label>
              <input type="number" step="0.01" value={form.valorePerdita} onChange={e => setForm({ ...form, valorePerdita: e.target.value })} className="input-field" required />
            </div>
            <div>
              <label className="label">Quantità</label>
              <input type="number" value={form.quantita} onChange={e => setForm({ ...form, quantita: e.target.value })} className="input-field" />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer pb-2">
                <input type="checkbox" checked={form.denunciato} onChange={e => setForm({ ...form, denunciato: e.target.checked })} className="rounded border-border" />
                <span className="text-sm text-text-secondary">Denunciato alle autorità</span>
              </label>
            </div>
          </div>
          <div>
            <label className="label">Note</label>
            <textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} className="input-field" rows={2} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Annulla</button>
            <button type="submit" className="btn-primary">{editItem ? 'Salva Modifiche' : 'Registra Perdita'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        message="Eliminare questa perdita? L'operazione non è reversibile."
      />
    </div>
  );
}
