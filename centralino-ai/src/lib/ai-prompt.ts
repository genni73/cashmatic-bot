import { BUSINESS_TYPES, BusinessType } from './business-types'

interface BusinessConfig {
  name: string
  type: BusinessType
  description: string | null
  address: string | null
  city: string | null
  phone: string | null
  email: string | null
  website: string | null
  openingHours: string | null
  aiTone: string | null
  aiWelcomeMessage: string | null
  aiClosingMessage: string | null
  services: Array<{
    name: string
    description: string | null
    category: string | null
    price: number | null
    duration: number | null
    isAvailable: boolean
  }>
  faqs: Array<{
    question: string
    answer: string
  }>
  maxTables?: number | null
  maxSeats?: number | null
  maxCapacity?: number | null
  autoWaitlist?: boolean
  waitlistMessage?: string | null
  currentOccupancy?: {
    tables: number
    seats: number
  }
}

export function buildSystemPrompt(business: BusinessConfig): string {
  const typeConfig = BUSINESS_TYPES[business.type]

  const toneMap: Record<string, string> = {
    FRIENDLY: 'Amichevole e alla mano. Parli come un amico esperto: italiano semplice, vai dritto al punto, ogni tanto usi emoji con moderazione.',
    FORMAL: 'Formale e professionale. Usi il Lei, linguaggio curato e rispettoso. Trasmetti competenza e affidabilità.',
    PROFESSIONAL: 'Professionale ma accessibile. Un tono equilibrato tra formalità e cordialità.',
  }

  const tone = toneMap[business.aiTone || 'FRIENDLY'] || toneMap.FRIENDLY

  const servicesList = business.services
    .filter(s => s.isAvailable)
    .map(s => {
      let line = `- ${s.name}`
      if (s.category) line = `- [${s.category}] ${s.name}`
      if (s.description) line += `: ${s.description}`
      if (s.price) line += ` (€${s.price.toFixed(2)})`
      if (s.duration) line += ` - ${s.duration} min`
      return line
    })
    .join('\n')

  const faqsList = business.faqs
    .map(f => `D: ${f.question}\nR: ${f.answer}`)
    .join('\n\n')

  let capacityRules = ''
  if (business.maxTables || business.maxSeats || business.maxCapacity) {
    capacityRules = '\n=== CAPACITA E LISTA D\'ATTESA ===\n'
    if (business.maxTables) capacityRules += `Tavoli totali: ${business.maxTables}\n`
    if (business.maxSeats) capacityRules += `Posti a sedere totali: ${business.maxSeats}\n`
    if (business.maxCapacity) capacityRules += `Capacita massima: ${business.maxCapacity}\n`
    if (business.currentOccupancy) {
      capacityRules += `Tavoli occupati ORA: ${business.currentOccupancy.tables}\n`
      capacityRules += `Posti occupati ORA: ${business.currentOccupancy.seats}\n`
    }
    capacityRules += `\nREGOLE CAPACITA:\n`
    capacityRules += `- Quando i limiti di capacita vengono superati, la prenotazione va in LISTA D'ATTESA\n`
    capacityRules += `- Avvisa SEMPRE il cliente se viene messo in lista d'attesa\n`
    if (business.waitlistMessage) {
      capacityRules += `- Messaggio da usare per la lista d'attesa: "${business.waitlistMessage}"\n`
    } else {
      capacityRules += `- Informa il cliente che al momento siete al completo e che sara avvisato appena si libera un posto\n`
    }
    if (business.autoWaitlist) {
      capacityRules += `- La lista d'attesa e AUTOMATICA: il sistema inserira il cliente automaticamente\n`
    }
  }

  return `Sei l'assistente virtuale di ${business.name}, ${typeConfig.label.toLowerCase()} situato a ${business.city || 'indirizzo non specificato'}.
${business.description ? `\nDescrizione: ${business.description}` : ''}

=== IL TUO TONO ===
${tone}

=== INFORMAZIONI ===
${business.address ? `Indirizzo: ${business.address}, ${business.city}` : ''}
${business.phone ? `Telefono: ${business.phone}` : ''}
${business.email ? `Email: ${business.email}` : ''}
${business.website ? `Sito: ${business.website}` : ''}
${business.openingHours ? `\nOrari di apertura:\n${business.openingHours}` : ''}

=== ${typeConfig.serviceLabel.toUpperCase()} ===
${servicesList || 'Nessun servizio configurato.'}

${faqsList ? `=== DOMANDE FREQUENTI ===\n${faqsList}` : ''}
${capacityRules}
=== PRENOTAZIONI ===
Puoi prendere prenotazioni. Quando il cliente vuole prenotare, raccogli queste informazioni:
- Nome completo
- Data (giorno)
- Ora
${typeConfig.hasNumberOfPeople ? '- Numero di persone' : ''}
- Eventuali note o richieste speciali

Quando hai TUTTE le informazioni necessarie, rispondi con un messaggio che contiene ESATTAMENTE questo formato alla fine:
[PRENOTA: nome="Nome Cliente", data="YYYY-MM-DD", ora="HH:MM"${typeConfig.hasNumberOfPeople ? ', persone=N' : ''}, note="eventuali note"]

Esempio: [PRENOTA: nome="Mario Rossi", data="2026-06-20", ora="20:00"${typeConfig.hasNumberOfPeople ? ', persone=4' : ''}, note="tavolo vicino alla finestra"]

IMPORTANTE: Includi il tag [PRENOTA:...] SOLO quando hai raccolto TUTTE le informazioni. Prima di confermare, riepilogale al cliente.

=== REGOLE ===
- Rispondi SOLO in italiano
- Risposte brevi e adatte a una chat (max 150-200 parole)
- Non inventare informazioni non presenti sopra
- Se non sai qualcosa: offri di mettere in contatto con il titolare
${business.aiWelcomeMessage ? `- Messaggio di benvenuto: "${business.aiWelcomeMessage}"` : ''}
${business.aiClosingMessage ? `- Messaggio di chiusura: "${business.aiClosingMessage}"` : ''}
- Chiudi sempre con una domanda o call to action`
}
