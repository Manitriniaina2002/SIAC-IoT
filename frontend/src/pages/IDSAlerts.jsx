import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Shield, AlertTriangle, AlertCircle, Info, Lightbulb, Clock, Wifi, WifiOff, Lock, Unlock, Network, Database, Server, Eye, Zap, FileText, ChevronLeft, ChevronRight } from 'lucide-react'
import { StatCard, ContentCard } from '@/components/cards'
import { PageHeader } from '@/components/layout'
import AnimatedBackground from '@/components/AnimatedBackground'
import { api } from '@/lib/api'
import { BASE_URL } from '@/lib/api'
import { Button } from '@/components/ui/button'

export default function IDSAlerts() {
  const [suricataLogs, setSuricataLogs] = useState([])
  const [suricataStats, setSuricataStats] = useState({})
  const [backendConnected, setBackendConnected] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(3)
  const [currentEventsPage, setCurrentEventsPage] = useState(1)
  const [eventsPerPage] = useState(5)
  const [dateFilter, setDateFilter] = useState('all')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')

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

  const handleExport = async (format) => {
    const url = `${BASE_URL}/api/v1/suricata/logs/export?format=${format}`;
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
        const extension = format === 'excel' ? 'xlsx' : format;
        a.download = `suricata_alerts_${new Date().toISOString().split('T')[0]}.${extension}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(a);
        toast.success(`Alertes exportées en ${format.toUpperCase()}`);
      } else {
        toast.error('Échec de l\'export');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Échec de l\'export');
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
      'esp32_anomaly': 'Anomalie ESP32'
    }
    return labels[category] || category || 'Inconnu'
  }

  // Date filtering logic
  const filterByDate = (logs) => {
    if (dateFilter === 'all') return logs
    
    const now = new Date()
    let startDate = new Date()
    
    switch(dateFilter) {
      case '1h':
        startDate = new Date(now - 60 * 60 * 1000)
        break
      case '24h':
        startDate = new Date(now - 24 * 60 * 60 * 1000)
        break
      case '7d':
        startDate = new Date(now - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(now - 30 * 24 * 60 * 60 * 1000)
        break
      case 'custom':
        if (!customStartDate) return logs
        startDate = new Date(customStartDate)
        const endDate = customEndDate ? new Date(customEndDate) : now
        return logs.filter(log => {
          const logDate = new Date(log.event_ts || log.ts)
          return logDate >= startDate && logDate <= endDate
        })
      default:
        return logs
    }
    
    return logs.filter(log => {
      const logDate = new Date(log.event_ts || log.ts)
      return logDate >= startDate
    })
  }

  const filteredLogs = filterByDate(suricataLogs)
  const highPriorityAlerts = filteredLogs.filter(log => log.severity <= 2)
  const recentAlerts = filteredLogs

  // Pagination logic for High Priority Alerts
  const totalPages = Math.ceil(highPriorityAlerts.length / itemsPerPage)
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentAlerts = highPriorityAlerts.slice(indexOfFirstItem, indexOfLastItem)

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const goToPage = (pageNumber) => {
    setCurrentPage(pageNumber)
  }

  // Pagination logic for Recent Events
  const totalEventsPages = Math.ceil(recentAlerts.length / eventsPerPage)
  const indexOfLastEvent = currentEventsPage * eventsPerPage
  const indexOfFirstEvent = indexOfLastEvent - eventsPerPage
  const currentEvents = recentAlerts.slice(indexOfFirstEvent, indexOfLastEvent)

  const nextEventsPage = () => {
    if (currentEventsPage < totalEventsPages) {
      setCurrentEventsPage(currentEventsPage + 1)
    }
  }

  const prevEventsPage = () => {
    if (currentEventsPage > 1) {
      setCurrentEventsPage(currentEventsPage - 1)
    }
  }

  const goToEventsPage = (pageNumber) => {
    setCurrentEventsPage(pageNumber)
  }

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
          <Button 
            onClick={() => handleExport('excel')} 
            className="bg-green-600 hover:bg-green-700 shadow-lg font-semibold px-6 py-2 flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Export Excel
          </Button>
          <Button 
            onClick={() => handleExport('pdf')} 
            className="bg-red-600 hover:bg-red-700 shadow-lg font-semibold px-6 py-2 flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Date Filter */}
      <div className="rounded-2xl p-6 bg-white/80 backdrop-blur-sm border border-gray-200">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-gray-700">Filtrer par date:</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setDateFilter('all')}
              className={`px-4 py-2 rounded-lg border font-medium transition-colors ${
                dateFilter === 'all'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Tout
            </button>
            <button
              onClick={() => setDateFilter('1h')}
              className={`px-4 py-2 rounded-lg border font-medium transition-colors ${
                dateFilter === '1h'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              1 Heure
            </button>
            <button
              onClick={() => setDateFilter('24h')}
              className={`px-4 py-2 rounded-lg border font-medium transition-colors ${
                dateFilter === '24h'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              24 Heures
            </button>
            <button
              onClick={() => setDateFilter('7d')}
              className={`px-4 py-2 rounded-lg border font-medium transition-colors ${
                dateFilter === '7d'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              7 Jours
            </button>
            <button
              onClick={() => setDateFilter('30d')}
              className={`px-4 py-2 rounded-lg border font-medium transition-colors ${
                dateFilter === '30d'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              30 Jours
            </button>
            <button
              onClick={() => setDateFilter('custom')}
              className={`px-4 py-2 rounded-lg border font-medium transition-colors ${
                dateFilter === 'custom'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Personnalisé
            </button>
          </div>

          {dateFilter === 'custom' && (
            <div className="flex items-center gap-2 ml-auto">
              <input
                type="datetime-local"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-500">à</span>
              <input
                type="datetime-local"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div className="ml-auto text-sm text-gray-600">
            {filteredLogs.length} alerte{filteredLogs.length !== 1 ? 's' : ''} trouvée{filteredLogs.length !== 1 ? 's' : ''}
          </div>
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
          {currentAlerts.map((alert, index) => (
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
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">IP Source:</span>
                  <div className="font-mono text-gray-900">{alert.src_ip || 'N/A'}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-700">IP Dest:</span>
                  <div className="font-mono text-gray-900">{alert.dest_ip || alert.dst_ip || 'N/A'}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Action:</span>
                  <div className="font-mono text-gray-900 uppercase">{alert.action || 'logged'}</div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-sm">
                  <span className="font-medium text-gray-700">Signature:</span>
                  <div className="text-gray-900 mt-1">{alert.signature || 'N/A'}</div>
                </div>
              </div>
            </div>
          ))}
          
          {currentAlerts.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucune alerte prioritaire détectée</p>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between border-t pt-4">
            <div className="text-sm text-gray-600">
              Affichage {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, highPriorityAlerts.length)} sur {highPriorityAlerts.length} alertes
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={prevPage}
                disabled={currentPage === 1}
                className={`p-2 rounded-lg border ${
                  currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300'
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                  // Show first page, last page, current page, and pages around current
                  if (
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => goToPage(pageNum)}
                        className={`px-4 py-2 rounded-lg border ${
                          currentPage === pageNum
                            ? 'bg-red-600 text-white border-red-600'
                            : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  } else if (
                    pageNum === currentPage - 2 ||
                    pageNum === currentPage + 2
                  ) {
                    return <span key={pageNum} className="px-2 text-gray-400">...</span>
                  }
                  return null
                })}
              </div>

              <button
                onClick={nextPage}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-lg border ${
                  currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300'
                }`}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
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
          {currentEvents.map((alert, index) => (
            <div key={index} className="flex items-start justify-between p-3 bg-white/60 rounded-lg border border-gray-200">
              <div className="flex items-start gap-3 flex-1">
                <div className={`p-2 rounded-full ${getSeverityColor(alert.severity)}`}>
                  {getCategoryIcon(getCategoryFromSignature(alert.signature))}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-800">
                    {alert.message || alert.signature || 'Événement de sécurité'}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {getCategoryLabel(getCategoryFromSignature(alert.signature))}
                  </div>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs">
                    <span className="font-mono text-gray-700">
                      <strong>Src:</strong> {alert.src_ip || 'N/A'}
                    </span>
                    <span className="font-mono text-gray-700">
                      <strong>Dest:</strong> {alert.dest_ip || alert.dst_ip || 'N/A'}
                    </span>
                    <span className="font-mono text-gray-700 uppercase">
                      <strong>Action:</strong> {alert.action || 'logged'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right ml-3">
                <div className="text-sm text-gray-500 whitespace-nowrap">
                  {new Date(alert.event_ts || alert.ts).toLocaleTimeString('fr-FR')}
                </div>
                <div className={`text-xs px-2 py-1 rounded-full mt-1 ${getSeverityColor(alert.severity)}`}>
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

        {recentAlerts.length > eventsPerPage && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Affichage de {indexOfFirstEvent + 1} à {Math.min(indexOfLastEvent, recentAlerts.length)} sur {recentAlerts.length} événements
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={prevEventsPage}
                  disabled={currentEventsPage === 1}
                  className={`p-2 rounded-lg border ${
                    currentEventsPage === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300'
                  }`}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="flex gap-1">
                  {Array.from({ length: totalEventsPages }, (_, i) => i + 1).map((pageNum) => {
                    if (
                      pageNum === 1 ||
                      pageNum === totalEventsPages ||
                      (pageNum >= currentEventsPage - 1 && pageNum <= currentEventsPage + 1)
                    ) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => goToEventsPage(pageNum)}
                          className={`px-4 py-2 rounded-lg border ${
                            currentEventsPage === pageNum
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300'
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    } else if (
                      pageNum === currentEventsPage - 2 ||
                      pageNum === currentEventsPage + 2
                    ) {
                      return <span key={pageNum} className="px-2 text-gray-400">...</span>
                    }
                    return null
                  })}
                </div>

                <button
                  onClick={nextEventsPage}
                  disabled={currentEventsPage === totalEventsPages}
                  className={`p-2 rounded-lg border ${
                    currentEventsPage === totalEventsPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300'
                  }`}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
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