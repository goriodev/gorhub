import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// Increment view count — public
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const video = await prisma.video.findUnique({ where: { id: params.id } })
  if (!video || !video.published) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.video.update({ where: { id: params.id }, data: { views: { increment: 1 } } })
  return NextResponse.json(video)
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id
  const video = await prisma.video.findFirst({ where: { id: params.id, userId } })
  if (!video) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.video.delete({ where: { id: params.id } })
  return new NextResponse(null, { status: 204 })
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id
  const video = await prisma.video.findFirst({ where: { id: params.id, userId } })
  if (!video) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json().catch(() => ({}))
  const updated = await prisma.video.update({ where: { id: params.id }, data: { published: body.published } })
  return NextResponse.json(updated)
}
