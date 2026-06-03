import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

function getSignedVideoUrl(publicId: string, expiresIn = 3600) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME!
  const apiSecret = process.env.CLOUDINARY_API_SECRET!
  const expireAt = Math.floor(Date.now() / 1000) + expiresIn
  const toSign = `exp=${expireAt}&public_id=${publicId}`
  const sig = crypto.createHash('sha256').update(toSign + apiSecret).digest('hex')
  return `https://res.cloudinary.com/${cloudName}/video/upload/s--${sig.slice(0, 8)}--/e_${expireAt}/${publicId}`
}

// Increment view count + return signed URL — public
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const video = await prisma.video.findUnique({ where: { id: params.id } })
  if (!video || !video.published) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.video.update({ where: { id: params.id }, data: { views: { increment: 1 } } })

  const signedVideoUrl = getSignedVideoUrl(video.cloudinaryId)
  return NextResponse.json({ ...video, url: signedVideoUrl })
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
