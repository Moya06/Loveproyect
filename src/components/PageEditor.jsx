import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye, Image, FileText, Settings2, Heart, Plus, Trash2, Upload, Film, Globe, Lock, Edit2, Music } from 'lucide-react'
import { API_URL } from '../config'
import { getLocalPages, saveLocalPage, getLocalPageData, saveLocalPageData, fetchWithTimeout } from '../lib/offlineStore'

function formatDateForInput(dateValue) {
  if (!dateValue) return ''
  const date = new Date(dateValue)
  if (isNaN(date.getTime())) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function PageEditor({ user }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [page, setPage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('hero')
  const [photos, setPhotos] = useState([])
  const [letter, setLetter] = useState({ content: '', signature_text: '', greeting: 'Mi amor,' })
  const [timeline, setTimeline] = useState([])
  const [settings, setSettings] = useState(null)
  const [videos, setVideos] = useState([])
  const [generatingVideo, setGeneratingVideo] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchPage()
  }, [id])

  const showMessage = (msg) => {
    setMessage(msg)
    setTimeout(() => setMessage(''), 3000)
  }

  const fetchPage = async () => {
    try {
      const res = await fetchWithTimeout(`${API_URL}/corazon/pages/${id}`, { headers: { 'x-user-id': user.id } })
      if (!res.ok) throw new Error('No encontrado')
      const data = await res.json()
      setPage(data)
      setPhotos(data.photos || [])
      setLetter(data.letter || { content: '', signature_text: '', greeting: 'Mi amor,' })
      setTimeline(data.timeline || [])
      setSettings(data.settings || {})
      setVideos(data.videos || [])
      saveLocalPage(user.id, data)
      saveLocalPageData(id, { photos: data.photos || [], letter: data.letter || { content: '', signature_text: '', greeting: 'Mi amor,' }, timeline: data.timeline || [], settings: data.settings || {}, videos: data.videos || [] })
    } catch (err) {
      console.error('Error cargando pagina:', err)
      const localPages = getLocalPages(user.id)
      const localPage = localPages.find(p => p.id === id)
      if (localPage) {
        setPage(localPage)
        const localData = getLocalPageData(id)
        setPhotos(localData.photos || [])
        setLetter(localData.letter || { content: '', signature_text: '', greeting: 'Mi amor,' })
        setTimeline(localData.timeline || [])
        setSettings(localData.settings || {})
        setVideos(localData.videos || [])
      } else {
        navigate('/')
      }
    }
    setLoading(false)
  }

  const savePage = async (updates) => {
    if (!page) return
    setSaving(true)
    try {
      const res = await fetchWithTimeout(`${API_URL}/corazon/pages/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
        body: JSON.stringify(updates)
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error)
      }
      const updated = await res.json()
      const newPage = { ...page, ...updated }
      setPage(newPage)
      saveLocalPage(user.id, newPage)
      showMessage('Guardado correctamente')
    } catch (err) {
      console.error('Error guardando pagina:', err)
      const newPage = { ...page, ...updates, updated_at: new Date().toISOString() }
      setPage(newPage)
      saveLocalPage(user.id, newPage)
      showMessage('Guardado localmente (modo sin conexion)')
    }
    setSaving(false)
  }

  const [editingPhoto, setEditingPhoto] = useState(null)
  const [photoSettings, setPhotoSettings] = useState({ duration_ms: 3000, transition_type: 'fade' })

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    const file = files[0]
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = document.createElement('img')
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
        thumbCtx.drawImage(img, (img.width - minDim) / 2, (img.height - minDim) / 2, minDim, minDim, 0, 0, thumbSize, thumbSize)
        const thumbnail = thumbCanvas.toDataURL('image/jpeg', 0.7)

        setEditingPhoto({ image_data: data, thumbnail_data: thumbnail, duration_ms: 6000, transition_type: 'fade' })
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const addPhotoWithSettings = async () => {
    if (!editingPhoto) return
    try {
      const res = await fetchWithTimeout(`${API_URL}/corazon/pages/${id}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
        body: JSON.stringify(editingPhoto)
      })
      if (!res.ok) throw new Error('Error al agregar foto')
      const newPhoto = await res.json()
      const updated = [...photos, newPhoto]
      setPhotos(updated)
      setEditingPhoto(null)
      saveLocalPageData(id, { ...getLocalPageData(id), photos: updated })
      showMessage('Foto agregada')
    } catch (err) {
      console.error('Error agregando foto:', err)
      const localPhoto = { ...editingPhoto, id: 'local-photo-' + crypto.randomUUID(), page_id: id, order_index: photos.length, created_at: new Date().toISOString() }
      const updated = [...photos, localPhoto]
      setPhotos(updated)
      saveLocalPageData(id, { ...getLocalPageData(id), photos: updated })
      setEditingPhoto(null)
      showMessage('Foto guardada localmente')
    }
  }

  const updatePhotoSettings = async () => {
    if (!editingPhoto || !editingPhoto.id) return
    try {
      const res = await fetchWithTimeout(`${API_URL}/corazon/pages/${id}/photos/${editingPhoto.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
        body: JSON.stringify({ duration_ms: editingPhoto.duration_ms, transition_type: editingPhoto.transition_type })
      })
      if (!res.ok) throw new Error('Error al actualizar foto')
      const updated = await res.json()
      const newPhotos = photos.map(p => p.id === updated.id ? { ...p, ...updated } : p)
      setPhotos(newPhotos)
      saveLocalPageData(id, { ...getLocalPageData(id), photos: newPhotos })
      setEditingPhoto(null)
      showMessage('Foto actualizada')
    } catch (err) {
      console.error('Error actualizando foto:', err)
      const newPhotos = photos.map(p => p.id === editingPhoto.id ? { ...p, duration_ms: editingPhoto.duration_ms, transition_type: editingPhoto.transition_type } : p)
      setPhotos(newPhotos)
      saveLocalPageData(id, { ...getLocalPageData(id), photos: newPhotos })
      setEditingPhoto(null)
      showMessage('Foto actualizada localmente')
    }
  }

  const deletePhoto = async (photoId) => {
    if (!confirm('¿Eliminar esta foto?')) return
    try {
      const res = await fetchWithTimeout(`${API_URL}/corazon/pages/${id}/photos/${photoId}`, {
        method: 'DELETE',
        headers: { 'x-user-id': user.id }
      })
      if (!res.ok) throw new Error('Error al eliminar foto')
      const newPhotos = photos.filter(p => p.id !== photoId)
      setPhotos(newPhotos)
      saveLocalPageData(id, { ...getLocalPageData(id), photos: newPhotos })
      showMessage('Foto eliminada')
    } catch (err) {
      console.error('Error eliminando foto:', err)
      const newPhotos = photos.filter(p => p.id !== photoId)
      setPhotos(newPhotos)
      saveLocalPageData(id, { ...getLocalPageData(id), photos: newPhotos })
      showMessage('Foto eliminada localmente')
    }
  }

  const saveLetter = async () => {
    try {
      const res = await fetchWithTimeout(`${API_URL}/corazon/pages/${id}/letter`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
        body: JSON.stringify(letter)
      })
      if (!res.ok) throw new Error('Error al guardar carta')
      saveLocalPageData(id, { ...getLocalPageData(id), letter })
      showMessage('Carta guardada')
    } catch (err) {
      console.error('Error guardando carta:', err)
      saveLocalPageData(id, { ...getLocalPageData(id), letter })
      showMessage('Carta guardada localmente')
    }
  }

  const saveTimeline = async () => {
    try {
      const res = await fetchWithTimeout(`${API_URL}/corazon/pages/${id}/timeline`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
        body: JSON.stringify({ items: timeline })
      })
      if (!res.ok) throw new Error('Error al guardar historia')
      saveLocalPageData(id, { ...getLocalPageData(id), timeline })
      showMessage('Historia guardada')
    } catch (err) {
      console.error('Error guardando historia:', err)
      saveLocalPageData(id, { ...getLocalPageData(id), timeline })
      showMessage('Historia guardada localmente')
    }
  }

  const saveSettings = async (newSettings) => {
    try {
      const res = await fetchWithTimeout(`${API_URL}/corazon/pages/${id}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
        body: JSON.stringify(newSettings)
      })
      if (!res.ok) throw new Error('Error al guardar ajustes')
      const data = await res.json()
      setSettings(data)
      saveLocalPageData(id, { ...getLocalPageData(id), settings: data })
      showMessage('Ajustes guardados')
    } catch (err) {
      console.error('Error guardando ajustes:', err)
      setSettings(newSettings)
      saveLocalPageData(id, { ...getLocalPageData(id), settings: newSettings })
      showMessage('Ajustes guardados localmente')
    }
  }

  const handleAudioUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('audio/') && !file.type.startsWith('video/mp4')) {
      showMessage('Error: Solo archivos de audio (MP3, M4A, MP4 audio)')
      e.target.value = ''
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      const data = ev.target.result
      const newSettings = { ...settings, background_audio: data }
      setSettings(newSettings)
      saveSettings(newSettings)
      e.target.value = ''
    }
    reader.readAsDataURL(file)
  }

  const removeAudio = () => {
    const newSettings = { ...settings, background_audio: null }
    setSettings(newSettings)
    saveSettings(newSettings)
  }

  const generateVideo = async () => {
    if (photos.length < 2) {
      alert('Necesitas al menos 2 fotos')
      return
    }
    setGeneratingVideo(true)
    try {
      const res = await fetch(`${API_URL}/corazon/pages/${id}/generate-video`, {
        method: 'POST',
        headers: { 'x-user-id': user.id }
      })
      const video = await res.json()
      
      const poll = async () => {
        const statusRes = await fetch(`${API_URL}/corazon/pages/${id}/videos`, { headers: { 'x-user-id': user.id } })
        const videosData = await statusRes.json()
        const currentVideo = videosData.find(v => v.id === video.id)
        if (currentVideo?.status === 'processing') {
          setTimeout(poll, 1000)
        } else {
          setVideos(videosData)
          setGeneratingVideo(false)
          showMessage('Video generado')
        }
      }
      poll()
    } catch (err) {
      console.error('Error:', err)
      setGeneratingVideo(false)
      showMessage('Error al generar video')
    }
  }

  const togglePublic = () => {
    const newStatus = page.status === 'published' ? 'draft' : 'published'
    savePage({ status: newStatus })
  }

  const getPageUrl = () => `${window.location.origin}/view/${page?.page_slug}`

  const copyLink = () => {
    navigator.clipboard.writeText(getPageUrl())
    showMessage('Link copiado')
  }

  if (loading) {
    return <div className="p-8 text-center text-cream/50">Cargando...</div>
  }

  const tabs = [
    { id: 'hero', label: 'Hero', icon: Heart },
    { id: 'photos', label: 'Fotos', icon: Image },
    { id: 'timeline', label: 'Historia', icon: FileText },
    { id: 'letter', label: 'Carta', icon: Heart },
    { id: 'settings', label: 'Ajustes', icon: Settings2 },
  ]

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        {message && (
          <div className={`fixed top-24 right-6 z-50 px-4 py-2 rounded-lg text-sm ${message.includes('Error') ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'}`}>
            {message}
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-cream/60 hover:text-cream transition-colors">
            <ArrowLeft className="w-5 h-5" />
            Volver
          </button>
          <div className="flex items-center gap-3">
            {saving && <span className="text-cream/40 text-sm">Guardando...</span>}
            <button
              onClick={togglePublic}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors ${page.status === 'published' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}
            >
              {page.status === 'published' ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              {page.status === 'published' ? 'Publicado' : 'Borrador'}
            </button>
            <button
              onClick={copyLink}
              className="px-4 py-2 rounded-lg bg-white/5 text-cream/70 hover:bg-white/10 transition-colors text-sm"
            >
              Copiar Link
            </button>
            <button
              onClick={() => window.open(getPageUrl(), '_blank')}
              className="px-4 py-2 rounded-lg bg-accent/20 text-accent hover:bg-accent/30 transition-colors text-sm flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              Ver Pagina
            </button>
          </div>
        </div>

        <div className="glass-accent rounded-2xl overflow-hidden">
          <div className="flex border-b border-white/10 overflow-x-auto">
            {tabs.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm whitespace-nowrap transition-colors ${activeTab === tab.id ? 'text-accent border-b-2 border-accent bg-accent/5' : 'text-cream/50 hover:text-cream'}`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>

          <div className="p-6">
            {activeTab === 'hero' && (
              <div className="space-y-6">
                <h3 className="font-playfair text-xl text-cream mb-4">Configuracion del Hero</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-cream/60 text-sm block mb-2">Titulo Principal</label>
                    <input
                      type="text"
                      value={page.hero_title || ''}
                      onChange={e => setPage({ ...page, hero_title: e.target.value })}
                      onBlur={() => savePage({ hero_title: page.hero_title })}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-cream focus:border-accent/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-cream/60 text-sm block mb-2">Subtitulo</label>
                    <input
                      type="text"
                      value={page.hero_subtitle || ''}
                      onChange={e => setPage({ ...page, hero_subtitle: e.target.value })}
                      onBlur={() => savePage({ hero_subtitle: page.hero_subtitle })}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-cream focus:border-accent/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-cream/60 text-sm block mb-2">Nombre de quien envia (Corazon)</label>
                    <input
                      type="text"
                      value={page.corazon_name || ''}
                      onChange={e => setPage({ ...page, corazon_name: e.target.value })}
                      onBlur={() => savePage({ corazon_name: page.corazon_name })}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-cream focus:border-accent/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-cream/60 text-sm block mb-2">Nombre de quien recibe (Flecha)</label>
                    <input
                      type="text"
                      value={page.flecha_name || ''}
                      onChange={e => setPage({ ...page, flecha_name: e.target.value })}
                      onBlur={() => savePage({ flecha_name: page.flecha_name })}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-cream focus:border-accent/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-cream/60 text-sm block mb-2">Fecha de inicio (contador)</label>
                    <input
                      type="date"
                      value={formatDateForInput(page.counter_start_date)}
                      onChange={e => setPage({ ...page, counter_start_date: e.target.value })}
                      onBlur={() => savePage({ counter_start_date: page.counter_start_date })}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-cream focus:border-accent/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-cream/60 text-sm block mb-2">Texto bajo el contador</label>
                    <input
                      type="text"
                      value={page.hero_date_text || ''}
                      onChange={e => setPage({ ...page, hero_date_text: e.target.value })}
                      onBlur={() => savePage({ hero_date_text: page.hero_date_text })}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-cream focus:border-accent/50 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'photos' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-playfair text-xl text-cream">Fotos ({photos.length})</h3>
                  <div className="flex gap-2">
                    <input type="file" id="photo-upload" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                    <label htmlFor="photo-upload" className="px-4 py-2 rounded-lg bg-accent text-white text-sm cursor-pointer hover:bg-accent/80 transition-colors flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Agregar Foto
                    </label>
                    {photos.length >= 2 && (
                      <button
                        onClick={generateVideo}
                        disabled={generatingVideo}
                        className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm flex items-center gap-2 hover:bg-green-500 disabled:opacity-50"
                      >
                        <Film className="w-4 h-4" />
                        {generatingVideo ? 'Generando...' : 'Generar Video'}
                      </button>
                    )}
                  </div>
                </div>

                {editingPhoto && (
                  <div className="glass rounded-xl p-4 border border-accent/30">
                    <h4 className="text-cream font-medium mb-4">{editingPhoto.id ? 'Editar Foto' : 'Configurar Nueva Foto'}</h4>
                    <div className="flex gap-6">
                      <img src={editingPhoto.thumbnail_data || editingPhoto.image_data} alt="Preview" className="w-24 h-24 object-cover rounded-lg" />
                      <div className="flex-1 grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-cream/60 text-sm block mb-2">Duracion (ms)</label>
                          <input
                            type="number"
                            value={editingPhoto.duration_ms}
                            onChange={e => setEditingPhoto({ ...editingPhoto, duration_ms: parseInt(e.target.value) || 3000 })}
                            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-cream text-sm"
                            min="500"
                            max="10000"
                            step="500"
                          />
                        </div>
                        <div>
                          <label className="text-cream/60 text-sm block mb-2">Transicion</label>
                          <select
                            value={editingPhoto.transition_type}
                            onChange={e => setEditingPhoto({ ...editingPhoto, transition_type: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-cream text-sm"
                          >
                            <option value="fade">Fade</option>
                            <option value="slide_left">Slide Left</option>
                            <option value="slide_right">Slide Right</option>
                            <option value="zoom">Zoom</option>
                            <option value="crossdissolve">Cross Dissolve</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={editingPhoto.id ? updatePhotoSettings : addPhotoWithSettings}
                          className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm hover:bg-green-500"
                        >
                          {editingPhoto.id ? 'Guardar' : 'Agregar'}
                        </button>
                        <button
                          onClick={() => setEditingPhoto(null)}
                          className="px-4 py-2 rounded-lg bg-white/10 text-cream/70 text-sm hover:bg-white/20"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {photos.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-white/10 rounded-xl">
                    <Image className="w-12 h-12 mx-auto text-cream/30 mb-3" />
                    <p className="text-cream/50">Sube tus fotos favoritas</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {photos.map((photo, i) => (
                      <div key={photo.id || i} className="relative aspect-square rounded-xl overflow-hidden group">
                        <img src={photo.thumbnail_data || photo.image_data} alt="" className="w-full h-full object-cover" />
                        <button
                          onClick={() => deletePhoto(photo.id)}
                          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 text-white text-xs text-center">
                          #{i + 1} - {photo.transition_type} - {photo.duration_ms}ms
                        </div>
                        <button
                          onClick={() => { setEditingPhoto(photo); setPhotoSettings({ duration_ms: photo.duration_ms, transition_type: photo.transition_type }) }}
                          className="absolute top-2 left-2 w-8 h-8 rounded-full bg-accent/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Settings2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {videos.length > 0 && (
                  <div className="mt-8">
                    <h4 className="text-cream/60 text-sm mb-3">Videos Generados</h4>
                    <div className="space-y-2">
                      {videos.map(video => (
                        <div key={video.id} className="flex items-center justify-between p-3 glass rounded-lg">
                          <span className="text-cream">{video.title}</span>
                          <div className="flex items-center gap-2">
                            {video.status === 'completed' ? (
                              <a href={`${API_URL}/videos/${video.id}/stream`} target="_blank" rel="noreferrer" className="px-3 py-1 rounded bg-green-500/20 text-green-400 text-sm hover:bg-green-500/30">
                                Ver
                              </a>
                            ) : video.status === 'processing' ? (
                              <span className="text-amber-400 text-sm">Generando... {video.progress}%</span>
                            ) : (
                              <span className="text-red-400 text-sm">Error</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'timeline' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-playfair text-xl text-cream">Linea de Tiempo</h3>
                  <button
                    onClick={() => setTimeline([...timeline, { date_label: '', title: '', description: '' }])}
                    className="px-4 py-2 rounded-lg bg-accent text-white text-sm flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Agregar Momento
                  </button>
                </div>

                <div className="space-y-4">
                  {timeline.map((item, i) => (
                    <div key={i} className="glass rounded-xl p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input
                          type="text"
                          value={item.date_label}
                          onChange={e => { const t = [...timeline]; t[i].date_label = e.target.value; setTimeline(t) }}
                          placeholder="Fecha (ej: El Inicio)"
                          className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-cream text-sm"
                        />
                        <input
                          type="text"
                          value={item.title}
                          onChange={e => { const t = [...timeline]; t[i].title = e.target.value; setTimeline(t) }}
                          placeholder="Titulo del momento"
                          className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-cream text-sm"
                        />
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={item.description}
                            onChange={e => { const t = [...timeline]; t[i].description = e.target.value; setTimeline(t) }}
                            placeholder="Descripcion"
                            className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-cream text-sm"
                          />
                          <button onClick={() => setTimeline(timeline.filter((_, idx) => idx !== i))} className="px-3 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={saveTimeline} className="px-6 py-2 rounded-lg bg-accent text-white">
                  Guardar Historia
                </button>
              </div>
            )}

            {activeTab === 'letter' && (
              <div className="space-y-6">
                <h3 className="font-playfair text-xl text-cream">Carta de Amor</h3>
                <div>
                  <label className="text-cream/60 text-sm block mb-2">Saludo</label>
                  <input
                    type="text"
                    value={letter.greeting || 'Mi amor,'}
                    onChange={e => setLetter({ ...letter, greeting: e.target.value })}
                    onBlur={saveLetter}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-cream"
                  />
                </div>
                <div>
                  <label className="text-cream/60 text-sm block mb-2">Contenido de la Carta</label>
                  <textarea
                    value={letter.content || ''}
                    onChange={e => setLetter({ ...letter, content: e.target.value })}
                    onBlur={saveLetter}
                    rows={10}
                    placeholder="Escribe tu carta de amor aqui..."
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-cream resize-none"
                  />
                </div>
                <div>
                  <label className="text-cream/60 text-sm block mb-2">Firma</label>
                  <input
                    type="text"
                    value={letter.signature_text || ''}
                    onChange={e => setLetter({ ...letter, signature_text: e.target.value })}
                    onBlur={saveLetter}
                    placeholder="Con todo mi amor, tu Corazon"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-cream"
                  />
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                <h3 className="font-playfair text-xl text-cream mb-4">Ajustes de la Pagina</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="glass rounded-xl p-4">
                    <h4 className="text-cream font-medium mb-3">Colores del Tema</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded" style={{ backgroundColor: settings?.theme_colors?.primary || '#e74c3c' }} />
                        <input
                          type="text"
                          value={settings?.theme_colors?.primary || '#e74c3c'}
                          onChange={e => setSettings({ ...settings, theme_colors: { ...settings?.theme_colors, primary: e.target.value } })}
                          onBlur={() => saveSettings(settings)}
                          className="flex-1 px-3 py-2 rounded bg-white/5 border border-white/10 text-cream text-sm"
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded" style={{ backgroundColor: settings?.theme_colors?.secondary || '#f39c12' }} />
                        <input
                          type="text"
                          value={settings?.theme_colors?.secondary || '#f39c12'}
                          onChange={e => setSettings({ ...settings, theme_colors: { ...settings?.theme_colors, secondary: e.target.value } })}
                          onBlur={() => saveSettings(settings)}
                          className="flex-1 px-3 py-2 rounded bg-white/5 border border-white/10 text-cream text-sm"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="glass rounded-xl p-4">
                    <h4 className="text-cream font-medium mb-3">Opciones</h4>
                    <label className="flex items-center gap-3 text-cream/70 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings?.celebration_enabled !== false}
                        onChange={e => { const newSettings = { ...settings, celebration_enabled: e.target.checked }; setSettings(newSettings); saveSettings(newSettings) }}
                        className="w-5 h-5 rounded"
                      />
                      Boton de celebracion
                    </label>
                    <label className="flex items-center gap-3 text-cream/70 cursor-pointer mt-2">
                      <input
                        type="checkbox"
                        checked={settings?.particle_effects !== false}
                        onChange={e => { const newSettings = { ...settings, particle_effects: e.target.checked }; setSettings(newSettings); saveSettings(newSettings) }}
                        className="w-5 h-5 rounded"
                      />
                      Particulas flotantes
                    </label>
                  </div>
                  <div className="glass rounded-xl p-4">
                    <h4 className="text-cream font-medium mb-3 flex items-center gap-2">
                      <Music className="w-4 h-4" />
                      Musica de Fondo
                    </h4>
                    {settings?.background_audio ? (
                      <div className="space-y-3">
                        <audio src={settings.background_audio} controls className="w-full h-10" />
                        <div className="flex gap-2">
                          <label className="flex-1 px-3 py-2 rounded-lg bg-accent text-white text-sm text-center cursor-pointer hover:bg-accent/80 transition-colors">
                            Cambiar
                            <input type="file" accept="audio/*,video/mp4" onChange={handleAudioUpload} className="hidden" />
                          </label>
                          <button
                            onClick={removeAudio}
                            className="px-3 py-2 rounded-lg bg-red-500/20 text-red-400 text-sm hover:bg-red-500/30 transition-colors"
                          >
                            Quitar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:border-accent/50 transition-colors">
                        <Upload className="w-6 h-6 text-accent" />
                        <span className="text-cream/60 text-sm text-center">Sube una pista MP3 o MP4</span>
                        <input type="file" accept="audio/*,video/mp4" onChange={handleAudioUpload} className="hidden" />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}