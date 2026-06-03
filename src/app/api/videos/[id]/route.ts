import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { v2 as cloudinary } from 'cloudinary'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

function getSignedVideoUrl(cloudinaryId: string) {
  return cloudinary.url(cloudinaryId, {
    resource_type: 'video',
    type: 'authenticated',
    sign_url: true,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    secure: true,
  })
}

// Increment view count + return signed URL — public
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const video = await prisma.video.findUnique({ where: { id: params.id } })
  if (!video || !video.published) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.video.update({ where: { id: params.id }, data: { views: { increment: 1 } } })

  return NextResponse.json({ ...video, url: getSignedVideoUrl(video.cloudinaryId) })
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
