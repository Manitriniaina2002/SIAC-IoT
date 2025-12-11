import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Activity, TrendingUp, AlertTriangle, Database, Wifi, CheckCircle, Zap, ArrowUpRight, BarChart3, LineChart, RefreshCw, Brain, Calendar, Sparkles, HardDrive, TrendingDown, Eye, EyeOff, Radio, Cpu, FileText } from 'lucide-react'
import { StatCard, ContentCard, ActivityItem, ProgressBar } from '@/components/cards'
import { PageHeader } from '@/components/layout'
import { LineChart as RechartsLine, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import AnimatedBackground from '@/components/AnimatedBackground'
import { api } from '@/lib/api'
import { BASE_URL } from '@/lib/api'
import { Button } from '@/components/ui/button'

export default function IoTMonitoring() {
  const [devices, setDevices] = useState([])
  const [backendConnected, setBackendConnected] = useState(false)
  const [recentTelemetry, setRecentTelemetry] = useState([])
  const [sensorData, setSensorData] = useState([])

  const loadDevices = async () => {
    try {
      const data = await api.getDevices()
      setDevices(Array.isArray(data) ? data : [])
      setBackendConnected(true)
    } catch (e) {
      setBackendConnected(false)
    }
  }

  const loadRecentTelemetry = async () => {
    try {
      const data = await api.getRecentTelemetry(10)
      setRecentTelemetry(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error('Failed to load telemetry:', e)
      setRecentTelemetry([])
    }
  }

  const loadSensorData = async () => {
    try {
      // Get real ESP32 telemetry data
      const data = await api.getRecentTelemetry(20)
      console.log('📊 Telemetry data for chart:', data)
      if (data && data.length > 0) {
        // Transform telemetry to chart format
        const chartData = data
          .filter(item => item.device_id === 'ESP32-001' && item.sensors)
          .map(item => ({
            time: new Date(item.ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            temperature: parseFloat(item.sensors.temperature) || 0,
            humidity: parseFloat(item.sensors.humidity) || 0,
            distance: parseFloat(item.sensors.distance) || 0
          }))
          .reverse()
        
        console.log('📈 Chart data transformed:', chartData)
        if (chartData.length > 0) {
          setSensorData(chartData)
        } else {
          console.warn('⚠️ No ESP32 data found after filtering')
          setSensorData([])
        }
      } else {
        console.warn('⚠️ No telemetry data received')
        setSensorData([])
      }
    } catch (e) {
      console.error('❌ Failed to load sensor data:', e)
      setSensorData([])
    }
  }

  const handleExport = async (format) => {
    const url = `${BASE_URL}/api/v1/telemetry/export?format=${format}`;
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
        a.download = `telemetry.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(a);
        toast.success(`Telemetry exported as ${format.toUpperCase()}`);
      } else {
        toast.error('Export failed');
      }
    } catch (error) {
      toast.error('Export failed');
    }
  }

  useEffect(() => { 
    loadDevices()
    loadRecentTelemetry()
    loadSensorData()

    // Auto-refresh telemetry and chart every 5 seconds for real-time updates
    const intervalId = setInterval(() => {
      loadRecentTelemetry()
      loadSensorData()
    }, 5000)

    // Cleanup interval on unmount
    return () => clearInterval(intervalId)
  }, [])

  const getSensorStatusColor = (value, type) => {
    switch(type) {
      case 'motion':
        return value ? 'text-green-600 bg-green-50' : 'text-gray-600 bg-gray-50'
      case 'distance':
        return value > 100 ? 'text-yellow-600 bg-yellow-50' : 'text-green-600 bg-green-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const formatSensorValue = (value, type) => {
    if (value === null || value === undefined) return 'N/A'
    
    switch(type) {
      case 'temperature':
        return `${value}°C`
      case 'humidity':
        return `${value}%`
      case 'distance':
        return `${value} cm`
      case 'motion':
        return value ? 'Détecté' : 'Aucun mouvement'
      case 'servo_state':
        return value
      case 'led_states':
        return Object.entries(value).map(([led, state]) => 
          `${led}: ${state ? 'ON' : 'OFF'}`
        ).join(', ')
      default:
        return value
    }
  }

  return (
    <div className="space-y-6 relative min-h-screen">
      <AnimatedBackground />
      <div className="relative" style={{zIndex: 10}}>
      
      <PageHeader 
        title="Monitoring IoT" 
        description="Surveillance ESP32, capteur DHT22, ultrasons et LEDs"
        icon={Radio}
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
              {backendConnected ? 'Connecté' : 'Déconnecté'}
            </span>
            <span className="text-sm text-gray-600">
              {devices.length} appareils connectés
            </span>
          </div>
          <Button 
            onClick={() => { loadDevices(); loadRecentTelemetry(); loadSensorData() }} 
            className="bg-blue-600 hover:bg-blue-700 shadow-lg font-semibold px-6 py-2 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </Button>
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

      {/* Sensor Overview Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="ESP32 Controller"
          value={recentTelemetry.filter(t => t.device_id === 'ESP32-001').length > 0 ? 'Actif ✓' : 'Inactif'}
          description="Contrôleur principal ESP32"
          icon={Cpu}
          gradient="from-blue-500 via-cyan-600 to-teal-700"
        />

        <StatCard
          title="Capteur DHT22"
          value={recentTelemetry.filter(t => t.device_id === 'ESP32-001' && t.sensors?.temperature).length > 0 
            ? `${recentTelemetry.filter(t => t.device_id === 'ESP32-001')[0]?.sensors?.temperature?.toFixed(1)}°C` 
            : 'Inactif'}
          description="Température et humidité"
          icon={TrendingUp}
          gradient="from-green-500 via-emerald-600 to-teal-700"
        />

        <StatCard
          title="Capteur Ultrason"
          value={recentTelemetry.filter(t => t.device_id === 'ESP32-001' && t.sensors?.distance).length > 0 
            ? `${recentTelemetry.filter(t => t.device_id === 'ESP32-001')[0]?.sensors?.distance?.toFixed(0)} cm` 
            : 'Inactif'}
          description="Détection de distance"
          icon={Radio}
          gradient="from-orange-500 via-amber-600 to-yellow-600"
        />

        <StatCard
          title="LED Rouge"
          value={recentTelemetry.filter(t => t.device_id === 'ESP32-001' && t.sensors?.distance).length > 0 
            ? (recentTelemetry.filter(t => t.device_id === 'ESP32-001')[0]?.sensors?.distance < 20 ? '🔴 Allumée' : '⚫ Éteinte')
            : 'Inconnue'}
          description="Indicateur rouge"
          icon={Zap}
          gradient="from-red-500 via-pink-600 to-rose-700"
        />

        <StatCard
          title="LED Verte"
          value={recentTelemetry.filter(t => t.device_id === 'ESP32-001' && t.sensors?.distance).length > 0 
            ? (recentTelemetry.filter(t => t.device_id === 'ESP32-001')[0]?.sensors?.distance >= 20 ? '🟢 Allumée' : '⚫ Éteinte')
            : 'Inconnue'}
          description="Indicateur vert"
          icon={CheckCircle}
          gradient="from-emerald-500 via-green-600 to-lime-700"
        />

        <StatCard
          title="Température Moyenne"
          value={(() => {
            const temps = recentTelemetry.filter(t => t.device_id === 'ESP32-001' && t.sensors?.temperature).map(t => t.sensors.temperature)
            return temps.length > 0 ? `${(temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1)}°C` : 'Indisponible'
          })()}
          description="Mesure DHT22"
          icon={TrendingUp}
          gradient="from-purple-500 via-violet-600 to-indigo-700"
        />
      </div>

      {/* Real-time Sensor Data */}
      <ContentCard
        title="Données Capteurs en Temps Réel"
        description="État actuel des appareils IoT ESP32"
        icon={Activity}
        iconColor="blue"
        gradientFrom="blue-50"
        gradientTo="cyan-50"
      >
        <div className="space-y-4">
          {/* ESP32 Main Controller with all sensors */}
          {recentTelemetry.filter(t => t.device_id === 'ESP32-001').slice(0, 1).map((telemetry, index) => (
            <div key={`esp32-${index}`} className="border border-blue-300 rounded-lg p-4 bg-gradient-to-r from-blue-50 to-cyan-50 shadow-md">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-gray-800">ESP32 Main Controller</span>
                  <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded font-semibold">ESP32-001</span>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    Actif
                  </span>
                </div>
                <span className="text-sm text-gray-500 font-medium">
                  {new Date(telemetry.ts).toLocaleString('fr-FR')}
                </span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center bg-white/70 p-3 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">🌡️ Température</div>
                  <div className="font-bold text-2xl text-red-600">{telemetry.sensors?.temperature?.toFixed(1) || 'N/A'}°C</div>
                </div>
                <div className="text-center bg-white/70 p-3 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">💧 Humidité</div>
                  <div className="font-bold text-2xl text-blue-600">{telemetry.sensors?.humidity?.toFixed(1) || 'N/A'}%</div>
                </div>
                <div className="text-center bg-white/70 p-3 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">📏 Distance</div>
                  <div className="font-bold text-2xl text-green-600">{telemetry.sensors?.distance?.toFixed(0) || 'N/A'} cm</div>
                </div>
                <div className="text-center bg-white/70 p-3 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">📡 Réseau</div>
                  <div className="font-bold text-sm text-purple-600">{telemetry.net?.tx_bytes || 0} B TX</div>
                </div>
              </div>
            </div>
          ))}

          {recentTelemetry.filter(t => t.device_id === 'ESP32-001').length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Cpu className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucune donnée ESP32 disponible</p>
              <p className="text-sm mt-2">Vérifiez que l'ESP32 est connecté et envoie des données MQTT</p>
            </div>
          )}

          {/* LED Indicators - if available */}
          {recentTelemetry.filter(t => t.device_id.startsWith('led-')).slice(0, 2).map((telemetry, index) => (
            <div key={`led-${index}`} className="border border-gray-200 rounded-lg p-4 bg-white/50 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-red-600" />
                  <span className="font-semibold text-gray-800">
                    {telemetry.device_id === 'led-red-001' ? 'LED Rouge' : 'LED Verte'}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    telemetry.device_id === 'led-red-001' 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {telemetry.device_id}
                  </span>
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(telemetry.ts).toLocaleString('fr-FR')}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">État</div>
                  <div className="font-semibold text-sm px-2 py-1 rounded bg-gray-50">
                    {formatSensorValue(telemetry.sensors?.led_states, 'led_states')}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">Contrôle</div>
                  <div className="font-semibold text-sm px-2 py-1 rounded bg-blue-50 text-blue-700">
                    Automatique
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {recentTelemetry.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Radio className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucune donnée capteur reçue récemment</p>
            </div>
          )}
        </div>
      </ContentCard>

      {/* Sensor Trends Chart */}
      <ContentCard
        title="Tendances Capteurs"
        description="Évolution DHT22 (température/humidité) et ultrasons (distance)"
        icon={LineChart}
        iconColor="green"
        gradientFrom="green-50"
        gradientTo="emerald-50"
      >
        {sensorData.length > 0 ? (
          <div className="h-80 w-full">
            <div className="mb-3 text-sm text-gray-600">
              📊 Affichage des {sensorData.length} dernières mesures
            </div>
            <ResponsiveContainer width="100%" height={320} minWidth={300} minHeight={300}>
              <LineChart data={sensorData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis 
                  dataKey="time" 
                  label={{ value: 'Heure', position: 'insideBottom', offset: -5 }}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  label={{ value: 'Valeurs', angle: -90, position: 'insideLeft' }}
                  tick={{ fontSize: 12 }}
                  domain={['auto', 'auto']}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '8px', padding: '10px' }}
                  labelStyle={{ fontWeight: 'bold', marginBottom: '5px' }}
                />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                <Line 
                  type="monotone" 
                  dataKey="temperature" 
                  stroke="#ef4444" 
                  strokeWidth={3} 
                  name="Température (°C)" 
                  dot={{ r: 5, fill: '#ef4444' }} 
                  activeDot={{ r: 7 }}
                  animationDuration={500}
                />
                <Line 
                  type="monotone" 
                  dataKey="humidity" 
                  stroke="#3b82f6" 
                  strokeWidth={3} 
                  name="Humidité (%)" 
                  dot={{ r: 5, fill: '#3b82f6' }} 
                  activeDot={{ r: 7 }}
                  animationDuration={500}
                />
                <Line 
                  type="monotone" 
                  dataKey="distance" 
                  stroke="#10b981" 
                  strokeWidth={3} 
                  name="Distance (cm)" 
                  dot={{ r: 5, fill: '#10b981' }} 
                  activeDot={{ r: 7 }}
                  animationDuration={500}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <LineChart className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="font-semibold">Aucune donnée disponible</p>
            <p className="text-sm mt-2">Les données apparaîtront une fois que l'ESP32 aura envoyé suffisamment de lectures</p>
          </div>
        )}
      </ContentCard>

      {/* ESP32 Telemetry Logs */}
      <ContentCard
        title="Logs ESP32 (Temps Réel)"
        description="Flux de données MQTT des capteurs ESP32"
        icon={FileText}
        iconColor="purple"
        gradientFrom="purple-50"
        gradientTo="violet-50"
      >
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {recentTelemetry.length > 0 ? (
            recentTelemetry.map((log, index) => (
              <div key={index} className="bg-gradient-to-r from-purple-50 to-violet-50 p-4 rounded-lg border border-purple-200 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="font-bold text-purple-700">{log.device_id}</span>
                    <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                      {new Date(log.ts).toLocaleTimeString('fr-FR')}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-red-600">🌡️</span>
                    <span className="text-gray-600">Temp:</span>
                    <span className="font-semibold">{log.sensors?.temperature?.toFixed(1) || 'N/A'}°C</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600">💧</span>
                    <span className="text-gray-600">Hum:</span>
                    <span className="font-semibold">{log.sensors?.humidity?.toFixed(1) || 'N/A'}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">📏</span>
                    <span className="text-gray-600">Dist:</span>
                    <span className="font-semibold">{log.sensors?.distance?.toFixed(0) || 'N/A'} cm</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-purple-600">📡</span>
                    <span className="text-gray-600">TX:</span>
                    <span className="font-semibold">{log.net?.tx_bytes || 0} B</span>
                  </div>
                </div>

                {log.sensors?.motion !== undefined && (
                  <div className="mt-2 text-xs">
                    <span className={`px-2 py-1 rounded-full ${log.sensors.motion ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>
                      {log.sensors.motion ? '🚶 Mouvement détecté' : '⚪ Aucun mouvement'}
                    </span>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="font-semibold">Aucun log ESP32 reçu</p>
              <p className="text-sm mt-2">Les données apparaîtront dès que l'ESP32 enverra des données MQTT</p>
              <div className="mt-4 text-xs bg-yellow-50 border border-yellow-200 rounded p-3 max-w-md mx-auto">
                <p>💡 <strong>Vérifiez:</strong></p>
                <ul className="text-left mt-2 space-y-1">
                  <li>• ESP32 connecté au WiFi</li>
                  <li>• Broker MQTT actif (port 11883)</li>
                  <li>• Topic MQTT: <code className="bg-yellow-100 px-1">devices/+/telemetry</code></li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </ContentCard>

      </div>
    </div>
  )
}