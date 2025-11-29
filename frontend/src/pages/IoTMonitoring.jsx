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
      // Try to get real data from InfluxDB
      const data = await api.getInfluxSensorData()
      if (data && data.length > 0) {
        // Transform InfluxDB data to chart format
        const chartData = data.slice(0, 20).map(item => ({
          time: new Date(item.time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          temperature: item.temperature || 0,
          humidity: item.humidity || 0,
          distance: item.distance || 0
        })).reverse()
        setSensorData(chartData)
      } else {
        // Fallback to mock data if no real data
        setSensorData([
          { time: '08:00', temperature: 22, humidity: 45, distance: 120 },
          { time: '09:00', temperature: 23, humidity: 48, distance: 115 },
          { time: '10:00', temperature: 24, humidity: 52, distance: 110 },
          { time: '11:00', temperature: 25, humidity: 50, distance: 125 },
          { time: '12:00', temperature: 26, humidity: 47, distance: 118 },
          { time: '13:00', temperature: 27, humidity: 45, distance: 122 },
          { time: '14:00', temperature: 28, humidity: 43, distance: 115 },
          { time: '15:00', temperature: 26, humidity: 46, distance: 120 }
        ])
      }
    } catch (e) {
      console.error('Failed to load sensor data:', e)
      // Use mock data as fallback
      setSensorData([
        { time: '08:00', temperature: 22, humidity: 45, distance: 120 },
        { time: '09:00', temperature: 23, humidity: 48, distance: 115 },
        { time: '10:00', temperature: 24, humidity: 52, distance: 110 },
        { time: '11:00', temperature: 25, humidity: 50, distance: 125 },
        { time: '12:00', temperature: 26, humidity: 47, distance: 118 },
        { time: '13:00', temperature: 27, humidity: 45, distance: 122 },
        { time: '14:00', temperature: 28, humidity: 43, distance: 115 },
        { time: '15:00', temperature: 26, humidity: 46, distance: 120 }
      ])
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
          value={devices.filter(d => d.device_id === 'esp32-001' && d.last_seen).length > 0 ? 'Actif' : 'Inactif'}
          description="Contrôleur principal ESP32"
          icon={Cpu}
          gradient="from-blue-500 via-cyan-600 to-teal-700"
        />

        <StatCard
          title="Capteur DHT22"
          value={devices.filter(d => d.device_id === 'dht22-001' && d.last_seen).length > 0 ? 'Actif' : 'Inactif'}
          description="Température et humidité"
          icon={TrendingUp}
          gradient="from-green-500 via-emerald-600 to-teal-700"
        />

        <StatCard
          title="Capteur Ultrason"
          value={devices.filter(d => d.device_id === 'ultrasonic-001' && d.last_seen).length > 0 ? 'Actif' : 'Inactif'}
          description="Détection de distance"
          icon={Radio}
          gradient="from-orange-500 via-amber-600 to-yellow-600"
        />

        <StatCard
          title="LED Rouge"
          value={recentTelemetry.filter(t => t.device_id === 'led-red-001').length > 0 ? 'Contrôlée' : 'Inconnue'}
          description="Indicateur rouge"
          icon={Zap}
          gradient="from-red-500 via-pink-600 to-rose-700"
        />

        <StatCard
          title="LED Verte"
          value={recentTelemetry.filter(t => t.device_id === 'led-green-001').length > 0 ? 'Contrôlée' : 'Inconnue'}
          description="Indicateur vert"
          icon={CheckCircle}
          gradient="from-emerald-500 via-green-600 to-lime-700"
        />

        <StatCard
          title="Température Moyenne"
          value={`${recentTelemetry.reduce((acc, t) => acc + (t.sensors?.temperature || 0), 0) / Math.max(recentTelemetry.filter(t => t.sensors?.temperature).length, 1).toFixed(1)} °C`}
          description="Mesure DHT22"
          icon={TrendingUp}
          gradient="from-purple-500 via-violet-600 to-indigo-700"
        />
      </div>

      {/* Real-time Sensor Data */}
      <ContentCard
        title="Données Capteurs en Temps Réel"
        description="État actuel des appareils IoT"
        icon={Activity}
        iconColor="blue"
        gradientFrom="blue-50"
        gradientTo="cyan-50"
      >
        <div className="space-y-4">
          {/* ESP32 Main Controller */}
          {recentTelemetry.filter(t => t.device_id === 'esp32-001').slice(0, 1).map((telemetry, index) => (
            <div key={`esp32-${index}`} className="border border-gray-200 rounded-lg p-4 bg-white/50 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-gray-800">ESP32 Main Controller</span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">esp32-001</span>
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(telemetry.ts).toLocaleString('fr-FR')}
                </span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">Température</div>
                  <div className="font-semibold text-lg">{formatSensorValue(telemetry.sensors?.temperature, 'temperature')}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">Humidité</div>
                  <div className="font-semibold text-lg">{formatSensorValue(telemetry.sensors?.humidity, 'humidity')}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">Mouvement</div>
                  <div className={`font-semibold text-sm px-2 py-1 rounded ${getSensorStatusColor(telemetry.sensors?.motion, 'motion')}`}>
                    {formatSensorValue(telemetry.sensors?.motion, 'motion')}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">Servo</div>
                  <div className="font-semibold text-sm px-2 py-1 rounded bg-gray-50">
                    {formatSensorValue(telemetry.sensors?.servo_state, 'servo_state')}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Ultrasonic Distance Sensor */}
          {recentTelemetry.filter(t => t.device_id === 'ultrasonic-001').slice(0, 1).map((telemetry, index) => (
            <div key={`ultrasonic-${index}`} className="border border-gray-200 rounded-lg p-4 bg-white/50 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Radio className="w-5 h-5 text-orange-600" />
                  <span className="font-semibold text-gray-800">Capteur Ultrason</span>
                  <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">ultrasonic-001</span>
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(telemetry.ts).toLocaleString('fr-FR')}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">Distance</div>
                  <div className={`font-semibold text-lg px-2 py-1 rounded ${getSensorStatusColor(telemetry.sensors?.distance, 'distance')}`}>
                    {formatSensorValue(telemetry.sensors?.distance, 'distance')}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">État</div>
                  <div className="font-semibold text-sm px-2 py-1 rounded bg-green-50 text-green-700">
                    Fonctionnel
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* DHT22 Temperature/Humidity Sensor */}
          {recentTelemetry.filter(t => t.device_id === 'dht22-001').slice(0, 1).map((telemetry, index) => (
            <div key={`dht22-${index}`} className="border border-gray-200 rounded-lg p-4 bg-white/50 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-gray-800">Capteur DHT22</span>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">dht22-001</span>
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(telemetry.ts).toLocaleString('fr-FR')}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">Température</div>
                  <div className="font-semibold text-lg">{formatSensorValue(telemetry.sensors?.temperature, 'temperature')}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">Humidité</div>
                  <div className="font-semibold text-lg">{formatSensorValue(telemetry.sensors?.humidity, 'humidity')}</div>
                </div>
              </div>
            </div>
          ))}

          {/* LED Indicators */}
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
        <div className="h-80 w-full min-h-[320px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={300}>
            <LineChart data={sensorData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="temperature" stroke="#ef4444" name="Température (°C)" />
              <Line type="monotone" dataKey="humidity" stroke="#3b82f6" name="Humidité (%)" />
              <Line type="monotone" dataKey="distance" stroke="#10b981" name="Distance (cm)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ContentCard>

      </div>
    </div>
  )
}