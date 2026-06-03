import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

const schema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(8).regex(/[A-Z]/, 'Need uppercase').regex(/[0-9]/, 'Need number'),
})

export async function POST(req: Request) {
  const { ok } = rateLimit(getClientIp(req), 5, 60_000)
  if (!ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { name, email, password } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return NextResponse.json({ error: 'Email already in use' }, { status: 409 })

  const hashed = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({ data: { name, email, password: hashed } })

  return NextResponse.json({ id: user.id, email: user.email }, { status: 201 })
}
