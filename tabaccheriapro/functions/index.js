const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onRequest, onCall } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

initializeApp();
const db = getFirestore();

function getCurrentYearMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

exports.aggiornaAnalytics = onSchedule({
  schedule: "every 60 minutes",
  timeZone: "Europe/Rome",
  region: "europe-west6"
}, async () => {
  const period = getCurrentYearMonth();
  const tabaccherie = await db.collection("tabaccherie").get();

  for (const tabDoc of tabaccherie.docs) {
    const tabId = tabDoc.id;

    try {
      const venditeSnap = await db.collection("tabaccherie").doc(tabId)
        .collection("vendite").doc(period).collection("items").get();
      const costiSnap = await db.collection("tabaccherie").doc(tabId)
        .collection("costi").doc(period).collection("items").get();
      const perditeSnap = await db.collection("tabaccherie").doc(tabId)
        .collection("perdite").doc(period).collection("items").get();

      const vendite = venditeSnap.docs.map(d => d.data());
      const costi = costiSnap.docs.map(d => d.data());
      const perditeList = perditeSnap.docs.map(d => d.data());

      const totaleVendite = vendite.reduce((a, v) => a + (v.importoLordo || 0), 0);
      const totaleCosti = costi.reduce((a, c) => a + (c.importo || 0), 0);
      const totalePerdite = perditeList.reduce((a, p) => a + (p.valorePerdita || 0), 0);
      const margineNetto = totaleVendite - totaleCosti - totalePerdite;
      const margineNettoPerc = totaleVendite > 0 ? (margineNetto / totaleVendite) * 100 : 0;

      const venditePerCategoria = {};
      const costiPerCategoria = {};
      const prodottiMap = {};

      vendite.forEach(v => {
        const cat = v.categoria || "altro";
        venditePerCategoria[cat] = (venditePerCategoria[cat] || 0) + (v.importoLordo || 0);
        const desc = v.descrizione || cat;
        if (!prodottiMap[desc]) prodottiMap[desc] = { vendite: 0, margine: 0 };
        prodottiMap[desc].vendite += v.importoLordo || 0;
        prodottiMap[desc].margine += v.margineEuro || 0;
      });

      costi.forEach(c => {
        const cat = c.categoria || "altro";
        costiPerCategoria[cat] = (costiPerCategoria[cat] || 0) + (c.importo || 0);
      });

      const aggio = vendite
        .filter(v => ["sigarette","sigari","tabacco_sfuso","sigarette_elettroniche","nicotine_pouch","marche_bollo","bolli_auto","ricariche_tp","gratta_vinci","lotto","scommesse"].includes(v.categoria))
        .reduce((a, v) => a + (v.margineEuro || 0), 0);

      const sortedProducts = Object.entries(prodottiMap)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.vendite - a.vendite);

      await db.collection("tabaccherie").doc(tabId)
        .collection("analytics").doc(period).set({
          periodo: period,
          totaleVendite,
          totaleCosti,
          totalePerdite,
          margineNetto,
          margineNettoPerc,
          aggio,
          venditePerCategoria,
          costiPerCategoria,
          topProdotti: sortedProducts.slice(0, 10),
          bottomProdotti: sortedProducts.slice(-10).reverse(),
          lastUpdated: FieldValue.serverTimestamp()
        }, { merge: true });

    } catch (err) {
      console.error(`Error updating analytics for ${tabId}:`, err);
    }
  }
});

exports.inviaAlert = onSchedule({
  schedule: "0 8 * * *",
  timeZone: "Europe/Rome",
  region: "europe-west6"
}, async () => {
  const period = getCurrentYearMonth();
  const tabaccherie = await db.collection("tabaccherie").get();

  for (const tabDoc of tabaccherie.docs) {
    const tabId = tabDoc.id;
    try {
      const analyticsDoc = await db.collection("tabaccherie").doc(tabId)
        .collection("analytics").doc(period).get();

      if (!analyticsDoc.exists) continue;
      const data = analyticsDoc.data();
      const alerts = [];

      if (data.margineNettoPerc < 5) {
        alerts.push({ tipo: "margine_basso", messaggio: `Margine netto basso: ${data.margineNettoPerc.toFixed(1)}%`, urgenza: "alta" });
      }
      if (data.totalePerdite > data.totaleVendite * 0.05) {
        alerts.push({ tipo: "perdite_elevate", messaggio: "Perdite superiori al 5% del fatturato", urgenza: "media" });
      }

      if (alerts.length > 0) {
        await db.collection("tabaccherie").doc(tabId)
          .collection("alerts").doc(period).set({
            alerts,
            lastCheck: FieldValue.serverTimestamp()
          }, { merge: true });
      }
    } catch (err) {
      console.error(`Error checking alerts for ${tabId}:`, err);
    }
  }
});

