import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import crypto from 'crypto'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { folder = 'gorhub-videos' } = await req.json().catch(() => ({}))

  const timestamp = Math.round(new Date().getTime() / 1000)
  const apiSecret = process.env.CLOUDINARY_API_SECRET!
  const params = `folder=${folder}&timestamp=${timestamp}`
  const signature = crypto.createHash('sha1').update(params + apiSecret).digest('hex')

  return NextResponse.json({
    signature,
    timestamp,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    folder,
  })
}
