import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import Dashboard from './components/Dashboard'
import PageEditor from './components/PageEditor'
import PageViewer from './components/PageViewer'
import CupidoDashboard from './components/CupidoDashboard'
import Login from './components/Login'
import VerifyEmail from './components/VerifyEmail'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedUser = localStorage.getItem('amor_user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const handleLogin = (userData) => {
    setUser(userData)
    localStorage.setItem('amor_user', JSON.stringify(userData))
  }

  const handleCupidoLogin = (userData) => {
    setUser(userData)
    localStorage.setItem('amor_user', JSON.stringify(userData))
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('amor_user')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="text-accent text-xl">Cargando...</div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-dark text-cream">
        <Routes>
          <Route path="/view/:slug" element={<PageViewer />} />
          <Route path="/verify/:token" element={<VerifyEmail />} />
          <Route path="/login" element={
            !user ? <Login onLogin={handleLogin} onCupidoLogin={handleCupidoLogin} /> : <Navigate to="/" />
          } />
          <Route path="/*" element={
            user ? (
              <>
                <Navbar user={user} onLogout={handleLogout} />
                <div className="pt-20">
                  <Routes>
                    <Route path="/" element={
                      user.role === 'cupido' ? <CupidoDashboard user={user} /> : <Dashboard user={user} />
                    } />
                    <Route path="/page/:id" element={<PageEditor user={user} />} />
                  </Routes>
                </div>
              </>
            ) : <Navigate to="/login" />
          } />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
