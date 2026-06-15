import { useState, useEffect } from 'react'
import { Users, Eye, FileText, BarChart3, Crown } from 'lucide-react'

import { API_URL } from '../config'

export default function CupidoDashboard({ user }) {
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        fetch(`${API_URL}/cupido/stats`),
        fetch(`${API_URL}/cupido/users`)
      ])
      const statsData = await statsRes.json()
      const usersData = await usersRes.json()
      setStats(statsData)
      setUsers(usersData)
    } catch (err) {
      console.error('Error:', err)
    }
    setLoading(false)
  }

  if (loading) {
    return <div className="p-8 text-center text-cream/50">Cargando...</div>
  }

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Crown className="w-10 h-10 text-amber-400" />
          <div>
            <h1 className="font-playfair text-3xl md:text-4xl text-gradient-romantic mb-1">Panel de Cupido</h1>
            <p className="text-cream/50">Bienvenido, {user?.name}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="glass-accent rounded-2xl p-6">
            <Users className="w-8 h-8 text-accent mb-3" />
            <div className="font-playfair text-3xl text-cream">{stats?.total_users || 0}</div>
            <div className="text-cream/50 text-sm">Enamorados</div>
          </div>
          <div className="glass-accent rounded-2xl p-6">
            <FileText className="w-8 h-8 text-rose-400 mb-3" />
            <div className="font-playfair text-3xl text-cream">{stats?.total_pages || 0}</div>
            <div className="text-cream/50 text-sm">Paginas Creadas</div>
          </div>
          <div className="glass-accent rounded-2xl p-6">
            <Eye className="w-8 h-8 text-amber-400 mb-3" />
            <div className="font-playfair text-3xl text-cream">{stats?.total_views || 0}</div>
            <div className="text-cream/50 text-sm">Vistas Totales</div>
          </div>
          <div className="glass-accent rounded-2xl p-6">
            <BarChart3 className="w-8 h-8 text-green-400 mb-3" />
            <div className="font-playfair text-3xl text-cream">{stats?.published_pages || 0}</div>
            <div className="text-cream/50 text-sm">Publicadas</div>
          </div>
        </div>

        <div className="glass-accent rounded-2xl p-6">
          <h2 className="font-playfair text-xl text-cream mb-4">Enamorados Registrados</h2>
          {users.length === 0 ? (
            <p className="text-cream/50 text-center py-8">Aun no hay enamorados registrados</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-cream/50 text-sm border-b border-white/10">
                    <th className="pb-3 px-2">Nombre</th>
                    <th className="pb-3 px-2">Email</th>
                    <th className="pb-3 px-2">Paginas</th>
                    <th className="pb-3 px-2">Vistas</th>
                    <th className="pb-3 px-2">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-b border-white/5 text-sm">
                      <td className="py-3 px-2 text-cream">{u.name}</td>
                      <td className="py-3 px-2 text-cream/60">{u.email}</td>
                      <td className="py-3 px-2 text-accent">{u.pages_count}</td>
                      <td className="py-3 px-2 text-amber-400">{u.total_views}</td>
                      <td className="py-3 px-2 text-cream/40">{new Date(u.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
