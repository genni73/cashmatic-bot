import { useState, useMemo } from 'react';
import { useCollection } from '../hooks/useFirestore';
import { getCurrentYearMonth, formatCurrency, formatMonth } from '../utils/formatters';
import { calcolaKPI } from '../utils/calculations';
import PeriodSelector from '../components/ui/PeriodSelector';
import { exportVenditeExcel, exportCostiExcel, exportPerditeExcel, exportReportCompleto } from '../services/export';
import { FileSpreadsheet, FileText, TrendingUp, Award, AlertTriangle, Wallet, Download, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';

const reportTypes = [
  {
    id: 'mensile',
    title: 'Report Mensile Completo',
    description: 'Riepilogo completo di vendite, costi, perdite, margini e KPI del mese selezionato. Include grafici e tabelle riassuntive.',
    icon: BarChart3,
    color: 'bg-primary/10 text-primary'
  },
  {
    id: 'aggio',
    title: 'Report Aggio ADM',
    description: 'Dettaglio dell\'aggio sui prodotti di monopolio: tabacchi, valori bollati, gratta e vinci, lotto e giochi. Calcolo aggio lordo e netto.',
    icon: Award,
    color: 'bg-accent/10 text-accent'
  },
  {
    id: 'fiscale',
    title: 'Report Fiscale',
    description: 'Riepilogo per uso fiscale/commercialista: fatturato netto, IVA, costi deducibili, margine operativo. Formato adatto alla contabilità.',
    icon: FileText,
    color: 'bg-success/10 text-success'
  },
  {
    id: 'costi_budget',
    title: 'Costi vs Budget',
    description: 'Confronto tra i costi sostenuti e il budget previsto per categoria. Evidenzia scostamenti e tendenze.',
    icon: Wallet,
    color: 'bg-warning/10 text-warning'
  },
  {
    id: 'perdite',
    title: 'Report Perdite',
    description: 'Analisi dettagliata delle perdite per tipologia: furti, scadenze, ammanchi cassa, danneggiamenti. Include incidenza sul fatturato.',
    icon: AlertTriangle,
    color: 'bg-danger/10 text-danger'
  },
  {
    id: 'vendite',
    title: 'Report Vendite',
    description: 'Dettaglio vendite per categoria, sottocategoria e fonte. Include analisi per operatore e andamento giornaliero.',
    icon: TrendingUp,
    color: 'bg-info/10 text-info'
  }
];

export default function Report() {
  const [period, setPeriod] = useState(getCurrentYearMonth());
  const [exporting, setExporting] = useState(null);
  const { data: vendite, loading: loadingV } = useCollection('vendite', period);
  const { data: costi, loading: loadingC } = useCollection('costi', period);
  const { data: perdite, loading: loadingP } = useCollection('perdite', period);

  const loading = loadingV || loadingC || loadingP;

  const kpi = useMemo(() => calcolaKPI(vendite, costi, perdite), [vendite, costi, perdite]);

  const handleExport = async (reportId, format = 'excel') => {
    setExporting(reportId);
    try {
      switch (reportId) {
        case 'mensile':
          await exportReportCompleto(vendite, costi, perdite, period);
          break;
        case 'aggio':
          await exportVenditeExcel(
            vendite.filter(v => ['tabacchi', 'gratta_vinci', 'lotto', 'superenalotto', 'valori_bollati', '10_e_lotto', 'scommesse'].includes(v.categoria)),
            period,
            'Report_Aggio_ADM'
          );
          break;
        case 'fiscale':
          await exportReportCompleto(vendite, costi, perdite, period, 'fiscale');
          break;
        case 'costi_budget':
          await exportCostiExcel(costi, period, 'Report_Costi_Budget');
          break;
        case 'perdite':
          await exportPerditeExcel(perdite, period);
          break;
        case 'vendite':
          await exportVenditeExcel(vendite, period);
          break;
        default:
          break;
      }
      toast.success('Report esportato con successo');
    } catch (err) {
      toast.error(`Errore nell'esportazione: ${err.message}`);
    } finally {
      setExporting(null);
    }
  };

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
        <h1 className="text-2xl font-bold text-text-primary">Report</h1>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      <div className="card p-4">
        <h3 className="font-semibold text-text-primary mb-2">Riepilogo Periodo: {formatMonth(period)}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-3">
          <div>
            <p className="text-xs text-text-muted">Fatturato</p>
            <p className="text-lg font-bold text-text-primary">{formatCurrency(kpi.totaleVendite)}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Costi</p>
            <p className="text-lg font-bold text-text-primary">{formatCurrency(kpi.totaleCosti)}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Perdite</p>
            <p className="text-lg font-bold text-danger">{formatCurrency(kpi.totalePerdite)}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Utile Netto</p>
            <p className={`text-lg font-bold ${kpi.utileNetto >= 0 ? 'text-success' : 'text-danger'}`}>
              {formatCurrency(kpi.utileNetto)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportTypes.map(report => {
          const Icon = report.icon;
          const isExporting = exporting === report.id;
          return (
            <div key={report.id} className="card p-5 flex flex-col">
              <div className="flex items-start gap-3 mb-3">
                <div className={`p-2.5 rounded-lg ${report.color}`}>
                  <Icon size={22} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-text-primary">{report.title}</h3>
                </div>
              </div>
              <p className="text-sm text-text-secondary mb-4 flex-1">{report.description}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleExport(report.id, 'excel')}
                  disabled={isExporting}
                  className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm py-2"
                >
                  {isExporting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      <FileSpreadsheet size={14} /> Excel
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleExport(report.id, 'csv')}
                  disabled={isExporting}
                  className="btn-secondary flex items-center justify-center gap-2 text-sm py-2 px-3"
                >
                  <Download size={14} /> CSV
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card p-4">
        <h3 className="font-semibold text-text-primary mb-3">Dati Disponibili</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-surface-2 rounded-lg p-3">
            <p className="text-2xl font-bold text-primary">{vendite.length}</p>
            <p className="text-xs text-text-muted mt-1">Vendite registrate</p>
          </div>
          <div className="bg-surface-2 rounded-lg p-3">
            <p className="text-2xl font-bold text-primary">{costi.length}</p>
            <p className="text-xs text-text-muted mt-1">Costi registrati</p>
          </div>
          <div className="bg-surface-2 rounded-lg p-3">
            <p className="text-2xl font-bold text-primary">{perdite.length}</p>
            <p className="text-xs text-text-muted mt-1">Perdite registrate</p>
          </div>
        </div>
      </div>
    </div>
  );
}
