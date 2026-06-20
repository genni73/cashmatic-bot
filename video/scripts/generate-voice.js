/**
 * Genera la voce stile Siri per il video TikTok Cashmatic.
 *
 * Opzione A (gratis): Google TTS via gTTS CLI
 *   pip install gTTS
 *   node scripts/generate-voice.js
 *
 * Opzione B (qualità pro): ElevenLabs API
 *   - Vai su elevenlabs.io, prendi l'API key gratuita
 *   - Imposta ELEVENLABS_API_KEY nell'ambiente
 *   - Voce consigliata: "Bella" (italiano femminile, stile Siri)
 *     oppure "Giovanni" (maschile professionale)
 */

const https = require("https");
const fs = require("fs");
const { execSync } = require("child_process");
const path = require("path");

/* ─── Script voce italiano (41 secondi totali) ────────────
   Tempo sincronizzato con le scene del video Remotion:
   0s–3s:   Intro logo GF
   3s–6s:   Hook
   6s–11s:  Selfpay reveal
   11s–25s: 4 vantaggi
   25s–35s: CTA
   35s–41s: Outro
*/
const VOICEOVER_SEGMENTS = [
  { start: 1.5,  text: "Casse automatiche. Per il denaro punto it." },
  { start: 4.5,  text: "Stai ancora contando i soldi a mano?" },
  { start: 7.5,  text: "Ecco la soluzione." },
  { start: 9.0,  text: "Cashmatic Selfpay millesessanta. La cassa automatica più veloce sul mercato." },
  { start: 12.5, text: "Processa banconote in meno di un secondo." },
  { start: 16.5, text: "Conta e gestisce banconote E monete, in modo completamente automatico." },
  { start: 21.0, text: "Addio ammanchi e differenze di cassa. Zero errori garantiti." },
  { start: 25.5, text: "La tua cassa è sempre sicura e protetta, ventiquattro ore su ventiquattro." },
  { start: 30.0, text: "Vuoi saperne di più? Visita perIlDenaro punto it, oppure chiamaci." },
  { start: 34.0, text: "Assistenza, vendita e noleggio. GF Casse Automatiche." },
  { start: 37.0, text: "Seguici su TikTok per altri video!" },
];

const FULL_SCRIPT = VOICEOVER_SEGMENTS.map(s => s.text).join(" ");

console.log("═══════════════════════════════════════════════");
console.log("  SCRIPT VOICEOVER – Cashmatic Selfpay 1060");
console.log("═══════════════════════════════════════════════\n");
VOICEOVER_SEGMENTS.forEach(s => {
  const mm = Math.floor(s.start / 60).toString().padStart(2, "0");
  const ss = (s.start % 60).toFixed(1).padStart(4, "0");
  console.log(`[${mm}:${ss}] ${s.text}`);
});
console.log("\n");

/* ─── Tentativo generazione con gTTS (Python) ─────────── */
function tryGTTS() {
  try {
    execSync("python3 -c 'import gtts'", { stdio: "pipe" });
    console.log("✅ gTTS trovato — genero audio...");
    const outPath = path.join(__dirname, "../public/voiceover.mp3");
    execSync(
      `python3 -c "
from gtts import gTTS
text = '${FULL_SCRIPT.replace(/'/g, "\\'")}'
tts = gTTS(text=text, lang='it', slow=False)
tts.save('${outPath}')
print('Audio salvato in ${outPath}')
"`,
      { stdio: "inherit" }
    );
    console.log("\n✅ Audio generato: public/voiceover.mp3");
    console.log("   Aggiungi <Audio src={staticFile('voiceover.mp3')} /> in Composition.tsx\n");
    return true;
  } catch {
    return false;
  }
}

/* ─── ElevenLabs API ──────────────────────────────────── */
async function tryElevenLabs() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    console.log("💡 Per audio qualità PRO (stile Siri):");
    console.log("   1. Vai su https://elevenlabs.io (piano gratuito disponibile)");
    console.log("   2. Copia la tua API key");
    console.log("   3. ELEVENLABS_API_KEY=xxx node scripts/generate-voice.js\n");
    return false;
  }

  // Voice ID "Bella" italiana su ElevenLabs
  const VOICE_ID = "EXAVITQu4vr4xnSDxMaL";
  console.log("✅ ElevenLabs API key trovata — genero audio HD...");

  return new Promise((resolve) => {
    const body = JSON.stringify({
      text: FULL_SCRIPT,
      model_id: "eleven_multilingual_v2",
      voice_settings: { stability: 0.4, similarity_boost: 0.85, style: 0.3, use_speaker_boost: true },
    });

    const req = https.request(
      {
        hostname: "api.elevenlabs.io",
        path: `/v1/text-to-speech/${VOICE_ID}`,
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const buf = Buffer.concat(chunks);
          const outPath = path.join(__dirname, "../public/voiceover.mp3");
          fs.writeFileSync(outPath, buf);
          console.log(`\n✅ Audio HD salvato: public/voiceover.mp3 (${(buf.length / 1024).toFixed(0)} KB)`);
          console.log("   Aggiungi <Audio src={staticFile('voiceover.mp3')} /> in Composition.tsx\n");
          resolve(true);
        });
      }
    );
    req.on("error", (e) => { console.error("Errore ElevenLabs:", e.message); resolve(false); });
    req.write(body);
    req.end();
  });
}

/* ─── Main ────────────────────────────────────────────── */
async function main() {
  const gttsOk = tryGTTS();
  if (!gttsOk) await tryElevenLabs();

  console.log("═══════════════════════════════════════════════");
  console.log("  PROSSIMI PASSI:");
  console.log("  1. cd video && npm install");
  console.log("  2. npm run start   → anteprima nel browser");
  console.log("  3. npm run render  → esporta il video MP4");
  console.log("  4. Carica su TikTok! 🚀");
  console.log("═══════════════════════════════════════════════\n");
}

main();
