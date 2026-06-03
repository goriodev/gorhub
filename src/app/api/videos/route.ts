import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

const createSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  cloudinaryId: z.string(),
  url: z.string().url(),
  thumbnail: z.string().optional(),
  duration: z.number().int().optional(),
})

// Public — anyone can fetch published videos
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const limit = Math.min(50, Number(searchParams.get('limit') ?? 12))

  const [videos, total] = await Promise.all([
    prisma.video.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: { id: true, title: true, description: true, url: true, thumbnail: true, duration: true, views: true, createdAt: true },
    }),
    prisma.video.count({ where: { published: true } }),
  ])

  return NextResponse.json({ videos, total, page, pages: Math.ceil(total / limit) })
}

// Admin only — upload new video record
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const userId = (session.user as any).id
  const video = await prisma.video.create({ data: { ...parsed.data, userId } })
  return NextResponse.json(video, { status: 201 })
}
