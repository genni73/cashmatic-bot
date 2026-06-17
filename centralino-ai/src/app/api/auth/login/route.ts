import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, generateToken } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email e password obbligatori' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { business: true },
    })

    if (!user || !(await verifyPassword(password, user.password))) {
      return NextResponse.json({ error: 'Credenziali non valide' }, { status: 401 })
    }

    const token = generateToken({ userId: user.id, businessId: user.businessId })
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
    const message = error instanceof Error ? error.message : 'Errore durante il login'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
