'use client'
import { useEffect, useState } from 'react'
import { Plus, Trash2, Flag } from 'lucide-react'

interface Task {
  id: string; title: string; description: string | null; status: string
  priority: string; dueDate: string | null; project: { name: string; color: string } | null
}

const COLUMNS = [
  { key: 'TODO', label: 'To Do', bg: 'bg-gray-100', dot: 'bg-gray-400' },
  { key: 'IN_PROGRESS', label: 'In Progress', bg: 'bg-blue-50', dot: 'bg-brand-500' },
  { key: 'IN_REVIEW', label: 'In Review', bg: 'bg-amber-50', dot: 'bg-amber-400' },
  { key: 'DONE', label: 'Done', bg: 'bg-green-50', dot: 'bg-emerald-500' },
]

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'text-gray-400',
  MEDIUM: 'text-blue-400',
  HIGH: 'text-orange-400',
  URGENT: 'text-red-500',
}

function Modal({ onClose, onSave }: { onClose: () => void; onSave: (data: any) => void }) {
  const [form, setForm] = useState({ title: '', description: '', priority: 'MEDIUM', status: 'TODO' })
  const [saving, setSaving] = useState(false)
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    await onSave(form)
    setSaving(false)
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="card w-full max-w-md p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-gray-900 text-lg">New Task</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Title *</label>
            <input className="input" required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
            <textarea className="input resize-none" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
              <select className="input" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                {['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'].map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Creating…' : 'Create Task'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function TaskCard({ task, onDelete, onMove }: { task: Task; onDelete: (id: string) => void; onMove: (id: string, status: string) => void }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm hover:shadow-md transition-shadow group">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-gray-900 leading-snug flex-1">{task.title}</p>
        <button onClick={() => onDelete(task.id)} className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-red-500 transition-all shrink-0">
          <Trash2 size={13} />
        </button>
      </div>
      {task.description && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{task.description}</p>}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-1">
          <Flag size={11} className={PRIORITY_COLORS[task.priority]} />
          <span className="text-xs text-gray-400">{task.priority}</span>
        </div>
        <select
          value={task.status}
          onChange={e => onMove(task.id, e.target.value)}
          className="text-xs border border-gray-200 rounded px-1.5 py-0.5 bg-white focus:outline-none focus:ring-1 focus:ring-brand-400"
        >
          {['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'].map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
      </div>
      {task.project && (
        <div className="mt-2 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: task.project.color }} />
          <span className="text-xs text-gray-400 truncate">{task.project.name}</span>
        </div>
      )}
    </div>
  )
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  async function load() {
    setLoading(true)
    const r = await fetch('/api/tasks')
    const d = await r.json()
    setTasks(d.tasks ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleCreate(data: any) {
    await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    setShowModal(false); load()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this task?')) return
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' }); load()
  }

  async function handleMove(id: string, status: string) {
    await fetch(`/api/tasks/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
    load()
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" />
    </div>
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-500 text-sm mt-0.5">{tasks.length} total tasks</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Task
        </button>
      </div>

      {/* Kanban board */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {COLUMNS.map(col => {
          const colTasks = tasks.filter(t => t.status === col.key)
          return (
            <div key={col.key} className={`${col.bg} rounded-xl p-3 min-h-[400px]`}>
              <div className="flex items-center gap-2 mb-3 px-1">
                <span className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{col.label}</span>
                <span className="ml-auto text-xs font-medium text-gray-400 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                  {colTasks.length}
                </span>
              </div>
              <div className="space-y-2">
                {colTasks.map(task => (
                  <TaskCard key={task.id} task={task} onDelete={handleDelete} onMove={handleMove} />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {showModal && <Modal onClose={() => setShowModal(false)} onSave={handleCreate} />}
    </div>
  )
}
