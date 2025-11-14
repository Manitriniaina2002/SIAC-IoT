import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Settings, Users, Database, Cpu, Activity, HardDrive, Mail, Calendar, Save, Trash2, Radio, Shield } from 'lucide-react'
import { StatCard, ContentCard } from '@/components/cards'
import { PageHeader } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { api } from '@/lib/api'
import AnimatedBackground from '@/components/AnimatedBackground'

export default function Admin() {
  const [users, setUsers] = useState([])
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [newUser, setNewUser] = useState({ username: '', email: '', role: 'viewer', password: '' })
  const roleOptions = ['admin', 'operator', 'viewer']

  const loadUsers = async () => {
    try {
      const data = await api.getUsers()
      setUsers(Array.isArray(data) ? data : [])
    } catch (e) {
      toast.error(e.message || 'Erreur chargement utilisateurs')
    }
  }
  useEffect(() => { loadUsers() }, [])

  const [settings, setSettings] = useState({
    mqttBroker: 'mqtt://localhost:1883',
    influxdbUrl: 'http://localhost:8086',
    alertEmail: 'alerts@siac-iot.com',
    retentionDays: 30,
    autoBackup: true,
  })

  const handleDeleteUser = async (id) => {
    try {
      await api.deleteUser(id)
      await loadUsers()
      toast.success('Utilisateur supprimé')
    } catch (e) {
      toast.error(e.message || 'Erreur lors de la suppression')
    }
  }

  const handleToggleStatus = async (id) => {
    const user = users.find(u => u.id === id)
    if (!user) return
    const next = !(user.is_active ?? user.status === 'active')
    try {
      await api.updateUser(id, { is_active: next })
      await loadUsers()
      toast.success(`Utilisateur ${next ? 'activé' : 'désactivé'}`)
    } catch (e) {
      toast.error(e.message || 'Erreur lors de la mise à jour')
    }
  }

  const handleChangeRole = async (id, role) => {
    try {
      await api.updateUser(id, { role })
      await loadUsers()
      toast.success('Rôle mis à jour')
    } catch (e) {
      toast.error(e.message || 'Erreur de mise à jour du rôle')
    }
  }

  const handleSaveSettings = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: 'Sauvegarde des paramètres...',
        success: 'Paramètres sauvegardés avec succès',
        error: 'Erreur lors de la sauvegarde',
      }
    )
  }

  return (
    <div className="container relative">
      <AnimatedBackground />
      <div className="space-y-6 relative" style={{zIndex: 10}}>
        <PageHeader 
          title="Administration" 
          description="Gérer les utilisateurs et la configuration système"
          icon={Settings}
        />

        {/* User Management Section */}
        <ContentCard
          title="Gestion des utilisateurs"
          description="Administrer les accès et les rôles"
          icon={Users}
          iconColor="violet"
          gradientFrom="violet-50"
          gradientTo="purple-50"
          headerActions={
            <Button onClick={() => setIsAddOpen(true)} style={{background: 'linear-gradient(to right, #7F0202, #311156)', color: 'white'}}>
              + Nouvel utilisateur
            </Button>
          }
        >
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nom d'utilisateur</th>
                  <th>Email</th>
                  <th>Rôle</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td style={{ fontWeight: '600' }}>{user.username}</td>
                    <td>{user.email || '-'}</td>
                    <td>
                      <select
                        value={(user.role || '').toLowerCase()}
                        onChange={(e) => handleChangeRole(user.id, e.target.value)}
                        className="border rounded px-2 py-1 text-sm"
                      >
                        {roleOptions.map(r => (
                          <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <span className={`badge ${(user.is_active ?? true) ? 'online' : 'offline'}`}>
                        {(user.is_active ?? true) ? 'active' : 'inactive'}
                      </span>
                    </td>
                                          <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button 
                            onClick={() => handleToggleStatus(user.id)}
                            style={{
                              padding: '0.5rem 1rem',
                              fontSize: '0.875rem',
                              background: (user.is_active ?? true) ? 
                                'linear-gradient(135deg, #f59e0b, #d97706)' :
                                'linear-gradient(135deg, #10b981, #059669)'
                            }}
                          >
                            {(user.is_active ?? true) ? 'Désactiver' : 'Activer'}
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(user.id)}
                            style={{
                              padding: '0.5rem 1rem',
                              fontSize: '0.875rem',
                              background: 'linear-gradient(135deg, #ef4444, #dc2626)'
                            }}
                            className="flex items-center gap-2"
                          >
                            <Trash2 className="h-4 w-4" /> Supprimer
                          </button>
                        </div>
                      </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ContentCard>

        {/* Add User Dialog */}
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogContent>
            <DialogClose onClick={() => setIsAddOpen(false)} />
            <DialogHeader>
              <DialogTitle>Nouvel utilisateur</DialogTitle>
              <DialogDescription>Créer un compte utilisateur</DialogDescription>
            </DialogHeader>
            <div className="px-6 py-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom d'utilisateur</label>
                <input value={newUser.username} onChange={(e) => setNewUser({...newUser, username: e.target.value})} className="w-full px-3 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} className="w-full px-3 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
                <select value={newUser.role} onChange={(e) => setNewUser({...newUser, role: e.target.value})} className="w-full px-3 py-2 border rounded">
                  {roleOptions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
                <input type="password" value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} className="w-full px-3 py-2 border rounded" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsAddOpen(false)}>Annuler</Button>
              <Button
                disabled={loading}
                onClick={async () => {
                  if (!newUser.username || !newUser.password) { toast.error('Username et mot de passe requis'); return }
                  setLoading(true)
                  try {
                    await api.createUser(newUser)
                    await loadUsers()
                    setIsAddOpen(false)
                    setNewUser({ username: '', email: '', role: 'viewer', password: '' })
                    toast.success('Utilisateur créé')
                  } catch (e) {
                    toast.error(e.message || 'Erreur création utilisateur')
                  } finally {
                    setLoading(false)
                  }
                }}
                style={{background: 'linear-gradient(to right, #7F0202, #311156)', color: 'white'}}
              >
                Créer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* System Settings Section */}
        <ContentCard
          title="Paramètres système"
          description="Configuration de l'infrastructure"
          icon={Settings}
          iconColor="blue"
          gradientFrom="blue-50"
          gradientTo="indigo-50"
        >
          <div style={{ marginTop: '1.5rem' }}>
            <div className="form-group">
              <label className="flex items-center gap-2">
                <Radio className="h-4 w-4" /> MQTT Broker URL
              </label>
              <input 
                type="text" 
                value={settings.mqttBroker}
                onChange={(e) => setSettings({...settings, mqttBroker: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label className="flex items-center gap-2">
                <Database className="h-4 w-4" /> InfluxDB URL
              </label>
              <input 
                type="text" 
                value={settings.influxdbUrl}
                onChange={(e) => setSettings({...settings, influxdbUrl: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label className="flex items-center gap-2">
                <Mail className="h-4 w-4" /> Email d'alerte
              </label>
              <input 
                type="email" 
                value={settings.alertEmail}
                onChange={(e) => setSettings({...settings, alertEmail: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Rétention des données (jours)
              </label>
              <input 
                type="number" 
                value={settings.retentionDays}
                onChange={(e) => setSettings({...settings, retentionDays: parseInt(e.target.value)})}
              />
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={settings.autoBackup}
                  onChange={(e) => setSettings({...settings, autoBackup: e.target.checked})}
                  style={{ width: 'auto', margin: 0 }}
                />
                <span className="flex items-center gap-2">
                  <Save className="h-4 w-4" /> Sauvegarde automatique quotidienne
                </span>
              </label>
            </div>

            <button onClick={handleSaveSettings} style={{ width: '100%', marginTop: '1rem' }} className="flex items-center justify-center gap-2">
              <Save className="h-4 w-4" /> Sauvegarder les paramètres
            </button>
          </div>
        </ContentCard>

        {/* System Stats */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Stockage utilisé"
            value="2.4 GB"
            description="Sur 10 GB disponibles"
            icon={HardDrive}
            gradient="from-slate-500 via-gray-600 to-zinc-700"
          />

          <StatCard
            title="CPU Usage"
            value="45%"
            description="Charge moyenne"
            icon={Cpu}
            gradient="from-amber-500 via-orange-600 to-yellow-600"
          />

          <StatCard
            title="Uptime"
            value="99.9%"
            description="Disponibilité système"
            icon={Activity}
            gradient="from-emerald-500 via-green-600 to-teal-700"
          />

          <StatCard
            title="Backup"
            value="Hier"
            description="Dernière sauvegarde"
            icon={Shield}
            gradient="from-red-500 via-red-600 to-red-700"
          />
        </div>
      </div>
    </div>
  )
}
