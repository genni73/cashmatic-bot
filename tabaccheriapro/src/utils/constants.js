export const CATEGORIE_VENDITA = [
  { id: "sigarette", label: "Sigarette", aggio: 10.0, gruppo: "Tabacchi" },
  { id: "sigari", label: "Sigari", aggio: 10.0, gruppo: "Tabacchi" },
  { id: "tabacco_sfuso", label: "Tabacco Sfuso/Pipa", aggio: 10.0, gruppo: "Tabacchi" },
  { id: "sigarette_elettroniche", label: "Sigarette Elettroniche", aggio: 10.0, gruppo: "Tabacchi" },
  { id: "nicotine_pouch", label: "Nicotine Pouch", aggio: 10.0, gruppo: "Tabacchi" },
  { id: "marche_bollo", label: "Marche da Bollo", aggio: 8.0, gruppo: "Valori Bollati" },
  { id: "bolli_auto", label: "Bollo Auto/Moto", aggio: 0.9, gruppo: "Valori Bollati" },
  { id: "ricariche_tp", label: "Ricariche TP/Carte", aggio: 1.5, gruppo: "Valori Bollati" },
  { id: "gratta_vinci", label: "Gratta & Vinci", aggio: 8.0, gruppo: "Valori Bollati" },
  { id: "lotto", label: "Lotto/SuperEnalotto", aggio: 6.0, gruppo: "Valori Bollati" },
  { id: "scommesse", label: "Scommesse Sportive", aggio: 5.0, gruppo: "Valori Bollati" },
  { id: "ricariche_tel", label: "Ricariche Telefoniche", aggio: 4.0, gruppo: "Servizi" },
  { id: "ricariche_prepagata", label: "Carte Prepagate", aggio: 2.5, gruppo: "Servizi" },
  { id: "postepay", label: "Postepay/Bancomat", aggio: 1.0, gruppo: "Servizi" },
  { id: "pagamenti_utenze", label: "Pagamento Utenze", aggio: 1.2, gruppo: "Servizi" },
  { id: "f24_tributi", label: "F24/Tributi", aggio: 0.8, gruppo: "Servizi" },
  { id: "spedizioni", label: "Spedizioni/Posta", aggio: 8.0, gruppo: "Servizi" },
  { id: "foto_servizi", label: "Foto/Fototessere", aggio: 85.0, gruppo: "Servizi" },
  { id: "giornali", label: "Giornali/Riviste", aggio: 18.0, gruppo: "Editoria" },
  { id: "libri", label: "Libri", aggio: 12.0, gruppo: "Editoria" },
  { id: "accendini", label: "Accendini/Accessori", aggio: 35.0, gruppo: "Accessori" },
  { id: "caramelle", label: "Caramelle/Dolciumi", aggio: 25.0, gruppo: "Accessori" },
  { id: "cartoleria", label: "Cartoleria/Gadget", aggio: 30.0, gruppo: "Accessori" },
  { id: "altro", label: "Altro", aggio: 0, gruppo: "Altro" }
];

export const CATEGORIE_COSTI = [
  { id: "affitto", label: "Affitto Locale", tipologia: "fisso" },
  { id: "stipendi", label: "Stipendi/Collaboratori", tipologia: "fisso" },
  { id: "contributi", label: "Contributi INPS/INAIL", tipologia: "fisso" },
  { id: "utilities_luce", label: "Energia Elettrica", tipologia: "fisso" },
  { id: "utilities_gas", label: "Gas", tipologia: "fisso" },
  { id: "internet_tel", label: "Internet/Telefonia", tipologia: "fisso" },
  { id: "assicurazioni", label: "Assicurazioni", tipologia: "fisso" },
  { id: "leasing", label: "Leasing/Noleggio Attrezzature", tipologia: "fisso" },
  { id: "commercialista", label: "Commercialista/Consulenze", tipologia: "fisso" },
  { id: "canone_sw", label: "Canoni Software/SaaS", tipologia: "fisso" },
  { id: "acquisto_merce", label: "Acquisto Merce (Logista/ADM)", tipologia: "variabile" },
  { id: "acquisto_giornali", label: "Acquisto Giornali/Riviste", tipologia: "variabile" },
  { id: "acquisto_altro", label: "Acquisto Altro", tipologia: "variabile" },
  { id: "commissioni", label: "Commissioni Bancarie/POS", tipologia: "variabile" },
  { id: "trasporti", label: "Trasporti/Spedizioni", tipologia: "variabile" },
  { id: "manutenzione", label: "Manutenzione/Riparazioni", tipologia: "variabile" },
  { id: "marketing", label: "Marketing/Pubblicità", tipologia: "variabile" },
  { id: "sanzioni", label: "Sanzioni/Multe", tipologia: "straordinario" },
  { id: "ristrutturazione", label: "Ristrutturazione", tipologia: "straordinario" },
  { id: "altro_straord", label: "Altro Straordinario", tipologia: "straordinario" }
];

export const TIPOLOGIE_PERDITE = [
  { id: "furto", label: "Furto" },
  { id: "scadenza", label: "Prodotti Scaduti" },
  { id: "danneggiamento", label: "Danneggiamento" },
  { id: "reso", label: "Reso/Storno" },
  { id: "ammanchi_cassa", label: "Ammanchi di Cassa" },
  { id: "altro", label: "Altro" }
];

export const GRUPPI_VENDITA = ["Tabacchi", "Valori Bollati", "Servizi", "Editoria", "Accessori", "Altro"];

export const RUOLI = [
  { id: "admin", label: "Amministratore" },
  { id: "operatore", label: "Operatore" },
  { id: "contabile", label: "Contabile" }
];
