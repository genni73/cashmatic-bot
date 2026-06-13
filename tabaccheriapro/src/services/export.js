import * as XLSX from 'xlsx';
import { formatCurrency, formatDate, formatPercent } from '../utils/formatters';

export function exportToExcel(data, filename, sheetName = 'Dati') {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportToCSV(data, filename) {
  const ws = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(ws, { FS: ';' });
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${filename}.csv`);
}

export function exportVenditeExcel(vendite, periodo) {
  const data = vendite.map(v => ({
    'Data': formatDate(v.data),
    'Categoria': v.categoria,
    'Descrizione': v.descrizione,
    'Quantità': v.quantita || 1,
    'Importo Lordo': v.importoLordo,
    'IVA %': v.ivaPerc || 0,
    'Importo Netto': v.importoNetto,
    'Margine €': v.margineEuro,
    'Margine %': v.marginePerc,
    'Fonte': v.fonte,
    'Operatore': v.operatore
  }));
  exportToExcel(data, `vendite_${periodo}`, 'Vendite');
}

export function exportCostiExcel(costi, periodo) {
  const data = costi.map(c => ({
    'Data': formatDate(c.data),
    'Tipologia': c.tipologia,
    'Categoria': c.categoria,
    'Descrizione': c.descrizione,
    'Importo': c.importo,
    'IVA %': c.ivaPerc || 0,
    'Importo Netto': c.importoNetto,
    'Fornitore': c.fornitore,
    'Ricorrente': c.ricorrente ? 'Sì' : 'No'
  }));
  exportToExcel(data, `costi_${periodo}`, 'Costi');
}

export function exportPerditeExcel(perdite, periodo) {
  const data = perdite.map(p => ({
    'Data': formatDate(p.data),
    'Tipologia': p.tipologia,
    'Categoria': p.categoria,
    'Descrizione': p.descrizione,
    'Valore Perdita': p.valorePerdita,
    'Quantità': p.quantita || 1,
    'Rilevato da': p.rilevato_da,
    'Denunciato': p.denunciato ? 'Sì' : 'No',
    'Note': p.note
  }));
  exportToExcel(data, `perdite_${periodo}`, 'Perdite');
}

export function exportReportCompleto(vendite, costi, perdite, periodo) {
  const wb = XLSX.utils.book_new();

  const venditeData = vendite.map(v => ({
    'Data': formatDate(v.data), 'Categoria': v.categoria, 'Descrizione': v.descrizione,
    'Importo': v.importoLordo, 'Margine €': v.margineEuro, 'Margine %': v.marginePerc
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(venditeData), 'Vendite');

  const costiData = costi.map(c => ({
    'Data': formatDate(c.data), 'Tipologia': c.tipologia, 'Categoria': c.categoria,
    'Descrizione': c.descrizione, 'Importo': c.importo
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(costiData), 'Costi');

  const perditeData = perdite.map(p => ({
    'Data': formatDate(p.data), 'Tipologia': p.tipologia, 'Descrizione': p.descrizione,
    'Valore': p.valorePerdita
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(perditeData), 'Perdite');

  XLSX.writeFile(wb, `report_completo_${periodo}.xlsx`);
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
