import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

const createSchema = z.object({
  items: z.array(z.object({ productId: z.string(), quantity: z.number().int().positive() })).min(1),
  notes: z.string().optional(),
})

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const limit = Math.min(50, Number(searchParams.get('limit') ?? 20))
  const status = searchParams.get('status')

  const userId = (session.user as any).id
  const where = { userId, ...(status && { status: status as any }) }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({ where, include: { items: { include: { product: true } } }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
    prisma.order.count({ where }),
  ])

  return NextResponse.json({ orders, total, page, pages: Math.ceil(total / limit) })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const userId = (session.user as any).id

  // Fetch products and validate stock
  const products = await Promise.all(parsed.data.items.map(i => prisma.product.findFirst({ where: { id: i.productId, userId } })))
  for (let i = 0; i < products.length; i++) {
    if (!products[i]) return NextResponse.json({ error: `Product ${parsed.data.items[i].productId} not found` }, { status: 404 })
  }

  const total = parsed.data.items.reduce((sum, item, i) => sum + (products[i]!.price * item.quantity), 0)
  const orderNumber = `ORD-${Date.now()}`

  const order = await prisma.order.create({
    data: {
      orderNumber,
      total,
      userId,
      notes: parsed.data.notes,
      items: {
        create: parsed.data.items.map((item, i) => ({ quantity: item.quantity, unitPrice: products[i]!.price, productId: item.productId })),
      },
    },
    include: { items: { include: { product: true } } },
  })

  return NextResponse.json(order, { status: 201 })
}
