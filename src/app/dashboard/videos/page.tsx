'use client'
import { useEffect, useRef, useState } from 'react'
import { Plus, Trash2, Eye, EyeOff, Video, Upload, X } from 'lucide-react'

interface VideoItem {
  id: string; title: string; description: string | null; url: string
  thumbnail: string | null; duration: number | null; views: number; published: boolean; createdAt: string
}

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60), s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function VideosPage() {
  const [videos, setVideos] = useState<VideoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [form, setForm] = useState({ title: '', description: '' })
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function load() {
    setLoading(true)
    const r = await fetch('/api/videos')
    const d = await r.json()
    setVideos(d.videos ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!fileRef.current?.files?.[0]) { setError('Please select a video file'); return }
    if (!form.title) { setError('Title is required'); return }

    setUploading(true); setError(''); setUploadProgress(0)

    try {
      // Get Cloudinary signature from our API
      const sigRes = await fetch('/api/upload/signature', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ folder: 'gorhub-videos' }) })
      const { signature, timestamp, cloudName, apiKey, folder } = await sigRes.json()

      // Upload directly to Cloudinary
      const formData = new FormData()
      formData.append('file', fileRef.current.files[0])
      formData.append('api_key', apiKey)
      formData.append('timestamp', timestamp)
      formData.append('signature', signature)
      formData.append('folder', folder)
      formData.append('resource_type', 'video')

      const xhr = new XMLHttpRequest()
      xhr.upload.onprogress = (e) => { if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100)) }

      const uploadResult = await new Promise<any>((resolve, reject) => {
        xhr.onload = () => resolve(JSON.parse(xhr.responseText))
        xhr.onerror = reject
        xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`)
        xhr.send(formData)
      })

      if (uploadResult.error) throw new Error(uploadResult.error.message)

      // Save to our database
      await fetch('/api/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description || undefined,
          cloudinaryId: uploadResult.public_id,
          url: uploadResult.secure_url,
          thumbnail: uploadResult.secure_url.replace('/upload/', '/upload/so_0/').replace(/\.\w+$/, '.jpg'),
          duration: Math.round(uploadResult.duration ?? 0),
        }),
      })

      setShowUpload(false)
      setForm({ title: '', description: '' })
      load()
    } catch (err: any) {
      setError(err.message ?? 'Upload failed')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  async function togglePublish(video: VideoItem) {
    await fetch(`/api/videos/${video.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ published: !video.published }) })
    load()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this video?')) return
    await fetch(`/api/videos/${id}`, { method: 'DELETE' }); load()
  }

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Videos</h1>
          <p className="text-gray-500 text-sm mt-0.5">{videos.length} videos · publicly streamable</p>
        </div>
        <button onClick={() => setShowUpload(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Upload Video
        </button>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="card w-full max-w-lg p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-gray-900 text-lg flex items-center gap-2"><Upload size={18} /> Upload Video</h3>
              <button onClick={() => setShowUpload(false)}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
            </div>
            <form onSubmit={handleUpload} className="space-y-4">
              {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">{error}</div>}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Title *</label>
                <input className="input" required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Video title" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <textarea className="input resize-none" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Video File *</label>
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:border-brand-400 transition-colors cursor-pointer" onClick={() => fileRef.current?.click()}>
                  <Video size={24} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">Click to select a video file</p>
                  <p className="text-xs text-gray-400 mt-1">MP4, MOV, AVI up to 2GB</p>
                  <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={e => e.target.files?.[0] && setForm(f => ({ ...f, _fileName: e.target.files![0].name } as any))} />
                </div>
                {(form as any)._fileName && <p className="text-xs text-green-600 mt-1">✓ {(form as any)._fileName}</p>}
              </div>

              {uploading && (
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Uploading…</span><span>{uploadProgress}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-500 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowUpload(false)} className="btn-secondary flex-1" disabled={uploading}>Cancel</button>
                <button type="submit" disabled={uploading} className="btn-primary flex-1">{uploading ? `Uploading ${uploadProgress}%…` : 'Upload'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Video grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" />
        </div>
      ) : videos.length === 0 ? (
        <div className="card p-16 text-center text-gray-400">
          <Video size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No videos yet</p>
          <p className="text-sm mt-1">Upload your first video to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map(video => (
            <div key={video.id} className="card overflow-hidden group">
              <div className="relative aspect-video bg-gray-900">
                {video.thumbnail
                  ? <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center"><Video size={32} className="text-gray-600" /></div>
                }
                {video.duration && (
                  <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                    {formatDuration(video.duration)}
                  </span>
                )}
                {!video.published && (
                  <span className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-0.5 rounded font-medium">Draft</span>
                )}
              </div>
              <div className="p-3">
                <p className="font-medium text-gray-900 text-sm truncate">{video.title}</p>
                {video.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{video.description}</p>}
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-gray-400">{video.views} views</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => togglePublish(video)} className={`p-1.5 rounded-md transition-colors ${video.published ? 'text-green-500 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`} title={video.published ? 'Unpublish' : 'Publish'}>
                      {video.published ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                    <button onClick={() => handleDelete(video.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
