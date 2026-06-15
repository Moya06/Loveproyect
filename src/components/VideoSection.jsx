import { useState, useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Film, Camera, Download, Loader, Music, Zap, Award, Play, Eye, Trash2, Settings2 } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

import { API_URL } from '../config'

export default function VideoSection({ user, photos }) {
  const [videos, setVideos] = useState([])
  const [currentVideo, setCurrentVideo] = useState(null)
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [checking, setChecking] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [videoTitle, setVideoTitle] = useState('Mi Video del Amor')
  const sectionRef = useRef(null)

  useEffect(() => {
    if (user) fetchVideos()
  }, [user])

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.video-animate',
        { opacity: 0, y: 60, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 1, stagger: 0.2, ease: 'power3.out', scrollTrigger: { trigger: sectionRef.current, start: 'top 70%' } }
      )
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  const fetchVideos = async () => {
    try {
      const res = await fetch(`${API_URL}/videos`, { headers: { 'x-user-id': user?.id } })
      const data = await res.json()
      setVideos(data)
    } catch (err) {
      console.error('Error fetching videos:', err)
    }
  }

  const createVideo = async () => {
    if (photos.length < 2) {
      alert('Necesitas al menos 2 fotos')
      return
    }
    setChecking(true)
    try {
      const res = await fetch(`${API_URL}/videos`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user?.id
        },
        body: JSON.stringify({ title: videoTitle })
      })
      const video = await res.json()
      setVideos([video, ...videos])
      setShowCreateForm(false)
      setCurrentVideo(video)
    } catch (err) {
      console.error('Error creating video:', err)
    }
    setChecking(false)
  }

  const generateVideo = async (videoId) => {
    setChecking(true)
    let pollCount = 0
    const poll = async () => {
      try {
        const res = await fetch(`${API_URL}/videos/${videoId}`, { headers: { 'x-user-id': user?.id } })
        const video = await res.json()
        setCurrentVideo(video)
        
        if (video.status === 'processing' && pollCount < 120) {
          pollCount++
          setTimeout(poll, 1000)
        } else {
          setChecking(false)
          if (video.status === 'completed') {
            fetchVideos()
          }
        }
      } catch (err) {
        console.error('Polling error:', err)
        setChecking(false)
      }
    }
    
    try {
      await fetch(`${API_URL}/videos/${videoId}/generate`, { 
        method: 'POST',
        headers: { 'x-user-id': user?.id }
      })
      poll()
    } catch (err) {
      console.error('Error generating:', err)
      setChecking(false)
    }
  }

  const deleteVideo = async (videoId) => {
    if (!confirm('¿Eliminar este video?')) return
    try {
      await fetch(`${API_URL}/videos/${videoId}`, { 
        method: 'DELETE',
        headers: { 'x-user-id': user?.id }
      })
      setVideos(videos.filter(v => v.id !== videoId))
      if (currentVideo?.id === videoId) setCurrentVideo(null)
    } catch (err) {
      console.error('Error deleting:', err)
    }
  }

  const streamVideo = (videoId) => {
    window.open(`${API_URL}/videos/${videoId}/stream`, '_blank')
  }

  if (!user) {
    return (
      <section ref={sectionRef} id="video" className="py-32 px-6 relative" style={{ background: 'linear-gradient(180deg, #0a0a0f, #1a0a0a, #0a0a0f)' }}>
        <div className="absolute inset-0 pattern-hearts opacity-20" />
        <div className="relative z-10 max-w-4xl mx-auto text-center py-24">
          <Film className="w-16 h-16 mx-auto text-accent/40 mb-4" />
          <h3 className="font-playfair text-2xl text-cream mb-3">Inicia sesion para crear videos</h3>
          <p className="text-cream/50">Usa el boton de iniciar sesion en la navegacion</p>
        </div>
      </section>
    )
  }

  return (
    <section ref={sectionRef} id="video" className="py-32 px-6 relative" style={{ background: 'linear-gradient(180deg, #0a0a0f, #1a0a0a, #0a0a0f)' }}>
      <div className="absolute inset-0 pattern-hearts opacity-20" />
      
      <div className="relative z-10 max-w-5xl mx-auto">
        <div className="video-animate opacity-0 text-center mb-12">
          <Film className="w-16 h-16 mx-auto text-accent mb-4" />
          <h2 className="font-playfair text-4xl md:text-6xl font-bold mt-6 mb-4 text-gradient-romantic">
            Crea Tu Video
          </h2>
          <p className="font-great text-xl md:text-2xl text-accent/70">{photos.length} fotos listas</p>
        </div>

        {photos.length >= 2 && !currentVideo && (
          <div className="video-animate opacity-0 glass-accent rounded-[2rem] p-8 md:p-12 mb-8">
            <div className="text-center">
              <Camera className="w-12 h-12 mx-auto text-accent/60 mb-4" />
              <p className="text-cream/60 mb-6">Crea un video con todas tus fotos</p>
              {!showCreateForm ? (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="px-10 py-4 rounded-full bg-gradient-to-r from-accentDark via-accent to-rose-600 text-white font-semibold text-lg tracking-wider uppercase transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(231,76,60,0.5)] flex items-center gap-3 mx-auto"
                >
                  <Zap className="w-5 h-5" />
                  Crear Nuevo Video
                </button>
              ) : (
                <div className="max-w-md mx-auto">
                  <input
                    type="text"
                    value={videoTitle}
                    onChange={e => setVideoTitle(e.target.value)}
                    placeholder="Titulo del video"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-cream mb-4 focus:border-accent/50 focus:outline-none"
                  />
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={createVideo}
                      disabled={checking}
                      className="px-8 py-3 rounded-full bg-accent text-white font-semibold transition-all hover:scale-105 disabled:opacity-50"
                    >
                      Crear
                    </button>
                    <button
                      onClick={() => setShowCreateForm(false)}
                      className="px-8 py-3 rounded-full glass text-cream/70 transition-all hover:bg-white/10"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {currentVideo && (
          <div className="video-animate opacity-0 glass-accent rounded-[2rem] p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-playfair text-xl text-cream">{currentVideo.title}</h3>
                <p className="text-cream/50 text-sm">
                  {currentVideo.status === 'completed' ? 'Completado' : currentVideo.status === 'processing' ? 'Generando...' : 'Listo para generar'}
                </p>
              </div>
              <button
                onClick={() => setCurrentVideo(null)}
                className="text-cream/60 hover:text-cream text-sm"
              >
                Cerrar
              </button>
            </div>

            {currentVideo.status === 'completed' ? (
              <div className="text-center py-6">
                <Award className="w-16 h-16 mx-auto text-accent mb-4" />
                <p className="text-xl text-accent mb-6 font-semibold">Video listo!</p>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => streamVideo(currentVideo.id)}
                    className="px-8 py-3 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold flex items-center gap-2 hover:scale-105 transition-transform"
                  >
                    <Play className="w-5 h-5" />
                    Ver Video
                  </button>
                  <button
                    onClick={() => generateVideo(currentVideo.id)}
                    className="px-8 py-3 rounded-full glass text-cream hover:bg-white/10 transition-colors"
                  >
                    Regenerar
                  </button>
                </div>
              </div>
            ) : currentVideo.status === 'processing' ? (
              <div className="py-6">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Loader className="w-6 h-6 animate-spin text-accent" />
                  <span className="text-cream/80">Generando video...</span>
                </div>
                <div className="w-full max-w-md mx-auto h-3 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-accent via-rose-500 to-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${currentVideo.progress || 0}%` }}
                  />
                </div>
                <p className="text-center text-cream/50 text-sm mt-3">{currentVideo.progress || 0}%</p>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-cream/60 mb-6">El video esta listo para generarse</p>
                <button
                  onClick={() => generateVideo(currentVideo.id)}
                  disabled={checking}
                  className="px-10 py-4 rounded-full bg-gradient-to-r from-accentDark via-accent to-rose-600 text-white font-semibold text-lg tracking-wider uppercase transition-all duration-300 hover:scale-105 disabled:opacity-50 flex items-center gap-3 mx-auto"
                >
                  <Zap className="w-5 h-5" />
                  Generar Video
                </button>
              </div>
            )}
          </div>
        )}

        {videos.length > 0 && (
          <div className="video-animate opacity-0">
            <h3 className="font-playfair text-xl text-cream mb-6 text-center">Mis Videos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {videos.map(video => (
                <div key={video.id} className="glass rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <h4 className="text-cream font-medium">{video.title}</h4>
                    <p className="text-cream/40 text-sm">{video.frame_count} fotos</p>
                  </div>
                  <div className="flex gap-2">
                    {video.status === 'completed' && (
                      <button
                        onClick={() => streamVideo(video.id)}
                        className="w-10 h-10 rounded-full bg-accent/20 text-accent flex items-center justify-center hover:bg-accent/30 transition-colors"
                      >
                        <Play className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteVideo(video.id)}
                      className="w-10 h-10 rounded-full bg-white/5 text-cream/60 flex items-center justify-center hover:bg-red-500/20 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="video-animate opacity-0 mt-12 grid grid-cols-3 gap-4 text-center text-sm text-cream/40">
          <div className="glass rounded-xl p-4">
            <Music className="w-6 h-6 mx-auto mb-2 text-accent" />
            <div>Musica romantica</div>
          </div>
          <div className="glass rounded-xl p-4">
            <Zap className="w-6 h-6 mx-auto mb-2 text-accent" />
            <div>Animaciones</div>
          </div>
          <div className="glass rounded-xl p-4">
            <Award className="w-6 h-6 mx-auto mb-2 text-accent" />
            <div>Calidad HD</div>
          </div>
        </div>
      </div>
    </section>
  )
}
