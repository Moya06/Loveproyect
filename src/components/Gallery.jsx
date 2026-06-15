import { useState, useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Camera, X, ChevronLeft, ChevronRight, Image, Trash2, Plus, Eye, GripVertical, Settings2, Play } from 'lucide-react'
import AnimationPicker from './AnimationPicker'

gsap.registerPlugin(ScrollTrigger)

import { API_URL } from '../config'

export default function Gallery({ user, photos, onPhotosChange }) {
  const [lightboxIndex, setLightboxIndex] = useState(-1)
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [editingPhoto, setEditingPhoto] = useState(null)
  const [showAnimationPicker, setShowAnimationPicker] = useState(false)
  const [animations, setAnimations] = useState([])
  const fileInputRef = useRef(null)
  const gridRef = useRef(null)
  const sectionRef = useRef(null)

  useEffect(() => {
    fetchAnimations()
  }, [])

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.gallery-title',
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: sectionRef.current, start: 'top 70%' } }
      )
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  useEffect(() => {
    if (!gridRef.current || photos.length === 0) return
    const items = gridRef.current.querySelectorAll('.gallery-item')
    gsap.fromTo(items,
      { opacity: 0, scale: 0.8 },
      { opacity: 1, scale: 1, duration: 0.5, stagger: 0.05, ease: 'back.out(1.7)' }
    )
  }, [photos.length])

  const fetchAnimations = async () => {
    try {
      const res = await fetch(`${API_URL}/animations`)
      const data = await res.json()
      setAnimations(data)
    } catch (err) {
      console.error('Error fetching animations:', err)
    }
  }

  const openLightbox = (photo, index) => {
    setSelectedPhoto(photo)
    setLightboxIndex(index)
  }

  const closeLightbox = () => {
    setLightboxIndex(-1)
    setSelectedPhoto(null)
    setEditingPhoto(null)
  }

  const navigate = (dir) => {
    const newIndex = (lightboxIndex + dir + photos.length) % photos.length
    setLightboxIndex(newIndex)
    setSelectedPhoto(photos[newIndex])
  }

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0 || !user) return

    const file = files[0]
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        const maxSize = 1920
        let { width, height } = img
        if (width > maxSize || height > maxSize) {
          if (width > height) { height = (height / width) * maxSize; width = maxSize }
          else { width = (width / height) * maxSize; height = maxSize }
        }
        canvas.width = width
        canvas.height = height
        ctx.drawImage(img, 0, 0, width, height)
        const data = canvas.toDataURL('image/jpeg', 0.85)

        const thumbCanvas = document.createElement('canvas')
        const thumbCtx = thumbCanvas.getContext('2d')
        const thumbSize = 300
        thumbCanvas.width = thumbSize
        thumbCanvas.height = thumbSize
        const minDim = Math.min(img.width, img.height)
        const sx = (img.width - minDim) / 2
        const sy = (img.height - minDim) / 2
        thumbCtx.drawImage(img, sx, sy, minDim, minDim, 0, 0, thumbSize, thumbSize)
        const thumbnail = thumbCanvas.toDataURL('image/jpeg', 0.7)

        uploadImages([{ data, thumbnail, filename: file.name }])
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const uploadImages = async (images) => {
    try {
      const res = await fetch(`${API_URL}/photos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id
        },
        body: JSON.stringify({ images })
      })
      const newPhotos = await res.json()
      onPhotosChange([...photos, ...newPhotos])
    } catch (err) {
      console.error('Error uploading:', err)
    }
  }

  const handleDelete = async (e, photoId) => {
    e.stopPropagation()
    if (!confirm('¿Eliminar esta foto?')) return
    try {
      await fetch(`${API_URL}/photos/${photoId}`, { 
        method: 'DELETE',
        headers: { 'x-user-id': user?.id }
      })
      onPhotosChange(photos.filter(p => p.id !== photoId))
    } catch (err) {
      console.error('Error deleting:', err)
    }
  }

  const handleReorder = async (photoId, newOrder) => {
    try {
      await fetch(`${API_URL}/photos/${photoId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user?.id
        },
        body: JSON.stringify({ order_index: newOrder })
      })
      const updated = photos.map(p => p.id === photoId ? { ...p, order_index: newOrder } : p)
      updated.sort((a, b) => a.order_index - b.order_index)
      onPhotosChange(updated)
    } catch (err) {
      console.error('Error reordering:', err)
    }
  }

  const handleUpdateSettings = async (photoId, updates) => {
    try {
      const res = await fetch(`${API_URL}/photos/${photoId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user?.id
        },
        body: JSON.stringify(updates)
      })
      const updated = await res.json()
      onPhotosChange(photos.map(p => p.id === photoId ? updated : p))
    } catch (err) {
      console.error('Error updating:', err)
    }
  }

  const handleEditPhoto = (e, photo) => {
    e.stopPropagation()
    setEditingPhoto(photo)
    setSelectedPhoto(photo)
  }

  useEffect(() => {
    const handleKey = (e) => {
      if (lightboxIndex === -1) return
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowLeft') navigate(-1)
      if (e.key === 'ArrowRight') navigate(1)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [lightboxIndex])

  if (!user) {
    return (
      <section ref={sectionRef} id="gallery" className="py-32 px-6 relative" style={{ background: 'linear-gradient(180deg, #0a0a0f, #120a0a)' }}>
        <div className="absolute inset-0 pattern-hearts opacity-15" />
        <div className="relative z-10 max-w-6xl mx-auto text-center py-24">
          <Camera className="w-20 h-20 mx-auto text-accent/40 mb-6" />
          <h3 className="font-playfair text-2xl text-cream mb-3">Inicia sesion para ver tus fotos</h3>
          <p className="text-cream/50">Usa el boton de iniciar sesion en la navegacion</p>
        </div>
      </section>
    )
  }

  return (
    <>
      <section ref={sectionRef} id="gallery" className="py-32 px-6 relative" style={{ background: 'linear-gradient(180deg, #0a0a0f, #120a0a)' }}>
        <div className="absolute inset-0 pattern-hearts opacity-15" />
        
        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="gallery-title opacity-0 text-center mb-16">
            <Camera className="w-16 h-16 mx-auto text-accent mb-4" />
            <h2 className="font-playfair text-4xl md:text-6xl font-bold mt-6 mb-4 text-gradient-romantic">
              Galeria de Momentos
            </h2>
            <p className="font-great text-xl md:text-2xl text-accent/70">{photos.length} fotos - Arrastra para reordenar</p>
          </div>

          {photos.length === 0 ? (
            <div className="text-center py-24 glass-accent rounded-3xl border-2 border-dashed border-accent/30">
              <Image className="w-20 h-20 mx-auto text-accent/40 mb-6" />
              <h3 className="font-playfair text-2xl text-cream mb-3">Aun no hay fotos</h3>
              <p className="text-cream/50 mb-8">Sube tus momentos especiales</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-8 py-4 rounded-full bg-gradient-to-r from-accentDark to-accent text-white font-semibold tracking-wider uppercase transition-all duration-300 hover:scale-105 flex items-center gap-2 mx-auto"
              >
                <Plus className="w-5 h-5" />
                Subir Fotos
              </button>
            </div>
          ) : (
            <>
              <div ref={gridRef} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mb-10">
                {photos.map((photo, i) => (
                  <div
                    key={photo.id}
                    className="gallery-item relative rounded-2xl overflow-hidden aspect-square cursor-pointer group bg-white/5"
                    onClick={() => openLightbox(photo, i)}
                  >
                    <img
                      src={photo.thumbnail_data || photo.image_data}
                      alt={`Foto ${i + 1}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-between">
                        <span className="text-white/80 text-xs">#{i + 1}</span>
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => handleEditPhoto(e, photo)}
                            className="w-7 h-7 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-accent/60 transition-colors"
                          >
                            <Settings2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(e, photo.id)}
                            className="w-7 h-7 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-red-500/60 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-black/50 text-white/80 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <GripVertical className="w-3 h-3" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap justify-center items-center gap-4">
                <input type="file" ref={fileInputRef} accept="image/*" onChange={handleUpload} className="hidden" />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-8 py-4 rounded-full bg-gradient-to-r from-accentDark to-accent text-white font-semibold tracking-wider uppercase transition-all duration-300 hover:scale-105 flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Subir Mas Fotos
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      {lightboxIndex !== -1 && selectedPhoto && (
        <div
          className="fixed inset-0 z-[2000] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 md:top-8 md:right-8 w-12 h-12 rounded-full glass text-cream flex items-center justify-center transition-all hover:rotate-90 hover:bg-accent/20 z-10"
          >
            <X className="w-6 h-6" />
          </button>
          
          {lightboxIndex > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); navigate(-1) }}
              className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-12 h-12 md:w-16 md:h-16 rounded-full glass text-cream flex items-center justify-center transition-all hover:bg-accent/30 z-10"
            >
              <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
            </button>
          )}
          
          {lightboxIndex < photos.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); navigate(1) }}
              className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-12 h-12 md:w-16 md:h-16 rounded-full glass text-cream flex items-center justify-center transition-all hover:bg-accent/30 z-10"
            >
              <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
            </button>
          )}
          
          <div className="flex flex-col lg:flex-row gap-6 max-w-6xl w-full items-center justify-center" onClick={e => e.stopPropagation()}>
            <div className="relative max-w-full lg:max-w-[60%]">
              <img
                src={selectedPhoto.image_data}
                alt="Foto"
                className="max-w-full max-h-[70vh] mx-auto rounded-2xl object-contain shadow-[0_0_100px_rgba(231,76,60,0.2)]"
              />
            </div>
            
            <div className="glass-accent rounded-2xl p-6 w-full lg:w-[300px]">
              <h4 className="font-playfair text-xl text-cream mb-4">Configuracion</h4>
              
              <div className="space-y-4">
                <div>
                  <label className="text-cream/60 text-sm block mb-2">Duracion (ms)</label>
                  <input
                    type="number"
                    value={selectedPhoto.duration_ms}
                    onChange={(e) => handleUpdateSettings(selectedPhoto.id, { duration_ms: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-cream text-sm focus:border-accent/50 focus:outline-none"
                    min="500"
                    max="10000"
                    step="500"
                  />
                </div>
                
                <div>
                  <label className="text-cream/60 text-sm block mb-2">Transicion</label>
                  <select
                    value={selectedPhoto.transition_type}
                    onChange={(e) => handleUpdateSettings(selectedPhoto.id, { transition_type: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-cream text-sm focus:border-accent/50 focus:outline-none"
                  >
                    <option value="fade">Fade</option>
                    <option value="slide_left">Slide Left</option>
                    <option value="slide_right">Slide Right</option>
                    <option value="zoom">Zoom</option>
                    <option value="crossdissolve">Cross Dissolve</option>
                  </select>
                </div>
                
                <div className="text-center text-cream/40 text-xs pt-4">
                  Foto {lightboxIndex + 1} de {photos.length}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
