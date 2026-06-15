import { useState } from 'react'
import { Heart, LogIn, User, Crown, Mail, Lock, UserPlus, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

import { API_URL } from '../config'

export default function Login({ onLogin, onCupidoLogin }) {
  const [isRegister, setIsRegister] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [verificationUrl, setVerificationUrl] = useState('')
  const [showCupidoInput, setShowCupidoInput] = useState(false)
  const [cupidoCode, setCupidoCode] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    setVerificationUrl('')

    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login'
      const body = isRegister
        ? { email: form.email, password: form.password, name: form.name }
        : { email: form.email, password: form.password }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      let data
      const contentType = res.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        data = await res.json()
      } else {
        const text = await res.text()
        // Si la respuesta es HTML (error del servidor/proxy), mostrar mensaje util
        const cleanText = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120)
        throw new Error(cleanText || `Error HTTP ${res.status}`)
      }

      if (!res.ok) throw new Error(data.error || data.message || `Error HTTP ${res.status}`)

      if (isRegister) {
        setSuccess(data.message)
        if (data.verification_url) {
          setVerificationUrl(data.verification_url)
        }
        setForm({ ...form, password: '' })
      } else {
        onLogin(data)
      }
    } catch (err) {
      console.error('Login error:', err)
      if (err.name === 'AbortError') {
        setError('El servidor tardo demasiado en responder. Intenta de nuevo.')
      } else {
        setError(err.message || 'No se pudo conectar con el servidor. Intenta de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCupidoLogin = () => {
    if (cupidoCode === 'cupido2024') {
      onCupidoLogin({ id: 'cupido-admin', name: 'Cupido', role: 'cupido', email: 'cupido@amor.com' })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'linear-gradient(135deg, #0a0a0f 0%, #1a0a0a 50%, #0d0d1a 100%)' }}>
      <div className="absolute inset-0 pattern-hearts opacity-20" />
      
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <Heart className="w-16 h-16 mx-auto text-accent fill-accent animate-pulse mb-4" />
          <h1 className="font-great text-4xl text-gradient-romantic mb-2">Nuestro Amor</h1>
          <p className="text-cream/50">Crea paginas romanticas personalizadas</p>
        </div>

        <div className="glass-accent rounded-3xl p-8">
          <div className="flex mb-6 border-b border-white/10">
            <button
              onClick={() => { setIsRegister(false); setError(''); setSuccess('') }}
              className={`flex-1 pb-3 text-center transition-colors ${!isRegister ? 'text-accent border-b-2 border-accent' : 'text-cream/50'}`}
            >
              Iniciar Sesion
            </button>
            <button
              onClick={() => { setIsRegister(true); setError(''); setSuccess('') }}
              className={`flex-1 pb-3 text-center transition-colors ${isRegister ? 'text-accent border-b-2 border-accent' : 'text-cream/50'}`}
            >
              Registrarse
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 text-sm text-center">
              {success}
              {verificationUrl && (
                <div className="mt-3 pt-3 border-t border-green-500/20">
                  <p className="text-xs mb-2">Click para verificar tu cuenta:</p>
                  <a href={verificationUrl} className="text-accent hover:underline break-all text-xs">
                    {verificationUrl}
                  </a>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="text-cream/60 text-sm block mb-2">Nombre</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cream/30" />
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="Tu nombre completo"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-cream placeholder:text-cream/30 focus:border-accent/50 focus:outline-none transition-colors"
                    required
                  />
                </div>
              </div>
            )}
            
            <div>
              <label className="text-cream/60 text-sm block mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cream/30" />
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="tu@email.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-cream placeholder:text-cream/30 focus:border-accent/50 focus:outline-none transition-colors"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="text-cream/60 text-sm block mb-2">Contrasena</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cream/30" />
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="Minimo 6 caracteres"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-cream placeholder:text-cream/30 focus:border-accent/50 focus:outline-none transition-colors"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-accentDark to-accent text-white font-semibold tracking-wide hover:scale-105 transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                'Cargando...'
              ) : isRegister ? (
                <>
                  <UserPlus className="w-5 h-5" />
                  Crear Cuenta
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Iniciar Sesion
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/10">
            <button
              onClick={() => setShowCupidoInput(!showCupidoInput)}
              className="w-full text-center text-cream/30 text-xs hover:text-amber-400 transition-colors"
            >
              Acceso Administrador
            </button>
            {showCupidoInput && (
              <div className="mt-3 flex gap-2">
                <input
                  type="password"
                  value={cupidoCode}
                  onChange={e => setCupidoCode(e.target.value)}
                  placeholder="Codigo secreto"
                  className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-amber-500/30 text-cream text-sm focus:border-amber-500/50 focus:outline-none"
                  onKeyDown={e => e.key === 'Enter' && handleCupidoLogin()}
                />
                <button
                  onClick={handleCupidoLogin}
                  className="px-4 py-2 rounded-lg bg-amber-600/20 border border-amber-500/30 text-amber-400 text-sm hover:bg-amber-600/30"
                >
                  <Crown className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
