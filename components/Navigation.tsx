'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/members', label: 'Members', icon: '👥' },
  { href: '/meetings', label: 'Meetings', icon: '📅' },
  { href: '/reports', label: 'Reports', icon: '📊' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
]

export default function Navigation() {
  const pathname = usePathname()

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 min-h-screen bg-blue-900 text-white fixed left-0 top-0">
        <div className="px-4 py-5 border-b border-blue-800">
          <div className="text-sm font-bold leading-tight">Sacrament</div>
          <div className="text-xs text-blue-300">Speaker Tracker</div>
        </div>
        <nav className="flex-1 py-4 space-y-1 px-2">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  active ? 'bg-blue-700 text-white' : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-blue-900 flex border-t border-blue-800 z-50">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center py-2 text-xs font-medium transition ${
                active ? 'text-white' : 'text-blue-300'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
