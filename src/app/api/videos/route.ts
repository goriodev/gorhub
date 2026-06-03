import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import crypto from 'crypto'
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

function signedUrl(publicId: string, resourceType = 'video', expiresIn = 3600) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME!
  const apiKey = process.env.CLOUDINARY_API_KEY!
  const apiSecret = process.env.CLOUDINARY_API_SECRET!
  const expireAt = Math.floor(Date.now() / 1000) + expiresIn

  const toSign = `exp=${expireAt}&public_id=${publicId}`
  const signature = crypto.createHash('sha256').update(toSign + apiSecret).digest('hex')

  return `https://res.cloudinary.com/${cloudName}/${resourceType}/upload/s--${signature.slice(0, 8)}--/e_${expireAt}/${publicId}`
}

function signedThumbnail(publicId: string, expiresIn = 3600) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME!
  const apiKey = process.env.CLOUDINARY_API_KEY!
  const apiSecret = process.env.CLOUDINARY_API_SECRET!
  const expireAt = Math.floor(Date.now() / 1000) + expiresIn

  const toSign = `exp=${expireAt}&public_id=${publicId}`
  const signature = crypto.createHash('sha256').update(toSign + apiSecret).digest('hex')

  return `https://res.cloudinary.com/${cloudName}/video/upload/s--${signature.slice(0, 8)}--/e_${expireAt}/so_0/${publicId}.jpg`
}

function withSignedUrls(video: any) {
  const publicId = video.cloudinaryId ?? video.url?.split('/upload/').pop()?.replace(/\.\w+$/, '') ?? ''
  return {
    ...video,
    url: publicId ? signedUrl(publicId) : video.url,
    thumbnail: publicId ? signedThumbnail(publicId) : video.thumbnail,
  }
}

// Public — anyone can fetch published videos (with signed URLs)
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
