import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, generateToken } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const { name, email, password, businessName, businessType, phone, city } = await request.json()

    if (!name || !email || !password || !businessName) {
      return NextResponse.json({ error: 'Compila tutti i campi obbligatori' }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ error: 'Email già registrata' }, { status: 409 })
    }

    const slug = businessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    const existingSlug = await prisma.business.findUnique({ where: { slug } })
    const finalSlug = existingSlug ? `${slug}-${Date.now()}` : slug

    const hashedPassword = await hashPassword(password)

    const business = await prisma.business.create({
      data: {
        name: businessName,
        slug: finalSlug,
        type: businessType || 'RESTAURANT',
        phone: phone || null,
        city: city || null,
        aiTone: 'FRIENDLY',
        isActive: true,
      },
    })

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'OWNER',
        businessId: business.id,
      },
    })

    const token = generateToken({ userId: user.id, businessId: business.id })
    const cookieStore = await cookies()
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return NextResponse.json({ success: true, user: { id: user.id, name: user.name, email: user.email } })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Errore durante la registrazione'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
