import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import toast from 'react-hot-toast'
import { Home, Wifi, Bell, Settings, LogOut, Menu, X, User, Shield, Activity, Server, FileText } from 'lucide-react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import ProtectedRoute from './components/auth/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Devices from './pages/Devices'
import Alerts from './pages/Alerts'
import IoTMonitoring from './pages/IoTMonitoring'
import IDSAlerts from './pages/IDSAlerts'
import Logs from './pages/Logs'
import Admin from './pages/Admin'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog'
import './styles.css'

function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false)
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    toast.success('Déconnexion réussie')
    setIsMobileMenuOpen(false)
    setIsLogoutDialogOpen(false)
  }

  const handleLogoutClick = () => {
    setIsLogoutDialogOpen(true)
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/iot-monitoring', label: 'Monitoring IoT', icon: Activity },
    { path: '/ids-alerts', label: 'Alertes IDS', icon: Shield },
    { path: '/logs', label: 'Logs', icon: FileText },
    { path: '/devices', label: 'Appareils', icon: Server },
    { path: '/alerts', label: 'Alertes ML', icon: Bell },
    { path: '/admin', label: 'Administration', icon: Settings },
  ]
  
  return (
    <>
      <button 
        className="fixed top-4 left-4 z-[1100] lg:hidden p-2 rounded-lg bg-primary text-white shadow-lg hover:bg-primary/90 transition-colors"
        onClick={toggleMobileMenu} 
        aria-label="Menu"
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <div className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-logo flex justify-center items-center py-6">
          <img src="/logo.png" alt="SIAC-IoT" style={{width: '100%', maxWidth: '100px', height: 'auto'}} />
        </div>
        
        <nav className="sidebar-nav" style={{color: '#000000'}}>
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path || (item.path === '/dashboard' && location.pathname === '/')
            return (
              <Link
                key={item.path}
                to={item.path}
                className={isActive ? 'active' : ''}
                onClick={closeMobileMenu}
                style={{color: '#000000'}}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto border-t" style={{marginBottom: '0', paddingBottom: '0'}}>
          <div className="px-3 pt-3 pb-0" style={{marginBottom: '0'}}>
            {/* User Role/Status */}
            {user && (
              <div className="px-4 py-3 bg-gradient-to-br from-red-50 to-rose-50 rounded-lg border mb-2" style={{borderColor: 'rgba(127, 2, 2, 0.3)'}}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{background: 'linear-gradient(135deg, #7F0202, #311156)'}}>
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{user.username}</p>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium capitalize" style={{color: '#7F0202'}}>
                        {user.role === 'admin' ? 'Administrateur' : user.role}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Logout Button */}
            <Button
              variant="ghost"
              className="w-full justify-start hover:bg-red-600 hover:text-white transition-all duration-300 hover:scale-105 hover:shadow-md"
              onClick={handleLogoutClick}
              style={{color: '#000000', marginBottom: '0'}}
            >
              <LogOut size={20} className="mr-3 transition-transform duration-300 group-hover:rotate-12" />
              <span>Déconnexion</span>
            </Button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && <div className="sidebar-overlay" onClick={closeMobileMenu}></div>}

      {/* Logout Confirmation Dialog */}
      <Dialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <DialogContent>
          <DialogClose onClick={() => setIsLogoutDialogOpen(false)} />
          <DialogHeader>
            <DialogTitle>Confirmer la déconnexion</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir vous déconnecter ?
            </DialogDescription>
          </DialogHeader>
          
          <div className="px-6 py-4">
            <p className="text-gray-700">
              Vous serez redirigé vers la page de connexion.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setIsLogoutDialogOpen(false)}
              className="hover:bg-gray-100"
            >
              Annuler
            </Button>
            <Button
              onClick={handleLogout}
              style={{background: 'linear-gradient(to right, #7F0202, #311156)', color: 'white'}}
              className="hover:opacity-90 flex items-center gap-2"
            >
              <LogOut size={18} />
              Se déconnecter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#fff',
              color: '#333',
              border: '1px solid #ddd',
              padding: '20px 24px',
              borderRadius: '12px',
              fontSize: '16px',
              minWidth: '400px',
              maxWidth: '600px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Protected Routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <div className="app-container">
                <Sidebar />
                <div className="main-content">
                  <Dashboard />
                </div>
              </div>
            </ProtectedRoute>
          } />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <div className="app-container">
                <Sidebar />
                <div className="main-content">
                  <Dashboard />
                </div>
              </div>
            </ProtectedRoute>
          } />
          
          <Route path="/devices" element={
            <ProtectedRoute>
              <div className="app-container">
                <Sidebar />
                <div className="main-content">
                  <Devices />
                </div>
              </div>
            </ProtectedRoute>
          } />
          
          <Route path="/alerts" element={
            <ProtectedRoute>
              <div className="app-container">
                <Sidebar />
                <div className="main-content">
                  <Alerts />
                </div>
              </div>
            </ProtectedRoute>
          } />
          
          <Route path="/admin" element={
            <ProtectedRoute requiredRole="admin">
              <div className="app-container">
                <Sidebar />
                <div className="main-content">
                  <Admin />
                </div>
              </div>
            </ProtectedRoute>
          } />
          
          <Route path="/iot-monitoring" element={
            <ProtectedRoute>
              <div className="app-container">
                <Sidebar />
                <div className="main-content">
                  <IoTMonitoring />
                </div>
              </div>
            </ProtectedRoute>
          } />
          
          <Route path="/ids-alerts" element={
            <ProtectedRoute>
              <div className="app-container">
                <Sidebar />
                <div className="main-content">
                  <IDSAlerts />
                </div>
              </div>
            </ProtectedRoute>
          } />
          
          <Route path="/logs" element={
            <ProtectedRoute>
              <div className="app-container">
                <Sidebar />
                <div className="main-content">
                  <Logs />
                </div>
              </div>
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
