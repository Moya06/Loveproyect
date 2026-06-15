import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Plus, Eye, Image, Film, ExternalLink, QrCode } from 'lucide-react'

import { API_URL } from '../config'
import { getLocalPages, saveLocalPage, generateLocalSlug, fetchWithTimeout } from '../lib/offlineStore'

export default function Dashboard({ user }) {
  const [pages, setPages] = useState([])
  const [showCreate, setShowCreate] = useState(false)
  const [newPage, setNewPage] = useState({ corazonName: '', flechaName: '' })
  const [loading, setLoading] = useState(true)
  const [offlineMode, setOfflineMode] = useState(false)

  useEffect(() => {
    fetchPages()
  }, [])

  const fetchPages = async () => {
    try {
      const res = await fetchWithTimeout(`${API_URL}/corazon/pages`, { headers: { 'x-user-id': user.id } })
      const data = await res.json()
      const serverPages = Array.isArray(data) ? data : []
      setPages(serverPages)
      serverPages.forEach(p => saveLocalPage(user.id, p))
    } catch (err) {
      console.error('Error cargando paginas:', err)
      setOfflineMode(true)
      setPages(getLocalPages(user.id))
    }
    setLoading(false)
  }

  const createPage = async (e) => {
    e.preventDefault()
    try {
      const res = await fetchWithTimeout(`${API_URL}/corazon/pages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
        body: JSON.stringify(newPage)
      })
      const page = await res.json()
      const updated = [page, ...pages]
      setPages(updated)
      saveLocalPage(user.id, page)
      setShowCreate(false)
      setNewPage({ corazonName: '', flechaName: '' })
    } catch (err) {
      console.error('Error creando pagina:', err)
      const page = {
        id: 'local-' + crypto.randomUUID(),
        corazon_id: user.id,
        corazon_name: newPage.corazonName,
        flecha_name: newPage.flechaName,
        page_slug: generateLocalSlug(newPage.flechaName || 'mi-amor') + '-' + Date.now().toString(36),
        hero_title: 'Mi Amor',
        hero_subtitle: '',
        hero_date_text: '',
        status: 'draft',
        is_public: false,
        view_count: 0,
        photos_count: 0,
        videos_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      const updated = [page, ...pages]
      setPages(updated)
      saveLocalPage(user.id, page)
      setOfflineMode(true)
      setShowCreate(false)
      setNewPage({ corazonName: '', flechaName: '' })
    }
  }

  const getPageUrl = (slug) => `${window.location.origin}/view/${slug}`

  const generateQR = (slug) => {
    const url = getPageUrl(slug)
    const qrWindow = window.open('', '_blank', 'width=450,height=550')
    qrWindow.document.write(`
      <html>
        <head>
          <title>QR - ${slug}</title>
          <style>
            body { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:100vh; margin:0; background:#0a0a0f; font-family:system-ui; color:#f5e6d3; }
            .container { padding:30px; background:rgba(255,255,255,0.03); border-radius:20px; border:1px solid rgba(231,76,60,0.2); text-align:center; }
            h2 { font-family:Georgia; margin-bottom:20px; color:#e74c3c; }
            p { font-size:12px; color:#888; margin-top:15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Escanea para ver la pagina de amor</h2>
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}" alt="QR Code" />
            <p>${url}</p>
          </div>
        </body>
      </html>
    `)
  }

  const copyLink = (slug) => {
    navigator.clipboard.writeText(getPageUrl(slug))
    alert('Link copiado!')
  }

  if (loading) {
    return <div className="p-8 text-center text-cream/50">Cargando...</div>
  }

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        {offlineMode && (
          <div className="mb-4 p-3 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 text-sm text-center">
            Modo sin conexion activado. Tus paginas se guardan en este navegador.
          </div>
        )}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-playfair text-3xl md:text-4xl text-gradient-romantic mb-2">Mis Paginas de Amor</h1>
            <p className="text-cream/50">Crea y gestiona tus paginas romanticas personalizadas</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="px-6 py-3 rounded-full bg-gradient-to-r from-accentDark to-accent text-white font-semibold flex items-center gap-2 hover:scale-105 transition-transform"
          >
            <Plus className="w-5 h-5" />
            Nueva Pagina
          </button>
        </div>

        {pages.length === 0 ? (
          <div className="text-center py-20 glass-accent rounded-3xl">
            <Heart className="w-16 h-16 mx-auto text-accent/40 mb-4 animate-pulse" />
            <h3 className="font-playfair text-xl text-cream mb-2">Aun no tienes paginas</h3>
            <p className="text-cream/50 mb-6">Crea tu primera pagina de amor para alguien especial</p>
            <button
              onClick={() => setShowCreate(true)}
              className="px-8 py-3 rounded-full bg-accent text-white font-semibold hover:scale-105 transition-transform"
            >
              Crear Mi Primera Pagina
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pages.map(page => (
              <div key={page.id} className="glass-accent rounded-2xl p-6 hover-lift">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-playfair text-xl text-cream">{page.flecha_name || 'Mi Amor'}</h3>
                    <p className="text-cream/40 text-sm">/{page.page_slug}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${page.status === 'published' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>
                    {page.status === 'published' ? 'Publicado' : 'Borrador'}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-cream/50 text-sm mb-4">
                  <span className="flex items-center gap-1"><Image className="w-4 h-4" /> {page.photos_count || 0}</span>
                  <span className="flex items-center gap-1"><Film className="w-4 h-4" /> {page.videos_count || 0}</span>
                  <span className="flex items-center gap-1"><Eye className="w-4 h-4" /> {page.view_count || 0}</span>
                </div>

                <div className="flex gap-2">
                  <Link
                    to={`/page/${page.id}`}
                    className="flex-1 px-4 py-2 rounded-lg bg-accent/20 text-accent text-center text-sm hover:bg-accent/30 transition-colors"
                  >
                    Editar
                  </Link>
                  <button
                    onClick={() => copyLink(page.page_slug)}
                    className="px-3 py-2 rounded-lg bg-white/5 text-cream/70 hover:bg-white/10 transition-colors"
                    title="Copiar link"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => generateQR(page.page_slug)}
                    className="px-3 py-2 rounded-lg bg-white/5 text-cream/70 hover:bg-white/10 transition-colors"
                    title="Generar QR"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="glass-accent rounded-3xl p-8 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <h3 className="font-playfair text-2xl text-cream mb-6">Crear Nueva Pagina</h3>
            <form onSubmit={createPage} className="space-y-4">
              <div>
                <label className="text-cream/60 text-sm block mb-2">Tu nombre (Corazon)</label>
                <input
                  type="text"
                  value={newPage.corazonName}
                  onChange={e => setNewPage({ ...newPage, corazonName: e.target.value })}
                  placeholder="Tu nombre"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-cream placeholder:text-cream/30 focus:border-accent/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-cream/60 text-sm block mb-2">Nombre de tu Flecha</label>
                <input
                  type="text"
                  value={newPage.flechaName}
                  onChange={e => setNewPage({ ...newPage, flechaName: e.target.value })}
                  placeholder="Nombre de quien recibe"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-cream placeholder:text-cream/30 focus:border-accent/50 focus:outline-none"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 rounded-xl bg-accent text-white font-semibold hover:scale-105 transition-transform"
                >
                  Crear Pagina
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-6 py-3 rounded-xl glass text-cream/70 hover:bg-white/10 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