exports.netfoodWebhook = onRequest({
  region: "europe-west6",
  cors: true
}, async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Method not allowed");
    return;
  }

  const apiKey = req.headers["x-api-key"];
  if (!apiKey) {
    res.status(401).send("Missing API key");
    return;
  }

  try {
    const tabQuery = await db.collection("tabaccherie")
      .where("netfoodApiKey", "==", apiKey).limit(1).get();

    if (tabQuery.empty) {
      res.status(403).send("Invalid API key");
      return;
    }

    const tabId = tabQuery.docs[0].id;
    const transactions = req.body.transactions || [];
    const period = getCurrentYearMonth();
    let imported = 0;

    const batch = db.batch();
    for (const tx of transactions) {
      const docRef = db.collection("tabaccherie").doc(tabId)
        .collection("vendite").doc(period).collection("items").doc();

      batch.set(docRef, {
        data: new Date(tx.data || tx.date),
        fonte: "netfood",
        categoria: tx.categoria || "altro",
        descrizione: tx.descrizione || tx.articolo || "",
        importoLordo: parseFloat(tx.totale || tx.importo || 0),
        quantita: parseInt(tx.quantita || 1),
        prezzoUnitario: parseFloat(tx.prezzo || 0),
        operatore: tx.operatore || "",
        netfoodId: tx.id || `nf_${Date.now()}_${imported}`,
        createdAt: FieldValue.serverTimestamp()
      });
      imported++;
    }

    await batch.commit();

    await db.collection("tabaccherie").doc(tabId)
      .collection("syncLog").add({
        tipo: "webhook",
        dataSync: FieldValue.serverTimestamp(),
        recordImportati: imported,
        stato: "completato"
      });

    res.json({ success: true, imported });
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(500).json({ error: err.message });
  }
});

exports.creaRicorrenze = onSchedule({
  schedule: "0 6 1 * *",
  timeZone: "Europe/Rome",
  region: "europe-west6"
}, async () => {
  const now = new Date();
  const period = getCurrentYearMonth();
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevPeriod = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;

  const tabaccherie = await db.collection("tabaccherie").get();

  for (const tabDoc of tabaccherie.docs) {
    const tabId = tabDoc.id;
    try {
      const costiSnap = await db.collection("tabaccherie").doc(tabId)
        .collection("costi").doc(prevPeriod).collection("items")
        .where("ricorrente", "==", true).get();

      const batch = db.batch();
      let count = 0;

      for (const costoDoc of costiSnap.docs) {
        const costo = costoDoc.data();

        let shouldCreate = false;
        if (costo.periodoRicorrenza === "mensile") shouldCreate = true;
        else if (costo.periodoRicorrenza === "trimestrale" && now.getMonth() % 3 === 0) shouldCreate = true;
        else if (costo.periodoRicorrenza === "annuale" && now.getMonth() === 0) shouldCreate = true;

        if (shouldCreate) {
          const newRef = db.collection("tabaccherie").doc(tabId)
            .collection("costi").doc(period).collection("items").doc();

          batch.set(newRef, {
            ...costo,
            data: now,
            createdAt: FieldValue.serverTimestamp(),
            note: `Generato automaticamente da ricorrenza ${prevPeriod}`
          });
          count++;
        }
      }

      if (count > 0) await batch.commit();
      console.log(`Created ${count} recurring costs for ${tabId}`);
    } catch (err) {
      console.error(`Error creating recurrences for ${tabId}:`, err);
    }
  }
});
