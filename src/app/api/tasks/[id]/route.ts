import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.string().datetime().nullable().optional(),
  projectId: z.string().nullable().optional(),
})

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id
  const task = await prisma.task.findFirst({ where: { id: params.id, userId } })
  if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json().catch(() => null)
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const updated = await prisma.task.update({
    where: { id: params.id },
    data: { ...parsed.data, dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : parsed.data.dueDate },
    include: { project: true },
  })
  return NextResponse.json(updated)
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id
  const task = await prisma.task.findFirst({ where: { id: params.id, userId } })
  if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.task.delete({ where: { id: params.id } })
  return new NextResponse(null, { status: 204 })
}
