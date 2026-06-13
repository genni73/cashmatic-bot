import { useState } from 'react';
import Papa from 'papaparse';
import { CATEGORIE_VENDITA } from '../utils/constants';

const NETFOOD_CATEGORY_MAP = {
  'Tabacchi': 'sigarette',
  'Sigarette': 'sigarette',
  'Sigari': 'sigari',
  'Valori': 'marche_bollo',
  'Valori Bollati': 'marche_bollo',
  'Gratta e Vinci': 'gratta_vinci',
  'Gratta & Vinci': 'gratta_vinci',
  'Lotto': 'lotto',
  'Ricariche': 'ricariche_tel',
  'Giornali': 'giornali',
  'Bar': 'altro',
  'Varie': 'altro',
  'Accessori': 'accendini',
  'Cartoleria': 'cartoleria',
  'Dolciumi': 'caramelle'
};

export function useNetfoodImport() {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const mapCategory = (netfoodReparto, customMapping = {}) => {
    const fullMap = { ...NETFOOD_CATEGORY_MAP, ...customMapping };
    return fullMap[netfoodReparto] || 'altro';
  };

  const parseCSV = (file) => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        encoding: 'UTF-8',
        complete: (results) => resolve(results),
        error: (err) => reject(err)
      });
    });
  };

  const importFile = async (file, addVendita, customMapping = {}) => {
    setImporting(true);
    setError(null);
    setProgress(0);

    try {
      const parsed = await parseCSV(file);

      if (parsed.errors.length > 0) {
        console.warn('CSV parse warnings:', parsed.errors);
      }

      const records = parsed.data;
      const total = records.length;
      let imported = 0;
      let skipped = 0;
      const errors = [];

      for (let i = 0; i < records.length; i++) {
        const row = records[i];
        try {
          const categoria = mapCategory(row['Reparto'] || row['reparto'] || '', customMapping);
          const cat = CATEGORIE_VENDITA.find(c => c.id === categoria);

          const importoLordo = parseFloat((row['Totale'] || row['totale'] || '0').replace(',', '.'));
          const quantita = parseInt(row['Quantità'] || row['quantita'] || row['Qta'] || '1');
          const prezzoUnitario = parseFloat((row['Prezzo'] || row['prezzo'] || '0').replace(',', '.'));

          if (isNaN(importoLordo) || importoLordo === 0) {
            skipped++;
            continue;
          }

          const vendita = {
            data: parseNetfoodDate(row['Data'] || row['data']),
            fonte: 'netfood',
            categoria,
            sottocategoria: '',
            descrizione: row['Articolo'] || row['articolo'] || row['Descrizione'] || '',
            importoLordo,
            ivaPerc: 0,
            importoNetto: importoLordo,
            quantita: quantita || 1,
            prezzoUnitario: prezzoUnitario || importoLordo,
            costoUnitario: cat ? prezzoUnitario * (1 - cat.aggio / 100) : prezzoUnitario,
            margineEuro: cat ? importoLordo * cat.aggio / 100 : 0,
            marginePerc: cat ? cat.aggio : 0,
            netfoodId: row['Codice'] || row['codice'] || `nf_${Date.now()}_${i}`,
            operatore: row['Operatore'] || row['operatore'] || ''
          };

          await addVendita(vendita);
          imported++;
        } catch (err) {
          errors.push({ row: i + 1, error: err.message });
        }
        setProgress(Math.round(((i + 1) / total) * 100));
      }

      const result = { imported, skipped, errors, total };
      setResults(result);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setImporting(false);
    }
  };

  return { importFile, importing, progress, results, error, mapCategory };
}

function parseNetfoodDate(dateStr) {
  if (!dateStr) return new Date();
  // Try DD/MM/YYYY format
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  }
  // Try ISO
  return new Date(dateStr);
}
