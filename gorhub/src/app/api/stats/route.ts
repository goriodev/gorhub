import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id

  const [totalProducts, totalOrders, orders, tasks, recentOrders] = await Promise.all([
    prisma.product.count({ where: { userId } }),
    prisma.order.count({ where: { userId } }),
    prisma.order.findMany({ where: { userId }, select: { total: true, status: true, createdAt: true } }),
    prisma.task.groupBy({ by: ['status'], where: { userId }, _count: true }),
    prisma.order.findMany({ where: { userId }, include: { items: { include: { product: { select: { name: true } } } } }, orderBy: { createdAt: 'desc' }, take: 5 }),
  ])

  const revenue = orders.filter(o => o.status !== 'CANCELLED').reduce((s, o) => s + o.total, 0)
  const taskStats = Object.fromEntries(tasks.map(t => [t.status, t._count]))

  return NextResponse.json({ totalProducts, totalOrders, revenue, taskStats, recentOrders })
}
