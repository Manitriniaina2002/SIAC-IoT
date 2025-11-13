import React, { createContext, useState, useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = () => {
      try {
        const storedUser = localStorage.getItem('siac_user')
        const storedToken = localStorage.getItem('siac_token')
        const tokenExpiry = localStorage.getItem('siac_token_expiry')

        if (storedUser && storedToken && tokenExpiry) {
          const expiryTime = parseInt(tokenExpiry)
          const currentTime = new Date().getTime()

          // Check if token is expired
          if (currentTime < expiryTime) {
            setUser(JSON.parse(storedUser))
          } else {
            // Token expired, clear storage
            logout()
          }
        }
      } catch (error) {
        console.error('Auth check error:', error)
        logout()
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (username, password) => {
    try {
      // Simulate API call - replace with actual API endpoint
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          // Demo credentials - replace with actual authentication
          const validUsers = [
            { username: 'admin', password: 'admin123', role: 'admin', name: 'Administrateur' },
            { username: 'operator', password: 'oper123', role: 'operator', name: 'Opérateur' },
            { username: 'viewer', password: 'view123', role: 'viewer', name: 'Lecteur' },
          ]

          const foundUser = validUsers.find(
            u => u.username === username && u.password === password
          )

          if (foundUser) {
            // Generate a simple token (in production, this comes from backend)
            const token = btoa(JSON.stringify({
              username: foundUser.username,
              timestamp: new Date().getTime()
            }))

            // Set token expiry (24 hours)
            const expiryTime = new Date().getTime() + (24 * 60 * 60 * 1000)

            const userData = {
              username: foundUser.username,
              role: foundUser.role,
              name: foundUser.name
            }

            // Store in localStorage
            localStorage.setItem('siac_user', JSON.stringify(userData))
            localStorage.setItem('siac_token', token)
            localStorage.setItem('siac_token_expiry', expiryTime.toString())

            setUser(userData)
            resolve(userData)
          } else {
            reject(new Error('Identifiants incorrects'))
          }
        }, 1000)
      })
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    // Clear all auth data
    localStorage.removeItem('siac_user')
    localStorage.removeItem('siac_token')
    localStorage.removeItem('siac_token_expiry')
    setUser(null)
    navigate('/login')
    toast.success('Déconnexion réussie')
  }

  const hasRole = (requiredRole) => {
    if (!user) return false
    
    const roleHierarchy = {
      'admin': 3,
      'operator': 2,
      'viewer': 1
    }

    return roleHierarchy[user.role] >= roleHierarchy[requiredRole]
  }

  const value = {
    user,
    login,
    logout,
    hasRole,
    isAuthenticated: !!user,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
