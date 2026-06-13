import { useState, useMemo } from 'react';
import { useCollection } from '../hooks/useFirestore';
import { getCurrentYearMonth, formatCurrency, formatPercent, formatNumber } from '../utils/formatters';
import { raggruppaPerCategoria, calcolaAggioTabacchi } from '../utils/calculations';
import { CATEGORIE_VENDITA, GRUPPI_VENDITA } from '../utils/constants';
import KpiCard from '../components/ui/KpiCard';
import PeriodSelector from '../components/ui/PeriodSelector';
import { TrendBadge } from '../components/ui/KpiCard';
import EmptyState from '../components/ui/EmptyState';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Percent, Calculator, BarChart3 } from 'lucide-react';

const COLORS = ['#1B3A5C', '#C8960C', '#16A34A', '#DC2626', '#0284C7', '#D97706', '#7C3AED', '#EC4899', '#14B8A6', '#F97316'];

export default function Margini() {
  const [period, setPeriod] = useState(getCurrentYearMonth());
  const { data: vendite, loading } = useCollection('vendite', period);
  const [simCategoria, setSimCategoria] = useState('');
  const [simVariazione, setSimVariazione] = useState(0);

  const analisiCategorie = useMemo(() => {
    const byCategoria = {};
    vendite.forEach(v => {
      const catId = v.categoria;
      if (!byCategoria[catId]) {
        byCategoria[catId] = { vendite: 0, margine: 0, count: 0 };
      }
      byCategoria[catId].vendite += v.importoLordo || 0;
      byCategoria[catId].margine += v.margineEuro || 0;
      byCategoria[catId].count += 1;
    });

    return Object.entries(byCategoria).map(([catId, data]) => {
      const cat = CATEGORIE_VENDITA.find(c => c.id === catId);
      const marginePerc = data.vendite > 0 ? (data.margine / data.vendite) * 100 : 0;
      return {
        id: catId,
        nome: cat?.label || catId,
        gruppo: cat?.gruppo || 'Altro',
        aggioPerc: cat?.aggioPerc || 0,
        vendite: Math.round(data.vendite * 100) / 100,
        margine: Math.round(data.margine * 100) / 100,
        marginePerc: Math.round(marginePerc * 100) / 100,
        transazioni: data.count
      };
    }).sort((a, b) => b.vendite - a.vendite);
  }, [vendite]);

  const analisiGruppi = useMemo(() => {
    const byGruppo = {};
    analisiCategorie.forEach(c => {
      const g = c.gruppo;
      if (!byGruppo[g]) byGruppo[g] = { vendite: 0, margine: 0 };
      byGruppo[g].vendite += c.vendite;
      byGruppo[g].margine += c.margine;
    });
    return Object.entries(byGruppo).map(([nome, data]) => ({
      nome,
      vendite: Math.round(data.vendite),
      margine: Math.round(data.margine),
      marginePerc: data.vendite > 0 ? Math.round((data.margine / data.vendite) * 10000) / 100 : 0
    })).sort((a, b) => b.margine - a.margine);
  }, [analisiCategorie]);

  const totals = useMemo(() => ({
    vendite: analisiCategorie.reduce((a, c) => a + c.vendite, 0),
    margine: analisiCategorie.reduce((a, c) => a + c.margine, 0),
    marginePerc: (() => {
      const v = analisiCategorie.reduce((a, c) => a + c.vendite, 0);
      const m = analisiCategorie.reduce((a, c) => a + c.margine, 0);
      return v > 0 ? Math.round((m / v) * 10000) / 100 : 0;
    })()
  }), [analisiCategorie]);

  const marginiPieData = useMemo(() => {
    return analisiGruppi
      .filter(g => g.margine > 0)
      .map(g => ({ name: g.nome, value: g.margine }));
  }, [analisiGruppi]);

  const simulazione = useMemo(() => {
    if (!simCategoria || !simVariazione) return null;
    const cat = analisiCategorie.find(c => c.id === simCategoria);
    if (!cat) return null;
    const nuovoPrezzo = cat.vendite * (1 + simVariazione / 100);
    const nuovoMargine = nuovoPrezzo * (cat.aggioPerc / 100);
    const vecchioMargine = cat.margine;
    return {
      categoria: cat.nome,
      vecchioVendite: cat.vendite,
      nuovoVendite: Math.round(nuovoPrezzo * 100) / 100,
      vecchioMargine,
      nuovoMargine: Math.round(nuovoMargine * 100) / 100,
      differenza: Math.round((nuovoMargine - vecchioMargine) * 100) / 100
    };
  }, [simCategoria, simVariazione, analisiCategorie]);

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
        <h1 className="text-2xl font-bold text-text-primary">Analisi Margini</h1>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard label="Totale Vendite" value={totals.vendite} icon={BarChart3} color="primary" />
        <KpiCard label="Margine Totale" value={totals.margine} icon={TrendingUp} color="success" />
        <KpiCard label="Margine Medio %" value={totals.marginePerc} format="percent" icon={Percent} color="accent" />
      </div>

      {analisiCategorie.length === 0 ? (
        <EmptyState title="Nessun dato disponibile" description="Non ci sono vendite per il periodo selezionato." />
      ) : (
        <>
          <div className="card p-4">
            <h3 className="font-semibold text-text-primary mb-4">Margini per Categoria</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 text-text-muted font-medium">Categoria</th>
                    <th className="text-right py-2 px-3 text-text-muted font-medium">Vendite</th>
                    <th className="text-right py-2 px-3 text-text-muted font-medium">Aggio %</th>
                    <th className="text-right py-2 px-3 text-text-muted font-medium">Margine (&#8364;)</th>
                    <th className="text-right py-2 px-3 text-text-muted font-medium">Margine %</th>
                    <th className="text-right py-2 px-3 text-text-muted font-medium">N. Transazioni</th>
                    <th className="text-center py-2 px-3 text-text-muted font-medium">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {analisiCategorie.map((cat, i) => (
                    <tr key={cat.id} className="border-b border-border/50 hover:bg-surface-2 transition-colors">
                      <td className="py-2.5 px-3 font-medium text-text-primary">{cat.nome}</td>
                      <td className="py-2.5 px-3 text-right">{formatCurrency(cat.vendite)}</td>
                      <td className="py-2.5 px-3 text-right">{cat.aggioPerc}%</td>
                      <td className="py-2.5 px-3 text-right font-medium text-success">{formatCurrency(cat.margine)}</td>
                      <td className="py-2.5 px-3 text-right">{cat.marginePerc}%</td>
                      <td className="py-2.5 px-3 text-right">{formatNumber(cat.transazioni)}</td>
                      <td className="py-2.5 px-3 text-center">
                        <TrendBadge value={cat.marginePerc} threshold={10} />
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-primary font-semibold">
                    <td className="py-2.5 px-3">Totale</td>
                    <td className="py-2.5 px-3 text-right">{formatCurrency(totals.vendite)}</td>
                    <td className="py-2.5 px-3 text-right">-</td>
                    <td className="py-2.5 px-3 text-right text-success">{formatCurrency(totals.margine)}</td>
                    <td className="py-2.5 px-3 text-right">{totals.marginePerc}%</td>
                    <td className="py-2.5 px-3 text-right">{formatNumber(vendite.length)}</td>
                    <td className="py-2.5 px-3"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-4">
              <h3 className="font-semibold text-text-primary mb-4">Margini per Gruppo</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analisiGruppi}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="nome" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Legend />
                  <Bar dataKey="vendite" fill="#1B3A5C" name="Vendite" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="margine" fill="#16A34A" name="Margine" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card p-4">
              <h3 className="font-semibold text-text-primary mb-4">Distribuzione Margini</h3>
              {marginiPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={marginiPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} innerRadius={55} paddingAngle={2}>
                      {marginiPieData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => formatCurrency(v)} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-text-muted text-sm text-center py-12">Nessun margine positivo</p>
              )}
            </div>
          </div>

          <div className="card p-4">
            <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Calculator size={18} /> Simulatore Margini
            </h3>
            <p className="text-sm text-text-muted mb-4">
              Simula l'impatto di una variazione di prezzo sul margine di una categoria.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="label">Categoria</label>
                <select
                  value={simCategoria}
                  onChange={e => setSimCategoria(e.target.value)}
                  className="select-field"
                >
                  <option value="">Seleziona categoria...</option>
                  {analisiCategorie.map(c => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Variazione Prezzo %</label>
                <input
                  type="number"
                  step="0.5"
                  value={simVariazione}
                  onChange={e => setSimVariazione(parseFloat(e.target.value) || 0)}
                  className="input-field"
                  placeholder="+5 o -3"
                />
              </div>
              <div className="flex items-end">
                <div className="text-sm text-text-muted">
                  {simVariazione > 0 ? 'Aumento' : simVariazione < 0 ? 'Riduzione' : 'Nessuna variazione'} del {Math.abs(simVariazione)}%
                </div>
              </div>
            </div>
            {simulazione && (
              <div className="bg-surface-2 rounded-lg p-4">
                <h4 className="font-medium text-text-primary mb-3">Risultato Simulazione: {simulazione.categoria}</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-text-muted">Vendite Attuali</p>
                    <p className="font-semibold">{formatCurrency(simulazione.vecchioVendite)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">Vendite Simulate</p>
                    <p className="font-semibold">{formatCurrency(simulazione.nuovoVendite)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">Margine Attuale</p>
                    <p className="font-semibold">{formatCurrency(simulazione.vecchioMargine)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">Margine Simulato</p>
                    <p className="font-semibold">{formatCurrency(simulazione.nuovoMargine)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">Differenza Margine</p>
                    <p className={`font-semibold ${simulazione.differenza >= 0 ? 'text-success' : 'text-danger'}`}>
                      {simulazione.differenza >= 0 ? '+' : ''}{formatCurrency(simulazione.differenza)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
