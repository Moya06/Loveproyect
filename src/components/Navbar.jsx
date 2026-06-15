import { useState } from 'react'
import { Heart, Menu, X, User, LogOut, Layout, Crown } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

export default function Navbar({ user, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  const isCupido = user?.role === 'cupido'

  const navLinks = [
    { href: '/', label: 'Mis Paginas', icon: Layout },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-[999] px-6 py-4 flex justify-between items-center bg-dark/90 backdrop-blur-2xl border-b border-white/5">
      <Link to="/" className="flex items-center gap-3">
        <Heart className="w-6 h-6 text-accent fill-accent animate-pulse" />
        <span className="font-great text-2xl text-gradient-romantic">
          {isCupido ? 'Cupido' : 'Nuestro Amor'}
        </span>
      </Link>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2 text-cream/60 text-sm">
          <User className="w-4 h-4" />
          <span>{user?.name}</span>
          {isCupido && <span className="text-amber-400 text-xs">(Cupido)</span>}
        </div>
        
        <button
          onClick={onLogout}
          className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg text-cream/60 hover:text-cream hover:bg-white/5 transition-colors text-sm"
        >
          <LogOut className="w-4 h-4" />
          Salir
        </button>

        <button
          className="md:hidden w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-cream"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <ul className={`md:hidden absolute top-full left-0 right-0 glass-accent p-6 mt-2 mx-2 rounded-2xl border border-accent/20 ${menuOpen ? 'flex' : 'hidden'}`}>
        {navLinks.map(link => {
          const Icon = link.icon
          return (
            <li key={link.href}>
              <Link
                to={link.href}
                className="flex items-center gap-2 text-cream/80 no-underline text-sm py-3 px-4 rounded-xl hover:text-cream hover:bg-white/5 transition-all"
                onClick={() => setMenuOpen(false)}
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </Link>
            </li>
          )
        })}
        <li>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 text-cream/60 hover:text-cream py-3 px-4 w-full text-sm"
          >
            <LogOut className="w-4 h-4" />
            Salir
          </button>
        </li>
      </ul>
    </nav>
  )
}
