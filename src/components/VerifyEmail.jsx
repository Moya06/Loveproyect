import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Heart, Check, X } from 'lucide-react'

import { API_URL } from '../config'

export default function VerifyEmail() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    verifyToken()
  }, [token])

  const verifyToken = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/verify/${token}`)
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error)
      
      setStatus('success')
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'linear-gradient(135deg, #0a0a0f 0%, #1a0a0a 50%, #0d0d1a 100%)' }}>
      <div className="absolute inset-0 pattern-hearts opacity-20" />
      
      <div className="relative z-10 w-full max-w-md text-center">
        {status === 'loading' && (
          <>
            <Heart className="w-16 h-16 mx-auto text-accent animate-pulse mb-4" />
            <h2 className="font-playfair text-2xl text-cream mb-2">Verificando...</h2>
            <p className="text-cream/50">Espera un momento</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="w-20 h-20 mx-auto rounded-full bg-green-500/20 flex items-center justify-center mb-4">
              <Check className="w-10 h-10 text-green-400" />
            </div>
            <h2 className="font-playfair text-2xl text-green-400 mb-2">Cuenta Verificada!</h2>
            <p className="text-cream/50 mb-4">Tu cuenta ha sido activada correctamente.</p>
            <p className="text-cream/30 text-sm">Redirigiendo al login...</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="w-20 h-20 mx-auto rounded-full bg-red-500/20 flex items-center justify-center mb-4">
              <X className="w-10 h-10 text-red-400" />
            </div>
            <h2 className="font-playfair text-2xl text-red-400 mb-2">Error de Verificacion</h2>
            <p className="text-cream/50 mb-4">El enlace expiro o es invalido.</p>
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-3 rounded-xl bg-accent text-white font-semibold hover:scale-105 transition-transform"
            >
              Volver al Login
            </button>
          </>
        )}
      </div>
    </div>
  )
}
