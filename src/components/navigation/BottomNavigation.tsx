import { NavLink } from 'react-router-dom'

const items = [
  { to: '/home', label: 'Home', icon: '🏠' },
  { to: '/explore', label: 'Explorar', icon: '🔎' },
  { to: '/teams', label: 'Teams', icon: '👥' },
  { to: '/tournaments', label: 'Torneios', icon: '🏆' },
  { to: '/profile', label: 'Perfil', icon: '👤' }
]

export default function BottomNavigation() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-base-800/95 backdrop-blur border-t border-base-600 flex justify-around items-center h-16 z-40"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center text-xs gap-0.5 px-2 py-1 rounded-lg transition-colors ${
              isActive ? 'text-accent' : 'text-white/50'
            }`
          }
        >
          <span className="text-lg leading-none">{item.icon}</span>
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}
