import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'
import { Lock, Mail, Eye, EyeOff, Shield, LogIn } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import AnimatedBackground from '@/components/AnimatedBackground'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  
  const from = location.state?.from?.pathname || '/dashboard'

  const handleLogin = async (e) => {
    e.preventDefault()

    if (!username || !password) {
      toast.error('Veuillez remplir tous les champs')
      return
    }

    setLoading(true)
    
    try {
      await login(username, password)
      toast.success(`Bienvenue ${username} !`)
      navigate(from, { replace: true })
    } catch (error) {
      toast.error(error.message || 'Identifiants incorrects')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      {/* Animated Background */}
      <AnimatedBackground />
      
      {/* Content */}
      <div className="w-full max-w-md relative" style={{zIndex: 10}}>
        <div className="text-center mb-8">
          <img src="/logo.png" alt="SIAC-IoT" className="mx-auto mb-4" style={{width: '100px', height: 'auto'}} />
          <p className="text-gray-600">
            Système Intelligent d'Analyse et de Contrôle
          </p>
        </div>

        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-bold text-center">Connexion</CardTitle>
            <CardDescription className="text-center">
              Accédez à votre tableau de bord IoT
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Mail className="w-4 h-4" style={{color: '#7F0202'}} />
                  Nom d'utilisateur
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                    style={{'--tw-ring-color': '#7F0202'}}
                    placeholder="Entrez votre nom d'utilisateur"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Lock className="w-4 h-4" style={{color: '#7F0202'}} />
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 pr-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                    style={{'--tw-ring-color': '#7F0202'}}
                    placeholder="Entrez votre mot de passe"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full text-white py-2.5 rounded-lg font-medium transition-all shadow-lg hover:shadow-xl"
                style={{
                  background: 'linear-gradient(to right, #7F0202, #311156)',
                  boxShadow: '0 10px 15px -3px rgba(127, 2, 2, 0.3)',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'linear-gradient(to right, #6a0202, #250d40)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'linear-gradient(to right, #7F0202, #311156)'}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Connexion en cours...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <LogIn className="w-4 h-4" />
                    Se connecter
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
           2025 SIAC-IoT. Tous droits réservés.
        </p>
      </div>
    </div>
  )
}
