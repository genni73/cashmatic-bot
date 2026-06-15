# CLAUDE.md — Cashmatic WhatsApp Bot

## Panoramica
Bot WhatsApp per l'assistenza clienti di Cashmatic (azienda di casse automatiche). Riceve messaggi via webhook Meta/WhatsApp, genera risposte con Claude (Anthropic) e le invia al cliente.

## Stack tecnologico
- **Runtime:** Node.js >= 18
- **Framework:** Express 4
- **HTTP client:** Axios
- **Dev:** Nodemon (hot reload)
- **AI:** Anthropic Claude API (modello `claude-sonnet-4-20250514`)
- **Messaggistica:** WhatsApp Business API (Meta Graph API v18.0)

## Struttura del progetto
```
index.js        — Entry point unico: server Express, webhook WhatsApp, chiamata Anthropic, invio risposta
package.json    — Dipendenze e script npm
```

L'architettura e' volutamente monolitica: un singolo file `index.js` gestisce tutto il flusso.

## Come eseguire in locale
```bash
npm install
# Impostare le variabili d'ambiente (vedi sezione sotto)
npm start        # produzione
npm run dev      # sviluppo con hot reload (nodemon)
```

Il server ascolta su `PORT` (default 3000). Per ricevere i webhook Meta in locale serve un tunnel (es. ngrok).

## Deploy
Il progetto e' pensato per piattaforme PaaS (Render, Railway, Heroku, ecc.):
1. Push del repo sulla piattaforma
2. Configurare le variabili d'ambiente
3. Build command: `npm install`
4. Start command: `npm start`
5. Registrare l'URL pubblico come webhook nell'app Meta/WhatsApp Business

## API e servizi esterni
- **WhatsApp Business API (Meta):** ricezione messaggi tramite webhook (`GET /webhook` per verifica, `POST /webhook` per messaggi) e invio risposte tramite Graph API
- **Anthropic Claude API:** generazione risposte AI (`POST https://api.anthropic.com/v1/messages`)

## Variabili d'ambiente
| Variabile | Descrizione |
|---|---|
| `WHATSAPP_TOKEN` | Token di accesso dell'app Meta per WhatsApp |
| `WHATSAPP_PHONE_ID` | Phone Number ID dall'app Meta |
| `VERIFY_TOKEN` | Stringa segreta scelta per la verifica del webhook |
| `ANTHROPIC_API_KEY` | API key di Anthropic per Claude |
| `PORT` | Porta del server (opzionale, default `3000`) |

## Convenzioni e pattern
- **Lingua:** codice e commenti in italiano
- **Configurazione:** variabili d'ambiente lette in un oggetto `CONFIG` all'inizio di `index.js`
- **Memoria conversazioni:** storico in-memory (`conversationHistory` Map per numero di telefono), limitato a 20 messaggi per utente, si azzera al restart
- **System prompt:** definito come costante `SYSTEM_PROMPT` con personalita', catalogo prodotti e regole di risposta
- **Risposte webhook:** il server risponde subito 200 a Meta e processa il messaggio in modo asincrono
- **Endpoint:** `GET /` health check, `GET /webhook` verifica Meta, `POST /webhook` ricezione messaggi

## Comandi principali
```bash
npm install      # Installa dipendenze
npm start        # Avvia il server
npm run dev      # Avvia in sviluppo con nodemon
```
