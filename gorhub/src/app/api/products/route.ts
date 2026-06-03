import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

const createSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  price: z.number().positive(),
  stock: z.number().int().min(0),
  sku: z.string().min(1).max(50),
  category: z.string().optional(),
})

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const limit = Math.min(50, Number(searchParams.get('limit') ?? 20))
  const search = searchParams.get('search') ?? ''

  const userId = (session.user as any).id
  const where = {
    userId,
    ...(search && { name: { contains: search, mode: 'insensitive' as const } }),
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
    prisma.product.count({ where }),
  ])

  return NextResponse.json({ products, total, page, pages: Math.ceil(total / limit) })
}

export async function POST(req: Request) {
  const { ok } = rateLimit(getClientIp(req), 30, 60_000)
  if (!ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const userId = (session.user as any).id
  const existing = await prisma.product.findUnique({ where: { sku: parsed.data.sku } })
  if (existing) return NextResponse.json({ error: 'SKU already exists' }, { status: 409 })

  const product = await prisma.product.create({ data: { ...parsed.data, userId } })
  return NextResponse.json(product, { status: 201 })
}
