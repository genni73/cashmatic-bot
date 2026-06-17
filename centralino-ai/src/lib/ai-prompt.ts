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

=== REGOLE ===
- Rispondi SOLO in italiano
- Risposte brevi e adatte a una chat (max 150-200 parole)
- Non inventare informazioni non presenti sopra
- Per prenotazioni: raccogli nome, telefono, data, ora${typeConfig.hasNumberOfPeople ? ', numero di persone' : ''}
- Se non sai qualcosa: offri di mettere in contatto con il titolare
${business.aiWelcomeMessage ? `- Messaggio di benvenuto: "${business.aiWelcomeMessage}"` : ''}
${business.aiClosingMessage ? `- Messaggio di chiusura: "${business.aiClosingMessage}"` : ''}
- Chiudi sempre con una domanda o call to action`
}
