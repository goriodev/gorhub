'use client'
import { useEffect, useState } from 'react'
import { ShoppingCart, ChevronDown } from 'lucide-react'

interface OrderItem { id: string; quantity: number; unitPrice: number; product: { name: string } }
interface Order { id: string; orderNumber: string; status: string; total: number; createdAt: string; items: OrderItem[] }

const statusColors: Record<string, string> = {
  PENDING: 'badge bg-yellow-100 text-yellow-700',
  PROCESSING: 'badge bg-blue-100 text-blue-700',
  SHIPPED: 'badge bg-purple-100 text-purple-700',
  DELIVERED: 'badge bg-green-100 text-green-700',
  CANCELLED: 'badge bg-red-100 text-red-700',
}

const ALL_STATUSES = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [total, setTotal] = useState(0)
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  async function load(status = filter) {
    setLoading(true)
    const r = await fetch(`/api/orders?${status ? `status=${status}` : ''}`)
    const d = await r.json()
    setOrders(d.orders ?? [])
    setTotal(d.total ?? 0)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/orders/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
    load()
  }

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-500 text-sm mt-0.5">{total} total orders</p>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {[{ label: 'All', value: '' }, ...ALL_STATUSES.map(s => ({ label: s, value: s }))].map(({ label, value }) => (
          <button key={value}
            onClick={() => { setFilter(value); load(value) }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              filter === value ? 'bg-brand-500 text-white border-brand-500' : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300'
            }`}
          >{label}</button>
        ))}
      </div>

      <div className="space-y-2">
        {loading ? (
          <div className="card p-12 flex justify-center">
            <div className="animate-spin w-6 h-6 border-4 border-brand-500 border-t-transparent rounded-full" />
          </div>
        ) : orders.length === 0 ? (
          <div className="card p-12 text-center text-gray-400">
            <ShoppingCart size={32} className="mx-auto mb-2 opacity-40" />
            No orders found
          </div>
        ) : orders.map(order => (
          <div key={order.id} className="card overflow-hidden">
            <div
              className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => setExpanded(expanded === order.id ? null : order.id)}
            >
              <div className="flex items-center gap-4">
                <ChevronDown size={16} className={`text-gray-400 transition-transform ${expanded === order.id ? 'rotate-180' : ''}`} />
                <div>
                  <p className="font-medium text-gray-900">{order.orderNumber}</p>
                  <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={order.status}
                  onClick={e => e.stopPropagation()}
                  onChange={e => updateStatus(order.id, e.target.value)}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                >
                  {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <span className="font-semibold text-gray-900 text-sm">${order.total.toFixed(2)}</span>
              </div>
            </div>

            {expanded === order.id && (
              <div className="border-t border-gray-100 px-5 py-4 bg-gray-50/50">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Items</p>
                <div className="space-y-2">
                  {order.items.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-700">{item.product.name} <span className="text-gray-400">× {item.quantity}</span></span>
                      <span className="font-medium text-gray-900">${(item.unitPrice * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
