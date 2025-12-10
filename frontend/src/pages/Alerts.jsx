import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { AlertTriangle, AlertCircle, Info, Lightbulb, Clock, ChevronLeft, ChevronRight, RefreshCw, X } from 'lucide-react'
import { StatCard, ContentCard } from '@/components/cards'
import { PageHeader } from '@/components/layout'
import AnimatedBackground from '@/components/AnimatedBackground'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { api } from '@/lib/api'

export default function Alerts(){
  const [mlAlerts, setMlAlerts] = useState([])
  const [recommendations, setRecommendations] = useState(null)
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [alertsPerPage] = useState(3)
  const [recPage, setRecPage] = useState(1)
  const [recsPerPage] = useState(3)
  const [selectedRecommendation, setSelectedRecommendation] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const loadMlAlerts = async () => {
    setLoading(true)
    try {
      const [alerts, recs] = await Promise.all([
        api.getRecentAlerts(50),
        api.getRecommendations()
      ])
      setMlAlerts(Array.isArray(alerts) ? alerts : [])
      setRecommendations(recs)
    } catch (e) {
      console.error('Failed to load ML alerts:', e)
      toast.error('Échec du chargement des alertes ML')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMlAlerts()
    const interval = setInterval(loadMlAlerts, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleAnalyze = (alertId) => {
    const rec = recommendations?.recommendations?.find(r => r.alert_id === alertId)
    if (rec && rec.actions && rec.actions.length > 0) {
      setSelectedRecommendation(rec)
      setIsModalOpen(true)
    } else {
      toast('Aucune recommandation disponible pour cette alerte', { icon: 'ℹ️' })
    }
  }

  const getSeverityFromScore = (score) => {
    if (score > 0.8) return 'high'
    if (score > 0.5) return 'medium'
    return 'low'
  }

  // Count alerts by severity
  const criticalCount = mlAlerts.filter(a => a.severity === 'high' || getSeverityFromScore(a.score || 0) === 'high').length
  const mediumCount = mlAlerts.filter(a => a.severity === 'medium' || getSeverityFromScore(a.score || 0) === 'medium').length
  const lowCount = mlAlerts.filter(a => a.severity === 'low' || getSeverityFromScore(a.score || 0) === 'low').length

  // Pagination
  const totalPages = Math.ceil(mlAlerts.length / alertsPerPage)
  const indexOfLastAlert = currentPage * alertsPerPage
  const indexOfFirstAlert = indexOfLastAlert - alertsPerPage
  const currentAlerts = mlAlerts.slice(indexOfFirstAlert, indexOfLastAlert)

  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1)
  }

  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1)
  }

  const goToPage = (pageNumber) => {
    setCurrentPage(pageNumber)
  }

  return (
    <div className="container relative">
      <AnimatedBackground />
      <div className="space-y-6 relative" style={{zIndex: 10}}>
        <PageHeader 
          title="Alertes & Anomalies" 
          description="Surveillance et détection des incidents par Machine Learning"
          icon={AlertTriangle}
        />

        {/* Refresh Button */}
        <div className="flex justify-end">
          <button
            onClick={loadMlAlerts}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg font-semibold px-6 py-2 flex items-center gap-2 rounded-lg disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Chargement...' : 'Actualiser'}
          </button>
        </div>
        
        <div className="grid gap-6 md:grid-cols-3">
          <StatCard
            title="Critiques"
            value={criticalCount}
            description="Nécessitent action immédiate"
            icon={AlertCircle}
            gradient="from-red-500 via-rose-600 to-pink-700"
          />

          <StatCard
            title="Moyennes"
            value={mediumCount}
            description="À surveiller"
            icon={AlertTriangle}
            gradient="from-amber-500 via-orange-600 to-yellow-600"
          />

          <StatCard
            title="Faibles"
            value={lowCount}
            description="Informatives"
            icon={Info}
            gradient="from-slate-500 via-gray-600 to-zinc-700"
          />
        </div>

        <ContentCard
          title="Alertes ML Récentes"
          description="Anomalies détectées par le modèle IsolationForest"
          icon={AlertCircle}
          iconColor="red"
          gradientFrom="red-50"
          gradientTo="rose-50"
        >
          <div className="space-y-4">
            {currentAlerts.map(alert => {
              const severity = alert.severity || getSeverityFromScore(alert.score || 0)
              const severityLabel = severity === 'high' ? 'critical' : severity
              return (
                <div key={alert.alert_id} className={`alert-card ${severityLabel}`}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ flex: '1', minWidth: '200px' }}>
                      <div style={{ fontWeight: '700', fontSize: '1.125rem', color: '#1e293b', marginBottom: '0.25rem' }}>
                        {alert.reason || 'Anomalie ML détectée'}
                      </div>
                      <div className="text-muted" style={{ fontSize: '0.875rem' }}>
                        Device: <code>{alert.device_id || 'N/A'}</code>
                      </div>
                    </div>
                    <div style={{ 
                      padding: '0.5rem 1rem', 
                      borderRadius: '9999px',
                      background: severityLabel === 'critical' ? 'rgba(239, 68, 68, 0.1)' : 
                                 severityLabel === 'medium' ? 'rgba(245, 158, 11, 0.1)' : 
                                 'rgba(59, 130, 246, 0.1)',
                      color: severityLabel === 'critical' ? '#dc2626' : 
                            severityLabel === 'medium' ? '#d97706' : 
                            '#2563eb',
                      fontWeight: '700',
                      fontSize: '0.75rem',
                      textTransform: 'uppercase'
                    }}>
                      {severityLabel}
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <span className="text-muted" style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Clock className="h-3 w-3" /> {new Date(alert.ts).toLocaleString('fr-FR')}
                    </span>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      {alert.score !== undefined && (
                        <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>
                          Score: <span style={{ 
                            color: alert.score > 0.8 ? '#dc2626' : alert.score > 0.6 ? '#d97706' : '#2563eb',
                            fontWeight: '700'
                          }}>{(alert.score * 100).toFixed(0)}%</span>
                        </span>
                      )}
                      <button 
                        onClick={() => handleAnalyze(alert.alert_id)}
                        style={{ 
                          padding: '0.5rem 1.25rem',
                          fontSize: '0.875rem',
                          background: 'linear-gradient(135deg, #3b82f6, #2563eb)'
                        }}>
                        Analyser
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}

            {mlAlerts.length === 0 && !loading && (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucune alerte ML détectée</p>
              </div>
            )}

            {loading && (
              <div className="text-center py-8 text-gray-500">
                <RefreshCw className="w-12 h-12 mx-auto mb-4 opacity-50 animate-spin" />
                <p>Chargement des alertes...</p>
              </div>
            )}
          </div>

          {mlAlerts.length > alertsPerPage && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Affichage de {indexOfFirstAlert + 1} à {Math.min(indexOfLastAlert, mlAlerts.length)} sur {mlAlerts.length} alertes
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

                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
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
                                ? 'bg-purple-600 text-white border-purple-600'
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
            </div>
          )}
        </ContentCard>

        <ContentCard
          title="Recommandations ML"
          description="Actions suggérées par l'analyse d'intelligence artificielle"
          icon={Lightbulb}
          iconColor="amber"
          gradientFrom="amber-50"
          gradientTo="yellow-50"
        >
          {recommendations && recommendations.recommendations && recommendations.recommendations.length > 0 ? (
            <div className="space-y-4">
              {/* ML Status Badge */}
              {recommendations.ml_enabled && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-semibold text-green-700">🤖 Modèle ML actif - Recommandations générées par IA</span>
                </div>
              )}
              
              {recommendations.recommendations
                .slice((recPage - 1) * recsPerPage, recPage * recsPerPage)
                .map((rec, index) => (
                <div key={index} className="bg-white/60 p-5 rounded-lg border-2 border-amber-200 shadow-sm hover:shadow-md transition-shadow">
                  {/* Header with device info and priority */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="font-bold text-gray-800 text-lg mb-1">
                        {rec.device_name || rec.device_id}
                        {rec.device_location && <span className="text-sm text-gray-600 ml-2">📍 {rec.device_location}</span>}
                      </div>
                      <div className="text-sm text-gray-600 mb-2 italic">
                        {rec.reason}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                          rec.priority === 'critical' ? 'bg-red-600 text-white' :
                          rec.priority === 'high' ? 'bg-orange-500 text-white' :
                          rec.priority === 'medium' ? 'bg-yellow-500 text-white' :
                          'bg-blue-500 text-white'
                        }`}>
                          {rec.priority === 'critical' ? '🚨 CRITIQUE' : 
                           rec.priority === 'high' ? '⚠️ HAUTE' : 
                           rec.priority === 'medium' ? '⚡ MOYENNE' : 
                           '📋 FAIBLE'}
                        </div>
                        {rec.urgency && (
                          <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                            ⏰ {rec.urgency}
                          </div>
                        )}
                        {rec.confidence !== undefined && (
                          <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                            🎯 Confiance: {(rec.confidence * 100).toFixed(0)}%
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Root Cause Analysis */}
                  {rec.root_cause && rec.root_cause.length > 0 && (
                    <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <div className="text-sm font-bold text-purple-800 mb-2 flex items-center gap-2">
                        🔍 Analyse de cause racine (ML)
                      </div>
                      <ul className="space-y-1">
                        {rec.root_cause.map((cause, idx) => (
                          <li key={idx} className="text-sm text-purple-700 flex items-start gap-2">
                            <span className="text-purple-500 mt-1">▸</span>
                            <span>{cause}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* ML Recommendations */}
                  <div className="ml-0">
                    <div className="text-sm font-bold text-amber-800 mb-3 flex items-center gap-2">
                      💡 Actions recommandées par l'IA:
                    </div>
                    <ul className="space-y-2">
                      {rec.actions && rec.actions.map((action, idx) => (
                        <li key={idx} className="text-sm text-gray-800 flex items-start gap-3 p-2 hover:bg-amber-50 rounded transition-colors">
                          <span className="text-amber-600 mt-1 font-bold">•</span>
                          <span className="flex-1">{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* ML Metadata */}
                  {rec.ml_score !== undefined && (
                    <div className="mt-4 pt-3 border-t border-gray-200 text-xs text-gray-500">
                      Score ML d'anomalie: {rec.ml_score.toFixed(3)} | 
                      Statut: {rec.ml_status === 'ml_generated' ? '✅ Généré par ML' : rec.ml_status}
                    </div>
                  )}
                </div>
              ))}
              
              {/* Recommendations Pagination */}
              {recommendations.recommendations.length > recsPerPage && (
                <div className="flex items-center justify-between pt-4 border-t border-amber-200">
                  <div className="text-sm text-gray-600">
                    Page {recPage} sur {Math.ceil(recommendations.recommendations.length / recsPerPage)} • Total: {recommendations.recommendations.length} recommandations
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setRecPage(p => Math.max(1, p - 1))}
                      disabled={recPage === 1}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Précédent
                    </button>
                    <button
                      onClick={() => setRecPage(p => Math.min(Math.ceil(recommendations.recommendations.length / recsPerPage), p + 1))}
                      disabled={recPage === Math.ceil(recommendations.recommendations.length / recsPerPage)}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                    >
                      Suivant
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Lightbulb className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="font-semibold">Aucune recommandation disponible</p>
              <p className="text-sm mt-2">Les recommandations apparaîtront lorsque des anomalies seront détectées</p>
            </div>
          )}
        </ContentCard>
      </div>

      {/* ML Recommendations Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <DialogTitle className="text-2xl flex items-center gap-2">
                  🤖 Recommandations ML
                </DialogTitle>
                <DialogDescription>
                  {selectedRecommendation?.device_name || selectedRecommendation?.device_id}
                  {selectedRecommendation?.device_location && (
                    <span className="ml-2">📍 {selectedRecommendation.device_location}</span>
                  )}
                </DialogDescription>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </DialogHeader>

          {selectedRecommendation && (
            <div className="px-6 pb-6 space-y-4">
              {/* Alert Info */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                <div className="text-sm font-semibold text-gray-700 mb-2">Anomalie détectée:</div>
                <div className="text-gray-800 italic">{selectedRecommendation.reason}</div>
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <div className={`inline-block px-3 py-1.5 rounded-full text-sm font-bold ${
                    selectedRecommendation.priority === 'critical' ? 'bg-red-600 text-white' :
                    selectedRecommendation.priority === 'high' ? 'bg-orange-500 text-white' :
                    selectedRecommendation.priority === 'medium' ? 'bg-yellow-500 text-white' :
                    'bg-blue-500 text-white'
                  }`}>
                    {selectedRecommendation.priority === 'critical' ? '🚨 CRITIQUE' : 
                     selectedRecommendation.priority === 'high' ? '⚠️ HAUTE' : 
                     selectedRecommendation.priority === 'medium' ? '⚡ MOYENNE' : 
                     '📋 FAIBLE'}
                  </div>
                  {selectedRecommendation.urgency && (
                    <div className="inline-block px-3 py-1.5 rounded-full text-sm font-semibold bg-purple-100 text-purple-700">
                      ⏰ {selectedRecommendation.urgency}
                    </div>
                  )}
                  {selectedRecommendation.confidence !== undefined && (
                    <div className="inline-block px-3 py-1.5 rounded-full text-sm font-semibold bg-green-100 text-green-700">
                      🎯 Confiance ML: {(selectedRecommendation.confidence * 100).toFixed(0)}%
                    </div>
                  )}
                </div>
              </div>

              {/* Root Cause Analysis */}
              {selectedRecommendation.root_cause && selectedRecommendation.root_cause.length > 0 && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border-2 border-purple-200">
                  <div className="text-base font-bold text-purple-800 mb-3 flex items-center gap-2">
                    🔍 Analyse de cause racine (Intelligence Artificielle)
                  </div>
                  <ul className="space-y-2">
                    {selectedRecommendation.root_cause.map((cause, idx) => (
                      <li key={idx} className="text-sm text-purple-700 flex items-start gap-2 bg-white/50 p-2 rounded">
                        <span className="text-purple-500 mt-1 font-bold">▸</span>
                        <span className="flex-1">{cause}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* ML Recommendations */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-lg border-2 border-amber-300">
                <div className="text-base font-bold text-amber-800 mb-3 flex items-center gap-2">
                  💡 Actions recommandées par l'IA ({selectedRecommendation.actions?.length || 0})
                </div>
                <ul className="space-y-3">
                  {selectedRecommendation.actions && selectedRecommendation.actions.map((action, idx) => (
                    <li key={idx} className="flex items-start gap-3 bg-white p-3 rounded-lg border border-amber-200 hover:shadow-md transition-shadow">
                      <span className="text-amber-600 mt-1 font-bold text-lg">•</span>
                      <span className="flex-1 text-sm text-gray-800">{action}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* ML Metadata Footer */}
              {selectedRecommendation.ml_score !== undefined && (
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs text-gray-600">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span>📊 Score ML d'anomalie: <strong>{selectedRecommendation.ml_score.toFixed(3)}</strong></span>
                    <span>Statut: {selectedRecommendation.ml_status === 'ml_generated' ? '✅ Généré par ML' : selectedRecommendation.ml_status}</span>
                    {selectedRecommendation.timestamp && (
                      <span>⏱️ {new Date(selectedRecommendation.timestamp).toLocaleString('fr-FR')}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
                >
                  Fermer
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
