import { useState, useMemo } from 'react';
import { useCollection } from '../hooks/useFirestore';
import { getCurrentYearMonth, formatCurrency, formatDate, formatNumber } from '../utils/formatters';
import { calcolaImportoNetto } from '../utils/calculations';
import { CATEGORIE_VENDITA, GRUPPI_VENDITA } from '../utils/constants';
import KpiCard from '../components/ui/KpiCard';
import PeriodSelector from '../components/ui/PeriodSelector';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import CategoryBadge from '../components/ui/CategoryBadge';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import ExportMenu from '../components/ui/ExportMenu';
import EmptyState from '../components/ui/EmptyState';
import { exportVenditeExcel } from '../services/export';
import { Plus, Pencil, Trash2, ShoppingBag, TrendingUp, Hash, Layers } from 'lucide-react';
import toast from 'react-hot-toast';

const EMPTY_VENDITA = {
  data: new Date().toISOString().slice(0, 10),
  categoria: '',
  sottocategoria: '',
  descrizione: '',
  importoLordo: '',
  ivaPerc: 22,
  quantita: 1,
  prezzoUnitario: '',
  marginePerc: '',
  fonte: 'manuale',
  operatore: '',
  note: ''
};

export default function Vendite() {
  const [period, setPeriod] = useState(getCurrentYearMonth());
  const { data: vendite, loading, addItem, updateItem, deleteItem } = useCollection('vendite', period);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState(EMPTY_VENDITA);
  const [filterCategoria, setFilterCategoria] = useState('tutti');
  const [filterFonte, setFilterFonte] = useState('tutti');

  const filtered = useMemo(() => {
    let result = vendite;
    if (filterCategoria !== 'tutti') {
      result = result.filter(v => v.categoria === filterCategoria);
    }
    if (filterFonte !== 'tutti') {
      result = result.filter(v => v.fonte === filterFonte);
    }
    return result;
  }, [vendite, filterCategoria, filterFonte]);

  const totals = useMemo(() => ({
    totale: vendite.reduce((a, v) => a + (v.importoLordo || 0), 0),
    transazioni: vendite.length,
    margine: vendite.reduce((a, v) => a + (v.margineEuro || 0), 0),
    manuali: vendite.filter(v => v.fonte === 'manuale').length,
    netfood: vendite.filter(v => v.fonte === 'netfood').length
  }), [vendite]);

  const openAdd = () => {
    setEditItem(null);
    setForm(EMPTY_VENDITA);
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      data: item.data?.toDate ? item.data.toDate().toISOString().slice(0, 10) : item.data?.slice?.(0, 10) || '',
      categoria: item.categoria || '',
      sottocategoria: item.sottocategoria || '',
      descrizione: item.descrizione || '',
      importoLordo: item.importoLordo || '',
      ivaPerc: item.ivaPerc ?? 22,
      quantita: item.quantita || 1,
      prezzoUnitario: item.prezzoUnitario || '',
      marginePerc: item.marginePerc || '',
      fonte: item.fonte || 'manuale',
      operatore: item.operatore || '',
      note: item.note || ''
    });
    setModalOpen(true);
  };

  const handleCategoriaChange = (catId) => {
    const cat = CATEGORIE_VENDITA.find(c => c.id === catId);
    setForm({
      ...form,
      categoria: catId,
      marginePerc: cat?.aggioPerc || form.marginePerc,
      ivaPerc: cat?.ivaDefault ?? form.ivaPerc
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const importoLordo = parseFloat(form.importoLordo);
      const ivaPerc = parseFloat(form.ivaPerc) || 0;
      const marginePerc = parseFloat(form.marginePerc) || 0;
      const importoNetto = calcolaImportoNetto(importoLordo, ivaPerc);
      const margineEuro = importoLordo * (marginePerc / 100);

      const venditaData = {
        data: new Date(form.data),
        categoria: form.categoria,
        sottocategoria: form.sottocategoria,
        descrizione: form.descrizione,
        importoLordo,
        ivaPerc,
        importoNetto,
        quantita: parseInt(form.quantita) || 1,
        prezzoUnitario: parseFloat(form.prezzoUnitario) || importoLordo,
        marginePerc,
        margineEuro,
        fonte: form.fonte,
        operatore: form.operatore,
        note: form.note
      };

      if (editItem) {
        await updateItem(editItem.id, venditaData);
        toast.success('Vendita aggiornata');
      } else {
        await addItem(venditaData);
        toast.success('Vendita registrata');
      }
      setModalOpen(false);
    } catch (err) {
      toast.error('Errore nel salvataggio');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteItem(deleteId);
      toast.success('Vendita eliminata');
      setDeleteId(null);
    } catch (err) {
      toast.error("Errore nell'eliminazione");
    }
  };

  const gruppiCategorie = useMemo(() => {
    const groups = {};
    CATEGORIE_VENDITA.forEach(c => {
      const g = c.gruppo || 'Altro';
      if (!groups[g]) groups[g] = [];
      groups[g].push(c);
    });
    return groups;
  }, []);

  const columns = [
    {
      header: 'Data',
      accessorFn: (row) => formatDate(row.data?.toDate ? row.data.toDate() : new Date(row.data)),
      sortingFn: (a, b) => {
        const da = a.original.data?.toDate ? a.original.data.toDate() : new Date(a.original.data);
        const db = b.original.data?.toDate ? b.original.data.toDate() : new Date(b.original.data);
        return da - db;
      }
    },
    {
      header: 'Categoria',
      accessorKey: 'categoria',
      cell: ({ getValue }) => <CategoryBadge categoryId={getValue()} type="vendita" />
    },
    { header: 'Descrizione', accessorKey: 'descrizione' },
    {
      header: 'Qtà',
      accessorKey: 'quantita',
      cell: ({ getValue }) => formatNumber(getValue() || 1)
    },
    {
      header: 'Lordo',
      accessorKey: 'importoLordo',
      cell: ({ getValue }) => <span className="font-medium">{formatCurrency(getValue())}</span>
    },
    {
      header: 'Netto',
      accessorKey: 'importoNetto',
      cell: ({ getValue }) => formatCurrency(getValue())
    },
    {
      header: 'Margine',
      accessorKey: 'margineEuro',
      cell: ({ getValue, row }) => (
        <span className="text-success font-medium">
          {formatCurrency(getValue())} ({row.original.marginePerc || 0}%)
        </span>
      )
    },
    {
      header: 'Fonte',
      accessorKey: 'fonte',
      cell: ({ getValue }) => (
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          getValue() === 'netfood' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
        }`}>
          {getValue() === 'netfood' ? 'Netfood' : 'Manuale'}
        </span>
      )
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
        <h1 className="text-2xl font-bold text-text-primary">Vendite</h1>
        <div className="flex items-center gap-3">
          <PeriodSelector value={period} onChange={setPeriod} />
          <ExportMenu onExportExcel={() => exportVenditeExcel(vendite, period)} />
          <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={16} /> Nuova Vendita
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Totale Vendite" value={totals.totale} icon={ShoppingBag} color="primary" />
        <KpiCard label="N. Transazioni" value={totals.transazioni} format="number" icon={Hash} color="info" />
        <KpiCard label="Margine Totale" value={totals.margine} icon={TrendingUp} color="success" />
        <KpiCard label="Fonti" value={`${totals.manuali} man. / ${totals.netfood} NF`} format="text" icon={Layers} color="accent" />
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-muted">Categoria:</span>
          <select
            value={filterCategoria}
            onChange={e => setFilterCategoria(e.target.value)}
            className="select-field w-auto text-sm"
          >
            <option value="tutti">Tutte</option>
            {CATEGORIE_VENDITA.map(c => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-muted">Fonte:</span>
          <select
            value={filterFonte}
            onChange={e => setFilterFonte(e.target.value)}
            className="select-field w-auto text-sm"
          >
            <option value="tutti">Tutte</option>
            <option value="manuale">Manuale</option>
            <option value="netfood">Netfood</option>
          </select>
        </div>
      </div>

      <div className="card p-4">
        {filtered.length > 0 ? (
          <DataTable data={filtered} columns={columns} searchPlaceholder="Cerca vendite..." />
        ) : (
          <EmptyState
            title="Nessuna vendita trovata"
            description="Non ci sono vendite per il periodo e i filtri selezionati."
            actionLabel="Aggiungi Vendita"
            onAction={openAdd}
          />
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Modifica Vendita' : 'Nuova Vendita'} size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Data</label>
              <input type="date" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} className="input-field" required />
            </div>
            <div>
              <label className="label">Categoria</label>
              <select value={form.categoria} onChange={e => handleCategoriaChange(e.target.value)} className="select-field" required>
                <option value="">Seleziona...</option>
                {Object.entries(gruppiCategorie).map(([gruppo, cats]) => (
                  <optgroup key={gruppo} label={gruppo}>
                    {cats.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Sottocategoria</label>
              <input type="text" value={form.sottocategoria} onChange={e => setForm({ ...form, sottocategoria: e.target.value })} className="input-field" placeholder="Opzionale" />
            </div>
            <div>
              <label className="label">Operatore</label>
              <input type="text" value={form.operatore} onChange={e => setForm({ ...form, operatore: e.target.value })} className="input-field" placeholder="Nome operatore" />
            </div>
          </div>
          <div>
            <label className="label">Descrizione</label>
            <input type="text" value={form.descrizione} onChange={e => setForm({ ...form, descrizione: e.target.value })} className="input-field" placeholder="Descrizione della vendita" required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="label">Importo Lordo (&#8364;)</label>
              <input type="number" step="0.01" value={form.importoLordo} onChange={e => setForm({ ...form, importoLordo: e.target.value })} className="input-field" required />
            </div>
            <div>
              <label className="label">IVA %</label>
              <input type="number" value={form.ivaPerc} onChange={e => setForm({ ...form, ivaPerc: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="label">Quantità</label>
              <input type="number" value={form.quantita} onChange={e => setForm({ ...form, quantita: e.target.value })} className="input-field" min="1" />
            </div>
            <div>
              <label className="label">Prezzo Unitario (&#8364;)</label>
              <input type="number" step="0.01" value={form.prezzoUnitario} onChange={e => setForm({ ...form, prezzoUnitario: e.target.value })} className="input-field" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Margine / Aggio %</label>
              <input type="number" step="0.01" value={form.marginePerc} onChange={e => setForm({ ...form, marginePerc: e.target.value })} className="input-field" />
              {form.marginePerc && form.importoLordo && (
                <p className="text-xs text-text-muted mt-1">
                  Margine stimato: {formatCurrency(parseFloat(form.importoLordo) * (parseFloat(form.marginePerc) / 100))}
                </p>
              )}
            </div>
            <div>
              <label className="label">Fonte</label>
              <select value={form.fonte} onChange={e => setForm({ ...form, fonte: e.target.value })} className="select-field">
                <option value="manuale">Manuale</option>
                <option value="netfood">Netfood</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Note</label>
            <textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} className="input-field" rows={2} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Annulla</button>
            <button type="submit" className="btn-primary">{editItem ? 'Salva Modifiche' : 'Registra Vendita'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        message="Eliminare questa vendita? L'operazione non è reversibile."
      />
    </div>
  );
}
