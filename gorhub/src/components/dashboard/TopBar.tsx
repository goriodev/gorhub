'use client'
import { signOut } from 'next-auth/react'
import { LogOut, Bell } from 'lucide-react'

export function TopBar({ user }: { user: any }) {
  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
      <div />
      <div className="flex items-center gap-3">
        <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-brand-500 rounded-full" />
        </button>
        <div className="flex items-center gap-2.5 pl-3 border-l border-gray-200">
          <div className="w-8 h-8 bg-brand-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
            {user?.name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-900 leading-none">{user?.name}</p>
            <p className="text-xs text-gray-500 mt-0.5">{user?.email}</p>
          </div>
        </div>
        <button onClick={() => signOut({ callbackUrl: '/login' })}
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
          <LogOut size={16} />
        </button>
      </div>
    </header>
  )
}
