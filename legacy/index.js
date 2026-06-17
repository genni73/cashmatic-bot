const express = require("express");
const axios = require("axios");
const app = express();
app.use(express.json());

// ─── CONFIGURAZIONE ───────────────────────────────────────────
const CONFIG = {
  WHATSAPP_TOKEN: process.env.WHATSAPP_TOKEN,       // Token Meta
  WHATSAPP_PHONE_ID: process.env.WHATSAPP_PHONE_ID, // Phone Number ID (da Meta)
  VERIFY_TOKEN: process.env.VERIFY_TOKEN,           // Token verifica webhook (scegli tu una stringa)
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY, // API Key Anthropic
};

// ─── SYSTEM PROMPT CASHMATIC ───────────────────────────────────
const SYSTEM_PROMPT = `Sei l'assistente virtuale ufficiale di CASHMATIC, azienda italiana leader nelle casse automatiche per il denaro.
Sede: Cashmatic S.p.A. - Via Fondo Ausa, 28 - 47891 Dogana (Repubblica di San Marino)
Sito web: https://cashmatic.it

=== IL TUO TONO ===
Amichevole e diretto. Parli come un consulente esperto ma alla mano: italiano semplice e chiaro, vai subito al punto, ogni tanto usi emoji con moderazione. Niente giri di parole. Risposte brevi e utili, adatte a WhatsApp (non troppo lunghe).

=== I PRODOTTI CASHMATIC ===

LINEA SELFPAY (gestione contante nel punto cassa):
- SelfPay 460: modello compatto entry-level
- SelfPay 860: modello intermedio
- SelfPay 1060: modello avanzato
- SelfPay 1060C: versione con funzionalità aggiuntive
I SelfPay automatizzano la gestione del contante al banco: il cassiere usa la macchina, che gestisce banconote, monete e resto. Zero errori, zero furti interni.

LINEA VISUALPAY (ordini e pagamenti senza operatore — self-checkout):
- VisualPay 22, 27, 32: diversi formati di schermo (pollici)
- VisualPay Double Sided: doppio schermo, cliente e operatore
I VisualPay sono kiosk self-service: il cliente ordina e paga in autonomia. Perfetti per bar, fast food, ristoranti con menu digitale.

INPAY (per GDO e grande distribuzione):
Cassa automatica ad alta capacità per supermercati e grandi superfici. Progettata per gestire volumi elevati di transazioni.

=== I SETTORI ===
Bar e Ristorazione, Alimentari, Retail, Farmacie, Supermercati e GDO, Hospitality (hotel), Servizi.

=== I SERVIZI ===
App MyCashmatic: monitoraggio casse da smartphone, livelli contante, storico movimenti PDF/CSV, alert automatici.
Pannello Web: console per gestire più casse e più punti vendita da browser.
Ciclo chiuso: tracciabilità completa dal pagamento alla banca, collegamento CIT.
Assistenza tecnica: team interno specializzato, interventi in loco e da remoto, manutenzione programmata.

=== PERCHÉ CASHMATIC ===
- Elimina errori di cassa e discrepanze contabili
- Aumenta sicurezza contro rapine, furti interni e banconote false
- Migliora l'igiene (zero contatto diretto con il denaro)
- Velocizza i pagamenti, riduce le code
- Monitoraggio h24 da app e web

=== REGOLE ===
- Rispondi SOLO in italiano
- Risposte brevi adatte a WhatsApp (max 150-200 parole)
- Non inventare prezzi: di' che dipende dal modello e offri preventivo personalizzato
- Per preventivi/contatti: https://cashmatic.it/contatti-cashmatic-e-richiesta-informazioni/
- Per configurare la soluzione: https://cashmatic.it/configuratore-cashmatic/
- Se non sai qualcosa: offri di mettere in contatto con il team
- Chiudi sempre con una domanda o call to action`;

// ─── MEMORIA CONVERSAZIONI (in memoria, si azzera al restart) ───
const conversationHistory = {};

// ─── WEBHOOK VERIFICA (Meta lo chiama una volta per confermare) ─
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === CONFIG.VERIFY_TOKEN) {
    console.log("✅ Webhook verificato da Meta");
    res.status(200).send(challenge);
  } else {
    console.log("❌ Verifica webhook fallita");
    res.sendStatus(403);
  }
});

// ─── WEBHOOK MESSAGGI (Meta manda qui ogni messaggio WhatsApp) ──
app.post("/webhook", async (req, res) => {
  res.sendStatus(200); // Risponde subito a Meta (entro 5 secondi)

  try {
    const body = req.body;
    if (!body?.entry?.[0]?.changes?.[0]?.value?.messages) return;

    const message = body.entry[0].changes[0].value.messages[0];
    const from = message.from; // Numero del mittente
    const text = message.text?.body;

    if (!text) return; // Ignora messaggi non testuali (audio, foto, ecc.)

    console.log(`📩 Messaggio da ${from}: ${text}`);

    // Gestisci storico conversazione
    if (!conversationHistory[from]) conversationHistory[from] = [];
    conversationHistory[from].push({ role: "user", content: text });

    // Mantieni solo gli ultimi 20 messaggi per non sforare i token
    if (conversationHistory[from].length > 20) {
      conversationHistory[from] = conversationHistory[from].slice(-20);
    }

    // Chiama Anthropic
    const aiResponse = await axios.post(
      "https://api.anthropic.com/v1/messages",
      {
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: conversationHistory[from],
      },
      {
        headers: {
          "x-api-key": CONFIG.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
      }
    );

    const reply = aiResponse.data.content[0].text;

    // Salva risposta nel contesto
    conversationHistory[from].push({ role: "assistant", content: reply });

    // Invia risposta su WhatsApp
    await axios.post(
      `https://graph.facebook.com/v18.0/${CONFIG.WHATSAPP_PHONE_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: from,
        type: "text",
        text: { body: reply },
      },
      {
        headers: {
          Authorization: `Bearer ${CONFIG.WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(`✅ Risposta inviata a ${from}`);
  } catch (err) {
    console.error("❌ Errore:", err.response?.data || err.message);
  }
});

// ─── HEALTH CHECK ─────────────────────────────────────────────
app.get("/", (req, res) => {
  res.send("🤖 Cashmatic WhatsApp Bot — Online ✅");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server avviato sulla porta ${PORT}`));
