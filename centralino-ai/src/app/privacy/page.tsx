export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px', fontFamily: 'system-ui, sans-serif', color: '#333' }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>Informativa sulla Privacy</h1>
      <p style={{ color: '#666', marginBottom: 32 }}>Ultimo aggiornamento: {new Date().toLocaleDateString('it-IT')}</p>

      <h2 style={{ fontSize: 20, marginTop: 32 }}>1. Titolare del Trattamento</h2>
      <p>NetFood S.r.l. — Servizio Centralino AI per attività commerciali.</p>

      <h2 style={{ fontSize: 20, marginTop: 32 }}>2. Dati Raccolti</h2>
      <p>Raccogliamo i seguenti dati per erogare il servizio:</p>
      <ul>
        <li>Nome e numero di telefono forniti durante le conversazioni</li>
        <li>Messaggi scambiati tramite WhatsApp Business e chiamate vocali</li>
        <li>Dati relativi alle prenotazioni (data, ora, numero di persone)</li>
      </ul>

      <h2 style={{ fontSize: 20, marginTop: 32 }}>3. Finalità del Trattamento</h2>
      <p>I dati sono utilizzati esclusivamente per:</p>
      <ul>
        <li>Gestire prenotazioni e richieste dei clienti</li>
        <li>Fornire assistenza automatizzata tramite intelligenza artificiale</li>
        <li>Migliorare la qualità del servizio</li>
      </ul>

      <h2 style={{ fontSize: 20, marginTop: 32 }}>4. Base Giuridica</h2>
      <p>Il trattamento è basato sul consenso dell&apos;utente e sull&apos;esecuzione del contratto di servizio.</p>

      <h2 style={{ fontSize: 20, marginTop: 32 }}>5. Conservazione dei Dati</h2>
      <p>I dati delle conversazioni vengono conservati per un massimo di 12 mesi dalla data dell&apos;ultima interazione.</p>

      <h2 style={{ fontSize: 20, marginTop: 32 }}>6. Condivisione dei Dati</h2>
      <p>I dati non vengono venduti a terzi. Possono essere condivisi con:</p>
      <ul>
        <li>Meta (WhatsApp Business Platform) per l&apos;invio e ricezione dei messaggi</li>
        <li>Anthropic (Claude AI) per l&apos;elaborazione delle risposte automatiche</li>
        <li>Vapi.ai per la gestione delle chiamate vocali</li>
      </ul>

      <h2 style={{ fontSize: 20, marginTop: 32 }}>7. Diritti dell&apos;Utente</h2>
      <p>Ai sensi del GDPR, hai diritto a:</p>
      <ul>
        <li>Accedere ai tuoi dati personali</li>
        <li>Richiedere la rettifica o cancellazione dei dati</li>
        <li>Opporti al trattamento</li>
        <li>Richiedere la portabilità dei dati</li>
      </ul>

      <h2 style={{ fontSize: 20, marginTop: 32 }}>8. Contatti</h2>
      <p>Per esercitare i tuoi diritti o per qualsiasi domanda sulla privacy, contattaci a: <strong>cashmatic.fusco@gmail.com</strong></p>
    </div>
  )
}
