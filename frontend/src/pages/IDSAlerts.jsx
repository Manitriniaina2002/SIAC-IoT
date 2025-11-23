import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Shield, AlertTriangle, AlertCircle, Info, Lightbulb, Clock, Wifi, WifiOff, Lock, Unlock, Network, Database, Server, Eye, Zap } from 'lucide-react'
import { StatCard, ContentCard } from '@/components/cards'
import { PageHeader } from '@/components/layout'
import AnimatedBackground from '@/components/AnimatedBackground'
import { api } from '@/lib/api'

export default function IDSAlerts() {
  const [suricataLogs, setSuricataLogs] = useState([])
  const [suricataStats, setSuricataStats] = useState({})
  const [backendConnected, setBackendConnected] = useState(false)

  const loadSuricataData = async () => {
    try {
      const [logs, stats] = await Promise.all([
        api.getRecentSuricataLogs(50),
        api.getSuricataStats()
      ])
      setSuricataLogs(Array.isArray(logs) ? logs : [])
      setSuricataStats(stats || {})
      setBackendConnected(true)
    } catch (e) {
      setBackendConnected(false)
      console.error('Failed to load Suricata data:', e)
    }
  }

  useEffect(() => { 
    loadSuricataData()
    // Poll every 30 seconds for real-time updates
    const interval = setInterval(loadSuricataData, 30000)
    return () => clearInterval(interval)
  }, [])

  const getSeverityColor = (severity) => {
    const sev = parseInt(severity) || 3
    switch(sev) {
      case 1: return 'text-red-600 bg-red-50 border-red-200'
      case 2: return 'text-orange-600 bg-orange-50 border-orange-200'
      case 3: return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getSeverityLabel = (severity) => {
    const sev = parseInt(severity) || 3
    switch(sev) {
      case 1: return 'Critique'
      case 2: return 'Élevé'
      case 3: return 'Moyen'
      default: return 'Faible'
    }
  }

  const getCategoryFromSignature = (signature) => {
    if (!signature) return 'unknown'
    const sig = signature.toLowerCase()
    if (sig.includes('mqtt') && sig.includes('tls')) return 'mqtt_no_tls'
    if (sig.includes('brute') || sig.includes('admin')) return 'brute_force'
    if (sig.includes('scan') || sig.includes('nmap')) return 'network_scan'
    if (sig.includes('dos') || sig.includes('flood')) return 'dos'
    if (sig.includes('tls')) return 'tls_error'
    if (sig.includes('docker') || sig.includes('172.17')) return 'intrusion'
    return 'other'
  }

  const getCategoryIcon = (category) => {
    switch(category) {
      case 'brute_force': return <Lock className="w-4 h-4" />
      case 'dos': return <Zap className="w-4 h-4" />
      case 'network_scan': return <Network className="w-4 h-4" />
      case 'tls_error': return <Shield className="w-4 h-4" />
      case 'intrusion': return <Eye className="w-4 h-4" />
      default: return <AlertTriangle className="w-4 h-4" />
    }
  }

  const getCategoryLabel = (category) => {
    const labels = {
      'brute_force': 'Brute Force',
      'dos': 'Déni de Service',
      'network_scan': 'Scan Réseau',
      'tls_error': 'Erreur TLS',
      'intrusion': 'Intrusion',
      'mqtt_flood': 'MQTT Flood',
      'mqtt_no_tls': 'MQTT sans TLS',
      'esp32_anomaly': 'Anomalie ESP32',
      'rfid_brute': 'RFID Brute Force'
    }
    return labels[category] || category || 'Inconnu'
  }

  const highPriorityAlerts = suricataLogs.filter(log => log.severity <= 2)
  const recentAlerts = suricataLogs.slice(0, 10)

  return (
    <div className="space-y-6 relative min-h-screen">
      <AnimatedBackground />
      <div className="relative" style={{zIndex: 10}}>
      
      <PageHeader 
        title="Alertes IDS en Temps Réel" 
        description="Détection d'intrusions et menaces de sécurité"
        icon={Shield}
      />

      {/* Status Header */}
      <div className="rounded-2xl p-6 mb-6 bg-white/80 backdrop-blur-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className={`px-4 py-2 text-sm rounded-full font-semibold shadow-lg ${
              backendConnected 
                ? 'bg-green-500 text-white border-2 border-green-300' 
                : 'bg-red-500 text-white border-2 border-red-300'
            }`}>
              <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                backendConnected ? 'bg-green-200 animate-pulse' : 'bg-red-200'
              }`}></span>
              {backendConnected ? 'IDS Actif' : 'IDS Hors Ligne'}
            </span>
            <span className="text-sm text-gray-600">
              {suricataStats.logs_24h || 0} alertes détectées (24h)
            </span>
          </div>
          <button 
            onClick={loadSuricataData} 
            className="bg-red-600 hover:bg-red-700 text-white shadow-lg font-semibold px-6 py-2 flex items-center gap-2 rounded-lg"
          >
            <Shield className="w-4 h-4" />
            Actualiser IDS
          </button>
        </div>
      </div>

      {/* Security Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Alertes Critiques"
          value={highPriorityAlerts.filter(log => log.severity === 1).length}
          description="Sévérité maximale"
          icon={AlertCircle}
          gradient="from-red-500 via-rose-600 to-pink-700"
        />

        <StatCard
          title="Tentatives Brute Force"
          value={suricataStats.categories?.brute_force || 0}
          description="Attaques par force brute"
          icon={Lock}
          gradient="from-orange-500 via-red-600 to-rose-600"
        />

        <StatCard
          title="Scans Réseau"
          value={suricataStats.categories?.network_scan || 0}
          description="Détections de scans"
          icon={Network}
          gradient="from-yellow-500 via-amber-600 to-orange-600"
        />

        <StatCard
          title="Intrusions Détectées"
          value={suricataStats.categories?.intrusion || 0}
          description="Accès non autorisés"
          icon={Eye}
          gradient="from-purple-500 via-violet-600 to-indigo-700"
        />
      </div>

      {/* High Priority Alerts */}
      <ContentCard
        title="Alertes Prioritaires"
        description="Menaces de sécurité critiques nécessitant une attention immédiate"
        icon={AlertCircle}
        iconColor="red"
        gradientFrom="red-50"
        gradientTo="rose-50"
      >
        <div className="space-y-4">
          {highPriorityAlerts.map((alert, index) => (
            <div key={index} className={`border-2 rounded-lg p-4 bg-white/80 backdrop-blur-sm ${getSeverityColor(alert.severity)}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {getCategoryIcon(getCategoryFromSignature(alert.signature))}
                  <div>
                    <div className="font-semibold text-lg text-gray-800">
                      {alert.message || alert.signature || 'Alerte de sécurité'}
                    </div>
                    <div className="text-sm text-gray-600">
                      {getCategoryLabel(getCategoryFromSignature(alert.signature))} • {getSeverityLabel(alert.severity)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono text-gray-500">
                    {new Date(alert.event_ts || alert.ts).toLocaleString('fr-FR')}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">IP Source:</span>
                  <div className="font-mono">{alert.src_ip || 'N/A'}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Port Dest:</span>
                  <div className="font-mono">{alert.dst_port || 'N/A'}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Action:</span>
                  <div>{alert.action || 'logged'}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Signature:</span>
                  <div className="truncate" title={alert.signature}>
                    {alert.signature || 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {highPriorityAlerts.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucune alerte prioritaire détectée</p>
            </div>
          )}
        </div>
      </ContentCard>

      {/* Recent Security Events */}
      <ContentCard
        title="Événements de Sécurité Récents"
        description="Journal des dernières activités de sécurité"
        icon={Clock}
        iconColor="blue"
        gradientFrom="blue-50"
        gradientTo="indigo-50"
      >
        <div className="space-y-3">
          {recentAlerts.map((alert, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-white/60 rounded-lg border border-gray-200">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${getSeverityColor(alert.severity)}`}>
                  {getCategoryIcon(getCategoryFromSignature(alert.signature))}
                </div>
                <div>
                  <div className="font-medium text-gray-800">
                    {alert.message || alert.signature || 'Événement de sécurité'}
                  </div>
                  <div className="text-sm text-gray-600">
                    {getCategoryLabel(getCategoryFromSignature(alert.signature))} • {alert.src_ip || 'IP inconnue'}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">
                  {new Date(alert.event_ts || alert.ts).toLocaleTimeString('fr-FR')}
                </div>
                <div className={`text-xs px-2 py-1 rounded-full ${getSeverityColor(alert.severity)}`}>
                  {getSeverityLabel(alert.severity)}
                </div>
              </div>
            </div>
          ))}
          
          {recentAlerts.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucun événement récent</p>
            </div>
          )}
        </div>
      </ContentCard>

      {/* Security Categories Breakdown */}
      <ContentCard
        title="Répartition par Catégorie"
        description="Analyse des types d'alertes détectés"
        icon={Database}
        iconColor="green"
        gradientFrom="green-50"
        gradientTo="emerald-50"
      >
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Object.entries(suricataStats.categories || {}).map(([category, count]) => (
            <div key={category} className="bg-white/60 p-4 rounded-lg border border-gray-200 text-center">
              <div className="flex justify-center mb-2">
                {getCategoryIcon(category)}
              </div>
              <div className="text-2xl font-bold text-gray-800">{count}</div>
              <div className="text-sm text-gray-600">{getCategoryLabel(category)}</div>
            </div>
          ))}
        </div>
        
        {Object.keys(suricataStats.categories || {}).length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Aucune donnée de catégorie disponible</p>
          </div>
        )}
      </ContentCard>

      </div>
    </div>
  )
}