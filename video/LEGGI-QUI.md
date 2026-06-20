# Video TikTok — Cashmatic Selfpay 1060

## Come usare

### 1. Installa dipendenze
```bash
cd video
npm install
```

### 2. Genera la voce stile Siri (gratis)
```bash
pip install gTTS
node scripts/generate-voice.js
```
Oppure con **ElevenLabs** (qualità HD):
```bash
ELEVENLABS_API_KEY=la_tua_key node scripts/generate-voice.js
```

### 3. Anteprima nel browser
```bash
npm run start
```

### 4. Esporta il video MP4
```bash
npm run render
# Output: out/cashmatic-tiktok.mp4
```

### 5. Carica su TikTok 🚀

---

## Dettagli video
- **Formato**: 1080×1920 (9:16 verticale TikTok)
- **Durata**: ~41 secondi
- **FPS**: 30
- **Colori brand**: Navy #0d1b3e + Cyan #00ccff

## Scene
| Tempo | Scena |
|-------|-------|
| 0–3s  | Logo GF con glow neon |
| 3–6s  | Hook "Stai ancora contando a mano?" |
| 6–11s | Selfpay 1060 reveal con effetti |
| 11–15s| ⚡ Velocissima |
| 15–19s| 💰 100% Automatica |
| 19–23s| ✅ Zero Errori |
| 23–27s| 🔒 Sicurezza H24 |
| 27–35s| CTA perIlDenaro.it |
| 35–41s| Outro logo + TikTok follow |

## Script voce (italiano, stile Siri)
```
[00:01.5] Casse automatiche. Per il denaro punto it.
[00:04.5] Stai ancora contando i soldi a mano?
[00:07.5] Ecco la soluzione.
[00:09.0] Cashmatic Selfpay millesessanta. La cassa automatica più veloce sul mercato.
[00:12.5] Processa banconote in meno di un secondo.
[00:16.5] Conta e gestisce banconote E monete, in modo completamente automatico.
[00:21.0] Addio ammanchi e differenze di cassa. Zero errori garantiti.
[00:25.5] La tua cassa è sempre sicura e protetta, ventiquattro ore su ventiquattro.
[00:30.0] Vuoi saperne di più? Visita perIlDenaro.it, oppure chiamaci.
[00:34.0] Assistenza, vendita e noleggio. GF Casse Automatiche.
[00:37.0] Seguici su TikTok per altri video!
```
