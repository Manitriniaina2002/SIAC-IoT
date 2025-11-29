import React from 'react'
import toast from 'react-hot-toast'
import { AlertTriangle, AlertCircle, Info, Lightbulb, Clock } from 'lucide-react'
import { StatCard, ContentCard } from '@/components/cards'
import { PageHeader } from '@/components/layout'
import AnimatedBackground from '@/components/AnimatedBackground'

export default function Alerts(){
  const handleAnalyze = (alertId) => {
    toast.promise(
      new Promise((resolve) => {
        setTimeout(() => {
          resolve({ details: 'Analyse ML complétée', recommendations: ['Vérifier la source', 'Bloquer IP suspecte'] })
        }, 1500)
      }),
      {
        loading: 'Analyse en cours...',
        success: (data) => `Analyse terminée - ${data.recommendations.length} recommandations`,
        error: 'Échec de l\'analyse',
      }
    )
  }

  const alerts = [
    {id: 1, device: 'dht22-001', severity: 'critical', message: 'Température anormale détectée (DHT22)', time: 'Il y a 5 min', score: 0.89},
    {id: 2, device: 'ultrasonic-001', severity: 'medium', message: 'Distance inhabituelle détectée', time: 'Il y a 12 min', score: 0.72},
    {id: 3, device: 'esp32-001', severity: 'low', message: 'Connexion intermittente ESP32', time: 'Il y a 1h', score: 0.45},
    {id: 4, device: 'led-red-001', severity: 'critical', message: 'Échec de contrôle LED rouge', time: 'Il y a 2h', score: 0.95},
  ]

  return (
    <div className="container relative">
      <AnimatedBackground />
      <div className="space-y-6 relative" style={{zIndex: 10}}>
        <PageHeader 
          title="Alertes & Anomalies" 
          description="Surveillance et détection des incidents"
          icon={AlertTriangle}
        />
        
        <div className="grid gap-6 md:grid-cols-3">
          <StatCard
            title="Critiques"
            value="2"
            description="Nécessitent action immédiate"
            icon={AlertCircle}
            gradient="from-red-500 via-rose-600 to-pink-700"
          />

          <StatCard
            title="Moyennes"
            value="1"
            description="À surveiller"
            icon={AlertTriangle}
            gradient="from-amber-500 via-orange-600 to-yellow-600"
          />

          <StatCard
            title="Faibles"
            value="1"
            description="Informatives"
            icon={Info}
            gradient="from-slate-500 via-gray-600 to-zinc-700"
          />
        </div>

        <ContentCard
          title="Alertes récentes"
          description="Événements détectés par le système"
          icon={AlertCircle}
          iconColor="red"
          gradientFrom="red-50"
          gradientTo="rose-50"
        >
          <div className="space-y-4">
            {alerts.map(alert => (
              <div key={alert.id} className={`alert-card ${alert.severity}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ flex: '1', minWidth: '200px' }}>
                    <div style={{ fontWeight: '700', fontSize: '1.125rem', color: '#1e293b', marginBottom: '0.25rem' }}>
                      {alert.message}
                    </div>
                    <div className="text-muted" style={{ fontSize: '0.875rem' }}>
                      Device: <code>{alert.device}</code>
                    </div>
                  </div>
                  <div style={{ 
                    padding: '0.5rem 1rem', 
                    borderRadius: '9999px',
                    background: alert.severity === 'critical' ? 'rgba(239, 68, 68, 0.1)' : 
                               alert.severity === 'medium' ? 'rgba(245, 158, 11, 0.1)' : 
                               'rgba(59, 130, 246, 0.1)',
                    color: alert.severity === 'critical' ? '#dc2626' : 
                          alert.severity === 'medium' ? '#d97706' : 
                          '#2563eb',
                    fontWeight: '700',
                    fontSize: '0.75rem',
                    textTransform: 'uppercase'
                  }}>
                    {alert.severity}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <span className="text-muted" style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Clock className="h-3 w-3" /> {alert.time}
                  </span>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>
                      Score: <span style={{ 
                        color: alert.score > 0.8 ? '#dc2626' : alert.score > 0.6 ? '#d97706' : '#2563eb',
                        fontWeight: '700'
                      }}>{(alert.score * 100).toFixed(0)}%</span>
                    </span>
                    <button 
                      onClick={() => handleAnalyze(alert.id)}
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
            ))}
          </div>
        </ContentCard>

        <ContentCard
          title="Recommandations"
          description="Actions suggérées par le système"
          icon={Lightbulb}
          iconColor="amber"
          gradientFrom="amber-50"
          gradientTo="yellow-50"
        >
          <ul style={{ marginTop: '1rem', lineHeight: '2', paddingLeft: '1.5rem' }}>
            <li>Vérifier l'environnement du capteur <code>dht22-001</code> pour la température</li>
            <li>Inspecter la zone de détection du capteur <code>ultrasonic-001</code></li>
            <li>Vérifier la connexion WiFi de l'ESP32 <code>esp32-001</code></li>
            <li>Tester le circuit électrique des LEDs (<code>led-red-001</code>, <code>led-green-001</code>)</li>
          </ul>
        </ContentCard>
      </div>
    </div>
  )
}
