import { useState, useMemo } from 'react';
import { useCollection } from '../hooks/useFirestore';
import { getCurrentYearMonth } from '../utils/formatters';
import { formatCurrency, formatPercent, formatNumber } from '../utils/formatters';
import { calcolaKPI, calcolaAggioTabacchi, raggruppaPerCategoria, calcolaVariazionePercentuale } from '../utils/calculations';
import { CATEGORIE_VENDITA } from '../utils/constants';
import KpiCard from '../components/ui/KpiCard';
import PeriodSelector from '../components/ui/PeriodSelector';
import AlertBanner from '../components/ui/AlertBanner';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Euro, TrendingUp, Wallet, TrendingDown, Award, DollarSign, ArrowUpDown, BarChart3 } from 'lucide-react';

const COLORS = ['#1B3A5C', '#C8960C', '#16A34A', '#DC2626', '#0284C7', '#D97706', '#7C3AED', '#EC4899', '#14B8A6', '#F97316'];

export default function Dashboard() {
  const [period, setPeriod] = useState(getCurrentYearMonth());
  const { data: vendite, loading: loadingV } = useCollection('vendite', period);
  const { data: costi, loading: loadingC } = useCollection('costi', period);
  const { data: perdite, loading: loadingP } = useCollection('perdite', period);

  const loading = loadingV || loadingC || loadingP;

  const kpi = useMemo(() => calcolaKPI(vendite, costi, perdite), [vendite, costi, perdite]);

  const today = new Date();
  const todayStr = today.toDateString();
  const incassoOggi = useMemo(() => {
    return vendite.filter(v => {
      const d = v.data?.toDate ? v.data.toDate() : new Date(v.data);
      return d.toDateString() === todayStr;
    }).reduce((a, v) => a + (v.importoLordo || 0), 0);
  }, [vendite, todayStr]);

  const categorieChart = useMemo(() => {
    const grouped = raggruppaPerCategoria(vendite, 'categoria', 'importoLordo');
    return Object.entries(grouped).map(([key, value]) => {
      const cat = CATEGORIE_VENDITA.find(c => c.id === key);
      return { name: cat?.label || key, value: Math.round(value * 100) / 100 };
    }).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [vendite]);

  const marginiChart = useMemo(() => {
    const grouped = {};
    vendite.forEach(v => {
      const cat = CATEGORIE_VENDITA.find(c => c.id === v.categoria);
      const gruppo = cat?.gruppo || 'Altro';
      if (!grouped[gruppo]) grouped[gruppo] = { vendite: 0, margine: 0 };
      grouped[gruppo].vendite += v.importoLordo || 0;
      grouped[gruppo].margine += v.margineEuro || 0;
    });
    return Object.entries(grouped).map(([name, data]) => ({
      name,
      vendite: Math.round(data.vendite),
      margine: Math.round(data.margine)
    }));
  }, [vendite]);

  const andamentoChart = useMemo(() => {
    const days = {};
    vendite.forEach(v => {
      const d = v.data?.toDate ? v.data.toDate() : new Date(v.data);
      const key = `${d.getDate()}/${d.getMonth() + 1}`;
      if (!days[key]) days[key] = { vendite: 0, costi: 0 };
      days[key].vendite += v.importoLordo || 0;
    });
    costi.forEach(c => {
      const d = c.data?.toDate ? c.data.toDate() : new Date(c.data);
      const key = `${d.getDate()}/${d.getMonth() + 1}`;
      if (!days[key]) days[key] = { vendite: 0, costi: 0 };
      days[key].costi += c.importo || 0;
    });
    return Object.entries(days).map(([giorno, data]) => ({
      giorno,
      vendite: Math.round(data.vendite),
      costi: Math.round(data.costi),
      margine: Math.round(data.vendite - data.costi)
    })).slice(-30);
  }, [vendite, costi]);

  const alerts = useMemo(() => {
    const list = [];
    if (kpi.margineNettoPerc < 5) list.push({ type: 'danger', message: `Margine netto molto basso: ${kpi.margineNettoPerc.toFixed(1)}%` });
    if (kpi.totalePerdite > kpi.totaleVendite * 0.05) list.push({ type: 'warning', message: `Perdite elevate: ${formatCurrency(kpi.totalePerdite)} (>${formatPercent(5)} del fatturato)` });
    const ammanchi = perdite.filter(p => p.tipologia === 'ammanchi_cassa' && (p.valorePerdita || 0) > 50);
    if (ammanchi.length > 0) list.push({ type: 'danger', message: `${ammanchi.length} ammanchi di cassa rilevanti questo mese` });
    return list;
  }, [kpi, perdite]);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      {alerts.map((a, i) => <AlertBanner key={i} type={a.type} message={a.message} />)}

      <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 lg:mx-0 lg:px-0 lg:grid lg:grid-cols-4">
        <KpiCard label="Incasso Oggi" value={incassoOggi} icon={Euro} color="accent" />
        <KpiCard label="Margine Mese" value={kpi.margineNettoPerc} format="percent" icon={TrendingUp} color={kpi.margineNettoPerc >= 10 ? 'success' : 'danger'} />
        <KpiCard label="Costi Mese" value={kpi.totaleCosti} icon={Wallet} color="warning" />
        <KpiCard label="Perdite Mese" value={kpi.totalePerdite} icon={TrendingDown} color="danger" />
        <KpiCard label="Aggio ADM" value={kpi.aggioBrutto} icon={Award} color="info" />
        <KpiCard label="Utile Netto" value={kpi.utileNetto} icon={DollarSign} color={kpi.utileNetto >= 0 ? 'success' : 'danger'} />
        <KpiCard label="Fatturato Mese" value={kpi.totaleVendite} icon={ArrowUpDown} color="primary" />
        <KpiCard label="Break Even" value={kpi.breakEven} icon={BarChart3} color="info" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-4">
          <h3 className="font-semibold text-text-primary mb-4">Andamento Vendite / Costi</h3>
          {andamentoChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={andamentoChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="giorno" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Legend />
                <Line type="monotone" dataKey="vendite" stroke="#1B3A5C" name="Vendite" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="costi" stroke="#DC2626" name="Costi" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="margine" stroke="#16A34A" name="Margine" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-text-muted text-sm text-center py-12">Nessun dato per il periodo selezionato</p>
          )}
        </div>

        <div className="card p-4">
          <h3 className="font-semibold text-text-primary mb-4">Vendite per Categoria</h3>
          {categorieChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={categorieChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={50} paddingAngle={2}>
                  {categorieChart.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-text-muted text-sm text-center py-12">Nessun dato per il periodo selezionato</p>
          )}
        </div>

        <div className="card p-4 lg:col-span-2">
          <h3 className="font-semibold text-text-primary mb-4">Margini per Gruppo</h3>
          {marginiChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={marginiChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Legend />
                <Bar dataKey="vendite" fill="#1B3A5C" name="Vendite" radius={[4, 4, 0, 0]} />
                <Bar dataKey="margine" fill="#C8960C" name="Margine" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-text-muted text-sm text-center py-12">Nessun dato per il periodo selezionato</p>
          )}
        </div>
      </div>
    </div>
  );
}
