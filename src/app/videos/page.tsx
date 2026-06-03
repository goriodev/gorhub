'use client'
import { useEffect, useRef, useState } from 'react'
import { Play, X, Eye, Clock, Video } from 'lucide-react'

interface VideoItem {
  id: string; title: string; description: string | null; url: string
  thumbnail: string | null; duration: number | null; views: number; createdAt: string
}

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60), s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function VideoPlayer({ video, onClose }: { video: VideoItem; onClose: () => void }) {
  const ref = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    fetch(`/api/videos/${video.id}`).catch(() => {})
    ref.current?.play().catch(() => {})
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [video.id])

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col" onClick={onClose}>
      <div className="flex items-center justify-between px-6 py-4" onClick={e => e.stopPropagation()}>
        <div>
          <h2 className="text-white font-semibold text-lg">{video.title}</h2>
          {video.description && <p className="text-gray-400 text-sm mt-0.5">{video.description}</p>}
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors">
          <X size={22} />
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center px-4 pb-6" onClick={e => e.stopPropagation()}>
        <video
          ref={ref}
          src={video.url}
          controls
          className="w-full max-w-5xl max-h-full rounded-xl shadow-2xl"
          style={{ maxHeight: 'calc(100vh - 120px)' }}
        />
      </div>
    </div>
  )
}

export default function PublicVideosPage() {
  const [videos, setVideos] = useState<VideoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [playing, setPlaying] = useState<VideoItem | null>(null)

  useEffect(() => {
    fetch('/api/videos').then(r => r.json()).then(d => setVideos(d.videos ?? [])).finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="font-bold text-white text-lg">GorHub</span>
          <span className="text-gray-500 text-sm ml-1">/ Videos</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Videos</h1>
          <p className="text-gray-400 mt-1">{videos.length} {videos.length === 1 ? 'video' : 'videos'} available</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="animate-spin w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full" />
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-24 text-gray-500">
            <Video size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No videos yet</p>
            <p className="text-sm mt-1">Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {videos.map(video => (
              <div
                key={video.id}
                className="group cursor-pointer rounded-xl overflow-hidden bg-gray-900 border border-gray-800 hover:border-brand-500 transition-all duration-200 hover:shadow-lg hover:shadow-brand-500/10"
                onClick={() => setPlaying(video)}
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-gray-800 overflow-hidden">
                  {video.thumbnail
                    ? <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    : <div className="w-full h-full flex items-center justify-center"><Video size={32} className="text-gray-600" /></div>
                  }
                  {/* Play overlay */}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                      <Play size={22} className="text-gray-900 ml-1" fill="currentColor" />
                    </div>
                  </div>
                  {video.duration && (
                    <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded font-mono">
                      {formatDuration(video.duration)}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="p-3">
                  <h3 className="text-white font-medium text-sm leading-snug line-clamp-2">{video.title}</h3>
                  {video.description && <p className="text-gray-500 text-xs mt-1 line-clamp-2">{video.description}</p>}
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
                    <span className="flex items-center gap-1"><Eye size={11} />{video.views}</span>
                    <span className="flex items-center gap-1"><Clock size={11} />{formatDate(video.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {playing && <VideoPlayer video={playing} onClose={() => setPlaying(null)} />}
    </div>
  )
}
