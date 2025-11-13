import React from 'react'
import { Button } from '@/components/ui/button'
import { Activity, TrendingUp, AlertTriangle, Database, Wifi, CheckCircle, Zap, ArrowUpRight, BarChart3, LineChart } from 'lucide-react'
import { StatCard, ContentCard, ActivityItem, ProgressBar } from '@/components/cards'
import { PageHeader } from '@/components/layout'
import { LineChart as RechartsLine, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import AnimatedBackground from '@/components/AnimatedBackground'

export default function Dashboard() {
  const activities = [
    { id: 1, text: 'ESP32_Sensor_01 connecté', time: 'Il y a 5 min', type: 'success', icon: CheckCircle },
    { id: 2, text: 'Anomalie détectée sur RPi_Gateway_03', time: 'Il y a 12 min', type: 'danger', icon: AlertTriangle },
    { id: 3, text: 'Alerte haute température résolue', time: 'Il y a 1h', type: 'warning', icon: Zap },
    { id: 4, text: 'Nouveau device enregistré: Sensor_07', time: 'Il y a 2h', type: 'info', icon: Wifi },
  ]

  // Chart data
  const deviceActivityData = [
    { time: '00:00', devices: 18, alerts: 2 },
    { time: '04:00', devices: 20, alerts: 1 },
    { time: '08:00', devices: 22, alerts: 3 },
    { time: '12:00', devices: 24, alerts: 2 },
    { time: '16:00', devices: 23, alerts: 4 },
    { time: '20:00', devices: 24, alerts: 1 },
  ]

  const dataVolumeData = [
    { day: 'Lun', volume: 0.8 },
    { day: 'Mar', volume: 1.2 },
    { day: 'Mer', volume: 0.9 },
    { day: 'Jeu', volume: 1.5 },
    { day: 'Ven', volume: 1.3 },
    { day: 'Sam', volume: 1.0 },
    { day: 'Dim', volume: 1.2 },
  ]

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

  return (
    <div className="space-y-6 relative">
      <AnimatedBackground />
      <div className="relative" style={{zIndex: 10}}>
      <PageHeader 
        title="Tableau de bord" 
        description="Vue d'ensemble de votre infrastructure IoT"
      />

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Appareils Actifs"
          value="24"
          description="+3 depuis hier"
          icon={Activity}
          gradient="from-green-500 via-green-600 to-green-700"
        />
        
        <StatCard
          title="Alertes Actives"
          value="3"
          description="Attention requise"
          icon={AlertTriangle}
          gradient="from-red-500 via-rose-600 to-pink-700"
        />
        
        <StatCard
          title="Anomalies (24h)"
          value="7"
          description="-3 vs semaine dernière"
          icon={Zap}
          gradient="from-amber-500 via-orange-600 to-yellow-600"
        />
        
        <StatCard
          title="Volume de données"
          value="1.2 GB"
          description="Aujourd'hui"
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
            {activities.map((activity) => (
              <ActivityItem
                key={activity.id}
                text={activity.text}
                time={activity.time}
                type={activity.type}
                icon={activity.icon}
                getActivityColor={getActivityColor}
                getBadgeVariant={getBadgeVariant}
              />
            ))}
          </div>
        </ContentCard>

        <ContentCard
          title="État du Système"
          description="Performances globales"
          icon={TrendingUp}
          iconColor="blue"
          gradientFrom="blue-50"
          gradientTo="indigo-50"
        >
          <div className="space-y-5">
            <ProgressBar 
              label="Santé des capteurs" 
              percentage={96} 
              gradient="linear-gradient(to right, #07005F, #5b21b6)" 
            />
            <ProgressBar 
              label="Connexions MQTT" 
              percentage={89} 
              gradient="linear-gradient(to right, #3730a3, #6366f1)" 
            />
            <ProgressBar 
              label="Modèle IA (précision)" 
              percentage={94} 
              gradient="linear-gradient(to right, #7c3aed, #a78bfa)" 
            />
            <ProgressBar 
              label="Stockage utilisé" 
              percentage={67} 
              gradient="linear-gradient(to right, rgb(234, 179, 8), rgb(234, 88, 12))" 
            />
            <Button className="w-full mt-4 shadow-md hover:shadow-lg transition-all duration-200" style={{background: 'linear-gradient(to right, #7F0202, #311156)', color: 'white'}} variant="default">
              <Activity className="w-4 h-4 mr-2" />
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
          <ResponsiveContainer width="100%" height={300}>
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
          <ResponsiveContainer width="100%" height={300}>
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
        <ResponsiveContainer width="100%" height={300}>
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
