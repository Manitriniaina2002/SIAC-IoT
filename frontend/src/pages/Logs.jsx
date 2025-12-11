import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { FileText, AlertTriangle, AlertCircle, Info, Clock, Database, Server, Network, Shield, Activity, TrendingUp, Calendar, Download } from 'lucide-react'
import { StatCard, ContentCard } from '@/components/cards'
import { PageHeader } from '@/components/layout'
import AnimatedBackground from '@/components/AnimatedBackground'
import { api } from '@/lib/api'
import { BASE_URL } from '@/lib/api'
import { Button } from '@/components/ui/button'

export default function Logs() {
  const [suricataLogs, setSuricataLogs] = useState([])
  const [suricataStats, setSuricataStats] = useState({})
  const [backendConnected, setBackendConnected] = useState(false)
  const [activeAlerts, setActiveAlerts] = useState([])
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h')

  const loadLogsData = async () => {
    try {
      const [logs, stats, alerts] = await Promise.all([
        api.getRecentSuricataLogs(100),
        api.getSuricataStats(),
        api.getActiveAlerts()
      ])
      setSuricataLogs(Array.isArray(logs) ? logs : [])
      setSuricataStats(stats || {})
      setActiveAlerts(Array.isArray(alerts) ? alerts : [])
      setBackendConnected(true)
    } catch (e) {
      setBackendConnected(false)
      console.error('Failed to load logs data:', e)
    }
  }

  const handleExport = async (format) => {
    const url = `${BASE_URL}/api/v1/logs/export?format=${format}`;
    const token = api.getToken();
    try {
      const response = await fetch(url, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      });
      if (response.ok) {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `logs.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(a);
        toast.success(`Logs exported as ${format.toUpperCase()}`);
      } else {
        toast.error('Export failed');
      }
    } catch (error) {
      toast.error('Export failed');
    }
  }

  useEffect(() => { 
    loadLogsData()
    // Poll every 60 seconds for logs
    const interval = setInterval(loadLogsData, 60000)
    return () => clearInterval(interval)
  }, [])

  const getSeverityColor = (severity) => {
    const sev = parseInt(severity) || 3
    switch(sev) {
      case 1: return 'text-red-600 bg-red-50'
      case 2: return 'text-orange-600 bg-orange-50'
      case 3: return 'text-yellow-600 bg-yellow-50'
      default: return 'text-gray-600 bg-gray-50'
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

  const getSeverityIcon = (severity) => {
    const sev = parseInt(severity) || 3
    switch(sev) {
      case 1: return <AlertCircle className="w-4 h-4" />
      case 2: return <AlertTriangle className="w-4 h-4" />
      case 3: return <Info className="w-4 h-4" />
      default: return <Info className="w-4 h-4" />
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
      'esp32_anomaly': 'Anomalie ESP32'
    }
    return labels[category] || category || 'Inconnu'
  }

  const exportLogs = () => {
    const csvContent = [
      ['Timestamp', 'IP Source', 'Port Dest', 'Signature', 'Catégorie', 'Sévérité', 'Message', 'Occurrences', 'Action'].join(','),
      ...suricataLogs.map(log => [
        log.ts,
        log.src_ip || '',
        log.dst_port || '',
        `"${log.signature || ''}"`,
        log.category || '',
        log.severity || '',
        `"${log.message || ''}"`,
        log.occurrences || 1,
        log.action || 'logged'
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `suricata_logs_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    
    toast.success('Logs exportés avec succès')
  }

  const filteredLogs = suricataLogs.filter(log => {
    const logTime = new Date(log.ts)
    const now = new Date()
    switch(selectedTimeframe) {
      case '1h': return (now - logTime) < 3600000
      case '24h': return (now - logTime) < 86400000
      case '7d': return (now - logTime) < 604800000
      default: return true
    }
  })

  return (
    <div className="space-y-6 relative min-h-screen">
      <AnimatedBackground />
      <div className="relative" style={{zIndex: 10}}>
      
      <PageHeader 
        title="Logs & Journalisation" 
        description="Historique complet des événements système et sécurité"
        icon={FileText}
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
              {backendConnected ? 'Logging Actif' : 'Logging Hors Ligne'}
            </span>
            <div className="flex items-center gap-2">
              <select 
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md bg-white"
              >
                <option value="1h">Dernière heure</option>
                <option value="24h">24 heures</option>
                <option value="7d">7 jours</option>
                <option value="all">Tout</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={exportLogs} 
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg font-semibold px-4 py-2 flex items-center gap-2 rounded-lg"
            >
              <Download className="w-4 h-4" />
              Exporter CSV
            </button>
            <Button 
              onClick={() => handleExport('excel')} 
              className="bg-green-600 hover:bg-green-700 shadow-lg font-semibold px-4 py-2 flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Export Excel
            </Button>
            <Button 
              onClick={() => handleExport('pdf')} 
              className="bg-red-600 hover:bg-red-700 shadow-lg font-semibold px-4 py-2 flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Export PDF
            </Button>
            <button 
              onClick={loadLogsData} 
              className="bg-gray-600 hover:bg-gray-700 text-white shadow-lg font-semibold px-4 py-2 flex items-center gap-2 rounded-lg"
            >
              <Activity className="w-4 h-4" />
              Actualiser
            </button>
          </div>
        </div>
      </div>

      {/* Logs Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Logs"
          value={suricataStats.total_logs || 0}
          description="Événements enregistrés"
          icon={FileText}
          gradient="from-blue-500 via-cyan-600 to-teal-700"
        />

        <StatCard
          title="Logs (24h)"
          value={suricataStats.logs_24h || 0}
          description="Événements récents"
          icon={Clock}
          gradient="from-green-500 via-emerald-600 to-teal-700"
        />

        <StatCard
          title="Alertes Actives"
          value={activeAlerts.length}
          description="Nécessitent attention"
          icon={AlertTriangle}
          gradient="from-red-500 via-rose-600 to-pink-700"
        />

        <StatCard
          title="Catégories"
          value={Object.keys(suricataStats.categories || {}).length}
          description="Types d'événements"
          icon={Database}
          gradient="from-purple-500 via-violet-600 to-indigo-700"
        />
      </div>

      {/* Active Alerts Summary */}
      <ContentCard
        title="Alertes Actives"
        description="Résumé des alertes système non résolues"
        icon={AlertTriangle}
        iconColor="red"
        gradientFrom="red-50"
        gradientTo="rose-50"
      >
        <div className="space-y-3">
          {activeAlerts.slice(0, 5).map((alert, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-white/60 rounded-lg border border-red-200">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-red-50">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-800">{alert.reason}</div>
                  <div className="text-sm text-gray-600">
                    {alert.device_id} • Sévérité: {alert.severity}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">
                  {new Date(alert.ts).toLocaleString('fr-FR')}
                </div>
                <div className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">
                  Score: {alert.score ? alert.score.toFixed(2) : 'N/A'}
                </div>
              </div>
            </div>
          ))}
          
          {activeAlerts.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucune alerte active</p>
            </div>
          )}
        </div>
      </ContentCard>

      {/* Detailed Logs Table */}
      <ContentCard
        title="Journal des Événements"
        description="Logs détaillés de sécurité et système"
        icon={FileText}
        iconColor="blue"
        gradientFrom="blue-50"
        gradientTo="indigo-50"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left p-3 font-semibold text-gray-700">Timestamp</th>
                <th className="text-left p-3 font-semibold text-gray-700">IP Source</th>
                <th className="text-left p-3 font-semibold text-gray-700">Port</th>
                <th className="text-left p-3 font-semibold text-gray-700">Catégorie</th>
                <th className="text-left p-3 font-semibold text-gray-700">Sévérité</th>
                <th className="text-left p-3 font-semibold text-gray-700">Message</th>
                <th className="text-left p-3 font-semibold text-gray-700">Occurrences</th>
                <th className="text-left p-3 font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3 text-gray-600">
                    {new Date(log.event_ts || log.ts).toLocaleString('fr-FR')}
                  </td>
                  <td className="p-3 font-mono text-gray-800">
                    {log.src_ip || 'N/A'}
                  </td>
                  <td className="p-3 font-mono text-gray-800">
                    {log.dest_port || 'N/A'}
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                      {getCategoryLabel(getCategoryFromSignature(log.signature))}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className={`flex items-center gap-1 ${getSeverityColor(log.severity)}`}>
                      {getSeverityIcon(log.severity)}
                      <span className="text-xs font-medium">{log.severity}</span>
                    </div>
                  </td>
                  <td className="p-3 text-gray-800 max-w-xs truncate" title={log.message || log.signature}>
                    {log.message || log.signature || 'N/A'}
                  </td>
                  <td className="p-3 text-center">
                    {log.occurrences || 1}
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                      {log.action || 'logged'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredLogs.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucun log trouvé pour la période sélectionnée</p>
            </div>
          )}
        </div>
      </ContentCard>

      {/* Statistics Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <ContentCard
          title="Répartition par Sévérité"
          description="Distribution des niveaux de sévérité"
          icon={TrendingUp}
          iconColor="green"
          gradientFrom="green-50"
          gradientTo="emerald-50"
        >
          <div className="space-y-3">
            {Object.entries(suricataStats.severities || {}).map(([severity, count]) => (
              <div key={severity} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getSeverityIcon(parseInt(severity))}
                  <span className="text-sm font-medium">Sévérité {severity}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{width: `${(count / Math.max(...Object.values(suricataStats.severities || {}))) * 100}%`}}
                    ></div>
                  </div>
                  <span className="text-sm font-bold w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </ContentCard>

        <ContentCard
          title="Top Catégories"
          description="Catégories d'événements les plus fréquentes"
          icon={Database}
          iconColor="purple"
          gradientFrom="purple-50"
          gradientTo="violet-50"
        >
          <div className="space-y-3">
            {Object.entries(suricataStats.categories || {})
              .sort(([,a], [,b]) => b - a)
              .slice(0, 5)
              .map(([category, count]) => (
              <div key={category} className="flex items-center justify-between">
                <span className="text-sm font-medium">{getCategoryLabel(category)}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full" 
                      style={{width: `${(count / Math.max(...Object.values(suricataStats.categories || {}))) * 100}%`}}
                    ></div>
                  </div>
                  <span className="text-sm font-bold w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </ContentCard>
      </div>

      </div>
    </div>
  )
}