import { CATEGORIE_VENDITA } from './constants';

export function calcolaMargine(importoLordo, costoUnitario, quantita) {
  const costo = (costoUnitario || 0) * (quantita || 1);
  const margineEuro = importoLordo - costo;
  const marginePerc = importoLordo > 0 ? (margineEuro / importoLordo) * 100 : 0;
  return { margineEuro, marginePerc };
}

export function calcolaImportoNetto(importoLordo, ivaPerc) {
  if (!ivaPerc || ivaPerc === 0) return importoLordo;
  return importoLordo / (1 + ivaPerc / 100);
}

export function calcolaAggioCategoria(categoriaId) {
  const cat = CATEGORIE_VENDITA.find(c => c.id === categoriaId);
  return cat ? cat.aggio : 0;
}

export function calcolaAggioTabacchi(vendite) {
  const venditeTabacchi = vendite.filter(v => {
    const cat = CATEGORIE_VENDITA.find(c => c.id === v.categoria);
    return cat && (cat.gruppo === 'Tabacchi' || cat.gruppo === 'Valori Bollati');
  });

  const aggioBrutto = venditeTabacchi.reduce((acc, v) => {
    const cat = CATEGORIE_VENDITA.find(c => c.id === v.categoria);
    const aggio = cat ? cat.aggio : 0;
    return acc + ((v.importoLordo || 0) * aggio / 100);
  }, 0);

  return { aggioBrutto, totaleVenditeADM: venditeTabacchi.reduce((a, v) => a + (v.importoLordo || 0), 0) };
}

export function calcolaKPI(vendite, costi, perdite) {
  const totaleVendite = vendite.reduce((a, v) => a + (v.importoLordo || 0), 0);
  const totaleCosti = costi.reduce((a, c) => a + (c.importo || 0), 0);
  const totalePerdite = perdite.reduce((a, p) => a + (p.valorePerdita || 0), 0);
  const utileNetto = totaleVendite - totaleCosti - totalePerdite;
  const margineNettoPerc = totaleVendite > 0 ? (utileNetto / totaleVendite) * 100 : 0;
  const { aggioBrutto } = calcolaAggioTabacchi(vendite);
  const aggioPerc = totaleVendite > 0 ? (aggioBrutto / totaleVendite) * 100 : 0;
  const breakEven = margineNettoPerc > 0 ? (totaleCosti / margineNettoPerc) * 100 : 0;

  return {
    totaleVendite,
    totaleCosti,
    totalePerdite,
    utileNetto,
    margineNettoPerc,
    aggioBrutto,
    aggioPerc,
    breakEven
  };
}

export function raggruppaPerCategoria(items, field = 'categoria', valueField = 'importoLordo') {
  const grouped = {};
  items.forEach(item => {
    const key = item[field] || 'altro';
    if (!grouped[key]) grouped[key] = 0;
    grouped[key] += item[valueField] || 0;
  });
  return grouped;
}

export function calcolaVariazionePercentuale(attuale, precedente) {
  if (!precedente || precedente === 0) return attuale > 0 ? 100 : 0;
  return ((attuale - precedente) / Math.abs(precedente)) * 100;
}
