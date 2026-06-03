import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

const createSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']).default('TODO'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  dueDate: z.string().datetime().optional(),
  projectId: z.string().optional(),
})

const updateSchema = createSchema.partial()

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const projectId = searchParams.get('projectId')

  const userId = (session.user as any).id
  const tasks = await prisma.task.findMany({
    where: { userId, ...(status && { status: status as any }), ...(projectId && { projectId }) },
    include: { project: true },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
  })

  return NextResponse.json({ tasks })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const userId = (session.user as any).id
  const task = await prisma.task.create({
    data: { ...parsed.data, userId, dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined },
    include: { project: true },
  })

  return NextResponse.json(task, { status: 201 })
}
