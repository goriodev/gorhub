import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { v2 as cloudinary } from 'cloudinary'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

const createSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  cloudinaryId: z.string(),
  url: z.string().url(),
  thumbnail: z.string().optional(),
  duration: z.number().int().optional(),
})

function getSignedUrls(cloudinaryId: string) {
  const expiresAt = Math.floor(Date.now() / 1000) + 3600

  const url = cloudinary.url(cloudinaryId, {
    resource_type: 'video',
    type: 'authenticated',
    sign_url: true,
    expires_at: expiresAt,
    secure: true,
  })

  const thumbnail = cloudinary.url(cloudinaryId, {
    resource_type: 'video',
    type: 'authenticated',
    sign_url: true,
    expires_at: expiresAt,
    format: 'jpg',
    start_offset: '0',
    secure: true,
  })

  return { url, thumbnail }
}

function withSignedUrls(video: any) {
  try {
    const { url, thumbnail } = getSignedUrls(video.cloudinaryId)
    return { ...video, url, thumbnail }
  } catch {
    return video
  }
}

// Public — anyone can fetch published videos with signed URLs
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
    }),
    prisma.video.count({ where: { published: true } }),
  ])

  return NextResponse.json({ videos: videos.map(withSignedUrls), total, page, pages: Math.ceil(total / limit) })
}

// Admin only — save uploaded video record
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
