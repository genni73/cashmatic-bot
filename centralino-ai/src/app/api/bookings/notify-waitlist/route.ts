import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { sendWhatsAppMessage } from '@/lib/whatsapp'

export async function POST(request: Request) {
  const session = await getSession()
  if (!session?.user.businessId) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  }

  const { bookingId, action } = await request.json()

  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, businessId: session.user.businessId, status: 'WAITLIST' },
  })

  if (!booking) {
    return NextResponse.json({ error: 'Prenotazione non trovata o non in lista d\'attesa' }, { status: 404 })
  }

  const business = await prisma.business.findUnique({
    where: { id: session.user.businessId },
  })

  if (!business) {
    return NextResponse.json({ error: 'Attivita non trovata' }, { status: 404 })
  }

  if (action === 'confirm') {
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'CONFIRMED' },
    })

    if (business.whatsappPhoneId && business.whatsappToken) {
      const msg = `Gentile ${booking.customerName}, buone notizie! Si e liberato un posto per il ${booking.date.toLocaleDateString('it-IT')} alle ${booking.time}. La sua prenotazione e confermata! La aspettiamo da ${business.name}.`
      await sendWhatsAppMessage(business.whatsappPhoneId, business.whatsappToken, booking.customerPhone, msg)
    }

    return NextResponse.json({ success: true, message: 'Prenotazione confermata e cliente avvisato' })
  }

  if (action === 'cancel') {
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'CANCELLED' },
    })

    if (business.whatsappPhoneId && business.whatsappToken) {
      const msg = `Gentile ${booking.customerName}, ci dispiace ma non siamo riusciti a trovare disponibilita per il ${booking.date.toLocaleDateString('it-IT')} alle ${booking.time}. La invitiamo a provare un'altra data. Grazie per la comprensione!`
      await sendWhatsAppMessage(business.whatsappPhoneId, business.whatsappToken, booking.customerPhone, msg)
    }

    return NextResponse.json({ success: true, message: 'Prenotazione cancellata e cliente avvisato' })
  }

  return NextResponse.json({ error: 'Azione non valida' }, { status: 400 })
}
