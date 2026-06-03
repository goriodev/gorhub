import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  stock: z.number().int().min(0).optional(),
  category: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'OUT_OF_STOCK']).optional(),
})

async function getProduct(id: string, userId: string) {
  return prisma.product.findFirst({ where: { id, userId } })
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id
  const product = await getProduct(params.id, userId)
  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json().catch(() => null)
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const updated = await prisma.product.update({ where: { id: params.id }, data: parsed.data })
  return NextResponse.json(updated)
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id
  const product = await getProduct(params.id, userId)
  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.product.delete({ where: { id: params.id } })
  return new NextResponse(null, { status: 204 })
}
