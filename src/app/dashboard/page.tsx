'use client'
import { useEffect, useState } from 'react'
import { Package, ShoppingCart, DollarSign, CheckSquare, TrendingUp, Clock } from 'lucide-react'

interface Stats {
  totalProducts: number
  totalOrders: number
  revenue: number
  taskStats: Record<string, number>
  recentOrders: any[]
}

function StatCard({ label, value, icon: Icon, color, sub }: any) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
    </div>
  )
}

const statusColors: Record<string, string> = {
  PENDING: 'badge bg-yellow-100 text-yellow-700',
  PROCESSING: 'badge bg-blue-100 text-blue-700',
  SHIPPED: 'badge bg-purple-100 text-purple-700',
  DELIVERED: 'badge bg-green-100 text-green-700',
  CANCELLED: 'badge bg-red-100 text-red-700',
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(setStats).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" />
    </div>
  )

  const doneTasks = stats?.taskStats?.DONE ?? 0
  const totalTasks = Object.values(stats?.taskStats ?? {}).reduce((s, v) => s + v, 0)

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Your business at a glance</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Products" value={stats?.totalProducts ?? 0} icon={Package} color="bg-brand-500" />
        <StatCard label="Total Orders" value={stats?.totalOrders ?? 0} icon={ShoppingCart} color="bg-violet-500" />
        <StatCard label="Revenue" value={`$${(stats?.revenue ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={DollarSign} color="bg-emerald-500" />
        <StatCard label="Tasks Done" value={`${doneTasks}/${totalTasks}`} icon={CheckSquare} color="bg-amber-500" sub={totalTasks ? `${Math.round((doneTasks / totalTasks) * 100)}% complete` : undefined} />
      </div>

      {/* Task progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-brand-500" />
            <h2 className="font-semibold text-gray-900">Task Progress</h2>
          </div>
          <div className="space-y-3">
            {[
              { label: 'To Do', key: 'TODO', color: 'bg-gray-200' },
              { label: 'In Progress', key: 'IN_PROGRESS', color: 'bg-brand-500' },
              { label: 'In Review', key: 'IN_REVIEW', color: 'bg-amber-400' },
              { label: 'Done', key: 'DONE', color: 'bg-emerald-500' },
            ].map(({ label, key, color }) => {
              const count = stats?.taskStats?.[key] ?? 0
              const pct = totalTasks ? (count / totalTasks) * 100 : 0
              return (
                <div key={key}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{label}</span>
                    <span className="font-medium text-gray-900">{count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} className="text-brand-500" />
            <h2 className="font-semibold text-gray-900">Recent Orders</h2>
          </div>
          <div className="space-y-3">
            {(stats?.recentOrders ?? []).length === 0 && (
              <p className="text-gray-400 text-sm">No orders yet</p>
            )}
            {(stats?.recentOrders ?? []).map((order: any) => (
              <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{order.orderNumber}</p>
                  <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={statusColors[order.status] ?? 'badge bg-gray-100 text-gray-600'}>
                    {order.status}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">${order.total.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
