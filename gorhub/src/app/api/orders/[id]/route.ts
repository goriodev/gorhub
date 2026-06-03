import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

const updateSchema = z.object({ status: z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']) })

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id
  const order = await prisma.order.findFirst({ where: { id: params.id, userId } })
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json().catch(() => null)
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const updated = await prisma.order.update({ where: { id: params.id }, data: parsed.data, include: { items: { include: { product: true } } } })
  return NextResponse.json(updated)
}
