import React, { useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Activity, TrendingUp, AlertTriangle, Database, Wifi, CheckCircle, Zap, ArrowUpRight, BarChart3, LineChart, RefreshCw, Brain, Calendar, Sparkles, HardDrive, TrendingDown } from 'lucide-react'
import { StatCard, ContentCard, ActivityItem, ProgressBar } from '@/components/cards'
import { PageHeader } from '@/components/layout'
import { LineChart as RechartsLine, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import AnimatedBackground from '@/components/AnimatedBackground'
import { api } from '@/lib/api'
import { useWebSocket } from '@/lib/utils'

export default function Dashboard() {
  const [devices, setDevices] = useState([])
  const [backendConnected, setBackendConnected] = useState(false)
  const [modelStatus, setModelStatus] = useState(null)
  const loadDevices = async () => {
    try {
      const data = await api.getDevices()
      setDevices(Array.isArray(data) ? data : [])
      setBackendConnected(true)
    } catch (e) {
      setBackendConnected(false)
    }
  }
  useEffect(() => { loadDevices() }, [])
  const [recentAlerts, setRecentAlerts] = useState([])
  const [summary, setSummary] = useState({ devices_count: 0, alerts_active: 0, anomalies_24h: 0, data_volume_today_gb: 0 })
  const [activitySeries, setActivitySeries] = useState([])
  const [volumeSeries, setVolumeSeries] = useState([])
  const seenAlertsRef = useRef(new Set())

  // WebSocket for real-time updates
  const wsUrl = `ws://localhost:18000/ws` // Backend WebSocket endpoint
  const { isConnected: wsConnected } = useWebSocket(wsUrl, (data) => {
    if (data.type === 'telemetry') {
      // Update device data in real-time
      setDevices(prev => prev.map(device => 
        device.device_id === data.device_id 
          ? { ...device, last_seen: new Date().toISOString() }
          : device
      ))
    } else if (data.type === 'alert') {
      // Show real-time alert
      if (data.severity === 'high' && !seenAlertsRef.current.has(data.alert_id)) {
        seenAlertsRef.current.add(data.alert_id)
        toast.error(`${data.device_id}: ${data.reason || 'Alerte haute sévérité'}`, { duration: 6000 })
      }
      // Refresh alerts
      loadSummary()
    } else if (data.type === 'device_status') {
      // Update device status
      setDevices(prev => prev.map(device => 
        device.device_id === data.device_id 
          ? { ...device, ...data }
          : device
      ))
    }
  })

  // Chart data
  const deviceActivityData = activitySeries

  const dataVolumeData = volumeSeries

  const anomalyTrendData = [
    { month: 'Jan', anomalies: 12 },
    { month: 'Fév', anomalies: 15 },
    { month: 'Mar', anomalies: 10 },
    { month: 'Avr', anomalies: 8 },
    { month: 'Mai', anomalies: 11 },
    { month: 'Juin', anomalies: 7 },
  ]

  const getActivityColor = (type) => {
    switch(type) {
      case 'success': return 'bg-violet-50' 
      case 'danger': return 'text-red-600 bg-red-50'
      case 'warning': return 'text-yellow-600 bg-yellow-50'
      case 'info': return 'text-blue-600 bg-blue-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getBadgeVariant = (type) => {
    switch(type) {
      case 'success': return 'success'
      case 'danger': return 'destructive'
      case 'warning': return 'warning'
      case 'info': return 'default'
      default: return 'secondary'
    }
  }

  const loadSummary = async () => {
    try {
      const s = await api.getDashboardSummary()
      setSummary(s)
    } catch {}
    try {
      const alerts = await api.getRecentAlerts(4)
      setRecentAlerts(alerts || [])
    } catch {}
    try {
      const act = await api.getDevicesActivity24h()
      setActivitySeries(Array.isArray(act) ? act : [])
    } catch {}
    try {
      const vol = await api.getDataVolume7d()
      setVolumeSeries(Array.isArray(vol) ? vol : [])
    } catch {}
    try {
      const ml = await api.getModelStatus()
      setModelStatus(ml)
    } catch {}
  }

  useEffect(() => { loadSummary() }, [])

  // Poll for high severity alerts and toast when new
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const latest = await api.getRecentAlerts(5)
        for (const a of latest || []) {
          if (a.severity === 'high' && !seenAlertsRef.current.has(a.alert_id)) {
            seenAlertsRef.current.add(a.alert_id)
            toast.error(`${a.device_id}: ${a.reason || 'Alerte haute sévérité'}`, { duration: 6000 })
          }
        }
      } catch {}
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-6 relative min-h-screen">
      <AnimatedBackground />
      <div className="relative" style={{zIndex: 10}}>
      
      {/* Enhanced Header */}
      <div className="rounded-2xl p-8 mb-8">
        <div className="flex items-center justify-center flex-wrap gap-3">
          <span
              className={`px-4 py-2 text-sm rounded-full font-semibold shadow-lg transition-all ${
                backendConnected 
                  ? 'bg-green-500 text-white border-2 border-green-300' 
                  : 'bg-red-500 text-white border-2 border-red-300'
              }`}
              title={backendConnected ? 'Backend opérationnel' : 'Backend indisponible'}
            >
              <span className={`inline-block w-2 h-2 rounded-full mr-2 ${backendConnected ? 'bg-green-200 animate-pulse' : 'bg-red-200'}`}></span>
              {backendConnected ? 'Connecté' : 'Déconnecté'}
            </span>
            {modelStatus && (
              <span
                className={`px-4 py-2 text-sm rounded-full font-semibold shadow-lg flex items-center gap-2 ${
                  modelStatus.status === 'trained' 
                    ? 'bg-emerald-500 text-white border-2 border-emerald-300' 
                    : 'bg-yellow-500 text-white border-2 border-yellow-300'
                }`}
              >
                <Brain className="w-4 h-4" />
                ML: {modelStatus.status === 'trained' ? 'Actif' : 'En attente'}
              </span>
            )}
            <span
              className={`px-4 py-2 text-sm rounded-full font-semibold shadow-lg flex items-center gap-2 ${
                wsConnected 
                  ? 'bg-blue-500 text-white border-2 border-blue-300' 
                  : 'bg-gray-500 text-white border-2 border-gray-300'
              }`}
              title={wsConnected ? 'WebSocket connecté' : 'WebSocket déconnecté'}
            >
              <Wifi className="w-4 h-4" />
              WS: {wsConnected ? 'Connecté' : 'Déconnecté'}
            </span>
            <Button 
              onClick={() => { loadDevices(); loadSummary(); }} 
              className="bg-white hover:bg-gray-50 shadow-lg font-semibold px-6 py-2 flex items-center gap-2"
              style={{color: '#7F0202'}}
            >
              <RefreshCw className="w-4 h-4" />
              Rafraîchir
            </Button>
        </div>
      </div>

      {/* Stats Grid with enhanced design */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Appareils Connectés"
          value={devices.length.toString()}
          description={backendConnected ? 'Tous opérationnels' : 'Hors ligne'}
          icon={Activity}
          gradient="from-green-500 via-green-600 to-green-700"
        />
        
        <StatCard
          title="Alertes Actives"
          value={summary.alerts_active.toString()}
          description={summary.alerts_active > 0 ? 'Intervention requise' : 'Tout va bien'}
          icon={AlertTriangle}
          gradient="from-red-500 via-rose-600 to-pink-700"
        />
        
        <StatCard
          title="Anomalies Détectées"
          value={summary.anomalies_24h.toString()}
          description="Dernières 24 heures"
          icon={Zap}
          gradient="from-amber-500 via-orange-600 to-yellow-600"
        />
        
        <StatCard
          title="Données Traitées"
          value={`${summary.data_volume_today_gb} GB`}
          description="Volume aujourd'hui"
          icon={Database}
          gradient="from-cyan-500 via-blue-600 to-indigo-700"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <ContentCard
          title="Activité Récente"
          description="Événements des dernières heures"
          icon={Activity}
          iconColor="violet"
          gradientFrom="violet-50"
          gradientTo="purple-50"
        >
          <div className="space-y-3">
            {recentAlerts.length === 0 ? (
              <div className="text-gray-500 text-sm">Aucune alerte récente</div>
            ) : (
              recentAlerts.map((a) => {
                const type = a.severity === 'high' ? 'danger' : a.severity === 'medium' ? 'warning' : 'info'
                const icon = a.severity === 'high' ? AlertTriangle : a.severity === 'medium' ? Zap : Wifi
                const time = new Date(a.ts).toLocaleString('fr-FR')
                const text = `${a.device_id}: ${a.reason || 'Alerte détectée'}`
                return (
                  <ActivityItem
                    key={a.alert_id}
                    text={text}
                    time={time}
                    type={type}
                    icon={icon}
                    getActivityColor={getActivityColor}
                    getBadgeVariant={getBadgeVariant}
                    actions={[
                      {
                        label: 'Ack',
                        onClick: async () => {
                          try { await api.acknowledgeAlert(a.alert_id); await loadSummary() } catch {}
                        }
                      }
                    ]}
                  />
                )
              })
            )}
          </div>
        </ContentCard>

        <ContentCard
          title="État du Système"
          description="Performances et santé globale"
          icon={TrendingUp}
          iconColor="blue"
          gradientFrom="blue-50"
          gradientTo="indigo-50"
        >
          <div className="space-y-5">
            {/* ML Model Status - Featured */}
            {modelStatus && (
              <div className="p-4 rounded-xl shadow-lg border-2 transform hover:scale-[1.02] transition-all" style={{background: 'linear-gradient(to right, #7F0202, #311156)', borderColor: 'rgba(127, 2, 2, 0.5)'}}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Brain className="w-6 h-6 text-white" />
                    <span className="text-white font-bold text-lg">Modèle ML IsolationForest</span>
                  </div>
                  <span className={`px-3 py-1.5 text-xs rounded-full font-bold shadow-md flex items-center gap-1 ${
                    modelStatus.status === 'trained' ? 'bg-green-400 text-green-900 border-2 border-green-200' :
                    modelStatus.status === 'training' ? 'bg-yellow-400 text-yellow-900 border-2 border-yellow-200' :
                    modelStatus.status === 'error' ? 'bg-red-400 text-red-900 border-2 border-red-200' :
                    'bg-gray-400 text-gray-900 border-2 border-gray-200'
                  }`}>
                    {modelStatus.status === 'trained' ? <><CheckCircle className="w-3 h-3" /> ENTRAÎNÉ</> :
                     modelStatus.status === 'training' ? <><RefreshCw className="w-3 h-3 animate-spin" /> EN COURS</> :
                     modelStatus.status === 'error' ? <><AlertTriangle className="w-3 h-3" /> ERREUR</> :
                     <><TrendingDown className="w-3 h-3" /> EN ATTENTE</>}
                  </span>
                </div>
                {modelStatus.trained_at && (
                  <div className="text-xs text-purple-100 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>Entraîné le {new Date(modelStatus.trained_at).toLocaleString('fr-FR')}</span>
                  </div>
                )}
                {modelStatus.status === 'trained' && (
                  <div className="mt-2 text-xs text-purple-100 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Détection d'anomalies active sur toute la télémétrie entrante</span>
                  </div>
                )}
              </div>
            )}
            
            {[
              { label: "Santé des capteurs", percentage: 96, gradient: "linear-gradient(to right, #07005F, #5b21b6)" },
              { label: "Connexions MQTT", percentage: 89, gradient: "linear-gradient(to right, #3730a3, #6366f1)" },
              { label: "Précision détection", percentage: 94, gradient: "linear-gradient(to right, #7c3aed, #a78bfa)" },
              { label: "Stockage utilisé", percentage: 67, gradient: "linear-gradient(to right, rgb(234, 179, 8), rgb(234, 88, 12))" }
            ].map((metric, index) => (
              <ProgressBar 
                key={metric.label}
                label={metric.label}
                percentage={metric.percentage}
                gradient={metric.gradient}
              />
            ))}
            
            <Button className="w-full mt-4 shadow-lg hover:shadow-xl transition-all duration-200 text-base font-semibold" style={{background: 'linear-gradient(to right, #7F0202, #311156)', color: 'white'}} variant="default">
              <Activity className="w-5 h-5 mr-2" />
              Voir tous les appareils
            </Button>
          </div>
        </ContentCard>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <ContentCard
          title="Activité des Devices (24h)"
          description="Nombre de devices actifs et alertes"
          icon={BarChart3}
          iconColor="indigo"
          gradientFrom="indigo-50"
          gradientTo="purple-50"
        >
          <ResponsiveContainer width="100%" height={300} minWidth={300} minHeight={300}>
            <AreaChart data={deviceActivityData}>
              <defs>
                <linearGradient id="colorDevices" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorAlerts" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="time" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}
              />
              <Legend />
              <Area type="monotone" dataKey="devices" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorDevices)" name="Devices Actifs" />
              <Area type="monotone" dataKey="alerts" stroke="#ef4444" fillOpacity={1} fill="url(#colorAlerts)" name="Alertes" />
            </AreaChart>
          </ResponsiveContainer>
        </ContentCard>

        <ContentCard
          title="Volume de Données (7 jours)"
          description="Données collectées par jour (GB)"
          icon={Database}
          iconColor="blue"
          gradientFrom="blue-50"
          gradientTo="cyan-50"
        >
          <ResponsiveContainer width="100%" height={300} minWidth={300} minHeight={300}>
            <BarChart data={dataVolumeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="day" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}
              />
              <Bar dataKey="volume" fill="url(#barGradient)" radius={[8, 8, 0, 0]} name="Volume (GB)" />
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </ContentCard>
      </div>

      {/* Anomaly Trend Chart */}
      <ContentCard
        title="Tendance des Anomalies (6 mois)"
        description="Évolution du nombre d'anomalies détectées"
        icon={LineChart}
        iconColor="orange"
        gradientFrom="orange-50"
        gradientTo="amber-50"
      >
        <ResponsiveContainer width="100%" height={300} minWidth={300} minHeight={300}>
          <RechartsLine data={anomalyTrendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
            <YAxis stroke="#6b7280" fontSize={12} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="anomalies" 
              stroke="#f59e0b" 
              strokeWidth={3}
              dot={{ fill: '#f59e0b', r: 6 }}
              activeDot={{ r: 8 }}
              name="Anomalies"
            />
          </RechartsLine>
        </ResponsiveContainer>
      </ContentCard>
      </div>
    </div>
  )
}
