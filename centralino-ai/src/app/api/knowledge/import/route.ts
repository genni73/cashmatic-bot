import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

function parseFrontmatter(raw: string): { title?: string; tags?: string[]; body: string } {
  const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!fmMatch) return { body: raw }

  const fm = fmMatch[1]
  const body = fmMatch[2].trim()

  const titleMatch = fm.match(/^title:\s*(.+)$/m)
  const title = titleMatch ? titleMatch[1].replace(/^["']|["']$/g, '').trim() : undefined

  const tagsMatch = fm.match(/^tags:\s*\[([^\]]*)\]/m) || fm.match(/^tags:\s*(.+)$/m)
  let tags: string[] | undefined
  if (tagsMatch) {
    tags = tagsMatch[1]
      .split(/[,\s]+/)
      .map(t => t.replace(/^["'\-\s]+|["'\s]+$/g, '').trim())
      .filter(Boolean)
  }

  return { title, tags, body }
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const formData = await request.formData()
  const files = formData.getAll('files') as File[]

  if (!files.length) return NextResponse.json({ error: 'Nessun file ricevuto' }, { status: 400 })

  const created: string[] = []
  const errors: string[] = []

  for (const file of files) {
    try {
      const raw = await file.text()
      const { title, tags, body } = parseFrontmatter(raw)

      const noteName = file.name.replace(/\.md$/i, '')
      const noteTitle = title || noteName

      if (!body.trim()) {
        errors.push(`${file.name}: contenuto vuoto`)
        continue
      }

      await prisma.knowledgeNote.create({
        data: {
          title: noteTitle,
          content: body,
          tags: tags ? tags.join(', ') : null,
          source: 'OBSIDIAN',
          fileName: file.name,
          businessId: session.user.businessId,
        },
      })

      created.push(noteTitle)
    } catch {
      errors.push(`${file.name}: errore durante l'importazione`)
    }
  }

  return NextResponse.json({ created, errors })
}
