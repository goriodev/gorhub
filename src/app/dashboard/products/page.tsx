'use client'
import { useEffect, useState } from 'react'
import { Plus, Search, Pencil, Trash2, Package } from 'lucide-react'

interface Product { id: string; name: string; sku: string; price: number; stock: number; category: string | null; status: string }

const statusBadge: Record<string, string> = {
  ACTIVE: 'badge bg-green-100 text-green-700',
  INACTIVE: 'badge bg-gray-100 text-gray-600',
  OUT_OF_STOCK: 'badge bg-red-100 text-red-700',
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="card w-full max-w-md p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-gray-900 text-lg">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState({ name: '', sku: '', price: '', stock: '', category: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function load(q = search) {
    setLoading(true)
    const r = await fetch(`/api/products?search=${encodeURIComponent(q)}`)
    const d = await r.json()
    setProducts(d.products ?? [])
    setTotal(d.total ?? 0)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openCreate() {
    setEditing(null); setForm({ name: '', sku: '', price: '', stock: '', category: '' }); setError(''); setShowModal(true)
  }
  function openEdit(p: Product) {
    setEditing(p); setForm({ name: p.name, sku: p.sku, price: String(p.price), stock: String(p.stock), category: p.category ?? '' }); setError(''); setShowModal(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError('')
    const payload = { name: form.name, sku: form.sku, price: parseFloat(form.price), stock: parseInt(form.stock), category: form.category || undefined }
    const url = editing ? `/api/products/${editing.id}` : '/api/products'
    const method = editing ? 'PATCH' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error?.fieldErrors ? Object.values(data.error.fieldErrors).flat().join(', ') : data.error); return }
    setShowModal(false); load()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this product?')) return
    await fetch(`/api/products/${id}`, { method: 'DELETE' }); load()
  }

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 text-sm mt-0.5">{total} total products</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input className="input pl-9" placeholder="Search products…" value={search}
          onChange={e => { setSearch(e.target.value); load(e.target.value) }} />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Name', 'SKU', 'Category', 'Price', 'Stock', 'Status', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">
                  <div className="animate-spin w-6 h-6 border-4 border-brand-500 border-t-transparent rounded-full mx-auto" />
                </td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">
                  <Package size={32} className="mx-auto mb-2 opacity-40" />
                  No products found
                </td></tr>
              ) : products.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.sku}</td>
                  <td className="px-4 py-3 text-gray-500">{p.category ?? '—'}</td>
                  <td className="px-4 py-3 font-medium">${p.price.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={p.stock === 0 ? 'text-red-600 font-medium' : 'text-gray-900'}>{p.stock}</span>
                  </td>
                  <td className="px-4 py-3"><span className={statusBadge[p.status]}>{p.status.replace('_', ' ')}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(p)} className="p-1.5 text-gray-400 hover:text-brand-500 hover:bg-brand-50 rounded-md transition-colors"><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <Modal title={editing ? 'Edit Product' : 'Add Product'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSave} className="space-y-4">
            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">{error}</div>}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Name *</label>
                <input className="input" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">SKU *</label>
                <input className="input" required value={form.sku} disabled={!!editing} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                <input className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Price *</label>
                <input className="input" type="number" step="0.01" min="0" required value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Stock *</label>
                <input className="input" type="number" min="0" required value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
