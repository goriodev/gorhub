'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Package, ShoppingCart, CheckSquare, Zap, Video } from 'lucide-react'

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/products', label: 'Products', icon: Package },
  { href: '/dashboard/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/dashboard/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/dashboard/videos', label: 'Videos', icon: Video },
]

export function Sidebar() {
  const path = usePathname()

  return (
    <aside className="w-60 bg-gray-900 flex flex-col shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-gray-700/50">
        <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center shrink-0">
          <Zap className="w-4.5 h-4.5 text-white" size={18} />
        </div>
        <span className="font-bold text-white text-lg">GorHub</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = path === href || (href !== '/dashboard' && path.startsWith(href))
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                active
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-gray-700/50">
        <p className="text-xs text-gray-600 text-center">GorHub v1.0</p>
      </div>
    </aside>
  )
}
