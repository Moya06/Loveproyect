import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { Heart, Sparkles, Star, Music, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { API_URL } from '../config'

const floatingIcons = [Heart, Sparkles, Star, Music]

export default function PageViewer() {
  const { slug } = useParams()
  const [page, setPage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [displayedText, setDisplayedText] = useState('')
  const [showSignature, setShowSignature] = useState(false)
  const [celebrating, setCelebrating] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(-1)
  const [letterVisible, setLetterVisible] = useState(false)
  const [audioEnabled, setAudioEnabled] = useState(false)
  const canvasRef = useRef(null)
  const letterRef = useRef(null)
  const audioRef = useRef(null)
  const typingIntervalRef = useRef(null)

  useEffect(() => {
    fetchPage()
  }, [slug])

  useEffect(() => {
    if (!page?.settings?.background_audio || !audioRef.current) return
    const audio = audioRef.current
    audio.volume = 0.5
    audio.loop = true
    const playPromise = audio.play()
    if (playPromise !== undefined) {
      playPromise.then(() => setAudioEnabled(true)).catch(() => setAudioEnabled(false))
    }
    const enableAudio = () => {
      if (audio.paused) {
        audio.play().then(() => setAudioEnabled(true)).catch(() => {})
      }
    }
    window.addEventListener('click', enableAudio, { once: true })
    window.addEventListener('touchstart', enableAudio, { once: true })
    window.addEventListener('scroll', enableAudio, { once: true })
    return () => {
      window.removeEventListener('click', enableAudio)
      window.removeEventListener('touchstart', enableAudio)
      window.removeEventListener('scroll', enableAudio)
    }
  }, [page?.settings?.background_audio])

  useEffect(() => {
    if (!page?.counter_start_date) return
    const startDate = new Date(page.counter_start_date)
    const updateTimer = () => {
      const now = new Date()
      const diff = Math.max(0, now - startDate)
      setTime({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      })
    }
    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [page?.counter_start_date])

  useEffect(() => {
    if (!page?.letter?.content || !letterVisible || typingIntervalRef.current) return
    let i = 0
    const text = page.letter.content
    setDisplayedText('')
    setShowSignature(false)
    typingIntervalRef.current = setInterval(() => {
      setDisplayedText(text.slice(0, i + 1))
      i++
      if (i >= text.length) {
        clearInterval(typingIntervalRef.current)
        typingIntervalRef.current = null
        setShowSignature(true)
      }
    }, 25)
    return () => {
      clearInterval(typingIntervalRef.current)
      typingIntervalRef.current = null
    }
  }, [page?.letter?.content, letterVisible])

  useEffect(() => {
    if (!letterRef.current) return
    const checkVisible = () => {
      const rect = letterRef.current.getBoundingClientRect()
      const windowHeight = window.innerHeight || document.documentElement.clientHeight
      if (rect.top < windowHeight && rect.bottom > 0) {
        setLetterVisible(true)
      }
    }
    checkVisible()
    window.addEventListener('scroll', checkVisible, { passive: true })
    window.addEventListener('resize', checkVisible, { passive: true })
    return () => {
      window.removeEventListener('scroll', checkVisible)
      window.removeEventListener('resize', checkVisible)
    }
  }, [page?.letter])

  useEffect(() => {
    if (!celebrating) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    const colors = ['#e74c3c', '#f39c12', '#f1c40f', '#2ecc71', '#9b59b6', '#fff']
    const pieces = []

    class Piece {
      constructor() {
        this.x = Math.random() * canvas.width
        this.y = canvas.height + 20
        this.w = 8 + Math.random() * 10
        this.h = 6 + Math.random() * 8
        this.color = colors[Math.floor(Math.random() * colors.length)]
        this.vy = 3 + Math.random() * 4
        this.vx = (Math.random() - 0.5) * 3
        this.rotation = Math.random() * 360
        this.rotSpeed = (Math.random() - 0.5) * 8
        this.opacity = 1
      }
      update() {
        this.y -= this.vy
        this.x += this.vx
        this.rotation += this.rotSpeed
        this.vy += 0.03
        this.opacity -= 0.003
      }
      draw() {
        ctx.save()
        ctx.translate(this.x, this.y)
        ctx.rotate((this.rotation * Math.PI) / 180)
        ctx.globalAlpha = Math.max(0, this.opacity)
        ctx.fillStyle = this.color
        ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h)
        ctx.restore()
      }
    }

    for (let i = 0; i < 300; i++) pieces.push(new Piece())
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      pieces.forEach(p => { p.update(); p.draw() })
      pieces.splice(0, pieces.filter(p => p.y < -20 || p.opacity <= 0).length)
      if (pieces.length > 0) requestAnimationFrame(animate)
    }
    animate()
  }, [celebrating])

  const fetchPage = async () => {
    try {
      const res = await fetch(`${API_URL}/page/${slug}`)
      if (!res.ok) throw new Error('No encontrada')
      const data = await res.json()
      setPage(data)
    } catch (err) {
      console.error('Error:', err)
    }
    setLoading(false)
  }

  const navigateLightbox = (dir) => {
    setLightboxIndex(prev => (prev + dir + page.photos.length) % page.photos.length)
  }

  useEffect(() => {
    const handleKey = (e) => {
      if (lightboxIndex === -1) return
      if (e.key === 'Escape') setLightboxIndex(-1)
      if (e.key === 'ArrowLeft') navigateLightbox(-1)
      if (e.key === 'ArrowRight') navigateLightbox(1)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [lightboxIndex, page?.photos?.length])

  if (loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="text-center">
          <Heart className="w-12 h-12 mx-auto text-accent animate-pulse mb-4" />
          <p className="text-cream/50">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!page) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="text-center">
          <Heart className="w-16 h-16 mx-auto text-accent/30 mb-4" />
          <h1 className="font-playfair text-2xl text-cream mb-2">Pagina no encontrada</h1>
          <p className="text-cream/50">Esta pagina no existe o fue eliminada</p>
        </div>
      </div>
    )
  }

  const themeColors = page.settings?.theme_colors || { primary: '#e74c3c', secondary: '#f39c12', background: '#0a0a0f' }

  return (
    <div className="min-h-screen bg-dark text-cream overflow-x-hidden relative" style={{ background: `linear-gradient(180deg, ${themeColors.background}, #120a0a)` }}>
      <style>{`
        .text-gradient-romantic { background: linear-gradient(135deg, #f5e6d3, ${themeColors.primary}, ${themeColors.secondary}); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .glass { background: rgba(255,255,255,0.03); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.05); }
        .glass-accent { background: rgba(255,255,255,0.03); backdrop-filter: blur(20px); border: 1px solid ${themeColors.primary}40; }
        .pattern-hearts { background-image: radial-gradient(circle, ${themeColors.primary}20 1px, transparent 1px); background-size: 30px 30px; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fall-cascade { 0% { transform: translateY(-10vh) translateX(0) rotate(0deg); opacity: 0; } 10% { opacity: 0.5; } 90% { opacity: 0.3; } 100% { transform: translateY(110vh) translateX(40px) rotate(60deg); opacity: 0; } }
        .animate-fade-in-up { animation: fadeInUp 1s ease-out forwards; }
        .animate-fall-cascade { animation: fall-cascade linear infinite; }
      `}</style>

      {page.settings?.background_audio && (
        <audio ref={audioRef} src={page.settings.background_audio} preload="auto" className="hidden" />
      )}

      {page.settings?.background_audio && (
        <button
          onClick={() => {
            const audio = audioRef.current
            if (!audio) return
            if (audio.paused) {
              audio.play().then(() => setAudioEnabled(true)).catch(() => {})
            } else {
              audio.pause()
              setAudioEnabled(false)
            }
          }}
          className="fixed bottom-6 right-6 z-[100] w-12 h-12 rounded-full glass text-cream flex items-center justify-center transition-all hover:scale-110 hover:bg-accent/20"
          title={audioEnabled ? 'Pausar musica' : 'Reproducir musica'}
        >
          <Music className="w-5 h-5" />
          {!audioEnabled && <span className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full animate-pulse" />}
        </button>
      )}

      {page.settings?.particle_effects !== false && (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          {Array.from({ length: 30 }).map((_, i) => {
            const Icon = floatingIcons[i % floatingIcons.length]
            const softColors = [
              themeColors.primary,
              themeColors.secondary,
              '#ffb6c1',
              '#ffd700',
              '#ffffff',
              '#ff69b4',
              '#ffc0cb'
            ]
            const duration = 15 + Math.random() * 15
            const delay = Math.random() * 20
            const size = 14 + Math.random() * 18
            const drift = (Math.random() - 0.5) * 80
            return (
              <Icon
                key={i}
                className="absolute animate-fall-cascade"
                fill="currentColor"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: '-5vh',
                  color: softColors[i % softColors.length],
                  width: `${size}px`,
                  height: `${size}px`,
                  animationDelay: `${delay}s`,
                  animationDuration: `${duration}s`,
                  opacity: 0.35,
                  filter: 'drop-shadow(0 0 6px currentColor)'
                }}
              />
            )
          })}
        </div>
      )}

      <section className="min-h-screen flex items-center justify-center text-center relative overflow-hidden">
        <div className="absolute inset-0 pattern-hearts opacity-20" />
        <div className="relative z-10 p-6 max-w-4xl">
          <Heart className="w-16 h-16 mx-auto text-accent fill-accent animate-pulse mb-4" />
          <p className="font-great text-2xl text-accent mb-4 animate-fade-in-up opacity-0" style={{ animationDelay: '0.3s' }}>
            {page.hero_subtitle || 'Para el amor de mi vida'}
          </p>
          <h1 className="font-playfair text-[4rem] md:text-[7rem] font-bold text-gradient-romantic animate-fade-in-up opacity-0" style={{ animationDelay: '0.6s' }}>
            {page.hero_title || 'Mi Amor'}
          </h1>
          <div className="flex items-center justify-center gap-4 my-6 animate-fade-in-up opacity-0" style={{ animationDelay: '0.9s' }}>
            <div className="h-[1px] w-16 bg-gradient-to-r from-transparent to-accent" />
            <Heart className="w-6 h-6 text-accent fill-accent" />
            <div className="h-[1px] w-16 bg-gradient-to-l from-transparent to-accent" />
          </div>
          <p className="text-cream/60 text-sm tracking-[4px] uppercase animate-fade-in-up opacity-0" style={{ animationDelay: '1.2s' }}>
            {page.hero_date_text || 'Cada dia a tu lado es un regalo'}
          </p>
          <div className="mt-16 animate-bounce text-cream/30 text-xs">
            Desliza para descubrir
          </div>
        </div>
      </section>

      {page.counter_start_date && (
        <section className="py-20 px-6 text-center relative z-10">
          <h2 className="font-playfair text-3xl md:text-4xl text-gradient-romantic mb-8">Nuestro Tiempo Juntos</h2>
          <div className="flex justify-center gap-4 flex-wrap">
            {[
              { value: time.days, label: 'Dias' },
              { value: time.hours, label: 'Horas' },
              { value: time.minutes, label: 'Minutos' },
              { value: time.seconds, label: 'Segundos' },
            ].map(({ value, label }) => (
              <div key={label} className="glass-accent rounded-2xl p-6 min-w-[100px]">
                <div className="font-playfair text-4xl md:text-5xl font-bold text-gradient-romantic">{String(value).padStart(2, '0')}</div>
                <div className="text-xs uppercase tracking-[2px] text-cream/50 mt-2">{label}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {page.timeline?.length > 0 && (
        <section className="py-20 px-6 relative z-10" style={{ background: 'linear-gradient(180deg, #120a0a, #0a0a0f)' }}>
          <h2 className="font-playfair text-3xl md:text-4xl text-center text-gradient-romantic mb-12">Nuestra Historia</h2>
          <div className="max-w-2xl mx-auto relative pl-8">
            <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-accent to-transparent" />
            {page.timeline.map((item, i) => (
              <div key={i} className="relative mb-8 last:mb-0">
                <div className="absolute -left-[36px] top-0 w-8 h-8 rounded-full bg-gradient-to-br from-accent to-rose-600 flex items-center justify-center text-sm text-white font-bold">
                  {i + 1}
                </div>
                <div className="glass-accent rounded-xl p-4 ml-4">
                  <div className="text-xs text-accent tracking-[2px] uppercase mb-1">{item.date_label}</div>
                  <h3 className="font-playfair text-lg text-cream mb-2">{item.title}</h3>
                  <p className="text-cream/60 text-sm">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {page.photos?.length > 0 && (
        <section className="py-20 px-6 relative z-10" style={{ background: 'linear-gradient(180deg, #0a0a0f, #120a0a)' }}>
          <h2 className="font-playfair text-3xl md:text-4xl text-center text-gradient-romantic mb-12">Galeria de Momentos</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {page.photos.map((photo, i) => (
              <div 
                key={photo.id} 
                className="aspect-square rounded-xl overflow-hidden cursor-pointer group bg-white/5"
                onClick={() => setLightboxIndex(i)}
              >
                <img 
                  src={photo.thumbnail_data || photo.image_data} 
                  alt="" 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                  loading="lazy" 
                  onError={(e) => { e.target.src = photo.image_data }}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {page.letter?.content && (
        <section ref={letterRef} className="py-20 px-6 relative z-10" style={{ background: 'linear-gradient(180deg, #120a0a, #0a0a0f)' }}>
          <h2 className="font-playfair text-3xl md:text-4xl text-center text-gradient-romantic mb-8">Una Carta para Ti</h2>
          <div className="max-w-2xl mx-auto glass-accent rounded-[2rem] p-8 md:p-12">
            <div className="font-great text-2xl text-accent mb-4">{page.letter.greeting || 'Mi amor,'}</div>
            <p className="text-cream/80 leading-relaxed whitespace-pre-wrap break-words">
              {displayedText}
              <span className="inline-block w-[2px] h-[1em] bg-accent ml-1 animate-pulse" />
            </p>
            {showSignature && page.letter.signature_text && (
              <p className="font-great text-xl text-accent mt-6 text-right">{page.letter.signature_text}</p>
            )}
          </div>
        </section>
      )}

      {page.videos?.length > 0 && (
        <section className="py-20 px-6 text-center relative z-10">
          <h2 className="font-playfair text-3xl text-gradient-romantic mb-6">
            {page.videos.length === 1 ? 'Nuestro Video' : 'Nuestros Videos'}
          </h2>
          <div className="max-w-4xl mx-auto space-y-8">
            {page.videos.filter(v => v.status === 'completed').map(video => (
              <div key={video.id} className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                <video
                  src={`${API_URL}/videos/${video.id}/stream`}
                  controls
                  className="w-full max-h-[70vh]"
                  playsInline
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {page.settings?.celebration_enabled !== false && (
        <section className="py-20 px-6 text-center relative z-10">
          <button
            onClick={() => setCelebrating(true)}
            className="px-12 py-5 rounded-full bg-gradient-to-r from-accentDark via-accent to-rose-600 text-white font-playfair text-xl hover:scale-105 transition-transform shadow-lg"
          >
            Celebremos nuestro amor!
          </button>
        </section>
      )}

      <footer className="py-8 text-center border-t border-white/5 relative z-10">
        <div className="flex justify-center gap-2 mb-4">
          {[1, 2, 3, 4, 5].map(i => (
            <Heart key={i} className="w-5 h-5 text-accent fill-accent animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
          ))}
        </div>
        <p className="text-cream/30 text-sm">Hecho con amor para {page.flecha_name || 'ti'}</p>
        <p className="text-cream/20 text-xs mt-2">{page.corazon_name || ''}</p>
      </footer>

      {lightboxIndex !== -1 && (
        <div 
          className="fixed inset-0 z-[3000] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4"
          onClick={() => setLightboxIndex(-1)}
        >
          <button className="absolute top-6 right-6 text-cream/80 hover:text-cream z-10">
            <X className="w-8 h-8" />
          </button>
          {page.photos.length > 1 && (
            <>
              <button 
                onClick={(e) => { e.stopPropagation(); navigateLightbox(-1) }}
                className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 text-cream/80 hover:text-cream"
              >
                <ChevronLeft className="w-10 h-10" />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); navigateLightbox(1) }}
                className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 text-cream/80 hover:text-cream"
              >
                <ChevronRight className="w-10 h-10" />
              </button>
            </>
          )}
          <img 
            src={page.photos[lightboxIndex].image_data} 
            alt="" 
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}

      {celebrating && <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[4000]" />}
    </div>
  )
}